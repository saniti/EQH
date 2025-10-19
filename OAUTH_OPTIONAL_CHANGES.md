# OAuth Optional Mode - Implementation Summary

## Overview

This document describes the changes made to make OAuth authentication truly optional for local development. When `OAUTH_SERVER_URL` is not configured, the system automatically operates in **local development mode** with a default local user.

## Changes Made

### 1. Backend Changes

#### `server/_core/sdk.ts`
- Modified `OAuthService` class to accept `null` client when OAuth is not configured
- Added `ensureClient()` method that throws a clear error if OAuth methods are called without configuration
- Updated `createOAuthHttpClient()` to return `null` when `OAUTH_SERVER_URL` is empty
- Added `isOAuthEnabled` flag to `SDKServer` class
- **Key Change**: Modified `authenticateRequest()` to create and use a default local user when OAuth is disabled:
  ```typescript
  if (!this.isOAuthEnabled) {
    const localUserId = "local-dev-user";
    let user = await db.getUser(localUserId);
    
    if (!user) {
      console.log("[Auth] Creating local development user");
      await db.upsertUser({
        id: localUserId,
        name: "Local Developer",
        email: "dev@localhost",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });
      user = await db.getUser(localUserId);
    }
    
    return user;
  }
  ```

#### `server/_core/oauth.ts`
- Added check at the start of `registerOAuthRoutes()` to skip route registration when OAuth is not configured
- Logs a clear message: `"[OAuth] Skipping OAuth route registration (not configured)"`

### 2. Frontend Changes

#### `client/src/const.ts`
- Updated `getLoginUrl()` to handle missing OAuth configuration gracefully
- Returns current pathname instead of throwing error when OAuth is not configured
- This prevents redirect loops in local development mode

### 3. Environment Configuration

The `.env.example` file already documents that OAuth variables are optional:

```bash
# OAuth Configuration (Optional - only needed for Manus platform integration)
# Leave empty for local development without authentication
VITE_APP_ID=
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

## How It Works

### Local Development Mode (OAuth Disabled)

1. **Server Startup**: 
   - SDK detects empty `OAUTH_SERVER_URL`
   - Logs: `"[OAuth] Running in local mode without OAuth (OAUTH_SERVER_URL not configured)"`
   - OAuth routes are not registered

2. **Authentication**:
   - All tRPC requests automatically get a local user: `"local-dev-user"`
   - User is created on first request with:
     - ID: `"local-dev-user"`
     - Name: `"Local Developer"`
     - Email: `"dev@localhost"`
     - Login Method: `"local"`

3. **Frontend**:
   - `auth.me` query returns the local user
   - No login redirect occurs
   - All features work normally with the local user

### Production Mode (OAuth Enabled)

1. **Server Startup**:
   - SDK initializes with OAuth server URL
   - OAuth callback routes are registered
   - Logs: `"[OAuth] Initialized with baseURL: https://api.manus.im"`

2. **Authentication**:
   - Users must authenticate via OAuth
   - Session cookies are validated
   - User info is synced from OAuth server

3. **Frontend**:
   - Unauthenticated users are redirected to OAuth portal
   - Login flow completes via `/api/oauth/callback`
   - Session is maintained via secure cookies

## Testing Local Mode

1. **Create `.env` file** (or ensure OAuth variables are empty):
   ```bash
   DATABASE_URL=mysql://horse_admin:horse_password@localhost:3306/horse_health
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
   VITE_APP_TITLE=Horse Health Monitor
   VITE_APP_LOGO=/logo.svg
   ```

2. **Start the database**:
   ```bash
   docker compose up -d
   ```

3. **Run database migrations**:
   ```bash
   pnpm db:push
   ```

4. **Seed the database** (optional):
   ```bash
   pnpm seed
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

6. **Access the application**:
   - Open `http://localhost:3000`
   - You should be automatically logged in as "Local Developer"
   - All features should work without any OAuth configuration

## Expected Console Output

When running in local mode, you should see:

```
[OAuth] Running in local mode without OAuth (OAUTH_SERVER_URL not configured)
[OAuth] Skipping OAuth route registration (not configured)
Server running on http://localhost:3000/
[Auth] Creating local development user
```

## Benefits

1. **Zero Configuration**: No need to set up OAuth for local development
2. **Faster Development**: No authentication delays or redirects
3. **Offline Development**: Works without internet connection (after dependencies are installed)
4. **Simplified Testing**: All features accessible immediately
5. **Production Ready**: Same codebase works with OAuth when configured

## Migration Path

To enable OAuth in production:

1. Set environment variables:
   ```bash
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://portal.manus.im
   ```

2. Restart the server

3. OAuth authentication will be automatically enabled

No code changes required!

