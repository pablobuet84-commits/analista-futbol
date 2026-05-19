import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBsXuFWo76-mIqFwwu6CqpPWkzwgP5MC4I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gestion-gastos-synthonbago.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gestion-gastos-synthonbago",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gestion-gastos-synthonbago.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "201413854516",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:201413854516:web:2b31f6b8355b76f6a75161",
}

const app = initializeApp(firebaseConfig, "analista-futbol")
export const db = getFirestore(app)
