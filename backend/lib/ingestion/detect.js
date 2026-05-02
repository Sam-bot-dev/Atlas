const path = require('path');

const detectFileType = (file) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || file.path || '').toLowerCase();

  if (mime.includes('csv') || ext === '.csv') return 'csv';
  if (mime.includes('pdf') || ext === '.pdf') return 'pdf';
  if (mime.includes('image') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  if (mime.includes('json') || ext === '.json') return 'json';
  if (mime.includes('text') || ['.txt', '.log'].includes(ext)) return 'text';
  if (['.xlsx', '.xls'].includes(ext)) return 'spreadsheet';
  return 'unknown';
};

module.exports = { detectFileType };
