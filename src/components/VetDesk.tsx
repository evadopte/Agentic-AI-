import { useState } from 'react'
import { DOCUMENT_TYPES } from '../data/documents'
import { generatePassportNumber, passportReadiness } from '../data/passport'
import { formatDate } from '../lib/dates'
import { openDocument, reviewDocument, useDocuments, type StoredDocument } from '../lib/files'
import { SPECIES_EMOJI, type Pet, type Veterinarian } from '../types'
import { Field, ReviewBadge } from './ui'

const VET_KEY = 'petpass.vet'

function loadVet(): Veterinarian {
  try {
    const raw = localStorage.getItem(VET_KEY)
    if (raw) return JSON.parse(raw) as Veterinarian
  } catch {
    /* ignore */
  }
  return { name: '', address: '', contact: '', ordinal: '' }
}

interface Props {
  pets: Pet[]
  onUpdatePet: (pet: Pet) => void
}

/** Espace de démonstration où un vétérinaire vérifie les documents et délivre les passeports. */
export function VetDesk({ pets, onUpdatePet }: Props) {
  const { docs } = useDocuments()
  const [vet, setVet] = useState<Veterinarian>(loadVet)
  const vetReady = vet.name.trim() && vet.ordinal.trim()

  function updateVet(v: Veterinarian) {
    setVet(v)
    try {
      localStorage.setItem(VET_KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }

  const pending = docs.filter((d) => d.status === 'pending').length

  return (
    <div className="stack">
      <div className="banner">
        Espace de démonstration : en production, il serait réservé aux vétérinaires connectés et vérifiés (numéro ordinal).
      </div>

      <fieldset className="card">
        <legend>Vétérinaire</legend>
        <div className="grid">
          <Field label="Nom *">
            <input value={vet.name} onChange={(e) => updateVet({ ...vet, name: e.target.value })} />
          </Field>
          <Field label="N° ordinal *">
            <input value={vet.ordinal} onChange={(e) => updateVet({ ...vet, ordinal: e.target.value })} />
          </Field>
          <Field label="Adresse de la clinique">
            <input value={vet.address} onChange={(e) => updateVet({ ...vet, address: e.target.value })} />
          </Field>
          <Field label="Téléphone / e-mail">
            <input value={vet.contact} onChange={(e) => updateVet({ ...vet, contact: e.target.value })} />
          </Field>
        </div>
      </fieldset>

      <p>
        <strong>{pending}</strong> document(s) en attente de vérification.
      </p>

      {pets.length === 0 && <p className="muted">Aucun animal enregistré.</p>}
      {pets.map((pet) => (
        <PetReview
          key={pet.id}
          pet={pet}
          docs={docs.filter((d) => d.petId === pet.id)}
          vet={vetReady ? vet : null}
          onIssue={() =>
            onUpdatePet({ ...pet, passport: { number: generatePassportNumber(), issuedAt: new Date().toISOString(), vet } })
          }
          onRevoke={() => onUpdatePet({ ...pet, passport: undefined })}
        />
      ))}
    </div>
  )
}

function PetReview({
  pet,
  docs,
  vet,
  onIssue,
  onRevoke,
}: {
  pet: Pet
  docs: StoredDocument[]
  vet: Veterinarian | null
  onIssue: () => void
  onRevoke: () => void
}) {
  const statuses = new Map(docs.map((d) => [d.type, d.status]))
  const r = passportReadiness(pet, statuses)
  const owner = `${pet.owner.firstName} ${pet.owner.lastName}`.trim()

  return (
    <section className="card">
      <h3>
        {SPECIES_EMOJI[pet.species]} {pet.name || 'Sans nom'} <span className="muted small">· {owner || 'propriétaire inconnu'}</span>
      </h3>
      <p className="small">
        Puce : <strong>{pet.microchip.number || pet.microchip.tattoo || '—'}</strong> · identifié le {formatDate(pet.microchip.implantDate)}
        {pet.species !== 'bird' && ` · I-CAD : ${pet.microchip.icadRegistered ? 'oui' : 'non'}`}
      </p>
      {docs.length === 0 && <p className="muted">Aucun document téléversé.</p>}
      {docs.map((d) => (
        <DocReview key={d.key} doc={d} />
      ))}

      {pet.passport ? (
        <p className="small">
          ✅ Passeport n° {pet.passport.number} délivré le {formatDate(pet.passport.issuedAt)}.{' '}
          <button className="btn-link danger" onClick={onRevoke}>
            Annuler la délivrance
          </button>
        </p>
      ) : (
        <div className="issue">
          {!r.ready && (
            <p className="muted small">
              Pas encore prêt :{' '}
              {[
                ...r.missingFields,
                ...r.required.filter((t) => statuses.get(t) !== 'verified').map((t) => `${DOCUMENT_TYPES[t]} (non vérifié)`),
              ].join(', ')}
              .
            </p>
          )}
          <button className="btn-primary" disabled={!r.ready || !vet} onClick={onIssue}>
            Délivrer le passeport
          </button>
          {r.ready && !vet && <p className="muted small">Renseignez votre nom et votre numéro ordinal pour délivrer.</p>}
        </div>
      )}
    </section>
  )
}

function DocReview({ doc }: { doc: StoredDocument }) {
  const [note, setNote] = useState('')
  return (
    <div className={`doc-slot doc-${doc.status}`}>
      <div className="doc-head">
        <strong>📄 {DOCUMENT_TYPES[doc.type]}</strong>
        <ReviewBadge status={doc.status} />
      </div>
      <p className="small">
        <button className="btn-link" onClick={() => openDocument(doc)}>
          Ouvrir {doc.name}
        </button>{' '}
        · envoyé le {formatDate(doc.uploadedAt)}
        {doc.reviewNote && ` · motif : ${doc.reviewNote}`}
      </p>
      {doc.status === 'pending' && (
        <div className="doc-actions">
          <button className="btn-primary small" onClick={() => reviewDocument(doc, 'verified')}>
            Valider
          </button>
          <input placeholder="Motif du refus" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-secondary small" disabled={!note.trim()} onClick={() => reviewDocument(doc, 'rejected', note.trim())}>
            Refuser
          </button>
        </div>
      )}
    </div>
  )
}
