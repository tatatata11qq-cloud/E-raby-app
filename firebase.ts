import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

/**
 * Primary Teacher Master Configuration (المدرس الرئيسي)
 * Defined by policy and cannot be altered through normal registration.
 * Updated to: tatatata11qq@gmail.com
 */
export const PRIMARY_TEACHER_EMAIL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRIMARY_TEACHER_EMAIL) || 'tatatata11qq@gmail.com';

export const PRIMARY_TEACHER_NAME = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRIMARY_TEACHER_NAME) || 'محمد عربي محمد';

/**
 * Firebase Web Client Configuration for project: e-raby
 * Securely read from Vite environment variables without exposing admin secrets.
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as Record<string, string>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForErabyProjectSetup123456',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'e-raby.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'e-raby',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'e-raby.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '100000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:100000000000:web:abcdef1234567890abcdef',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
};

// Singleton App Instance to prevent duplicate initialization
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;
let isFirebaseConfigured = false;
let initError: Error | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseConfigured = true;

  // Initialize Analytics asynchronously only if supported in this environment
  if (typeof window !== 'undefined') {
    isSupported()
      .then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      })
      .catch((err) => {
        console.warn('Firebase Analytics is not supported in this browser environment:', err);
      });
  }
} catch (error) {
  console.error('Firebase Initialization Error:', error);
  initError = error as Error;
  // Initialize safe fallbacks to prevent runtime crashes
  if (!app!) {
    try {
      app = initializeApp(firebaseConfig, 'fallback-app');
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (e) {
      /* ignore */
    }
  }
}

export { firebaseConfig, app, auth, db, storage, analytics, isFirebaseConfigured, initError };
