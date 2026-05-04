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

// Security middleware — Content Security Policy + security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '));
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Request logging (skips health check noise)
app.use((req, res, next) => {
  if (req.path === '/api/v1/health') return next();
  const start = Date.now();
  res.on('finish', () => {
    const lvl = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${lvl}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

console.log(`✓ JWT_SECRET configured (${process.env.JWT_SECRET?.length ?? 0} chars)`);

// Crash guards — prevent one bad request from killing the server
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message);
  if (err.code === 'EADDRINUSE') process.exit(1);
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/v1/health',
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
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

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

// Health check — includes DB connectivity
app.get('/api/v1/health', async (_req, res) => {
  try {
    const { prisma } = require('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', uptime: Math.floor(process.uptime()), ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected', ts: new Date().toISOString() });
  }
});

// Public ask endpoint — accepts business context in body, calls Groq, no auth required
app.use('/api/v1/ask', require('./routes/askRoutes'));

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
const isProd = process.env.NODE_ENV === 'production';
app.use(express.static(frontendDist, { maxAge: isProd ? '1y' : 0, etag: true, index: false }));
app.use((_req, res, next) => {
  if (_req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), { maxAge: 0 }, (err) => { if (err) next(); });
});

// Global Error Handler
app.use(errorHandler);

// Wait for DB to be ready using $connect() — avoids Prisma logging query errors during probe
const waitForDb = async () => {
  const { prisma } = require('./lib/prisma');
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$connect();
      return;
    } catch {
      const delay = Math.min(1000 * 2 ** i, 8000);
      console.log(`[startup] DB not ready, retrying in ${delay}ms... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('[startup] DB never became ready — skipping job recovery');
};

const server = app.listen(port, () => {
  console.log(`Atlas backend running on port ${port} [${isProd ? 'production' : 'development'}]`);
  // Wait for DB to be ready, then recover queued jobs
  waitForDb().then(() => {
    recoverQueuedUploadJobs().catch((err) => {
      console.error('[startup] Upload job recovery failed:', err.message);
    });
  });
});

// Graceful shutdown — Render sends SIGTERM before killing the process
const shutdown = (sig) => {
  console.log(`[shutdown] ${sig} received — draining connections`);
  server.close(() => { console.log('[shutdown] Done.'); process.exit(0); });
  setTimeout(() => { console.error('[shutdown] Forced exit'); process.exit(1); }, 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
