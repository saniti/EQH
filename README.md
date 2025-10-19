# Horse Health Monitoring System

A comprehensive full-stack web application for managing horse health, training sessions, and performance tracking with multi-organization support.

## ✨ Features

- **🏢 Multi-Organization Management** - Support for multiple racing stables/equestrian centers
- **🐴 Horse Registry** - Complete horse profiles with health tracking and favorites
- **📊 Training Sessions** - Performance metrics, injury risk assessment, and session history
- **🏇 Track Management** - 55+ racetracks from Australia and United States
- **📱 Device Monitoring** - IoT device integration for real-time health data
- **🎨 Theme Customization** - 6 beautiful color schemes
- **👥 Role-Based Access Control** - Standard Users, Veterinarians, and Administrators
- **📈 Real-time Dashboard** - Live statistics and health alerts
- **🔍 Advanced Filtering** - Search, sort, and filter across all data

## 🚀 Quick Start (100% Local)

**Prerequisites:** Node.js 18+, pnpm, Docker

```bash
# 1. Clone the repository
git clone https://github.com/saniti/EQH.git
cd EQH

# 2. Start MySQL database
docker-compose up -d

# 3. Install dependencies
pnpm install

# 4. Set up environment
cp .env.example .env

# 5. Create database tables
pnpm db:push

# 6. Seed sample data (optional but recommended)
npx tsx scripts/seed-data.ts

# 7. Start the application
pnpm dev
```

**Access the app:** http://localhost:5173

See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed instructions.

## 📋 System Requirements

### For Local Development
- **Node.js** 18 or higher
- **pnpm** (npm install -g pnpm)
- **Docker** and Docker Compose
- **4GB RAM** minimum
- **2GB disk space** for database

### For Production
- **Ubuntu 20.04+** or similar Linux distribution
- **Node.js** 18+
- **MySQL 8.0+** or compatible database
- **Nginx** (recommended for reverse proxy)
- **2GB RAM** minimum
- **10GB disk space**

## 🏗️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **Wouter** - Routing
- **tRPC** - End-to-end type-safe API
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express 4** - Web server
- **tRPC 11** - API layer
- **Drizzle ORM** - Database toolkit
- **MySQL 8** - Database

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Local orchestration
- **PM2** - Process management (production)

## 📁 Project Structure

```
horse-health-monitor/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── pages/            # Page components (Dashboard, Horses, Sessions, etc.)
│   │   ├── components/       # Reusable UI components (shadcn/ui)
│   │   ├── contexts/         # React contexts (Organization, Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities (tRPC client, themes, date formatting)
│   └── public/               # Static assets
├── server/                    # Node.js backend
│   ├── routers.ts            # tRPC API routes
│   ├── db.ts                 # Database query functions
│   ├── storage.ts            # S3 file storage helpers
│   └── _core/                # Framework code (OAuth, context, etc.)
├── drizzle/                   # Database schema and migrations
│   └── schema.ts             # Table definitions (15 tables)
├── scripts/                   # Utility scripts
│   ├── seed-data.ts          # Sample data generator
│   └── clear-and-seed.ts     # Database reset script
├── docker-compose.yml         # Docker configuration for MySQL
├── .env.example              # Environment variables template
├── LOCAL_SETUP.md            # Detailed local setup guide
└── DEPLOYMENT.md             # Production deployment guide
```

## 🗄️ Database Schema

The system uses 15 tables:

- **users** - User accounts and authentication
- **organizations** - Racing stables/equestrian centers
- **userOrganizations** - User-organization memberships
- **horses** - Horse profiles and health data
- **sessions** - Training session records
- **injuries** - Injury tracking and medical records
- **tracks** - Racetracks and training facilities
- **devices** - Monitoring device registry
- **deviceReadings** - Real-time sensor data
- **upcomingCare** - Scheduled health appointments
- **userFavoriteHorses** - User favorites
- **organizationRequests** - Membership requests
- **invitations** - User invitations
- **userPreferences** - User settings
- **apiKeys** - API access management

## 🔧 Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Required for local development
DATABASE_URL=mysql://horse_admin:horse_password@localhost:3306/horse_health
JWT_SECRET=your-secret-key-minimum-32-characters

# Optional - Leave empty for local development without authentication
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=

