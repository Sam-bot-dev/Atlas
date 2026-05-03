const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');
const pdfParse = require('pdf-parse');
const readExcelFile = require('read-excel-file/node');

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
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return { rawText: text, rows: [], warning: 'File is not valid JSON.' };
  }
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.rows) ? payload.rows : [];
  return { rawText: text, rows, json: payload };
};

const readSpreadsheet = async (filePath) => {
  if (path.extname(filePath).toLowerCase() === '.xls') {
    const text = await fs.readFile(filePath, 'utf8').catch(() => '');
    if (!text.trim()) {
      return {
        rawText: '',
        rows: [],
        warning: 'Legacy .xls binary files are not supported. Export as .xlsx or CSV.',
      };
    }

    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      delimiter: text.includes('\t') ? '\t' : ',',
    });
    return { rawText: text, rows };
  }

  const sheetRows = await readExcelFile(filePath);
  const headers = (sheetRows[0] || []).map((value, index) => String(value || `column_${index + 1}`));
  const rows = sheetRows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });
    return record;
  });
  const rawText = rows.map((row) => JSON.stringify(row)).join('\n');
  return { rawText, rows, json: { rows } };
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
  if (job.detectedType === 'spreadsheet') return readSpreadsheet(job.storagePath);

  return {
    rawText: '',
    rows: [],
    warning: `Unsupported file type: ${job.detectedType}`,
  };
};

module.exports = { extractRawContent };
