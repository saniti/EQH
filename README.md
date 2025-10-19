# Horse Health Monitoring System

A comprehensive horse health monitoring platform with training session tracking, injury management, and multi-role access control for standard users, veterinarians, and administrators.

## Features

### All Users
- **Dashboard**: Real-time metrics, favorite horses, upcoming care
- **Horses**: Registry with filtering, sorting, favorites, and management
- **Sessions**: Training session tracking with performance data and injury risk
- **Tracks**: Global and local track management
- **Reporting**: Health trends reports with PDF/CSV export
- **Organizations**: View memberships and request creation/transfers
- **Devices**: Monitor and manage devices
- **Settings**: User profile and preferences

### Veterinarians (Additional)
- Medical diagnosis for flagged injuries
- Email notifications for injuries
- Status management (dismiss/flag)

### Administrators (Additional)
- **User Management**: Full CRUD, invitations, suspensions
- **Organization Management**: Global view, CRUD, request approvals
- **Device Management**: Global control
- **Track Management**: Direct global management, request approvals
- **Settings**: API configuration

## Tech Stack

- **Frontend**: React 19 + Tailwind 4 + shadcn/ui
- **Backend**: Node.js + Express 4 + tRPC 11
- **Database**: MySQL 8.0 (Docker-based)
- **Authentication**: Manus OAuth + JWT
- **ORM**: Drizzle ORM

## Prerequisites

- Node.js 22.x
- pnpm
- Docker and Docker Compose

## Quick Start

### 1. Start the Database

```bash
# Start MySQL in Docker
docker-compose up -d

# Wait for database to be ready (check health status)
docker-compose ps

# The database will be available at localhost:3306
```

### 2. Configure Environment

The project uses Manus platform for authentication and environment management. The following environment variables are automatically injected:

- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session cookie signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend base URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- `OWNER_OPEN_ID`, `OWNER_NAME` - Preview identity seed
- `VITE_APP_TITLE` - Application title
- `VITE_APP_LOGO` - Logo image URL

For local development, create a `.env` file:

```env
DATABASE_URL=mysql://horseuser:horsepass123@localhost:3306/horse_health_monitor
JWT_SECRET=your-jwt-secret-here
VITE_APP_TITLE=Horse Health Monitor
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Push Database Schema

```bash
pnpm db:push
```

This command will:
1. Generate migrations from the schema
2. Apply migrations to the database

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Database Management

### View Database Schema

```bash
# Connect to MySQL
docker exec -it horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor

# Show tables
SHOW TABLES;

# Describe a table
DESCRIBE users;
```

### Backup Database

```bash
docker exec horse-health-db mysqldump -u horseuser -phorsepass123 horse_health_monitor > backup.sql
```

### Restore Database

```bash
docker exec -i horse-health-db mysql -u horseuser -phorsepass123 horse_health_monitor < backup.sql
```

### Stop Database

```bash
docker-compose down
```

### Remove Database Volume (WARNING: Deletes all data)

```bash
docker-compose down -v
```

## Database Schema

### Core Tables

- **users** - User accounts with roles (user/admin) and types (standard/veterinarian)
- **organizations** - Organizations with contact info and notification settings
- **userOrganizations** - Many-to-many mapping between users and organizations
- **horses** - Horse registry with health records
- **userFavoriteHorses** - User's favorite horses
- **devices** - Monitoring devices assigned to horses
- **tracks** - Training tracks (global/local scope)
- **sessions** - Training sessions with performance data
- **sessionComments** - Comments on training sessions
- **injuryRecords** - Injury tracking with medical diagnoses
- **upcomingCare** - Scheduled care and appointments
- **invitations** - User invitations
- **organizationRequests** - Organization creation/transfer requests
- **trackRequests** - Track modification requests
- **apiSettings** - Admin API configuration

## Development Workflow

### 1. Update Schema

Edit `drizzle/schema.ts` to modify database tables:

```typescript
export const myNewTable = mysqlTable("myNewTable", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  // ... more fields
});
```

### 2. Push Schema Changes

```bash
pnpm db:push
```

### 3. Add Database Helpers

Add query functions in `server/db.ts`:

```typescript
export async function getMyData(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(myNewTable).where(eq(myNewTable.id, id));
  return result[0];
}
```

### 4. Create tRPC Procedures

Add API endpoints in `server/routers.ts`:

```typescript
myFeature: router({
  getData: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getMyData(input.id);
    }),
}),
```

### 5. Build Frontend

Create components in `client/src/pages/` and use tRPC hooks:

```typescript
const { data, isLoading } = trpc.myFeature.getData.useQuery({ id: 1 });
```

## User Roles & Permissions

### Standard User
- View and manage horses in their organizations
- Track training sessions and add comments
- Flag injuries with affected body parts
- Request track modifications
- Manage devices (non-veterinarians only)

### Veterinarian
- All standard user features
- Add medical diagnoses to injuries
- Send injury notifications
- Dismiss or formally flag injuries

### Administrator
- All user features
- Manage all users (CRUD, suspend, activate)
- Send user invitations
- Manage all organizations
- Approve/reject organization requests
- Global device management
- Direct global track management
- Approve/reject track requests
- Configure API settings

## API Documentation

The application uses tRPC for type-safe API communication. All endpoints are available under `/api/trpc`.

### Key Router Groups

- `auth` - Authentication (login, logout, current user)
- `dashboard` - Dashboard statistics and data
- `horses` - Horse management
- `sessions` - Training session tracking
- `injuries` - Injury record management
- `tracks` - Track management
- `devices` - Device management
- `organizations` - Organization management
- `users` - User management (admin)
- `invitations` - User invitations (admin)
- `upcomingCare` - Scheduled care management
- `apiSettings` - API configuration (admin)

## Production Deployment

### 1. Build for Production

```bash
pnpm build
```

### 2. Start Production Server

```bash
pnpm start
```

### 3. Docker Production Setup

For production, consider using a managed MySQL service or configure Docker with:
- Persistent volumes
- Backup strategy
- Monitoring
- SSL/TLS encryption
- Network security

## Troubleshooting

### Database Connection Issues

```bash
# Check if container is running
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Schema Migration Issues

```bash
# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d
pnpm db:push
```

### Port Conflicts

If port 3306 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3307:3306"  # Use different host port
```

Then update `DATABASE_URL` to use the new port.

## License

MIT

## Support

For issues and questions, please open an issue on the project repository.

