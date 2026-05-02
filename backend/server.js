const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
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

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Atlas backend running on port ${port}`);
});
