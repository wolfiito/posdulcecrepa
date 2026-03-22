// src/firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  collection, 
  addDoc, 
  serverTimestamp, 
  runTransaction, 
  doc, 
  getDocs,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  // Importamos los TIPOS que necesitamos
  type Transaction, 
  type DocumentData,
  type QueryDocumentSnapshot,
  query,
  where,
  orderBy,
  limit,
  updateDoc, 
  deleteDoc,
  Timestamp,
  setDoc,
  onSnapshot,
  FieldValue,
  writeBatch,
  increment
      // Podrías sumar todo e imprimir un comprobante final aquí.
} from "firebase/firestore";

import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// Tu configuración (No cambies tus claves)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Esto permite que la app funcione sin internet y cargue instantáneamente.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app); 

export { 
  collection, 
  addDoc, 
  serverTimestamp, 
  runTransaction, 
  doc, 
  getDocs, 
  ref, 
  uploadString, 
  getDownloadURL,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  updateDoc,   // <--- NUEVO
  deleteDoc,
  setDoc,
  onSnapshot,
  FieldValue,
  writeBatch,
  increment
      // Podrías sumar todo e imprimir un comprobante final aquí.
};

// Exporta los TIPOS que usaremos
export type { Transaction, DocumentData, QueryDocumentSnapshot };