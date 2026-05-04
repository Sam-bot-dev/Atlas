const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\\\n/g, '\n')
  ?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.warn('[firebaseAdmin] Missing env vars — Firebase auth disabled');
  // Export a stub so require() doesn't crash other modules.
  // In production, firebaseLogin endpoint will return 503 instead of crashing the server.
  module.exports = {
    auth: () => ({
      verifyIdToken: async () => { throw new Error('Firebase not configured — set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL'); },
    }),
  };
} else {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
  });
  module.exports = admin;
}
