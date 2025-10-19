# Deployment Guide - Horse Health Monitoring System

This guide covers deployment of the Node.js application with Docker-based MySQL database for both development and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Docker Database Management](#docker-database-management)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Backup and Recovery](#backup-and-recovery)

---

## Prerequisites

### Required Software

- **Node.js**: Version 22.x or higher
- **pnpm**: Latest version (`npm install -g pnpm`)
- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: For version control

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space

**Recommended (Production):**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repository-url>
cd horse-health-monitor

# Install dependencies
pnpm install
```

### Step 2: Start Docker Database

```bash
# Start MySQL container
docker-compose up -d

# Verify container is running
docker-compose ps

# Check logs
docker-compose logs -f db
```

The database will be available at:
- **Host**: localhost
- **Port**: 3306
- **Database**: horse_health_monitor
- **User**: horseuser
- **Password**: horsepass123

### Step 3: Configure Environment

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://horseuser:horsepass123@localhost:3306/horse_health_monitor

# Authentication (provided by Manus platform in production)
JWT_SECRET=your-development-jwt-secret-change-in-production
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=/logo.png

# For local testing without Manus OAuth
OWNER_OPEN_ID=dev-user-id
OWNER_NAME=Developer
```

### Step 4: Initialize Database Schema

```bash
# Generate and apply migrations
pnpm db:push

# Verify tables were created
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "USE horse_health_monitor; SHOW TABLES;"
```

### Step 5: Start Development Server

```bash
# Start the application
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Prepare the Server

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

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Deploy Application

```bash
# Create application directory
sudo mkdir -p /opt/horse-health-monitor
sudo chown $USER:$USER /opt/horse-health-monitor
cd /opt/horse-health-monitor

# Clone repository
git clone <your-repository-url> .

# Install dependencies
pnpm install --prod

# Build application
pnpm build
```

#### 3. Configure Production Environment

Create `/opt/horse-health-monitor/.env`:

```env
NODE_ENV=production

# Database - Use strong password in production
DATABASE_URL=mysql://horseuser:STRONG_PASSWORD_HERE@localhost:3306/horse_health_monitor

# Authentication (provided by Manus platform)
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=https://your-cdn.com/logo.png

# Manus OAuth (configured in platform)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Organization
```

**Generate strong secrets:**

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 4. Configure Production Docker Database

Update `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: horse-health-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: horse_health_monitor
      MYSQL_USER: horseuser
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "127.0.0.1:3306:3306"  # Bind to localhost only
    volumes:
      - horse_health_data:/var/lib/mysql
      - ./init-db:/docker-entrypoint-initdb.d
      - ./backups:/backups
    networks:
      - horse-health-network
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  horse_health_data:
    driver: local

networks:
  horse-health-network:
    driver: bridge
```

Create `.env.docker` for Docker secrets:

```env
MYSQL_ROOT_PASSWORD=your-strong-root-password
MYSQL_PASSWORD=your-strong-user-password
```

#### 5. Start Production Services

```bash
# Start database
docker-compose --env-file .env.docker up -d

# Wait for database to be ready
sleep 10

# Initialize database schema
pnpm db:push

# Start application with PM2
sudo npm install -g pm2
pm2 start npm --name "horse-health-monitor" -- start
pm2 save
pm2 startup
```

#### 6. Configure Nginx Reverse Proxy

Install and configure Nginx:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/horse-health-monitor`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Client max body size
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/horse-health-monitor-access.log;
    error_log /var/log/nginx/horse-health-monitor-error.log;
}
```

Enable the site and obtain SSL certificate:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/horse-health-monitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

#### 7. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Option 2: Docker Deployment (Application + Database)

Create a complete Docker setup for the application.

#### 1. Create Application Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["pnpm", "start"]
```

#### 2. Update docker-compose.yml for Full Stack

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: horse-health-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: horse_health_monitor
      MYSQL_USER: horseuser
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - horse_health_data:/var/lib/mysql
      - ./init-db:/docker-entrypoint-initdb.d
      - ./backups:/backups
    networks:
      - horse-health-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: horse-health-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://horseuser:${MYSQL_PASSWORD}@db:3306/horse_health_monitor
      JWT_SECRET: ${JWT_SECRET}
      VITE_APP_TITLE: ${VITE_APP_TITLE}
      VITE_APP_LOGO: ${VITE_APP_LOGO}
      VITE_APP_ID: ${VITE_APP_ID}
      OAUTH_SERVER_URL: ${OAUTH_SERVER_URL}
      VITE_OAUTH_PORTAL_URL: ${VITE_OAUTH_PORTAL_URL}
      OWNER_OPEN_ID: ${OWNER_OPEN_ID}
      OWNER_NAME: ${OWNER_NAME}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - horse-health-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  horse_health_data:
    driver: local

networks:
  horse-health-network:
    driver: bridge
```

#### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose --env-file .env.docker up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Initialize database (first time only)
docker-compose exec app pnpm db:push
```

---

### Option 3: Cloud Platform Deployment

#### AWS Deployment

**Using AWS ECS + RDS:**

1. **Create RDS MySQL Instance:**
   - Engine: MySQL 8.0
   - Instance class: db.t3.medium (or larger)
   - Storage: 50GB SSD
   - Enable automated backups
   - Configure security group to allow access from ECS

2. **Push Docker Image to ECR:**

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t horse-health-monitor .
docker tag horse-health-monitor:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/horse-health-monitor:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/horse-health-monitor:latest
```

3. **Create ECS Task Definition** with environment variables from AWS Secrets Manager

4. **Deploy ECS Service** with Application Load Balancer

#### DigitalOcean Deployment

**Using App Platform:**

1. Connect GitHub repository
2. Configure build settings:
   - Build command: `pnpm install && pnpm build`
   - Run command: `pnpm start`
3. Add Managed Database (MySQL)
4. Configure environment variables
5. Deploy

#### Heroku Deployment

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create horse-health-monitor

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Deploy
git push heroku main

# Initialize database
heroku run pnpm db:push
```

