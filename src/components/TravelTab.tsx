import { useEffect, useState } from 'react'
import { DESTINATIONS, RULES_CHECKED_ON, getDestination, type Phase } from '../data/destinations'
import { buildChecklist, type ChecklistItem } from '../lib/checklist'
import { formatDate } from '../lib/dates'
import { useDocuments } from '../lib/files'
import { SPECIES_LABELS, type Pet, type Trip } from '../types'
import { DocumentSlot } from './DocumentSlot'
import { Field, StatusBadge } from './ui'

const tripKey = (petId: string) => `petpass.trip.${petId}`

function loadTrip(petId: string): Trip {
  try {
    const raw = localStorage.getItem(tripKey(petId))
    if (raw) return { destinationId: '', arrivalDate: '', returnDate: '', ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { destinationId: '', arrivalDate: '', returnDate: '' }
}

const PHASE_TITLE: Record<Phase, string> = {
  entry: 'Pour entrer dans le pays',
  return: 'Pour revenir en France',
}

export function TravelTab({ pet }: { pet: Pet }) {
  const [trip, setTrip] = useState<Trip>(() => loadTrip(pet.id))
  const { byType } = useDocuments(pet.id)

  useEffect(() => {
    try {
      localStorage.setItem(tripKey(pet.id), JSON.stringify(trip))
    } catch {
      /* ignore */
    }
  }, [pet.id, trip])

  const destination = getDestination(trip.destinationId)
  const blocked = destination?.notAllowed?.[pet.species]
  const statuses = new Map([...byType].map(([t, d]) => [t, d.status]))
  // Le passeport délivré dans l'app couvre l'étape « passeport européen ».
  if (pet.passport && statuses.get('eu-passport') !== 'verified') statuses.set('eu-passport', 'verified')
  const items = destination && !blocked ? buildChecklist(destination, pet, trip, statuses) : []
  const groups = (['entry', 'return'] as Phase[])
    .map((phase) => ({ phase, items: items.filter((i) => (i.requirement.phase ?? 'entry') === phase) }))
    .filter((g) => g.items.length > 0)
  const done = items.filter((i) => i.result.status === 'ok').length
  const actionable = items.filter((i) => i.result.status !== 'info').length

  return (
    <div className="stack">
      <section className="card">
        <h3>Où voulez-vous emmener {pet.name || 'votre animal'} ?</h3>
        <p className="muted small">Départ depuis la France. Voyage non commercial (5 animaux maximum).</p>
        <div className="grid">
          <Field label="Destination">
            <select value={trip.destinationId} onChange={(e) => setTrip({ ...trip, destinationId: e.target.value })}>
              <option value="">Choisir…</option>
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.flag} {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'arrivée">
            <input type="date" value={trip.arrivalDate} onChange={(e) => setTrip({ ...trip, arrivalDate: e.target.value })} />
          </Field>
          {destination?.outsideEu && (
            <Field label="Date de retour en France">
              <input type="date" value={trip.returnDate} onChange={(e) => setTrip({ ...trip, returnDate: e.target.value })} />
            </Field>
          )}
        </div>
      </section>

      {destination && (
        <section className="card">
          <h3>
            {destination.flag} {destination.name}
          </h3>
          <p>{destination.summary}</p>
          {destination.restrictions && (
            <ul className="restrictions">
              {destination.restrictions.map((r) => (
                <li key={r}>⚠️ {r}</li>
              ))}
            </ul>
          )}
          {destination.outsideEu && (
            <p className="muted small">
              En cas d'escale, vérifiez aussi les règles de transit du pays traversé et de la compagnie de transport.
            </p>
          )}
        </section>
      )}

      {blocked && <div className="banner banner-warning">🚫 {SPECIES_LABELS[pet.species]} : {blocked}</div>}

      {destination && !blocked && items.length === 0 && (
        <div className="banner">Aucune exigence spécifique n'est enregistrée pour cette espèce. Renseignez-vous auprès des autorités du pays.</div>
      )}

      {items.length > 0 && (
        <>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${actionable ? (done / actionable) * 100 : 0}%` }} />
            <span>
              {done}/{actionable} étapes prêtes
            </span>
          </div>
          {groups.map((g) => (
            <section key={g.phase} className="stack">
              {destination?.outsideEu && <h3>{PHASE_TITLE[g.phase]}</h3>}
              {g.items.map((item) => (
                <RequirementCard key={item.requirement.id} item={item} pet={pet} byType={byType} />
              ))}
            </section>
          ))}
        </>
      )}

      {destination && (
        <footer className="muted small">
          Règles vérifiées le {formatDate(RULES_CHECKED_ON)}, à titre indicatif : elles changent souvent. Confirmez toujours avec votre vétérinaire et
          les sources officielles :{' '}
          {destination.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </span>
          ))}
        </footer>
      )}
    </div>
  )
}

function RequirementCard({ item, pet, byType }: { item: ChecklistItem; pet: Pet; byType: ReturnType<typeof useDocuments>['byType'] }) {
  const { requirement: r, result } = item
  return (
    <article className={`req req-${result.status}`}>
      <div className="req-head">
        <h4>
          {r.title} {r.vet && <span className="tag">🩺 vétérinaire</span>}
        </h4>
        <StatusBadge status={result.status} />
      </div>
      <p className="small">{r.details}</p>
      {result.message && <p className="req-result">{result.message}</p>}
      {r.upload && !(r.upload === 'eu-passport' && pet.passport) && <DocumentSlot petId={pet.id} type={r.upload} doc={byType.get(r.upload)} compact />}
    </article>
  )
}
