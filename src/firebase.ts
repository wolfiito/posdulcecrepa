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
  apiKey: "AIzaSyA_H_rGtLHa_WKzn2DvduS2m6L69C5xCYs",
  authDomain: "dulcecrepapos.firebaseapp.com",
  projectId: "dulcecrepapos",
  storageBucket: "dulcecrepapos.firebasestorage.app",
  messagingSenderId: "1036136584049",
  appId: "1:1036136584049:web:32d7baea5fa295e7dc9cd0"
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