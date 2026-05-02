const fs = require('fs/promises');
const path = require('path');
const asyncHandler = require('express-async-handler');
const { prisma } = require('../lib/prisma');
const { detectFileType } = require('../lib/ingestion/detect');
const { enqueueUploadJob } = require('../lib/ingestion/worker');

const ensureBusiness = async (req) => {
  const business = await prisma.business.findFirst({
    where: { id: req.params.bizId, userId: req.user.id },
  });

  if (!business) {
    const error = new Error('Business not found');
    error.statusCode = 404;
    throw error;
  }

  return business;
};

const parseMeta = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const serializeJob = (job) => ({
  id: job.id,
  uploadId: job.id,
  sourceId: job.sourceId,
  status: job.status,
  stage: job.stage,
  fileName: job.originalName,
  mimeType: job.mimeType,
  size: job.size,
  detectedType: job.detectedType,
  rawTextPreview: job.rawText ? job.rawText.slice(0, 500) : '',
  extracted: parseMeta(job.extractedJson),
  normalized: parseMeta(job.normalizedJson),
  error: job.error,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

const createUpload = asyncHandler(async (req, res) => {
  const business = await ensureBusiness(req);

  if (!req.file) {
    res.status(400);
    throw new Error('File is required');
  }

  const detectedType = detectFileType(req.file);
  const source = await prisma.dataSource.create({
    data: {
      type: `upload_${detectedType}`,
      name: req.file.originalname,
      status: 'pending',
      fileUrl: req.file.path,
      meta: JSON.stringify({
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }),
      businessId: business.id,
    },
  });

  const job = await prisma.uploadJob.create({
    data: {
      businessId: business.id,
      sourceId: source.id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
      storagePath: req.file.path,
      detectedType,
    },
  });

  enqueueUploadJob(job.id);

  res.status(202).json({
    uploadId: job.id,
    sourceId: source.id,
    status: job.status,
    stage: job.stage,
    detectedType,
    message: 'Upload accepted. Processing started.',
  });
});

const getUpload = asyncHandler(async (req, res) => {
  await ensureBusiness(req);

  const job = await prisma.uploadJob.findFirst({
    where: { id: req.params.uploadId, businessId: req.params.bizId },
  });

  if (!job) {
    res.status(404);
    throw new Error('Upload not found');
  }

  res.json(serializeJob(job));
});

const listUploads = asyncHandler(async (req, res) => {
  await ensureBusiness(req);

  const jobs = await prisma.uploadJob.findMany({
    where: { businessId: req.params.bizId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(jobs.map(serializeJob));
});

const deleteUpload = asyncHandler(async (req, res) => {
  await ensureBusiness(req);

  const job = await prisma.uploadJob.findFirst({
    where: { id: req.params.uploadId, businessId: req.params.bizId },
  });

  if (!job) {
    res.status(404);
    throw new Error('Upload not found');
  }

  await prisma.dataSource.delete({ where: { id: job.sourceId } });

  const absolute = path.resolve(job.storagePath);
  await fs.unlink(absolute).catch(() => {});

  res.json({ id: req.params.uploadId, deleted: true });
});

module.exports = {
  createUpload,
  getUpload,
  listUploads,
  deleteUpload,
};
