import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "atlas-9de9c.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "atlas-9de9c",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "atlas-9de9c.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "621266253541",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:621266253541:web:942322061effaee1d0060c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;