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
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
