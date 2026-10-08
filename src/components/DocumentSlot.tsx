import { useState, type ChangeEvent } from 'react'
import { ACCEPTED_MIME, DOCUMENT_HINTS, DOCUMENT_TYPES, MAX_UPLOAD_BYTES, type DocumentType } from '../data/documents'
import { formatDate } from '../lib/dates'
import { deleteDocument, openDocument, saveDocument, type StoredDocument } from '../lib/files'
import { ReviewBadge } from './ui'

interface Props {
  petId: string
  type: DocumentType
  doc?: StoredDocument
  note?: string
  compact?: boolean
}

export function DocumentSlot({ petId, type, doc, note, compact }: Props) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.type && !ACCEPTED_MIME.includes(file.type)) {
      setError('Format non accepté : envoyez un PDF ou une photo (JPG, PNG, WEBP, HEIC).')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Fichier trop lourd (10 Mo maximum).')
      return
    }
    setError('')
    setBusy(true)
    try {
      await saveDocument(petId, type, file)
    } catch {
      setError("Le document n'a pas pu être enregistré.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`doc-slot ${compact ? 'compact' : ''} ${doc ? `doc-${doc.status}` : ''}`}>
      <div className="doc-head">
        <strong>📄 {DOCUMENT_TYPES[type]}</strong>
        {doc && <ReviewBadge status={doc.status} />}
      </div>
      {!compact && (note || DOCUMENT_HINTS[type]) && <p className="muted small">{note || DOCUMENT_HINTS[type]}</p>}
      {doc && (
        <p className="small">
          <button type="button" className="btn-link" onClick={() => openDocument(doc)}>
            {doc.name}
          </button>{' '}
          · envoyé le {formatDate(doc.uploadedAt)}
          {doc.status === 'rejected' && doc.reviewNote && <span className="reject-note"> Motif du refus : {doc.reviewNote}</span>}
        </p>
      )}
      {error && <p className="error small">{error}</p>}
      <div className="doc-actions">
        <label className={`btn-secondary small ${busy ? 'disabled' : ''}`}>
          {doc ? 'Remplacer' : 'Téléverser'}
          <input type="file" hidden accept={ACCEPTED_MIME.join(',')} onChange={onFile} disabled={busy} />
        </label>
        {doc && (
          <button type="button" className="btn-link danger small" onClick={() => deleteDocument(doc.key)}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
