/* eslint-env node */
// Prisma 7 configuration — datasource URL lives here, not in schema.prisma
require('dotenv').config();
const { defineConfig } = require('@prisma/config');

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
