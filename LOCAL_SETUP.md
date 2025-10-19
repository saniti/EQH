# Local Setup Guide - Horse Health Monitoring System

This guide will help you run the complete Horse Health Monitoring System 100% locally on your machine **without any cloud dependencies**.

## Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **Docker** and **Docker Compose** installed
- **Git** installed

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/saniti/EQH.git
cd EQH
```

### 2. Start the MySQL Database with Docker

```bash
docker-compose up -d
```

This will:
- Start MySQL 8.0 on port 3306
- Create the `horse_health` database
- Set up persistent storage in `./mysql-data`

Wait about 10 seconds for MySQL to fully initialize.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root with **minimal required configuration**:

```bash
cat > .env << 'EOF'
# Database (Required)
DATABASE_URL=mysql://horse_admin:horse_password@localhost:3306/horse_health

# JWT Secret (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters

# OAuth (OPTIONAL - Leave empty for local development)
OAUTH_SERVER_URL=
VITE_APP_ID=
VITE_OAUTH_PORTAL_URL=

# App Branding (Optional)
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=/logo.svg
EOF
```

**Important:** For 100% local development, you only need `DATABASE_URL` and `JWT_SECRET`. The OAuth variables can be left empty or omitted entirely. The system will run in local mode without authentication.

### 5. Push Database Schema

```bash
pnpm db:push
```

This creates all 15 tables in your local MySQL database.

### 6. Seed Sample Data

```bash
npx tsx scripts/seed-data.ts
```

This populates your database with:
- 3 organizations
- 30 horses across 10 breeds
- 55 racetracks (Australia + US)
- 100 training sessions
- 50 monitoring devices
- Sample injury records and upcoming care appointments

### 7. Start the Development Server

```bash
pnpm dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

**Note:** You'll see a message `[OAuth] Running in local mode without OAuth (OAUTH_SERVER_URL not configured)` - this is normal and expected for local development.

## Verification

### Check Database is Running

```bash
docker ps
```

You should see the `horse-health-mysql` container running.

### Check Database Connection

```bash
docker exec -it horse-health-mysql mysql -u horse_admin -phorse_password horse_health -e "SHOW TABLES;"
```

You should see all 15 tables listed.

### Access the Application

Open http://localhost:5173 in your browser. You should see the Horse Health Monitoring System dashboard.

## Local Development Workflow

### Start Everything

```bash
# Terminal 1: Start MySQL
docker-compose up

# Terminal 2: Start the app
pnpm dev
```

### Stop Everything

```bash
# Stop the app: Ctrl+C in Terminal 2

# Stop MySQL
docker-compose down
```

### Reset Database

```bash
# Clear and reseed
npx tsx scripts/clear-and-seed.ts
npx tsx scripts/seed-data.ts
```

## Database Management

### Access MySQL CLI

```bash
docker exec -it horse-health-mysql mysql -u horse_admin -phorse_password horse_health
```

### Backup Database

```bash
docker exec horse-health-mysql mysqldump -u horse_admin -phorse_password horse_health > backup.sql
```

### Restore Database

```bash
docker exec -i horse-health-mysql mysql -u horse_admin -phorse_password horse_health < backup.sql
```

### View Logs

```bash
docker-compose logs -f mysql
```

## Project Structure

```
horse-health-monitor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities and helpers
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database queries
│   └── _core/             # Framework code
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── scripts/               # Utility scripts
│   ├── seed-data.ts       # Sample data generator
│   └── clear-and-seed.ts  # Database reset
├── docker-compose.yml     # Docker configuration
└── .env                   # Environment variables
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm db:push      # Push schema changes to database
pnpm lint         # Run ESLint
```

## Troubleshooting

### Port Already in Use

If port 3306 is already in use:

1. Edit `docker-compose.yml`
2. Change `3306:3306` to `3307:3306`
3. Update `DATABASE_URL` in `.env` to use port 3307

### Database Connection Failed

```bash
# Check if MySQL is running
docker ps

# Restart MySQL
docker-compose restart mysql

# Check logs
docker-compose logs mysql
```

### Permission Denied on mysql-data

```bash
sudo chown -R $(whoami):$(whoami) ./mysql-data
```

### OAuth Error Messages

If you see `[OAuth] Running in local mode without OAuth` - this is **normal and expected** for local development. The system works perfectly without OAuth configuration.

## Authentication (Optional)

By default, the app runs **without authentication** for local development. This is intentional and allows you to test all features immediately.

To enable full authentication (optional):

1. Sign up at https://portal.manus.im
2. Create a new application
3. Copy the App ID and update `.env`:
   ```
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_APP_ID=your-actual-app-id
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   ```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Features Included

✅ **Organization Management** - Multi-tenant support with role-based access  
✅ **Horse Registry** - Complete horse profiles with health tracking  
✅ **Training Sessions** - Performance metrics and injury risk assessment  
✅ **Track Management** - 55+ racetracks (Australia + US)  
✅ **Device Monitoring** - IoT device integration  
✅ **Theme Customization** - 6 color schemes  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Real-time Updates** - Live data synchronization  

## Support

For issues or questions:
- GitHub Issues: https://github.com/saniti/EQH/issues
- Documentation: See README.md and DEPLOYMENT.md

---

**You can now run the entire Horse Health Monitoring System 100% locally with just Docker and Node.js - no cloud services required!**

