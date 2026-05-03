const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');
const { recoverQueuedUploadJobs } = require('./lib/ingestion/worker');

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

// Startup validation with helpful guidance
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('⚠️  JWT_SECRET is not configured or is too short (min 32 chars).');
  console.error('   Set JWT_SECRET in your environment or .env file.');
  console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('JWT') || k.includes('SECRET') || k === 'NODE_ENV'));
} else {
  console.log('✓ JWT_SECRET configured (' + process.env.JWT_SECRET.length + ' chars)');
}


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = (process.env.FRONTEND_URL || ['http://localhost:5173', process.env.RENDER_EXTERNAL_URL].filter(Boolean).join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/v1/businesses', require('./middleware/authMiddleware').protect, require('./routes/businessRoutes'));

// Nested business sub-resources
app.use('/api/v1/businesses/:bizId/metrics', require('./routes/metricsRoutes'));
app.use('/api/v1/businesses/:bizId/insights', require('./routes/insightsRoutes'));
app.use('/api/v1/businesses/:bizId/actions', require('./routes/actionsRoutes'));
app.use('/api/v1/businesses/:bizId/automations', require('./routes/automationsRoutes'));
app.use('/api/v1/businesses/:bizId/uploads', require('./routes/uploadsRoutes'));
app.use('/api/v1/businesses/:bizId', require('./routes/businessExtrasRoutes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const frontendDist = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendDist));
app.get('*path', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next();
  });
});

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Atlas backend running on port ${port}`);
  recoverQueuedUploadJobs().catch((error) => {
    console.error('Upload job recovery failed:', error);
  });
});
