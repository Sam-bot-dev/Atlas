import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDzk23WQSZaZGhRY0KNzbY5SLzJoGCqNVg",
    authDomain: "atlas-9de9c.firebaseapp.com",
    projectId: "atlas-9de9c",
    storageBucket: "atlas-9de9c.firebasestorage.app",
    messagingSenderId: "621266253541",
    appId: "1:621266253541:web:942322061effaee1d0060c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;