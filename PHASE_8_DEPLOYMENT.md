# Phase 8: Deployment & Launch

## Objective
Get Atlas into production with robust CI/CD pipelines, monitoring, and infrastructure.

---

## Step 1: Backend Deployment

### 1.1 Docker Containerization

**File**: `backend/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
```

**File**: `backend/.dockerignore`
```
node_modules
npm-debug.log
.env.local
.git
.gitignore
README.md
prisma/dev.db
storage/
```

### 1.2 Environment Configuration

**File**: `.env.production`
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@db-host:5432/atlas_prod
JWT_SECRET=<generate-strong-random-key>
GROQ_API_KEY=<your-groq-api-key>
SENDGRID_API_KEY=<your-sendgrid-key>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE=<your-twilio-number>
GOOGLE_VISION_API_KEY=<optional>
```

### 1.3 Deployment Options

#### Option A: AWS ECS (Recommended for scalability)
```bash
# Create ECR repository
aws ecr create-repository --repository-name atlas-backend

# Build and push
docker build -t atlas-backend .
docker tag atlas-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/atlas-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/atlas-backend:latest

# Deploy via CloudFormation or ECS Console
```

#### Option B: Google Cloud Run (Simpler)
```bash
# Build and deploy
gcloud run deploy atlas-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,..."
```

#### Option C: Render.com (Easy)
```bash
# Connect GitHub repo
# Set environment variables in Render dashboard
# Deploy automatically on push
```

#### Option D: Railway.app
```bash
# Connect GitHub
# Add PostgreSQL plugin
# Set env vars
# Deploy
```

---

## Step 2: Frontend Deployment

### 2.1 Build Optimization

**File**: `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['./src/charts.jsx'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### 2.2 Deployment Options

#### Option A: Vercel (Recommended for React)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub for auto-deploy
```

**File**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE": "@api_base"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "destination": "https://api.atlasbiz.app/api/$1"
    },
    {
      "src": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**File**: `netlify.toml`
```toml
[build]
command = "npm run build"
publish = "dist"

[functions]
directory = "backend"

[[redirects]]
from = "/api/*"
to = "https://api.atlasbiz.app/api/:splat"
status = 200

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

#### Option C: AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://atlas-frontend-bucket/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E123ABC --paths "/*"
```

---

## Step 3: CI/CD Pipelines

### 3.1 GitHub Actions for Backend

**File**: `.github/workflows/backend-deploy.yml`
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run linter
        run: cd backend && npm run lint
      
      - name: Run tests
        run: cd backend && npm run test
      
      - name: Build Docker image
        run: docker build -t atlas-backend:${{ github.sha }} backend/
      
      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
          docker tag atlas-backend:${{ github.sha }} $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/atlas-backend:latest
          docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/atlas-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster atlas-prod --service atlas-backend --force-new-deployment
```

### 3.2 GitHub Actions for Frontend

**File**: `.github/workflows/frontend-deploy.yml`
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'index.html'
      - 'vite.config.js'
      - '.github/workflows/frontend-deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE: https://api.atlasbiz.app/api/v1
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

---

## Step 4: Database Setup

### 4.1 PostgreSQL Production Database

```bash
# Create database
CREATE DATABASE atlas_prod;
CREATE USER atlas_user WITH PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE atlas_prod TO atlas_user;
```

### 4.2 Run Migrations

```bash
# In production environment
export DATABASE_URL="postgresql://atlas_user:password@prod-db-host:5432/atlas_prod"
npx prisma migrate deploy
npx prisma generate
```

### 4.3 Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/atlas"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/atlas_$DATE.sql
gzip $BACKUP_DIR/atlas_$DATE.sql

# Keep only 30 days of backups
find $BACKUP_DIR -mtime +30 -delete
```

---

## Step 5: Monitoring & Observability

### 5.1 Error Tracking (Sentry)

**Backend**: `backend/lib/sentry.js`
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

module.exports = Sentry;
```

**Frontend**: `src/main.jsx`
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
});
```

### 5.2 Application Performance Monitoring

```bash
# Install New Relic or DataDog agent
npm install newrelic
# or
npm install datadog-browser-rum
```

### 5.3 Logging

**Backend**: Use Winston or Bunyan
```javascript
const logger = require('winston');

logger.info('Application started', { 
  version: '1.0.0',
  environment: process.env.NODE_ENV 
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack
});
```

### 5.4 Health Checks

**File**: `backend/routes/healthRoutes.js`
```javascript
const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'checking...',
  };
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'ok';
    res.json(health);
  } catch (error) {
    health.status = 'error';
    health.database = 'error';
    res.status(503).json(health);
  }
});

module.exports = router;
```

---

## Step 6: Security

### 6.1 HTTPS & SSL

- Use Let's Encrypt (free) or AWS ACM
- Enforce HTTPS redirect
- Set HSTS headers

```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 6.2 API Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 6.3 Environment Variables

- Never commit `.env` files
- Use secrets management:
  - GitHub Secrets for CI/CD
  - AWS Secrets Manager for production
  - Vercel/Netlify env var UI

### 6.4 CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
```

---

## Step 7: DNS & Domain

### 7.1 Domain Registration
- Register at Namecheap, GoDaddy, or Route53
- Set A/CNAME records to your hosting

### 7.2 DNS Records

```
Type    Name           Value
A       atlasbiz.app   12.34.56.78 (CloudFront IP)
CNAME   www            d1234.cloudfront.net
CNAME   api            api.atlasbiz.app (backend)
MX      @              mail.google.com (for email)
TXT     @              v=spf1 google.com ~all
```

### 7.3 Email Configuration

```javascript
// For transactional emails (SendGrid, Mailgun)
const fromEmail = 'noreply@atlasbiz.app';

// SPF, DKIM, DMARC records must be configured
```

---

## Step 8: Launch Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and loads correctly
- [ ] Database migrated and backed up
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Email service tested
- [ ] SMS/WhatsApp service tested
- [ ] All API endpoints tested
- [ ] Error tracking (Sentry) configured
- [ ] Application monitoring (New Relic/DataDog) configured
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Legal compliance (GDPR, data protection) reviewed
- [ ] Analytics (Google Analytics, PostHog) configured
- [ ] Feedback widget installed
- [ ] Status page set up (statuspage.io)
- [ ] On-call schedule established

---

## Post-Launch Monitoring

### 7.1 Daily Checks
- [ ] No critical errors in Sentry
- [ ] Database health OK
- [ ] API response times < 500ms
- [ ] User signups flowing in

### 7.2 Weekly Review
- [ ] User engagement metrics
- [ ] Feature usage analytics
- [ ] Bug reports and fixes
- [ ] Performance trends

### 7.3 Monthly Review
- [ ] Database size and growth
- [ ] Infrastructure costs
- [ ] User retention rates
- [ ] Security updates

---

## Scaling Strategy

### Horizontal Scaling
- Load balancer (AWS ALB, NGINX)
- Multiple backend instances
- Cache layer (Redis)
- CDN for static assets (CloudFront)

### Vertical Scaling
- Increase instance size
- More database connections
- Optimize slow queries

### Optimization
- Enable caching headers
- Minify assets
- Compress responses (gzip)
- Lazy load images
- Code splitting (already in Vite)

