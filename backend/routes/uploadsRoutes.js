const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const {
  createUpload,
  getUpload,
  listUploads,
  deleteUpload,
} = require('../controllers/uploadsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });
const uploadDir = path.join(__dirname, '..', 'storage', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/csv',
      'application/pdf',
      'application/json',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowed.includes(file.mimetype) || /\.(csv|pdf|json|txt|png|jpg|jpeg|webp|xlsx|xls)$/i.test(file.originalname)) {
      cb(null, true);
      return;
    }

    cb(new Error('Unsupported upload type. Use PDF, CSV, JSON, text, PNG, JPG, or WEBP.'));
  },
});

router.route('/').get(protect, listUploads).post(protect, upload.single('file'), createUpload);
router.route('/:uploadId').get(protect, getUpload).delete(protect, deleteUpload);

module.exports = router;
