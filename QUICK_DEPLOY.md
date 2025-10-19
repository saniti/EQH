# Quick Deployment Guide

This is a condensed guide for quickly deploying the Horse Health Monitoring System.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name pointed to your server (optional, for SSL)

### Automated Deployment

```bash
# 1. Clone repository
git clone <your-repository-url>
cd horse-health-monitor

# 2. Run deployment script
sudo ./deploy.sh
# Select option 1 for full installation

# 3. Update environment variables
sudo nano /opt/horse-health-monitor/.env
# Add your Manus OAuth credentials

# 4. Restart application
pm2 restart horse-health-monitor
```

**Done!** Your application is now running.

---

## 📋 Manual Deployment (10 Minutes)

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Install PM2
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Setup Application

```bash
# Create directory
sudo mkdir -p /opt/horse-health-monitor
cd /opt/horse-health-monitor

# Clone repository
git clone <your-repository-url> .

# Install dependencies
pnpm install --prod

# Build application
pnpm build
```

### Step 3: Configure Environment

```bash
# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
MYSQL_ROOT_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MYSQL_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env file
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=mysql://horseuser:${MYSQL_PASSWORD}@localhost:3306/horse_health_monitor
JWT_SECRET=${JWT_SECRET}
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=/logo.png
# Add your Manus OAuth credentials here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Organization
EOF

# Create Docker environment file
cat > .env.docker << EOF
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
EOF

# Secure files
chmod 600 .env .env.docker
```

### Step 4: Start Database

```bash
# Start MySQL container
docker-compose --env-file .env.docker up -d

# Wait for database to be ready
sleep 15

# Initialize database schema
pnpm db:push
```

### Step 5: Start Application

```bash
# Start with PM2
pm2 start npm --name "horse-health-monitor" -- start

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup
```

### Step 6: Configure Nginx (Optional)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/horse-health-monitor
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/horse-health-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL (optional)
sudo certbot --nginx -d your-domain.com
```

### Step 7: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🐳 Docker-Only Deployment

If you prefer to run everything in Docker:

### Step 1: Create Dockerfile

Already included in the project as `Dockerfile`.

### Step 2: Update docker-compose.yml

Use the full-stack configuration:

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

### Step 3: Initialize Database

```bash
# Wait for services to be ready
sleep 20

# Initialize database
docker-compose exec app pnpm db:push
```

---

## ✅ Verification

### Check Application Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs horse-health-monitor --lines 50

# Check if app is responding
curl http://localhost:3000
```

### Check Database Status

```bash
# Docker container status
docker-compose ps

# Database logs
docker-compose logs db

# Connect to database
docker exec -it horse-health-db mysql -u horseuser -p
```

### Test Application

```bash
# Health check
curl http://localhost:3000/api/health

# Or visit in browser
http://your-domain.com
```

---

## 🔧 Common Commands

### Application Management

```bash
# View logs
pm2 logs horse-health-monitor

# Restart application
pm2 restart horse-health-monitor

# Stop application
pm2 stop horse-health-monitor

# Monitor resources
pm2 monit
```

### Database Management

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose stop

# View logs
docker-compose logs -f db

# Backup database
docker exec horse-health-db mysqldump -u horseuser -p horse_health_monitor > backup.sql

# Restore database
docker exec -i horse-health-db mysql -u horseuser -p horse_health_monitor < backup.sql
```

### Updates

```bash
cd /opt/horse-health-monitor

# Pull latest code
git pull

# Install dependencies
pnpm install --prod

# Build
pnpm build

# Restart
pm2 restart horse-health-monitor
```

---

## 🆘 Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs horse-health-monitor

# Check environment variables
cat .env

# Verify Node.js version
node --version  # Should be 22.x

# Check port availability
sudo netstat -tlnp | grep 3000
```

### Database connection failed

```bash
# Check if container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Test connection
docker exec -it horse-health-db mysql -u horseuser -p -e "SELECT 1;"

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Port 3000 already in use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or use different port
# Update .env and restart
```

---

## 📊 Monitoring

### Setup Automated Backups

```bash
# Create backup script
sudo nano /opt/horse-health-monitor/backup.sh
```

Add the backup script content from DEPLOYMENT.md, then:

```bash
# Make executable
chmod +x /opt/horse-health-monitor/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/horse-health-monitor/backup.sh
```

### View Application Metrics

```bash
# PM2 metrics
pm2 monit

# System resources
htop

# Docker stats
docker stats
```

---

## 🔐 Security Checklist

- [ ] Strong passwords configured
- [ ] JWT secret is random and secure
- [ ] `.env` files have restricted permissions (600)
- [ ] Database bound to localhost only
- [ ] Firewall configured
- [ ] SSL/TLS enabled
- [ ] Regular backups configured
- [ ] System updates applied

---

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Application README**: See `README.md`
- **Docker Documentation**: https://docs.docker.com
- **PM2 Documentation**: https://pm2.keymetrics.io

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `pm2 logs horse-health-monitor`
2. Verify configuration: `cat .env`
3. Check database: `docker-compose ps`
4. Review full deployment guide: `DEPLOYMENT.md`

For production support, contact your system administrator.

