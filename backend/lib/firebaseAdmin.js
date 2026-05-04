const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Render stores the private key with literal \n — normalize all variants
const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawKey
  .replace(/\\\\n/g, '\n')  // double-escaped \\n
  .replace(/\\n/g, '\n')    // single-escaped \n
  .replace(/^"|"$/g, '');   // strip surrounding quotes if any

// Diagnostic — shows key shape without exposing the value
const keyOk = privateKey.includes('-----BEGIN PRIVATE KEY-----') && privateKey.includes('-----END PRIVATE KEY-----');
console.log('[firebaseAdmin] projectId:', !!projectId, '| clientEmail:', !!clientEmail, '| keyOk:', keyOk, '| rawKeyLen:', rawKey.length);

if (!projectId || !privateKey || !clientEmail) {
  console.warn('[firebaseAdmin] Missing env vars — Firebase auth disabled');
  module.exports = {
    auth: () => ({
      verifyIdToken: async () => { throw new Error('Firebase not configured — set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL'); },
    }),
  };
} else if (!keyOk) {
  console.error('[firebaseAdmin] Private key is missing PEM headers — check FIREBASE_PRIVATE_KEY on Render');
  module.exports = {
    auth: () => ({
      verifyIdToken: async () => { throw new Error('Firebase private key is malformed — missing PEM headers'); },
    }),
  };
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
      });
    }
    console.log('[firebaseAdmin] Initialized successfully');
    module.exports = admin;
  } catch (err) {
    console.error('[firebaseAdmin] Init failed:', err.message);
    module.exports = {
      auth: () => ({
        verifyIdToken: async () => { throw new Error('Firebase Admin init failed: ' + err.message); },
      }),
    };
  }
}
