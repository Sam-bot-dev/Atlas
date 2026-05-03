const { prisma } = require('../prisma');
const { extractRawContent } = require('./extractors');
const { extractStructuredData } = require('./llmExtractor');
const { normalizeExtraction } = require('./normalize');
const { calculateMetrics, saveMetrics } = require('../../services/metricService');
const { generateInsights } = require('../../services/insightService');
const { generateActions } = require('../../services/actionService');

let queue = Promise.resolve();

const setJob = (id, data) =>
  prisma.uploadJob.update({
    where: { id },
    data,
  });

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

  await setJob(jobId, {
    extractedJson: JSON.stringify({
      provider: structured.provider,
      ...structured.data,
    }),
    stage: 'normalize',
  });

  const counts = await normalizeExtraction({
    businessId: job.businessId,
    sourceId: job.sourceId,
    extraction: structured.data,
  });

  await prisma.dataSource.update({
    where: { id: job.sourceId },
    data: {
      status: 'complete',
      meta: JSON.stringify({
        uploadJobId: jobId,
        detectedType: job.detectedType,
        provider: structured.provider,
        counts,
      }),
    },
  });

  await setJob(jobId, {
    status: 'complete',
    stage: 'complete',
    normalizedJson: JSON.stringify({ counts }),
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
  const jobs = await prisma.uploadJob.findMany({
    where: { status: { in: ['queued', 'processing'] } },
    orderBy: { createdAt: 'asc' },
  });

  for (const job of jobs) {
    enqueueUploadJob(job.id);
  }

  return jobs.length;
};

module.exports = { enqueueUploadJob, recoverQueuedUploadJobs };
