# Docker Database - Quick Start

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running before proceeding

## Setup Steps

### 1. Start Docker Database

```bash
# Option 1: Using npm script (recommended)
pnpm db:start

# Option 2: Using docker-compose directly
docker-compose up -d
```

### 2. Run Database Setup Script

```bash
# This will:
# - Start the database
# - Generate Prisma client
# - Run migrations
pnpm db:setup
```

### 3. Verify Connection

```bash
# Check if database is running
docker-compose ps

# View database logs
pnpm db:logs
```

### 4. (Optional) Seed Database

```bash
cd apps/web
pnpm db:seed
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm db:start` | Start PostgreSQL container |
| `pnpm db:stop` | Stop PostgreSQL container |
| `pnpm db:logs` | View database logs |
| `pnpm db:setup` | Full setup (start + migrate) |
| `pnpm db:reset` | Reset database (⚠️ deletes all data) |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |

## Database Connection

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `jobtracker`
- **Username**: `jobtracker`
- **Password**: `jobtracker_dev_password`

**Connection String:**
```
postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker
```

## Troubleshooting

### Docker Not Running

If you see "permission denied" or "cannot connect to Docker daemon":

1. **macOS**: Open Docker Desktop from Applications
2. **Linux**: Run `sudo systemctl start docker`
3. Verify: `docker info` should work without errors

### Port Already in Use

If port 5432 is already in use:

1. Edit `docker-compose.yml` and change the port mapping:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

2. Update `apps/web/.env`:
   ```
   DATABASE_URL="postgresql://jobtracker:jobtracker_dev_password@localhost:5433/jobtracker"
   ```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove everything
pnpm db:stop
docker-compose down -v

# Start fresh
pnpm db:setup
```

## Next Steps

After the database is running:

1. **Start your application:**
   ```bash
   pnpm dev
   ```

2. **Access Prisma Studio** (optional):
   ```bash
   pnpm db:studio
   ```
   Opens at: http://localhost:5555

3. **Your app is now using PostgreSQL!** 🎉
