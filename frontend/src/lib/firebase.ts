import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBsXuFWo76-mIqFwwu6CqpPWkzwgP5MC4I",
  authDomain: "gestion-gastos-synthonbago.firebaseapp.com",
  projectId: "gestion-gastos-synthonbago",
  storageBucket: "gestion-gastos-synthonbago.firebasestorage.app",
  messagingSenderId: "201413854516",
  appId: "1:201413854516:web:2b31f6b8355b76f6a75161",
}

const app = initializeApp(firebaseConfig, "analista-futbol")
export const db = getFirestore(app)
