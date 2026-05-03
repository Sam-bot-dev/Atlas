// Atlas — API client
// All endpoints stubbed. Swap API_BASE and getToken() for real backend.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

const getToken = () => {
  try { return sessionStorage.getItem('atlas-token') || ''; } catch { return ''; }
};
const setToken = (t) => {
  try { sessionStorage.setItem('atlas-token', t); } catch { }
};
const clearToken = () => {
  try { sessionStorage.removeItem('atlas-token'); } catch { }
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
    summary: (bizId, period = '1M') => get(`/businesses/${bizId}/metrics`, { period }),
    series: (bizId, metric, period = '6M') => get(`/businesses/${bizId}/metrics/series/${metric}`, { period }),
    peakHours: (bizId) => get(`/businesses/${bizId}/metrics/peak-hours`),
    importExcel: (bizId, file) => {
      const form = new FormData();
      form.append('file', file);
      return upload(`/businesses/${bizId}/metrics/import-excel`, form);
    },
  },
  insights: {
    list: (bizId) => get(`/businesses/${bizId}/insights`),
    explain: (bizId, insightId) => get(`/businesses/${bizId}/insights/${insightId}/explain`),
    ask: (bizId, query) => post(`/businesses/${bizId}/ask`, { query }),
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

export { AtlasAPI };
