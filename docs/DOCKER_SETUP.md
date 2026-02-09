# Docker Database Setup Guide

This guide explains how to use Docker to run PostgreSQL for the Job Tracker application.

## Quick Start

### 1. Start the PostgreSQL Database

```bash
# From the project root
docker-compose up -d
```

This will:
- Start PostgreSQL 16 in a Docker container
- Create a database named `jobtracker`
- Expose it on port `5432`
- Persist data in a Docker volume

### 2. Verify Database is Running

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs postgres

# Test connection (optional)
docker-compose exec postgres psql -U jobtracker -d jobtracker -c "SELECT version();"
```

### 3. Update Environment Variables

The `.env` file in `apps/web/` should already be configured with:
```
DATABASE_URL="postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker"
```

### 4. Run Database Migrations

```bash
cd apps/web
pnpm prisma migrate deploy
# OR for development
pnpm prisma migrate dev
```

### 5. Generate Prisma Client

```bash
cd apps/web
pnpm prisma generate
```

### 6. (Optional) Seed the Database

```bash
cd apps/web
pnpm db:seed
```

## Database Connection Details

- **Host**: `localhost` (or `postgres` if connecting from another Docker container)
- **Port**: `5432`
- **Database**: `jobtracker`
- **Username**: `jobtracker`
- **Password**: `jobtracker_dev_password`

**Connection String:**
```
postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker
```

## Common Commands

### Start Database
```bash
docker-compose up -d
```

### Stop Database
```bash
docker-compose down
```

### Stop and Remove Data (⚠️ WARNING: Deletes all data)
```bash
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U jobtracker -d jobtracker
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U jobtracker jobtracker > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U jobtracker jobtracker < backup.sql
```

## Prisma Studio (Database GUI)

Access Prisma Studio to view/edit your database:

```bash
cd apps/web
pnpm prisma studio
```

This opens a browser at `http://localhost:5555`

## Troubleshooting

### Port Already in Use

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```

Then update your `DATABASE_URL` to use port `5433`.

### Database Connection Errors

1. **Check if container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check container logs:**
   ```bash
   docker-compose logs postgres
   ```

3. **Verify environment variables:**
   Make sure `apps/web/.env` has the correct `DATABASE_URL`

4. **Test connection manually:**
   ```bash
   docker-compose exec postgres psql -U jobtracker -d jobtracker
   ```

### Reset Database

If you need to completely reset the database:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migrations
cd apps/web
pnpm prisma migrate deploy
```

## Production Considerations

For production, you should:

1. **Change the default password** in `docker-compose.yml`
2. **Use environment variables** for sensitive data:
   ```yaml
   environment:
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
   ```
3. **Use a managed database service** (AWS RDS, Google Cloud SQL, etc.)
4. **Enable SSL connections**
5. **Set up regular backups**
6. **Use connection pooling** (PgBouncer)

## Data Persistence

Database data is stored in a Docker volume named `postgres_data`. This means:
- Data persists even if you stop the container
- Data is removed only if you use `docker-compose down -v`
- You can backup the volume if needed

To view volume information:
```bash
docker volume ls
docker volume inspect effective-barnacle_postgres_data
```
