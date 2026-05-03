// @ts-nocheck
/* eslint-disable */
/**
 * One-time migration: SQLite → PostgreSQL
 *
 * Usage:
 *   SQLITE_URL="file:./dev.db" DATABASE_URL="postgresql://..." node prisma/migrate-sqlite-to-postgres.js
 *
 * Requires better-sqlite3 to be installed temporarily:
 *   npm install --save-dev better-sqlite3
 *
 * Run AFTER `prisma migrate deploy` has created the Postgres schema.
 * Safe to re-run — uses upsert for all records.
 */

/* eslint-env node */
const { PrismaClient: PgClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const SQLITE_PATH = process.env.SQLITE_URL
  ? process.env.SQLITE_URL.replace('file:', '')
  : path.join(__dirname, '..', 'dev.db');

const pg = new PgClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const sqlite = new Database(SQLITE_PATH, { readonly: true });

const query = (sql) => sqlite.prepare(sql).all();

async function migrate() {
  await pg.$connect();
  console.log('Connected to PostgreSQL.');
  console.log(`Reading SQLite from: ${SQLITE_PATH}`);

  // ── Users ──────────────────────────────────────────────────────
  const users = query('SELECT * FROM User');
  console.log(`Migrating ${users.length} users...`);
  for (const u of users) {
    await pg.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password || null,
        isFirebaseUser: Boolean(u.isFirebaseUser),
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }

  // ── Businesses ─────────────────────────────────────────────────
  const businesses = query('SELECT * FROM Business');
  console.log(`Migrating ${businesses.length} businesses...`);
  for (const b of businesses) {
    await pg.business.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        name: b.name,
        category: b.category,
        location: b.location || '',
        owner: b.owner || '',
        initials: b.initials || '',
        color: b.color || '#4f46e5',
        placeId: b.placeId || '',
        address: b.address || '',
        isDemo: Boolean(b.isDemo),
        peakHours: b.peakHours || '[]',
        revenueSeries: b.revenueSeries || '[]',
        ordersSeries: b.ordersSeries || '[]',
        customerGrowth: b.customerGrowth || '[]',
        topMovers: b.topMovers || '[]',
        spendingMix: b.spendingMix || '[]',
        goals: b.goals || '[]',
        userId: b.userId,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      },
    });
  }

  // ── Metrics ────────────────────────────────────────────────────
  const metrics = query('SELECT * FROM Metric');
  console.log(`Migrating ${metrics.length} metrics...`);
  for (const m of metrics) {
    await pg.metric.upsert({
      where: { businessId_key: { businessId: m.businessId, key: m.key } },
      update: { value: m.value, delta: m.delta, unit: m.unit || '', period: m.period || '', label: m.label || '' },
      create: {
        id: m.id,
        key: m.key,
        value: m.value,
        delta: m.delta || 0,
        unit: m.unit || '',
        period: m.period || '',
        label: m.label || '',
        businessId: m.businessId,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      },
    });
  }

  // ── Insights ───────────────────────────────────────────────────
  const insights = query('SELECT * FROM Insight');
  console.log(`Migrating ${insights.length} insights...`);
  for (const i of insights) {
    await pg.insight.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        title: i.title,
        body: i.body,
        severity: i.severity || 'info',
        type: i.type || 'regular',
        evidence: i.evidence || '[]',
        businessId: i.businessId,
        createdAt: new Date(i.createdAt),
      },
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  const actions = query('SELECT * FROM Action');
  console.log(`Migrating ${actions.length} actions...`);
  for (const a of actions) {
    await pg.action.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        body: a.body,
        impact: a.impact || 'Medium',
        effort: a.effort || 'Medium',
        confidence: a.confidence || 'Medium',
        urgent: Boolean(a.urgent),
        status: a.status || 'pending',
        type: a.type || 'regular',
        businessId: a.businessId,
        createdAt: new Date(a.createdAt),
      },
    });
  }

  // ── Tasks ──────────────────────────────────────────────────────
  const tasks = query('SELECT * FROM Task');
  console.log(`Migrating ${tasks.length} tasks...`);
  for (const t of tasks) {
    await pg.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status || 'pending',
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        actionId: t.actionId || null,
        businessId: t.businessId,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  // ── Automations ────────────────────────────────────────────────
  const automations = query('SELECT * FROM Automation');
  console.log(`Migrating ${automations.length} automations...`);
  for (const a of automations) {
    await pg.automation.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        trigger: a.trigger,
        actionType: a.actionType,
        status: a.status || 'active',
        payload: a.payload || '{}',
        lastRunAt: a.lastRunAt ? new Date(a.lastRunAt) : null,
        businessId: a.businessId,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      },
    });
  }

  // ── DataSources ────────────────────────────────────────────────
  const sources = query('SELECT * FROM DataSource');
  console.log(`Migrating ${sources.length} data sources...`);
  for (const s of sources) {
    await pg.dataSource.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        type: s.type,
        name: s.name,
        status: s.status || 'pending',
        fileUrl: s.fileUrl || '',
        meta: s.meta || '{}',
        businessId: s.businessId,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }

  // ── Orders ─────────────────────────────────────────────────────
  const orders = query('SELECT * FROM "Order"');
  console.log(`Migrating ${orders.length} orders...`);
  for (const o of orders) {
    await pg.order.upsert({
      where: { businessId_externalId: { businessId: o.businessId, externalId: o.externalId || o.id } },
      update: {},
      create: {
        id: o.id,
        externalId: o.externalId || o.id,
        orderDate: o.orderDate ? new Date(o.orderDate) : null,
        customerName: o.customerName || '',
        customerPhone: o.customerPhone || '',
        productName: o.productName || '',
        quantity: o.quantity || 0,
        unitPrice: o.unitPrice || 0,
        total: o.total || 0,
        channel: o.channel || '',
        rawPayload: o.rawPayload || '{}',
        businessId: o.businessId,
        sourceId: o.sourceId,
        createdAt: new Date(o.createdAt),
      },
    });
  }

  console.log('\n✅ Migration complete!');
  console.log('You can now delete the SQLite file and remove better-sqlite3 from dependencies.');
}

migrate()
  .catch((e) => { console.error('Migration failed:', e); process.exit(1); })
  .finally(() => { pg.$disconnect(); sqlite.close(); });
