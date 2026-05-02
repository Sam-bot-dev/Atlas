const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const defaultDatabaseUrl = `file:${path.join(__dirname, '..', 'dev.db')}`;

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  // Prisma 7 requires an adapter for direct SQLite connection in many environments
  // We use the better-sqlite3 adapter for performance and stability
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || defaultDatabaseUrl,
  });

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
