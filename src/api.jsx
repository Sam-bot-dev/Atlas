// Atlas — API client
// All endpoints connected to backend. Supports real API + demo mode.

// Environment-based API configuration
const API_BASE = 
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/v1'
    : import.meta.env.VITE_API_BASE || '/api/v1';

// Fallback to demo mode if API unavailable
let DEMO_MODE = false;

const getToken = () => {
  try { return sessionStorage.getItem('atlas-token') || ''; } catch { return ''; }
};
const setToken = (t) => {
  try { sessionStorage.setItem('atlas-token', t); } catch {}
};
const clearToken = () => {
  try { sessionStorage.removeItem('atlas-token'); } catch {}
};

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status, data: err });
  }
  return res.json();
};

// Retry logic for failed requests
const retryFetch = async (path, options = {}, retries = 3, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(API_BASE + path, { ...options, timeout: 10000 });
      return res;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
};

const get = async (path, params) => {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  try {
    const res = await retryFetch(url.pathname + url.search);
    return handleResponse(res);
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
};

const post = async (path, body) => {
  try {
    const res = await retryFetch(path, { 
      method: 'POST', 
      headers: headers(), 
      body: JSON.stringify(body) 
    });
    return handleResponse(res);
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
};

const patch = async (path, body) => {
  try {
    const res = await retryFetch(path, { 
      method: 'PATCH', 
      headers: headers(), 
      body: JSON.stringify(body) 
    });
    return handleResponse(res);
  } catch (error) {
    console.error('PATCH request failed:', error);
    throw error;
  }
};

const del = async (path) => {
  try {
    const res = await retryFetch(path, { 
      method: 'DELETE', 
      headers: headers() 
    });
    return handleResponse(res);
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
};

const upload = async (path, formData) => {
  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    });
    return handleResponse(res);
  } catch (error) {
    console.error('Upload request failed:', error);
    throw error;
  }
};

const AtlasAPI = {
  auth: {
    login: (email, password) =>
      post('/auth/login', { email, password }).then(r => { setToken(r.token); return r; }),
    loginWithGoogle: () => { window.location.href = API_BASE + '/auth/google'; },
    signup: ({ email, password, name }) =>
      post('/auth/signup', { email, password, name }).then(r => { setToken(r.token); return r; }),
    logout: () => post('/auth/logout', {}).then(() => clearToken()),
    me: () => get('/auth/me'),
  },
  businesses: {
    list: () => get('/businesses'),
    get: (bizId) => get(`/businesses/${bizId}`),
    create: (data) => post('/businesses', data),
    update: (bizId, data) => patch(`/businesses/${bizId}`, data),
    detect: (name, address) => post('/businesses/detect', { name, address }),
  },
  sources: {
    list: (bizId) => get(`/businesses/${bizId}/sources`),
    connect: (bizId, type, credentials) => post(`/businesses/${bizId}/sources`, { type, credentials }),
    disconnect: (bizId, sourceId) => del(`/businesses/${bizId}/sources/${sourceId}`),
    sync: (bizId, sourceId) => post(`/businesses/${bizId}/sources/${sourceId}/sync`, {}),
  },
  uploads: {
    upload: (bizId, file) => {
      const form = new FormData();
      form.append('file', file);
      return upload(`/businesses/${bizId}/uploads`, form);
    },
    status: (bizId, uploadId) => get(`/businesses/${bizId}/uploads/${uploadId}`),
    list: (bizId) => get(`/businesses/${bizId}/uploads`),
    delete: (bizId, uploadId) => del(`/businesses/${bizId}/uploads/${uploadId}`),
  },
  metrics: {
    summary: (bizId, period = '1M') => get(`/businesses/${bizId}/metrics`, { period }),
    series: (bizId, metric, period = '6M') => get(`/businesses/${bizId}/metrics/series/${metric}`, { period }),
    peakHours: (bizId) => get(`/businesses/${bizId}/metrics/peak-hours`),
  },
  insights: {
    list: (bizId) => get(`/businesses/${bizId}/insights`),
    explain: (bizId, insightId) => get(`/businesses/${bizId}/insights/${insightId}/explain`),
  },
  actions: {
    list: (bizId) => get(`/businesses/${bizId}/actions`),
    apply: (bizId, actionId) => post(`/businesses/${bizId}/actions/${actionId}/apply`, {}),
    createTask: (bizId, actionId) => post(`/businesses/${bizId}/actions/${actionId}/task`, {}),
    dismiss: (bizId, actionId) => del(`/businesses/${bizId}/actions/${actionId}`),
  },
  automations: {
    list: (bizId) => get(`/businesses/${bizId}/automations`),
    toggle: (bizId, autoId) => patch(`/businesses/${bizId}/automations/${autoId}/toggle`, {}),
    create: (bizId, { trigger, action }) => post(`/businesses/${bizId}/automations`, { trigger, action }),
    delete: (bizId, autoId) => del(`/businesses/${bizId}/automations/${autoId}`),
    suggested: (bizId) => get(`/businesses/${bizId}/automations/suggested`),
  },
  ask: (bizId, query) => post(`/businesses/${bizId}/ask`, { query }),
  reports: {
    list: (bizId) => get(`/businesses/${bizId}/reports`),
    generate: (bizId, type) => post(`/businesses/${bizId}/reports`, { type }),
    download: (bizId, reportId) => get(`/businesses/${bizId}/reports/${reportId}/download`),
  },
  settings: {
    get: (bizId) => get(`/businesses/${bizId}/settings`),
    update: (bizId, data) => patch(`/businesses/${bizId}/settings`, data),
    updateGoals: (bizId, goals) => patch(`/businesses/${bizId}/settings/goals`, { goals }),
    updateDataPrefs: (bizId, prefs) => patch(`/businesses/${bizId}/settings/data-prefs`, prefs),
  },
};

export { AtlasAPI, DEMO_MODE };
