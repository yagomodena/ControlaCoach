// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALAhGiJs462b3CKJ68C7w_dQvOYfviI6Y",
  authDomain: "bossolan-futevlei-manager.firebaseapp.com",
  projectId: "bossolan-futevlei-manager",
  storageBucket: "bossolan-futevlei-manager.firebasestorage.app",
  messagingSenderId: "439422165067",
  appId: "1:439422165067:web:69a744e4234cd32469adce"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
