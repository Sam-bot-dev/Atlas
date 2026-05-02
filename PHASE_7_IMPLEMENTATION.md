# Phase 7: Frontend Finalization & Data Wiring

## Objective
Remove all mock data from the UI and replace with live backend endpoints. Implement state management, error handling, and responsive design.

---

## Step 1: Frontend API Client Updates

### Current State
- `src/api.jsx` has all endpoint stubs in place
- All components use `setTimeout` mocks inline
- Session storage for state persistence

### Tasks

#### 1.1 Configure API Base URL
**File**: `src/api.jsx`

Update based on environment:
```javascript
const API_BASE = 
  process.env.NODE_ENV === 'production' 
    ? 'https://api.atlasbiz.app/api/v1'
    : process.env.VITE_API_BASE || 'http://localhost:3001/api/v1';
```

#### 1.2 Add Request Retry Logic
```javascript
const retryFetch = async (path, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(API_BASE + path, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

#### 1.3 Add Response Caching
Implement a simple cache for frequently accessed endpoints:
```javascript
const cache = new Map();
const getCached = (key, ttl = 60000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
};
```

---

## Step 2: Wire API Calls in Components

### 2.1 Overview Page (`src/overview.jsx`)
Replace `setTimeout` mocks with real API calls:

```javascript
// Current mock (remove):
// setTimeout(() => setMetrics(demoMetrics), 800);

