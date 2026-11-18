/* إعرابي — الاتصال بمشروع Firebase. القيم تأتي من ملف .env */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};
export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
// لا Storage عمدًا: كل الملفات تُربط بروابط Google Drive فقط.
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function initAnalytics() {
  try {
    if (!app || !firebaseConfig.measurementId || !/^https?:$/.test(location.protocol)) return;
    const { isSupported, getAnalytics } = await import('firebase/analytics');
    if (await isSupported()) getAnalytics(app);
  } catch (e) { /* يتجاهل أي خطأ */ }
}
