const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const { recoverQueuedUploadJobs } = require('./lib/ingestion/worker');

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();
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
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/businesses', require('./routes/businessRoutes'));

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
app.get(/.*/, (req, res, next) => {
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