// Replace with:
useEffect(() => {
  if (!bizId) return;
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await AtlasAPI.metrics.summary(bizId);
      setMetrics(data);
    } catch (error) {
      setError('Failed to load metrics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchMetrics();
  const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
  return () => clearInterval(interval);
}, [bizId]);
```

### 2.2 Insights Section
```javascript
useEffect(() => {
  if (!bizId) return;
  const fetchInsights = async () => {
    try {
      const data = await AtlasAPI.insights.list(bizId);
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };
  
  fetchInsights();
  const interval = setInterval(fetchInsights, 300000); // Refresh every 5 minutes
  return () => clearInterval(interval);
}, [bizId]);
```

### 2.3 Actions Section
```javascript
useEffect(() => {
  if (!bizId) return;
  const fetchActions = async () => {
    try {
      const data = await AtlasAPI.actions.list(bizId);
      setActions(data);
    } catch (error) {
      console.error('Failed to load actions:', error);
    }
  };
  
  fetchActions();
  const interval = setInterval(fetchActions, 300000);
  return () => clearInterval(interval);
}, [bizId]);
```

### 2.4 Data Sources Page (`src/pages.jsx` - DataSourcesPage)
```javascript
const handleUpload = async (file) => {
  try {
    setProcessing('uploading');
    const uploadData = await AtlasAPI.uploads.upload(bizId, file);
    const uploadId = uploadData.id;
    
    // Poll for completion
    let attempts = 0;
    const pollStatus = async () => {
      const status = await AtlasAPI.uploads.status(bizId, uploadId);
      if (status.status === 'complete') {
        setProcessing(null);
        // Refresh metrics
        const newMetrics = await AtlasAPI.metrics.summary(bizId);
        onMetricsUpdate(newMetrics);
      } else if (status.status === 'failed') {
        setProcessing(null);
        setError(status.error || 'Upload failed');
      } else if (attempts < 120) {
        attempts++;
        setTimeout(pollStatus, 1000);
      }
    };
    
    pollStatus();
  } catch (error) {
    setProcessing(null);
    setError(error.message);
  }
};
```

### 2.5 Automations Page (`src/pages.jsx` - AutomationsPage)
```javascript
const fetchAutomations = async () => {
  try {
    const data = await AtlasAPI.automations.list(bizId);
    setAutomations(data);
  } catch (error) {
    setError('Failed to load automations');
  }
};

const handleToggle = async (autoId) => {
  try {
    const updated = await AtlasAPI.automations.toggle(bizId, autoId);
    setAutomations(automations.map(a => a.id === autoId ? updated : a));
  } catch (error) {
    setError('Failed to toggle automation');
  }
};

const handleCreateAutomation = async (trigger, action) => {
  try {
    const newAuto = await AtlasAPI.automations.create(bizId, { trigger, action });
    setAutomations([...automations, newAuto]);
  } catch (error) {
    setError('Failed to create automation');
  }
};
```

---

## Step 3: Implement State Management

### Option A: React Query (Recommended)
```bash
npm install @tanstack/react-query
```

```javascript
// src/hooks/useMetrics.js
import { useQuery } from '@tanstack/react-query';
import { AtlasAPI } from '../api';

export const useMetrics = (bizId) => {
  return useQuery({
    queryKey: ['metrics', bizId],
    queryFn: () => AtlasAPI.metrics.summary(bizId),
    enabled: !!bizId,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

export const useInsights = (bizId) => {
  return useQuery({
    queryKey: ['insights', bizId],
    queryFn: () => AtlasAPI.insights.list(bizId),
    enabled: !!bizId,
    staleTime: 300000,
  });
};
```

### Usage in Components:
```javascript
const { data: metrics, isLoading, error } = useMetrics(bizId);
```

### Option B: SWR
```bash
npm install swr
```

```javascript
import useSWR from 'swr';
const { data: metrics, error, mutate } = useSWR(
  bizId ? `/api/v1/businesses/${bizId}/metrics` : null,
  fetcher,
  { refreshInterval: 60000 }
);
```

---

## Step 4: Error Handling & Loading States

### Error Boundary Component
```javascript
// src/components/ErrorBoundary.jsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <p style={{ color: 'var(--ink-3)' }}>{this.state.error?.message}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Loading Skeleton
```javascript
// src/components/LoadingSkeleton.jsx
export const MetricSkeleton = () => (
  <div className="card" style={{ height: 80, background: 'var(--bg-subtle)', animation: 'pulse 2s infinite' }} />
);
```

### Empty State
```javascript
export const EmptyMetrics = () => (
  <div style={{ textAlign: 'center', padding: 40 }}>
    <p style={{ color: 'var(--ink-3)' }}>No data available yet.</p>
    <p style={{ fontSize: '12px' }}>Upload files or connect integrations to get started.</p>
  </div>
);
```

---

## Step 5: Responsive Design

### Mobile Breakpoints
```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -100%;
    transition: left 0.3s;
    z-index: 1000;
  }
  .sidebar.open {
    left: 0;
  }
  
  .grid-2 {
    grid-template-columns: 1fr;
  }
  
  .topbar {
    flex-direction: column;
    gap: 10px;
  }
}
```

### Hamburger Menu
```javascript
const [sidebarOpen, setSidebarOpen] = useState(false);
return (
  <div>
    <button 
      className="hamburger"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      style={{ display: 'none', '@media(max-width: 768px)': { display: 'block' } }}
    >
      ☰
    </button>
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  </div>
);
```

---

## Step 6: Dark Mode Completion

Ensure all components respond to theme:
```javascript
const isDarkMode = tweaks.theme === 'dark';
const bgColor = isDarkMode ? 'var(--bg)' : 'white';
```

---

## Checklist

- [ ] Update `src/api.jsx` with environment-based API_BASE
- [ ] Wire `Overview` page to real metrics endpoint
- [ ] Wire `Overview` page to real insights endpoint
- [ ] Wire `Overview` page to real actions endpoint
- [ ] Wire `DataSources` page to upload + status polling
- [ ] Wire `Analytics` page to historical data endpoint
- [ ] Wire `Automations` page to list/create/toggle endpoints
- [ ] Wire `Settings` page to settings endpoints
- [ ] Implement React Query (or SWR) for state management
- [ ] Add error boundaries to critical sections
- [ ] Create loading skeleton components
- [ ] Create empty state components
- [ ] Test all endpoints in staging environment
- [ ] Add responsive design for mobile (< 768px)
- [ ] Complete dark mode audit
- [ ] Set up monitoring/error tracking (Sentry)

---

## Testing Checklist

- [ ] Test metrics update every 60s
- [ ] Test file upload + progress polling
- [ ] Test error states (404, 500, timeout)
- [ ] Test offline mode (graceful fallback)
- [ ] Test authentication flow (login/logout)
- [ ] Test mobile responsiveness (iOS Safari, Chrome Android)
- [ ] Test dark mode toggle
- [ ] Test infinite scroll on analytics page
- [ ] Test form submission validation
- [ ] Test API retry logic
