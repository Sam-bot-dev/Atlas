/* eslint-env node */
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Singleton pattern — reuse across hot reloads in dev
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const { PrismaPg } = require('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  // Start with no logging so startup probe failures don't spam prisma:error.
  // waitForDb() in server.js will confirm readiness before any real queries run.
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
  });
}

const prisma = globalForPrisma.prisma;

module.exports = { prisma };
