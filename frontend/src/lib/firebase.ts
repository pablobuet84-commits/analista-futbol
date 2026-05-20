import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyA5LMLp_BCGLT6WR-AfaCggxvokDBEl6DI",
  authDomain: "analista-futbol.firebaseapp.com",
  projectId: "analista-futbol",
  storageBucket: "analista-futbol.firebasestorage.app",
  messagingSenderId: "850419542745",
  appId: "1:850419542745:web:3f89450b7e322c939a2cc8",
}

const app = initializeApp(firebaseConfig, "analista-futbol")
export const db = getFirestore(app)
export const storage = getStorage(app)
