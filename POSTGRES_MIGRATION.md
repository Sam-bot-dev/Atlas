# PostgreSQL Migration Guide

Atlas has been migrated from SQLite to PostgreSQL to fix #94 (data loss on Render deploys).

## What Changed

- **Database**: SQLite → PostgreSQL
- **Prisma version**: 7.8.0 (with `@prisma/adapter-pg`)
- **Config**: Datasource URL moved from `schema.prisma` to `prisma.config.js` (Prisma 7 requirement)
- **Dependencies**: Removed `better-sqlite3`, added `pg` and `@prisma/adapter-pg`

## Local Development Setup

### Option 1: Use Docker Postgres

```bash
docker run --name atlas-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atlas -p 5432:5432 -d postgres:16
```

### Option 2: Install Postgres locally

- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql@16 && brew services start postgresql@16`
- **Linux**: `sudo apt install postgresql-16`

### Create the database and run migrations

```bash
cd backend

# Update .env with your Postgres connection string
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atlas

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

## Migrating Existing SQLite Data

If you have an existing SQLite database (`backend/dev.db` or `backend/prisma/dev.db`) with real data:

```bash
cd backend

# 1. Make sure Postgres is running and DATABASE_URL is set
# 2. Run migrations first to create the schema
npm run db:migrate

# 3. Run the migration script
SQLITE_URL="file:./dev.db" npm run db:migrate-from-sqlite
```

The migration script (`prisma/migrate-sqlite-to-postgres.js`) uses upsert for all records, so it's safe to re-run.

## Render Deployment

The `render.yaml` has been updated to:

1. Create a managed PostgreSQL database (`atlas-db`)
2. Automatically inject `DATABASE_URL` from the database
3. Run `prisma migrate deploy` on every deploy
4. Seed demo data

### First Deploy Steps

1. Push the code to your repo
2. Render will automatically:
   - Provision the Postgres database
   - Run migrations
   - Seed demo data
   - Start the server

### Migrating Production SQLite Data

If you have production data in the current SQLite database on Render:

1. **Before deploying**, download the SQLite file from Render:
   ```bash
   # SSH into your Render service (if available) or use the Render Shell
   # Download /var/data/atlas.db
   ```

2. Run the migration locally:
   ```bash
   # Point to your production Postgres (get URL from Render dashboard)
   DATABASE_URL="postgresql://..." SQLITE_URL="file:./atlas.db" node backend/prisma/migrate-sqlite-to-postgres.js
   ```

3. Deploy the new code

## Troubleshooting

### "Authentication failed" error

Check your `DATABASE_URL` format:
```
postgresql://username:password@host:port/database
```

### "relation does not exist" error

Run migrations:
```bash
cd backend && npm run db:migrate
```

### Prisma Client errors

Regenerate the client:
```bash
cd backend && npm run db:generate
```

## Rollback (if needed)

To revert to SQLite temporarily:

1. Change `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
   }
   ```

2. Update `backend/prisma.config.js`:
   ```js
   datasource: {
     url: "file:./dev.db"
   }
   ```

3. Restore `backend/lib/prisma.js` to use `@prisma/adapter-better-sqlite3`

4. Run `npm install better-sqlite3 @prisma/adapter-better-sqlite3`

5. Run `npx prisma generate --config prisma.config.js`