# Branding
VITE_APP_TITLE=Horse Health Monitor
VITE_APP_LOGO=/logo.svg
```

### Docker Configuration

The `docker-compose.yml` provides a MySQL 8.0 database with:
- Port: 3306
- Database: horse_health
- User: horse_admin
- Password: horse_password
- Persistent storage in `./mysql-data`

## 📊 Sample Data

Run the seed script to populate your database with:

- **3 organizations** (Melbourne Racing Stables, Sydney Equestrian Center, Brisbane Horse Training)
- **30 horses** across 10 breeds (Thoroughbred, Arabian, Quarter Horse, etc.)
- **55 racetracks** (17 Australian + 23 US + 15 training facilities)
- **100 training sessions** with realistic performance metrics
- **50 monitoring devices** (heart rate monitors, temperature sensors, GPS trackers)
- **Injury records** and upcoming care appointments

```bash
npx tsx scripts/seed-data.ts
```

## 🎨 Theme Customization

The application includes 6 built-in themes:

1. **Professional Blue** (Default)
2. **Forest Green**
3. **Sunset Orange**
4. **Royal Purple**
5. **Ocean Teal**
6. **Dark Mode**

Users can switch themes via the palette icon in the sidebar.

## 🔐 Authentication & Authorization

### Local Development Mode

By default, the system runs **without authentication** for local development:

- OAuth configuration is **optional**
- A default local user ("Local Developer") is automatically created
- All features work immediately without login
- Perfect for development and testing

### Production Mode

Enable OAuth by setting environment variables:

```env
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-app-id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

The same codebase works in both modes - no code changes required!

### Roles

- **Standard User** - View horses and sessions for their organizations
- **Veterinarian** - Additional access to medical records and injury tracking
- **Administrator** - Full system access, user management, organization management

### RBAC Chain

```
Organization → Horses → Sessions
```

- Users belong to one or more organizations
- Horses belong to one organization
- Sessions belong to horses (and inherit organization access)

## 🚢 Deployment

### Local Development

See [LOCAL_SETUP.md](./LOCAL_SETUP.md)

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Traditional server deployment
- Docker deployment
- Cloud platform deployment (AWS, DigitalOcean, Heroku)
- Nginx configuration
- SSL setup
- Backup strategies

## 📝 Available Scripts

```bash
# Development
pnpm dev              # Start development server (frontend + backend)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Utilities
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
```

## 🧪 Testing

```bash
# Run seed data to test with sample data
npx tsx scripts/seed-data.ts

# Clear and reseed database
npx tsx scripts/clear-and-seed.ts
npx tsx scripts/seed-data.ts
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if MySQL is running
docker ps

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Port Conflicts

If port 3306 is already in use, edit `docker-compose.yml`:

```yaml
ports:
  - "3307:3306"  # Use 3307 instead
```

Then update `DATABASE_URL` in `.env` to use port 3307.

### Permission Issues

```bash
# Fix mysql-data directory permissions
sudo chown -R $(whoami):$(whoami) ./mysql-data
```

## 📚 Documentation

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Detailed local development setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Quick deployment reference
- [scripts/README.md](./scripts/README.md) - Seed data documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:
- GitHub Issues: https://github.com/saniti/EQH/issues

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with wearable devices
- [ ] Veterinary appointment scheduling
- [ ] Nutrition tracking
- [ ] Breeding management
- [ ] Competition results tracking
- [ ] Multi-language support

---

**Built with ❤️ for the equestrian community**

## 🔑 Key Highlights

✅ **100% Local Development** - Run entirely on your machine with Docker  
✅ **Type-Safe** - End-to-end TypeScript with tRPC  
✅ **Modern Stack** - React 19, Tailwind 4, Node.js  
✅ **Production-Ready** - Includes deployment guides and Docker configs  
✅ **Well-Documented** - Comprehensive guides for setup and deployment  
✅ **Sample Data** - Pre-populated with realistic data for testing  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Theme Support** - 6 beautiful color schemes  
✅ **Multi-Tenant** - Support for multiple organizations  
✅ **Role-Based Access** - Granular permissions system  

## Quick Links

- 📖 [Local Setup Guide](./LOCAL_SETUP.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 🗄️ [Database Schema](./drizzle/schema.ts)
- 🎨 [Theme Configuration](./client/src/lib/themes.ts)
- 📊 [Sample Data](./scripts/seed-data.ts)

