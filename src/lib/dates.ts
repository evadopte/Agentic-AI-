const DAY = 24 * 60 * 60 * 1000

/** Parse une date YYYY-MM-DD (ou datetime-local) en heure locale. */
export function parseDate(value: string): Date | null {
  if (!value) return null
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY)
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY)
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? parseDate(value) : value
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
