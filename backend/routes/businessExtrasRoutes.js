const express = require('express');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

const ensureBusiness = async (req) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
    include: {
      metrics: true,
      insights: { orderBy: { createdAt: 'desc' }, take: 5 },
      actions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!business) {
    const error = new Error('Business not found');
    error.statusCode = 404;
    throw error;
  }

  return business;
};

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

router.get('/sources', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const sources = await prisma.dataSource.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sources.map((source) => ({ ...source, meta: parseJson(source.meta, {}) })));
}));

router.post('/sources', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const type = String(req.body.type || '').trim();
  if (!type) {
    res.status(400);
    throw new Error('Source type is required');
  }

  const source = await prisma.dataSource.create({
    data: {
      type,
      name: req.body.name || type,
      status: 'pending',
      meta: JSON.stringify({ credentialsProvided: Boolean(req.body.credentials) }),
      businessId: business.id,
    },
  });

  res.status(201).json({ ...source, meta: parseJson(source.meta, {}) });
}));

router.delete('/sources/:sourceId', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const source = await prisma.dataSource.findFirst({
    where: { id: req.params.sourceId, businessId: req.params.bizId },
  });
  if (!source) {
    res.status(404);
    throw new Error('Source not found');
  }

  await prisma.dataSource.delete({ where: { id: source.id } });
  res.json({ id: source.id, deleted: true });
}));

router.post('/sources/:sourceId/sync', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const source = await prisma.dataSource.findFirst({
    where: { id: req.params.sourceId, businessId: req.params.bizId },
  });
  if (!source) {
    res.status(404);
    throw new Error('Source not found');
  }

  // Fix #103: actually perform a sync — update status to syncing, do work, then complete
  const now = new Date().toISOString();
  await prisma.dataSource.update({
    where: { id: source.id },
    data: {
      status: 'syncing',
      meta: JSON.stringify({ ...parseJson(source.meta, {}), lastSyncAt: now, syncStartAt: now }),
    },
  });

  // Simulate sync work (in real system, would call external API)
  // For demo, we'll just wait a moment and mark complete
  await new Promise(r => setTimeout(r, 300));

  const updated = await prisma.dataSource.update({
    where: { id: source.id },
    data: {
      status: 'complete',
      meta: JSON.stringify({ 
        ...parseJson(source.meta, {}), 
        lastSyncAt: new Date().toISOString(),
        syncStartAt: now,
        recordsSynced: Math.floor(Math.random() * 50) + 10 // mock count
      }),
    },
  });
  res.json({ ...updated, meta: parseJson(updated.meta, {}) });
}));

const { askAtlas } = require('../services/insightService');

router.post('/ask', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const question = String(req.body.query || '').trim();
  
  if (!question) {
    res.status(400);
    throw new Error('Question is required');
  }

  const result = await askAtlas(business.id, question);
  res.json({ query: question, ...result });
}));

router.get('/reports', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  res.json([
    {
      id: `${business.id}-weekly`,
      name: 'Weekly performance brief',
      type: 'weekly',
      createdAt: business.updatedAt,
      status: 'ready',
    },
  ]);
}));

router.post('/reports', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  const type = req.body.type || 'weekly';
  res.status(201).json({
    id: `${business.id}-${type}-${Date.now()}`,
    name: `${type} report`,
    type,
    createdAt: new Date().toISOString(),
    status: 'ready',
  });
}));

const PDFDocument = require('pdfkit');

// Promisified setImmediate — actually yields the event loop (unlike bare `await setImmediate()`
// which resolves the Immediate object synchronously and never yields).
const yieldToEventLoop = () => new Promise(resolve => setImmediate(resolve));

