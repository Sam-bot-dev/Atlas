/* eslint-env node */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Singleton pattern — reuse across hot reloads in dev
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  globalForPrisma.prisma.$connect()
    .then(() => console.log('PostgreSQL connected.'))
    .catch((err) => {
      // Log but don't exit — waitForDb in server.js will retry
      console.warn('Initial DB connection attempt failed:', err.message);
    });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
