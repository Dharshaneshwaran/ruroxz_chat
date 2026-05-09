const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');
const { getStorageUsed, MAX_BYTES } = require('../services/storageTracker');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.R2_BUCKET,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      cb(null, `media/${unique}${ext}`);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    if (getStorageUsed() >= MAX_BYTES) {
      return cb(new Error('STORAGE_LIMIT_EXCEEDED'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
