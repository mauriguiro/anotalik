import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWnX281qbvcpXVNgtTES3EE51EEE3-V00",
  authDomain: "anotalink-76201.firebaseapp.com",
  projectId: "anotalink-76201",
  storageBucket: "anotalink-76201.firebasestorage.app",
  messagingSenderId: "127641599850",
  appId: "1:127641599850:web:74c84ba4dbed67f8f82f13"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