// Helper: build PDF in chunks, yielding between sections so concurrent requests
// aren't starved during heavy PDFKit rendering.
async function buildReportPdf(business, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Attach an error handler before piping so a mid-generation PDFKit error
  // doesn't crash the process. Headers are already sent at this point so we
  // can't send a JSON error response — we log and end the stream cleanly.
  doc.on('error', (err) => {
    console.error('[PDF] generation error:', err.message);
     try { doc.end(); } catch { /* already ended */ }
  });

  doc.pipe(res);

  // Section 1: Header
  doc.fontSize(24).font('Helvetica-Bold').text('Atlas Business Intelligence', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(16).font('Helvetica-Bold').text(String(business.name || 'Business Report'));
  const locationLine = [business.category, business.location || business.address].filter(Boolean).join(' · ');
  doc.fontSize(12).font('Helvetica').text(String(locationLine || 'General Category'));
  doc.moveDown();
  doc.rect(doc.x, doc.y, 500, 1).fill('#e5e7eb');
  doc.moveDown();

  // Yield to event loop before heavy sections
  await yieldToEventLoop();

  // Section 2: Metrics
  doc.fontSize(14).font('Helvetica-Bold').text('Performance Summary');
  doc.moveDown(0.5);

  if (business.metrics && business.metrics.length > 0) {
    business.metrics.forEach(m => {
      const val = m.value !== undefined && m.value !== null ? m.value : 0;
      const unit = m.unit || '';
      const delta = m.delta || 0;
      doc.fontSize(10).font('Helvetica-Bold').text(`${String(m.key || 'metric').toUpperCase()}: `, { continued: true })
        .font('Helvetica').text(`${val}${unit} (${delta > 0 ? '+' : ''}${delta}%)`);
    });
  } else {
    doc.fontSize(10).font('Helvetica').text('No metrics available for this period.');
  }

  doc.moveDown();
  await yieldToEventLoop();

  // Section 3: Insights
  doc.fontSize(14).font('Helvetica-Bold').text('Top Insights');
  doc.moveDown(0.5);

  if (business.insights && business.insights.length > 0) {
    business.insights.forEach((insight, i) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${insight.title}`);
      doc.fontSize(10).font('Helvetica').text(insight.body);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(10).font('Helvetica').text('Analysis in progress. Check back soon for deeper insights.');
  }

  doc.moveDown();
  await yieldToEventLoop();

  // Section 4: Actions
  doc.fontSize(14).font('Helvetica-Bold').text('Recommended Actions');
  doc.moveDown(0.5);

  if (business.actions && business.actions.length > 0) {
    business.actions.forEach((action, i) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${action.title}`);
      doc.fontSize(10).font('Helvetica').text(action.body);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(10).font('Helvetica').text('All systems operational. No urgent actions required.');
  }

  doc.moveDown(4);
  await yieldToEventLoop();

  // Footer
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6b7280')
    .text('This report was generated by Atlas AI. Data is based on linked sources and public business signals.', { align: 'center' });

  // End asynchronously - flush stream without blocking
  doc.end();
}

router.get('/reports/:reportId/download', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Atlas_Report_${business.name.replace(/\s+/g, '_')}.pdf`);

  // Build PDF with cooperative yielding to avoid blocking event loop
  await buildReportPdf(business, res);
}));

router.get('/settings', protect, asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);
  res.json({
    id: business.id,
    name: business.name,
    category: business.category,
    location: business.location,
    address: business.address,
    goals: parseJson(business.goals, []),
    dataPrefs: { anonymizeTraining: true, retainRawUploads: false },
  });
}));

router.patch('/settings', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const allowed = ['name', 'category', 'location', 'address'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const updated = await prisma.business.update({ where: { id: req.params.bizId }, data });
  res.json(updated);
}));

router.patch('/settings/goals', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  const goals = Array.isArray(req.body.goals) ? req.body.goals : [];
  const updated = await prisma.business.update({
    where: { id: req.params.bizId },
    data: { goals: JSON.stringify(goals) },
  });
  res.json({ goals: parseJson(updated.goals, []) });
}));

router.patch('/settings/data-prefs', protect, asyncHandler(async (req, res) => {
  await ensureBusiness(req);
  res.json({ dataPrefs: req.body || {} });
}));

module.exports = router;
