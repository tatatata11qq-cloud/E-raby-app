import { db } from './firebase.js';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch
} from 'firebase/firestore';

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const ord = (a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0);
const list = async (col, ...c) => rows(await getDocs(c.length ? query(collection(db, col), ...c) : collection(db, col)));
const one = async (col, id) => { const s = await getDoc(doc(db, col, id)); return s.exists() ? { id: s.id, ...s.data() } : null; };

/* ---- قراءة ---- */
export const getLevels = async () => (await list('levels')).sort(ord);
export const getLevel = (id) => one('levels', id);
export const getAllParts = async () => (await list('parts')).sort(ord);
export const getPartsOf = async (levelId) => (await list('parts', where('levelId', '==', levelId))).sort(ord);
export const getAllContents = async () => (await list('contents')).sort(ord);
export const getContent = (id) => one('contents', id);
export const getContentsOfLevel = async (levelId) => (await list('contents', where('levelId', '==', levelId))).sort(ord);
export const getMyResults = (uid) => list('results', where('uid', '==', uid));
export const getAllResults = () => list('results');
export const getUsers = () => list('users');
export const getInstitution = () => one('config', 'institution').catch(() => null);

/* ---- كتابة ---- */
export const addResult = (r) => addDoc(collection(db, 'results'), { ...r, at: Date.now() });
async function save(col, id, data) {
  if (id) { await setDoc(doc(db, col, id), data, { merge: true }); return id; }
  return (await addDoc(collection(db, col), { ...data, createdAt: Date.now() })).id;
}
export const saveLevel = (id, d) => save('levels', id, d);
export const savePart = (id, d) => save('parts', id, d);
export const saveContent = (id, d) => save('contents', id, d);
export const saveInstitution = (d) => setDoc(doc(db, 'config', 'institution'), d);
export const setUserFields = (uid, patch) => updateDoc(doc(db, 'users', uid), patch);

async function removeMany(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const b = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => b.delete(r));
    await b.commit();
  }
}
export const deleteContent = (id) => deleteDoc(doc(db, 'contents', id));
export async function deletePart(id) {
  const cs = await list('contents', where('partId', '==', id));
  await removeMany([...cs.map((c) => doc(db, 'contents', c.id)), doc(db, 'parts', id)]);
}
export async function deleteLevel(id) {
  const [cs, ps] = await Promise.all([list('contents', where('levelId', '==', id)), list('parts', where('levelId', '==', id))]);
  await removeMany([...cs.map((c) => doc(db, 'contents', c.id)), ...ps.map((p) => doc(db, 'parts', p.id)), doc(db, 'levels', id)]);
}

/* ---- الرسائل: لكل طالب محادثة واحدة مع المدرّسين (threadId = uid الطالب) ---- */
export const getThread = async (threadId) => (await list('messages', where('threadId', '==', threadId))).sort((a, b) => a.at - b.at);
export const getAllMessages = () => list('messages');
export const sendMessage = (u, threadId, text) => addDoc(collection(db, 'messages'), {
  threadId, from: u.uid, fromName: u.fullName, fromStaff: u.role !== 'student', text: String(text).trim().slice(0, 2000), at: Date.now()
});
