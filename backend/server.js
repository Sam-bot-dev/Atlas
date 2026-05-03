/* eslint-env node */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');
const { recoverQueuedUploadJobs } = require('./lib/ingestion/worker');

dotenv.config();

// Validate critical configuration
const requiredEnv = [];
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  requiredEnv.push('JWT_SECRET (min 32 characters)');
}
if (requiredEnv.length > 0) {
  console.error('❌ Missing or invalid required environment variables:');
  requiredEnv.forEach(v => console.error('   -', v));
  console.error('   Set these in your .env file and restart the server.');
  process.exit(1);
}

const port = process.env.PORT || 5000;
const app = express();

// Security middleware — Content Security Policy
app.use((req, res, next) => {
  // Fix #105: Add CSP header to prevent XSS and data injection
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com; frame-src 'self';"
  );
  next();
});

console.log('✓ JWT_SECRET configured (' + (process.env.JWT_SECRET?.length ?? 0) + ' chars)');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Fix #79: rate limit expensive/state-changing endpoints to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // file uploads limited more strictly
  standardHeaders: true,
  legacyHeaders: false,
});

const allowedOrigins = (
  process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', process.env.RENDER_EXTERNAL_URL].filter(Boolean)
).map((origin) => origin.trim()).filter(Boolean);

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
// Note: businessRoutes handles its own auth per-route (detect is public)
app.use('/api/v1/businesses', require('./routes/businessRoutes'));

// Nested business sub-resources — ALL require auth + rate limiting where appropriate
app.use('/api/v1/businesses/:bizId/metrics',    require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/metricsRoutes'));
app.use('/api/v1/businesses/:bizId/insights',   require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/insightsRoutes'));
app.use('/api/v1/businesses/:bizId/actions',    require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/actionsRoutes'));
app.use('/api/v1/businesses/:bizId/automations',require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/automationsRoutes'));
app.use('/api/v1/businesses/:bizId/uploads',    require('./middleware/authMiddleware').protect, uploadLimiter, require('./routes/uploadsRoutes'));
app.use('/api/v1/businesses/:bizId/tasks',      require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/taskRoutes'));
app.use('/api/v1/businesses/:bizId',           require('./middleware/authMiddleware').protect, apiLimiter, require('./routes/businessExtrasRoutes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/metrics/template', (req, res) => {
  const templatePath = path.join(__dirname, '..', 'public', 'metrics-template.csv');
  // Fix: pass an error callback — without it, if the file doesn't exist Express
  // throws an unhandled error instead of returning a clean 404.
  res.download(templatePath, 'metrics-template.csv', (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ message: 'Template file not found' });
    }
  });
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
