const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Render stores the private key with literal \n — normalize all variants
const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawKey
  .replace(/\\\\n/g, '\n')  // double-escaped \\n
  .replace(/\\n/g, '\n')    // single-escaped \n
  .replace(/^"|"$/g, '');   // strip surrounding quotes if any

if (!projectId || !privateKey || !clientEmail) {
  console.warn('[firebaseAdmin] Missing env vars — Firebase auth disabled');
  console.warn('[firebaseAdmin] projectId:', !!projectId, 'clientEmail:', !!clientEmail, 'privateKey:', !!privateKey);
  module.exports = {
    auth: () => ({
      verifyIdToken: async () => { throw new Error('Firebase not configured — set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL'); },
    }),
  };
} else {
  try {
    // Only initialize once (guard against hot-reload double-init)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
      });
    }
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
