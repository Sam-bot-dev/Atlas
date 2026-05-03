const admin = require("firebase-admin");

// Removed hardcoded service account - using env vars now
// FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

const projectId = process.env.FIREBASE_PROJECT_ID;
// Fix #firebaseAdmin: private key may have literal \n from env var parsing
// Render and most CI systems store multiline secrets with literal \n
// Need to handle both \\n (double-escaped) and \n (single-escaped)
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\\\n/g, '\n')
  ?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase Admin env vars');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    privateKey,
    clientEmail,
  }),
});

module.exports = admin;
