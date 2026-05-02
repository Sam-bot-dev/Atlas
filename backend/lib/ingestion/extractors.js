const fs = require('fs/promises');
const { parse } = require('csv-parse/sync');
const pdfParse = require('pdf-parse');

const readCsv = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8');
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  return {
    rawText: text,
    rows: records,
  };
};

const readPdf = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const parsed = await pdfParse(buffer);
  return {
    rawText: parsed.text || '',
    rows: [],
  };
};

const readText = async (filePath) => ({
  rawText: await fs.readFile(filePath, 'utf8'),
  rows: [],
});

const readJson = async (filePath) => {
  const text = await fs.readFile(filePath, 'utf8');
  const payload = JSON.parse(text);
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.rows) ? payload.rows : [];
  return { rawText: text, rows, json: payload };
};

const readImageWithVision = async (filePath) => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return {
      rawText: '',
      rows: [],
      warning: 'GOOGLE_VISION_API_KEY missing. Image OCR skipped.',
    };
  }

  const content = (await fs.readFile(filePath)).toString('base64');
  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Vision OCR failed: ${body.slice(0, 240)}`);
  }

  const data = await res.json();
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text || '';
  return { rawText, rows: [] };
};

const extractRawContent = async (job) => {
  if (job.detectedType === 'csv') return readCsv(job.storagePath);
  if (job.detectedType === 'pdf') return readPdf(job.storagePath);
  if (job.detectedType === 'image') return readImageWithVision(job.storagePath);
  if (job.detectedType === 'json') return readJson(job.storagePath);
  if (job.detectedType === 'text') return readText(job.storagePath);

  return {
    rawText: '',
    rows: [],
    warning: `Unsupported file type: ${job.detectedType}`,
  };
};

module.exports = { extractRawContent };
