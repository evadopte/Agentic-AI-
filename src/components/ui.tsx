import type { ReactNode } from 'react'
import type { Status } from '../lib/checklist'
import type { ReviewStatus } from '../lib/files'

const STATUS_LABEL: Record<Status, string> = {
  ok: 'OK',
  todo: 'À faire',
  missing: 'Manquant',
  warning: 'Attention',
  info: 'Info',
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

const REVIEW_LABEL: Record<ReviewStatus, string> = {
  pending: 'En attente de vérification',
  verified: 'Vérifié',
  rejected: 'Refusé',
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, Status> = { pending: 'todo', verified: 'ok', rejected: 'missing' }
  return <span className={`badge badge-${map[status]}`}>{REVIEW_LABEL[status]}</span>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