---

## Docker Database Management

### Starting and Stopping

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose stop

# Stop and remove containers (data persists in volume)
docker-compose down

# Stop and remove everything including data (DESTRUCTIVE)
docker-compose down -v
```

### Accessing Database

```bash
# MySQL CLI
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor

# Execute SQL file
docker exec -i horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor < script.sql

# View logs
docker-compose logs -f db
```

### Database Maintenance

```bash
# Check database size
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'horse_health_monitor'
GROUP BY table_schema;"

# Optimize tables
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "
USE horse_health_monitor;
OPTIMIZE TABLE users, horses, sessions, organizations;"
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT signing secret (64+ chars) | Generated hex string |
| `VITE_APP_TITLE` | Application title | `Horse Health Monitor` |
| `VITE_APP_LOGO` | Logo URL | `https://cdn.example.com/logo.png` |
| `VITE_APP_ID` | Manus OAuth app ID | Provided by platform |
| `OAUTH_SERVER_URL` | OAuth backend URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | `https://auth.manus.im` |
| `OWNER_OPEN_ID` | Owner user ID | From Manus platform |
| `OWNER_NAME` | Owner name | Your organization name |

### Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong passwords** (20+ characters, mixed case, numbers, symbols)
3. **Rotate secrets regularly** (every 90 days)
4. **Use environment-specific secrets** (different for dev/staging/prod)
5. **Store secrets in secure vaults** (AWS Secrets Manager, HashiCorp Vault)
6. **Limit database access** to application servers only
7. **Enable SSL/TLS** for database connections in production

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Test connection
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "SELECT 1;"

# Verify network connectivity
docker network inspect horse-health-monitor_horse-health-network
```

### Application Won't Start

```bash
# Check application logs
pm2 logs horse-health-monitor

# Or for Docker
docker-compose logs app

# Verify environment variables
pm2 env horse-health-monitor

# Check port availability
sudo netstat -tlnp | grep 3000
```

### Migration Failures

```bash
# Check current schema
pnpm drizzle-kit introspect

# Force regenerate migrations
rm -rf drizzle/migrations/*
pnpm db:push

# Manual migration
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor < drizzle/0001_migration.sql
```

### Performance Issues

```bash
# Check database performance
docker stats horse-health-db

# Analyze slow queries
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SHOW VARIABLES LIKE 'slow_query%';"

# Check application memory
pm2 monit
```

---

## Backup and Recovery

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/horse-health-monitor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec horse-health-db mysqldump \
  -u horseuser -phorsepass123 \
  --single-transaction \
  --routines \
  --triggers \
  horse_health_monitor > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make executable and schedule:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/horse-health-monitor/backup.sh >> /var/log/horse-health-backup.log 2>&1
```

### Manual Backup

```bash
# Full backup
docker exec horse-health-db mysqldump \
  -u horseuser -phorsepass123 \
  --single-transaction \
  --routines \
  --triggers \
  horse_health_monitor | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup specific tables
docker exec horse-health-db mysqldump \
  -u horseuser -phorsepass123 \
  horse_health_monitor users horses sessions | gzip > partial_backup.sql.gz
```

### Restore from Backup

```bash
# Decompress and restore
gunzip < backup_20240119.sql.gz | \
  docker exec -i horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor

# Or restore directly from compressed file
zcat backup_20240119.sql.gz | \
  docker exec -i horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor
```

### Disaster Recovery

```bash
# 1. Stop application
pm2 stop horse-health-monitor

# 2. Stop and remove database container
docker-compose down

# 3. Remove old volume (if needed)
docker volume rm horse-health-monitor_horse_health_data

# 4. Start fresh database
docker-compose up -d

# 5. Wait for database to be ready
sleep 10

# 6. Restore from backup
zcat /path/to/backup.sql.gz | \
  docker exec -i horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor

# 7. Restart application
pm2 restart horse-health-monitor
```

---

## Monitoring and Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs horse-health-monitor --lines 100

# Application metrics
pm2 describe horse-health-monitor
```

### Database Monitoring

```bash
# Check database status
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "SHOW STATUS;"

# Monitor connections
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "SHOW PROCESSLIST;"

# Check table sizes
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 -e "
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'horse_health_monitor'
ORDER BY (data_length + index_length) DESC;"
```

### Log Rotation

Configure log rotation in `/etc/logrotate.d/horse-health-monitor`:

```
/var/log/nginx/horse-health-monitor-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## Production Checklist

- [ ] Strong passwords configured for database
- [ ] JWT secret generated and secured
- [ ] SSL/TLS certificates installed and configured
- [ ] Firewall rules configured
- [ ] Database backups automated
- [ ] Application monitoring configured
- [ ] Log rotation configured
- [ ] Environment variables secured
- [ ] Database bound to localhost or private network
- [ ] PM2 configured to restart on system reboot
- [ ] Nginx reverse proxy configured
- [ ] Health checks configured
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Performance monitoring configured (e.g., New Relic)
- [ ] Documentation updated with deployment details

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check system resources

**Weekly:**
- Review database performance
- Check backup integrity
- Update dependencies (security patches)

**Monthly:**
- Rotate secrets
- Review and optimize database queries
- Update system packages
- Test disaster recovery procedures

**Quarterly:**
- Security audit
- Performance optimization
- Capacity planning review

---

For additional support, refer to the main README.md or contact your system administrator.

