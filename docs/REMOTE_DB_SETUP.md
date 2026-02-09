# Remote Database Setup - Tailscale PostgreSQL

This project is now configured to use a remote PostgreSQL database hosted on your Ubuntu laptop, accessible via Tailscale VPN.

## Database Connection Details

- **Host:** `100.94.61.91` (Tailscale IP)
- **Port:** `5432`
- **Database:** `app_dev`
- **Username:** `postgres`
- **Password:** `PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT`

**Connection String:**
```
postgresql://postgres:PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT@100.94.61.91:5432/app_dev
```

## Prerequisites

1. **Tailscale VPN** must be installed and connected
   - Download from: https://tailscale.com/download
   - Make sure you're connected to the same Tailnet

2. **Test Connection:**
   ```bash
   # Test if you can reach the database server
   ping 100.94.61.91
   
   # Test PostgreSQL port
   telnet 100.94.61.91 5432
   # OR
   nc -zv 100.94.61.91 5432
   ```

## Setup Steps

### 1. Verify Tailscale Connection

```bash
# Check Tailscale status
tailscale status

# Should show your device and the Ubuntu laptop (100.94.61.91)
```

### 2. Generate Prisma Client

```bash
cd apps/web
pnpm prisma generate
```

### 3. Run Database Migrations

```bash
cd apps/web
pnpm prisma migrate deploy
```

Or for development with migration creation:

```bash
cd apps/web
pnpm prisma migrate dev
```

### 4. (Optional) Seed the Database

```bash
cd apps/web
pnpm db:seed
```

### 5. Verify Connection

```bash
# Test connection using Prisma Studio
cd apps/web
pnpm prisma studio
```

Or test directly:

```bash
# Using psql (if installed)
psql postgresql://postgres:PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT@100.94.61.91:5432/app_dev

# Using Prisma CLI
cd apps/web
pnpm prisma db pull
```

## Troubleshooting

### Connection Refused / Timeout

1. **Check Tailscale:**
   ```bash
   tailscale status
   ```
   Make sure you're connected and can see the Ubuntu laptop

2. **Check Database Server:**
   - Verify the database is running on the Ubuntu laptop
   - Check firewall rules (should allow Tailscale network)

3. **Test Network Connectivity:**
   ```bash
   ping 100.94.61.91
   telnet 100.94.61.91 5432
   ```

### Authentication Failed

- Double-check the password in `.env` matches the credentials
- Verify the username is `postgres`
- Ensure the database `app_dev` exists

### Database Does Not Exist

If `app_dev` doesn't exist, you can:

1. **Create it via psql:**
   ```bash
   psql postgresql://postgres:PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT@100.94.61.91:5432/postgres
   ```
   Then:
   ```sql
   CREATE DATABASE app_dev;
   \q
   ```

2. **Or use a different database:**
   - Update `.env` to use `postgres` (default database)
   - Or use `app_test` or `app_prod` if they exist

## Environment Variables

The `.env` file in `apps/web/` is already configured with:

```env
DATABASE_URL="postgresql://postgres:PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT@100.94.61.91:5432/app_dev"
```

## Switching Back to Local Docker

If you want to switch back to the local Docker database:

1. Update `apps/web/.env`:
   ```env
   DATABASE_URL="postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker"
   ```

2. Start Docker database:
   ```bash
   pnpm db:start
   ```

3. Run migrations:
   ```bash
   cd apps/web
   pnpm prisma migrate deploy
   ```

## Web Management Interface

Access pgAdmin for database management:

- **URL:** http://100.94.61.91:5050
- **Email:** admin@example.com
- **Password:** Pgau2KWSqM5VNELg4ohzeavvhSqmyFVZvA

## Security Notes

⚠️ **Important:**
- The database is only accessible via Tailscale VPN
- Never commit `.env` files with credentials to git
- Store credentials in a password manager
- The database is protected by firewall on the Ubuntu laptop

## Quick Reference

| Item | Value |
|------|-------|
| Host | 100.94.61.91 |
| Port | 5432 |
| Database | app_dev |
| Username | postgres |
| Password | PgYapw9jbMuncEWOq1Ffz2fjxWGTDRZT |
| pgAdmin | http://100.94.61.91:5050 |

## Next Steps

1. ✅ Verify Tailscale connection
2. ✅ Test database connectivity
3. ✅ Run migrations
4. ✅ Start your application

Your application will now use the remote PostgreSQL database!
