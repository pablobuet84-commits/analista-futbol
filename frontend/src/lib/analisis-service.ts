import { db } from './firebase'
import { collection, addDoc, updateDoc, getDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore'
import type { Message } from '@/types'

const COL = 'analisis'

export interface AnalisisSession {
  id: string
  filename: string
  taskId: string
  storageUrl: string
  createdAt: Date
  messages: Message[]
}

function toDate(ts: Timestamp | null | undefined): Date {
  return ts?.toDate?.() ?? new Date()
}

export async function createSession(filename: string, taskId: string, storageUrl: string = ''): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    filename,
    taskId,
    storageUrl,
    createdAt: serverTimestamp(),
    messages: [],
  })
  return ref.id
}

export async function addMessage(sessionId: string, msg: Message): Promise<void> {
  const ref = doc(db, COL, sessionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const messages = data.messages ?? []
  messages.push(msg)
  await updateDoc(ref, { messages })
}

export async function getSession(sessionId: string): Promise<AnalisisSession | null> {
  const snap = await getDoc(doc(db, COL, sessionId))
  if (!snap.exists()) return null
  const d = snap.data()
  return { id: snap.id, filename: d.filename, taskId: d.taskId, storageUrl: d.storageUrl || '', createdAt: toDate(d.createdAt), messages: d.messages ?? [] }
}

export async function listSessions(): Promise<AnalisisSession[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return { id: d.id, filename: data.filename, taskId: data.taskId, storageUrl: data.storageUrl || '', createdAt: toDate(data.createdAt), messages: data.messages ?? [] }
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, COL, sessionId))
}
