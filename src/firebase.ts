import { initializeApp } from "firebase/app";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  runTransaction, 
  doc, 
  getDoc,
  getDocs,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
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
} from "firebase/firestore";

import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

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
  getDoc,
  getDocs, 
  ref, 
  uploadString, 
  getDownloadURL,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  FieldValue,
  writeBatch,
  increment
};

export type { Transaction, DocumentData, QueryDocumentSnapshot };