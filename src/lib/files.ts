import { useCallback, useEffect, useState } from 'react'
import type { DocumentType } from '../data/documents'

export type ReviewStatus = 'pending' | 'verified' | 'rejected'

/** Documents téléversés, stockés dans IndexedDB (dans le navigateur). */
export interface StoredDocument {
  key: string
  petId: string
  type: DocumentType
  name: string
  mime: string
  size: number
  uploadedAt: string
  blob: Blob
  status: ReviewStatus
  reviewNote?: string
  reviewedAt?: string
}

const DB_NAME = 'petpass'
const STORE = 'documents'
const CHANGED = 'petpass:documents-changed'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'key' })
      store.createIndex('petId', 'petId')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

function notify() {
  window.dispatchEvent(new Event(CHANGED))
}

export function documentKey(petId: string, type: DocumentType): string {
  return `${petId}:${type}`
}

/** Enregistre (ou remplace) un document : il repasse en attente de vérification. */
export async function saveDocument(petId: string, type: DocumentType, file: File): Promise<void> {
  const doc: StoredDocument = {
    key: documentKey(petId, type),
    petId,
    type,
    name: file.name,
    mime: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    blob: file,
    status: 'pending',
  }
  await run('readwrite', (s) => s.put(doc))
  notify()
}

export async function reviewDocument(doc: StoredDocument, status: ReviewStatus, note = ''): Promise<void> {
  await run('readwrite', (s) =>
    s.put({ ...doc, status, reviewNote: note || undefined, reviewedAt: new Date().toISOString() }),
  )
  notify()
}

export function listDocuments(petId?: string): Promise<StoredDocument[]> {
  return run('readonly', (s) =>
    (petId ? s.index('petId').getAll(petId) : s.getAll()) as IDBRequest<StoredDocument[]>,
  )
}

export async function deleteDocument(key: string): Promise<void> {
  await run('readwrite', (s) => s.delete(key))
  notify()
}

export async function deletePetDocuments(petId: string): Promise<void> {
  const docs = await listDocuments(petId)
  await Promise.all(docs.map((d) => run('readwrite', (s) => s.delete(d.key))))
  notify()
}

/** Documents d'un animal (ou de tous si petId absent), rechargés à chaque modification. */
export function useDocuments(petId?: string) {
  const [docs, setDocs] = useState<StoredDocument[]>([])
  const refresh = useCallback(() => {
    listDocuments(petId).then(setDocs, () => setDocs([]))
  }, [petId])
  useEffect(() => {
    refresh()
    window.addEventListener(CHANGED, refresh)
    return () => window.removeEventListener(CHANGED, refresh)
  }, [refresh])
  const byType = new Map(docs.map((d) => [d.type, d]))
  return { docs, byType }
}

export function openDocument(doc: StoredDocument) {
  const url = URL.createObjectURL(doc.blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
