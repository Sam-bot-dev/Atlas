const { prisma } = require('../prisma');
const { extractRawContent } = require('./extractors');
const { extractStructuredData } = require('./llmExtractor');
const { normalizeExtraction } = require('./normalize');
let queue = Promise.resolve();

const setJob = (id, data) =>
  prisma.uploadJob.update({ where: { id }, data });

// Build a plain-English summary of what the AI extracted from the document
const buildAiSummary = (data, rawText, fileName) => {
  const counts = {
    orders: (data.orders || []).length,
    products: (data.products || []).length,
    customers: (data.customers || []).length,
    reviews: (data.reviews || []).length,
    inventory: (data.inventory || []).length,
    traffic: (data.traffic || []).length,
  };
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  const lines = [];

  if (total === 0) {
    lines.push("No structured business data was found in this document.");
    if (rawText && rawText.length > 20) {
      lines.push(`The document contains text but it doesn't match any known data format (orders, inventory, reviews, etc.).`);
    }
    return { useful: false, lines, counts, impact: [] };
  }

  lines.push(`Atlas read "${fileName}" and found the following:`);

  if (counts.orders > 0) {
    const orders = data.orders;
    const total_rev = orders.reduce((s, o) => s + (o.total || 0), 0);
    lines.push(`• ${counts.orders} orders${total_rev > 0 ? ` totalling ₹${total_rev.toLocaleString('en-IN')}` : ''}`);
  }
  if (counts.products > 0) lines.push(`• ${counts.products} products/SKUs`);
  if (counts.customers > 0) lines.push(`• ${counts.customers} customer records`);
  if (counts.reviews > 0) {
    const avg = data.reviews.reduce((s, r) => s + (r.rating || 0), 0) / counts.reviews;
    lines.push(`• ${counts.reviews} reviews (avg rating: ${avg.toFixed(1)}/5)`);
  }
  if (counts.inventory > 0) {
    const low = (data.inventory || []).filter(i => i.status === 'low' || i.quantityOnHand <= i.reorderPoint).length;
    lines.push(`• ${counts.inventory} inventory items${low > 0 ? ` (${low} below reorder point)` : ''}`);
  }
  if (counts.traffic > 0) lines.push(`• ${counts.traffic} traffic/visitor data points`);

  // What will change in analytics
  const impact = [];
  if (counts.orders > 0) impact.push('Revenue metrics will be recalculated');
  if (counts.customers > 0) impact.push('Customer retention rate will update');
  if (counts.inventory > 0) impact.push('Inventory health score will update');
  if (counts.reviews > 0) impact.push('Review sentiment score will update');
  if (counts.orders > 0 || counts.customers > 0) impact.push('New insights and actions will be generated');

  return { useful: true, lines, counts, impact };
};

const runUploadJob = async (jobId) => {
  let job = await prisma.uploadJob.findUnique({
    where: { id: jobId },
    include: { business: true },
  });

  if (!job) return;

  await setJob(jobId, { status: 'processing', stage: 'extract' });
  await prisma.dataSource.update({
    where: { id: job.sourceId },
    data: { status: 'processing' },
  });

  const raw = await extractRawContent(job);
  await setJob(jobId, {
    rawText: raw.rawText || '',
    stage: 'llm',
    error: raw.warning || '',
  });

  job = await prisma.uploadJob.findUnique({
    where: { id: jobId },
    include: { business: true },
  });

  const structured = await extractStructuredData({
    rawText: raw.rawText,
    rows: raw.rows,
    json: raw.json,
    business: job.business,
  });

  // Build a human-readable summary of what the AI understood
  const data = structured.data;
  const summary = buildAiSummary(data, raw.rawText, job.originalName);

  // Store extracted data and pause for user review — don't write to DB yet
  await setJob(jobId, {
    extractedJson: JSON.stringify({
      provider: structured.provider,
      summary,
      ...data,
    }),
    normalizedJson: JSON.stringify({ counts: {}, pendingReview: true }),
    status: 'pending_review',
    stage: 'pending_review',
  });

  await prisma.dataSource.update({
    where: { id: job.sourceId },
    data: { status: 'pending_review' },
  });
};

const enqueueUploadJob = (jobId) => {
  queue = queue
    .then(() => runUploadJob(jobId))
    .catch(async (error) => {
      const job = await prisma.uploadJob.findUnique({ where: { id: jobId } }).catch(() => null);
      if (job) {
        await prisma.uploadJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            stage: 'failed',
            error: error.message || 'Upload processing failed',
          },
        });
        await prisma.dataSource.update({
          where: { id: job.sourceId },
          data: {
            status: 'failed',
            meta: JSON.stringify({ uploadJobId: jobId, error: error.message || 'Upload processing failed' }),
          },
        });
      }
    });

  return queue;
};

const recoverQueuedUploadJobs = async () => {
  let retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      const jobs = await prisma.uploadJob.findMany({
        where: { status: { in: ['queued', 'processing'] } },
        orderBy: { createdAt: 'asc' },
      });

      for (const job of jobs) {
        if (job.status === 'processing') {
          // Reset processing jobs to queued and clear stage
          await prisma.uploadJob.update({
            where: { id: job.id },
            data: { status: 'queued', stage: 'queued' },
          });
        }
        enqueueUploadJob(job.id);
      }

      return jobs.length;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Upload job recovery attempt ${i + 1} failed, retrying...`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // wait 1s, 2s, 3s
    }
  }
};

// Apply the extracted data to the DB after user confirms
const confirmUploadJob = async (jobId) => {
  const job = await prisma.uploadJob.findUnique({
    where: { id: jobId },
    include: { business: true },
  });

  if (!job) throw new Error('Upload job not found');
  if (job.status !== 'pending_review') throw new Error('Job is not awaiting review');

  await setJob(jobId, { status: 'processing', stage: 'normalize' });

  let extracted;
  try {
    extracted = JSON.parse(job.extractedJson);
  } catch {
    throw new Error('Extracted data is corrupted');
  }

  // Remove summary metadata before normalizing
  const { provider, summary, ...data } = extracted;

  const counts = await normalizeExtraction({
    businessId: job.businessId,
    sourceId: job.sourceId,
    extraction: data,
  });

  await prisma.dataSource.update({
    where: { id: job.sourceId },
    data: {
      status: 'complete',
      meta: JSON.stringify({
        uploadJobId: jobId,
        detectedType: job.detectedType,
        provider: provider || 'unknown',
        counts,
      }),
    },
  });

  await setJob(jobId, {
    status: 'complete',
    stage: 'complete',
    normalizedJson: JSON.stringify({ counts }),
  });

  return counts;
};

module.exports = { enqueueUploadJob, recoverQueuedUploadJobs, confirmUploadJob };
