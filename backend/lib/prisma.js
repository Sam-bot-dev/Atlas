const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const defaultDatabaseUrl = `file:${path.join(__dirname, '..', 'dev.db')}`;

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  console.log('Initializing Prisma Client with better-sqlite3 adapter...');
  
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || defaultDatabaseUrl,
  });

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

  // Verify connection immediately
  globalForPrisma.prisma.$connect()
    .then(() => console.log('Database connected successfully.'))
    .catch((err) => console.error('Database connection failed:', err.message));
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
