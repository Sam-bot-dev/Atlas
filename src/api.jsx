// Atlas — Production API Client
// Handles authentication, business management, and AI-powered insights.

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const getToken = () => {
  try { 
    return sessionStorage.getItem('atlas-token') || localStorage.getItem('atlas-token') || ''; 
  } catch { return ''; }
};
// Fix #66: token was written to BOTH sessionStorage and localStorage, making
// the source of truth ambiguous and leaving stale tokens after logout.
// New policy: write only to sessionStorage; read localStorage as a migration
// fallback for users who had a token stored there previously.
const setToken = (t) => {
    try {
      sessionStorage.setItem('atlas-token', t);
      // Opportunistically clear any legacy localStorage token
      localStorage.removeItem('atlas-token');
    } catch {
      // Storage unavailable - fail silently
    }
  };
const clearToken = () => {
    try {
      sessionStorage.removeItem('atlas-token');
      localStorage.removeItem('atlas-token');
    } catch {
      // Storage unavailable - fail silently
    }
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

const get = (path, params) => {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  return fetch(url, { headers: headers() }).then(handleResponse);
};

const post = (path, body) =>
  fetch(API_BASE + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

const patch = (path, body) =>
  fetch(API_BASE + path, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }).then(handleResponse);

const del = (path) =>
  fetch(API_BASE + path, { method: 'DELETE', headers: headers() }).then(handleResponse);

const upload = (path, formData) =>
  fetch(API_BASE + path, {
    method: 'POST',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    body: formData,
  }).then(handleResponse);

const AtlasAPI = {
  auth: {
    exchange: async (fbToken) => {
      const res = await fetch(API_BASE + '/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: fbToken })
      });
      if (!res.ok) throw new Error('Token exchange failed');
      const data = await res.json();
      setToken(data.token);
      return data;
    },
    demoLogin: async () => {
      const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@atlas.ai', password: 'atlas123' })
      });
      if (!res.ok) throw new Error('Demo login failed');
      const data = await res.json();
      setToken(data.token);
      return data;
    },
    login: async (email, password) => {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      return AtlasAPI.auth.exchange(token);
    },
    loginWithGoogle: async () => {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      return AtlasAPI.auth.exchange(token);
    },
    signup: async ({ email, password, name }) => {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const token = await cred.user.getIdToken();
      return AtlasAPI.auth.exchange(token);
    },
    logout: async () => {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      await signOut(auth);
      clearToken();
    },
    me: async () => {
      // Fix #98: if we already have a token, skip the full Firebase onAuthStateChanged
      // + token exchange round-trip that happens on every app mount.
      if (getToken()) {
        // Validate the cached token is still good by hitting a lightweight endpoint.
        // If it fails (401), fall through to re-authenticate.
        try {
          const data = await get('/auth/me');
          return data;
        } catch (e) {
          if (e.status !== 401) throw e;
          // Token expired — clear it and re-authenticate below
          clearToken();
        }
      }
      const { onAuthStateChanged } = await import('firebase/auth');
      const { auth } = await import('./firebase');
      return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (user) {
            const token = await user.getIdToken();
            try {
              const atlasUser = await AtlasAPI.auth.exchange(token);
              resolve(atlasUser);
            } catch (e) {
              logError('AtlasAPI.auth.me', e);
              reject(e);
            }
          } else {
            reject(new Error('Not logged in'));
          }
        });
      });
    },
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
    summary: (bizId, period) => get(`/businesses/${bizId}/metrics`, period ? { period } : undefined),
    series: (bizId, metric, period) => get(`/businesses/${bizId}/metrics/series/${metric}`, period ? { period } : undefined),
    peakHours: (bizId, period) => get(`/businesses/${bizId}/metrics/peak-hours`, period ? { period } : undefined),
    forecast: (bizId) => get(`/businesses/${bizId}/metrics/forecast`),
    importExcel: (bizId, file) => {
      const form = new FormData();
      form.append('file', file);
      return upload(`/businesses/${bizId}/metrics/import-excel`, form);
    },
    downloadTemplate: () => fetch(API_BASE + '/metrics/template').then(r => { if (!r.ok) throw new Error('Template not found'); return r.blob(); }),
  },
  insights: {
    list: (bizId) => get(`/businesses/${bizId}/insights`),
    explain: (bizId, insightId) => get(`/businesses/${bizId}/insights/${insightId}/explain`),
    ask: (bizId, query) => post(`/businesses/${bizId}/ask`, { query }),
    // Public ask — sends full business context, works for demo + real businesses
    askWithContext: (query, business) => post('/ask', { query, business }),
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
    run: (bizId) => post(`/businesses/${bizId}/automations/run`, {}),
  },
  tasks: {
    list: (bizId) => get(`/businesses/${bizId}/tasks`),
    updateStatus: (bizId, taskId, status) => patch(`/businesses/${bizId}/tasks/${taskId}/status`, { status }),
    create: (bizId, { title, description, dueDate }) => post(`/businesses/${bizId}/tasks`, { title, description, dueDate }),
    delete: (bizId, taskId) => del(`/businesses/${bizId}/tasks/${taskId}`),
  },
  reports: {
    list: (bizId) => get(`/businesses/${bizId}/reports`),
    create: (bizId, type = 'weekly') => post(`/businesses/${bizId}/reports`, { type }),
    downloadUrl: (bizId, reportId) => `${API_BASE}/businesses/${bizId}/reports/${reportId}/download`,
  },
};
 
import { captureError } from './telemetry';

const logError = (prefix, error) => {
  console.error(`${prefix}:`, error);
  captureError(error, { prefix });
};
 
 export { AtlasAPI, logError };
