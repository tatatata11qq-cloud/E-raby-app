import { auth, db } from './firebase.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let me = null;
let banned = false;
let registering = false;
const subs = new Set();

export const getMe = () => me;
export const wasBanned = () => banned;
export const isStaff = (u) => !!u && (u.role === 'teacher' || u.role === 'admin');
export const isAdmin = (u) => !!u && u.role === 'admin';
export const onMe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

async function loadProfile(fb) {
  const s = await getDoc(doc(db, 'users', fb.uid));
  return s.exists() ? { uid: fb.uid, ...s.data() } : null;
}

export function initAuth() {
  return new Promise((resolve) => {
    let first = true;
    onAuthStateChanged(auth, async (fb) => {
      if (registering) return;
      try {
        me = fb ? await loadProfile(fb) : null;
        if (me && me.banned) { banned = true; me = null; await signOut(auth); }
      } catch (e) { me = null; }
      subs.forEach((f) => f(me));
      if (first) { first = false; resolve(me); }
    });
  });
}

export async function login(email, pw) {
  banned = false;
  const cred = await signInWithEmailAndPassword(auth, String(email).trim(), pw);
  const p = await loadProfile(cred.user);
  if (!p) { await signOut(auth); throw new Error('لا يوجد ملف لهذا الحساب. تواصل مع الإدارة.'); }
  if (p.banned) { await signOut(auth); throw new Error('تم حظر حسابك. تواصل مع إدارة المنصة.'); }
  me = p;
  subs.forEach((f) => f(me));
  return me;
}

export async function register(name, email, pw) {
  const fullName = String(name).trim().replace(/\s+/g, ' ');
  if (fullName.split(' ').length < 3) throw new Error('اكتب اسمك ثلاثيًا.');
  if (String(pw).length < 6) throw new Error('كلمة المرور قصيرة (6 أحرف على الأقل).');
  registering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, String(email).trim(), pw);
    await updateProfile(cred.user, { displayName: fullName }).catch(() => {});
    const data = { fullName, email: cred.user.email, role: 'student', banned: false, createdAt: Date.now() };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    me = { uid: cred.user.uid, ...data };
  } finally { registering = false; }
  subs.forEach((f) => f(me));
  return me;
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, String(email).trim());
export async function logout() { await signOut(auth); me = null; subs.forEach((f) => f(me)); }

const MSGS = {
  'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/user-not-found': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth/invalid-email': 'أدخل بريدًا إلكترونيًا صحيحًا.',
  'auth/email-already-in-use': 'هذا البريد مسجّل مسبقًا.',
  'auth/weak-password': 'كلمة المرور قصيرة (6 أحرف على الأقل).',
  'auth/too-many-requests': 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.',
  'auth/network-request-failed': 'تعذّر الاتصال بالإنترنت.',
  'permission-denied': 'ليست لديك صلاحية لهذا الإجراء.'
};
export const errMsg = (e) => MSGS[e && e.code] || (e && !e.code && e.message) || 'حدث خطأ غير متوقع. حاول مجددًا.';
