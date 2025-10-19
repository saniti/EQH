#!/bin/bash

# Horse Health Monitor - Quick Deployment Script
# This script automates the deployment process for production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="horse-health-monitor"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="${APP_DIR}/backups"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("docker" "docker-compose" "node" "pnpm" "git")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}"
    fi
    
    log "All dependencies installed ✓"
}

install_dependencies() {
    log "Installing dependencies..."
    
    # Update system
    apt update && apt upgrade -y
    
    # Install Node.js 22.x
    if ! command -v node &> /dev/null; then
        log "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt install -y nodejs
    fi
    
    # Install pnpm
    if ! command -v pnpm &> /dev/null; then
        log "Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        apt install -y docker-compose-plugin
    fi
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        log "Installing Nginx..."
        apt install -y nginx
    fi
    
    # Install Certbot
    if ! command -v certbot &> /dev/null; then
        log "Installing Certbot..."
        apt install -y certbot python3-certbot-nginx
    fi
    
    log "Dependencies installed ✓"
}

setup_environment() {
    log "Setting up environment..."
    
    # Create application directory
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Generate secrets if .env doesn't exist
    if [ ! -f "${APP_DIR}/.env" ]; then
        log "Generating environment configuration..."
        
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        MYSQL_ROOT_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        MYSQL_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        
        cat > "${APP_DIR}/.env" << EOF
NODE_ENV=production
DATABASE_URL=mysql://horseuser:${MYSQL_PASSWORD}@localhost:3306/horse_health_monitor
JWT_SECRET=${JWT_SECRET}
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=/logo.png
EOF
        
        cat > "${APP_DIR}/.env.docker" << EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
EOF
        
        chmod 600 "${APP_DIR}/.env" "${APP_DIR}/.env.docker"
        
        warn "Environment files created. Please update with your Manus OAuth credentials:"
        warn "  - VITE_APP_ID"
        warn "  - OAUTH_SERVER_URL"
        warn "  - VITE_OAUTH_PORTAL_URL"
        warn "  - OWNER_OPEN_ID"
        warn "  - OWNER_NAME"
        
        read -p "Press Enter to continue after updating .env file..."
    fi
    
    log "Environment configured ✓"
}

deploy_application() {
    log "Deploying application..."
    
    cd "$APP_DIR"
    
    # Pull latest code
    if [ -d ".git" ]; then
        log "Pulling latest code..."
        git pull
    else
        error "Not a git repository. Please clone the repository first."
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    pnpm install --prod
    
    # Build application
    log "Building application..."
    pnpm build
    
    log "Application deployed ✓"
}

setup_database() {
    log "Setting up database..."
    
    cd "$APP_DIR"
    
    # Start database container
    log "Starting database container..."
    docker-compose --env-file .env.docker up -d db
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 15
    
    # Check if database is healthy
    if ! docker-compose ps | grep -q "healthy"; then
        warn "Database may not be fully ready. Waiting additional time..."
        sleep 10
    fi
    
    # Initialize database schema
    log "Initializing database schema..."
    pnpm db:push
    
    log "Database setup complete ✓"
}

setup_application_service() {
    log "Setting up application service..."
    
    cd "$APP_DIR"
    
    # Stop existing PM2 process if running
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    
    # Start application with PM2
    log "Starting application..."
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
    
    # Configure PM2 to start on boot
    pm2 startup systemd -u root --hp /root
    
    log "Application service configured ✓"
}

setup_nginx() {
    log "Setting up Nginx reverse proxy..."
    
    read -p "Enter your domain name (e.g., example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        warn "No domain provided. Skipping Nginx setup."
        return
    fi
    
    # Create Nginx configuration
    cat > "/etc/nginx/sites-available/${APP_NAME}" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 50M;
    
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log /var/log/nginx/${APP_NAME}-error.log;
}
EOF
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log "Nginx configured ✓"
    
    # Setup SSL
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " SETUP_SSL
    
    if [ "$SETUP_SSL" = "y" ]; then
        log "Setting up SSL certificate..."
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}"
        log "SSL certificate installed ✓"
    fi
}

setup_firewall() {
    log "Configuring firewall..."
    
    # Install UFW if not installed
    if ! command -v ufw &> /dev/null; then
        apt install -y ufw
    fi
    
    # Configure firewall rules
    ufw --force enable
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    log "Firewall configured ✓"
}

setup_backup() {
    log "Setting up automated backups..."
    
    # Create backup script
    cat > "${APP_DIR}/backup.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/horse-health-monitor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

mkdir -p $BACKUP_DIR

docker exec horse-health-db mysqldump \
  -u horseuser -p$(grep MYSQL_PASSWORD /opt/horse-health-monitor/.env.docker | cut -d'=' -f2) \
  --single-transaction \
  --routines \
  --triggers \
  horse_health_monitor > $BACKUP_FILE

gzip $BACKUP_FILE

find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF
    
    chmod +x "${APP_DIR}/backup.sh"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * ${APP_DIR}/backup.sh >> /var/log/${APP_NAME}-backup.log 2>&1") | crontab -
    
    log "Automated backups configured (daily at 2 AM) ✓"
}

print_summary() {
    log "================================"
    log "Deployment Complete!"
    log "================================"
    log ""
    log "Application: ${APP_NAME}"
    log "Directory: ${APP_DIR}"
    log "Status: $(pm2 status | grep ${APP_NAME} | awk '{print $10}')"
    log ""
    log "Database: MySQL (Docker)"
    log "Status: $(docker-compose ps | grep horse-health-db | awk '{print $4}')"
    log ""
    log "Useful commands:"
    log "  - View logs: pm2 logs ${APP_NAME}"
    log "  - Restart app: pm2 restart ${APP_NAME}"
    log "  - Database CLI: docker exec -it horse-health-db mysql -u horseuser -p"
    log "  - View backups: ls -lh ${BACKUP_DIR}"
    log ""
    log "Configuration files:"
    log "  - Environment: ${APP_DIR}/.env"
    log "  - Docker env: ${APP_DIR}/.env.docker"
    log "  - Nginx config: /etc/nginx/sites-available/${APP_NAME}"
    log ""
    log "Next steps:"
    log "  1. Update ${APP_DIR}/.env with Manus OAuth credentials"
    log "  2. Test the application"
    log "  3. Monitor logs for any issues"
    log ""
}

# Main deployment flow
main() {
    log "Starting deployment of ${APP_NAME}..."
    
    check_root
    
    # Menu
    echo ""
    echo "Horse Health Monitor - Deployment Script"
    echo "========================================"
    echo "1. Full installation (new server)"
    echo "2. Update existing installation"
    echo "3. Setup database only"
    echo "4. Setup Nginx only"
    echo "5. Setup backups only"
    echo "6. Exit"
    echo ""
    read -p "Select option: " OPTION
    
    case $OPTION in
        1)
            install_dependencies
            setup_environment
            deploy_application
            setup_database
            setup_application_service
            setup_nginx
            setup_firewall
            setup_backup
            print_summary
            ;;
        2)
            check_dependencies
            deploy_application
            setup_database
            setup_application_service
            log "Update complete ✓"
            ;;
        3)
            check_dependencies
            setup_database
            log "Database setup complete ✓"
            ;;
        4)
            setup_nginx
            log "Nginx setup complete ✓"
            ;;
        5)
            setup_backup
            log "Backup setup complete ✓"
            ;;
        6)
            log "Exiting..."
            exit 0
            ;;
        *)
            error "Invalid option"
            ;;
    esac
}

# Run main function
main "$@"

