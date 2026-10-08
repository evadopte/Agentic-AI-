import { DOCUMENT_TYPES } from '../data/documents'
import { PASSPORT_CONDITIONS, PASSPORT_OPTIONAL_DOCUMENTS, passportReadiness } from '../data/passport'
import { formatDate } from '../lib/dates'
import { useDocuments } from '../lib/files'
import type { Pet } from '../types'
import { DigitalPassport } from './DigitalPassport'
import { DocumentSlot } from './DocumentSlot'

export function PassportTab({ pet, onEdit }: { pet: Pet; onEdit: () => void }) {
  const { byType } = useDocuments(pet.id)
  const statuses = new Map([...byType].map(([t, d]) => [t, d.status]))
  const r = passportReadiness(pet, statuses)
  const isBird = pet.species === 'bird'

  if (pet.passport) {
    return (
      <div className="stack">
        <div className="banner banner-ok">
          ✅ Passeport n° {pet.passport.number} délivré le {formatDate(pet.passport.issuedAt)} par {pet.passport.vet.name}.
        </div>
        <DigitalPassport pet={pet} />
      </div>
    )
  }

  const step1 = r.missingFields.length === 0
  const step2 = r.missingDocs === 0 && r.rejected === 0
  const step3 = r.ready

  return (
    <div className="stack">
      {isBird && (
        <div className="banner">
          Les oiseaux n'ont pas de passeport européen. L'app crée une fiche d'identité numérique, validée par un vétérinaire à partir d'un certificat sanitaire.
        </div>
      )}

      <ol className="steps">
        <li className={step1 ? 'done' : 'current'}>
          <h3>1. Compléter le profil</h3>
          {step1 ? (
            <p>Toutes les informations nécessaires sont remplies.</p>
          ) : (
            <>
              <p>Il manque : {r.missingFields.join(', ')}.</p>
              <button className="btn-secondary small" onClick={onEdit}>
                Compléter le profil
              </button>
            </>
          )}
        </li>

        <li className={step2 ? 'done' : step1 ? 'current' : ''}>
          <h3>2. Téléverser les documents</h3>
          <p className="muted">Ces documents seront vérifiés par un vétérinaire avant la délivrance du passeport.</p>
          <div className="doc-list">
            {r.required.map((t) => (
              <DocumentSlot key={t} petId={pet.id} type={t} doc={byType.get(t)} />
            ))}
          </div>
          {PASSPORT_OPTIONAL_DOCUMENTS[pet.species].length > 0 && (
            <>
              <h4>Facultatif</h4>
              <div className="doc-list">
                {PASSPORT_OPTIONAL_DOCUMENTS[pet.species].map(({ type, why }) => (
                  <DocumentSlot key={type} petId={pet.id} type={type} doc={byType.get(type)} note={why} />
                ))}
              </div>
            </>
          )}
        </li>

        <li className={step3 ? 'done' : step1 && step2 ? 'current' : ''}>
          <h3>3. Vérification par le vétérinaire</h3>
          <p>
            {r.verified}/{r.required.length} document(s) vérifié(s)
            {r.pending > 0 && `, ${r.pending} en attente`}
            {r.rejected > 0 && `, ${r.rejected} refusé(s) à remplacer`}.
          </p>
          {r.ready ? (
            <p>Le dossier est complet : le vétérinaire peut délivrer le passeport depuis l'espace vétérinaire.</p>
          ) : (
            r.rejected > 0 && (
              <p className="error">
                Refusé :{' '}
                {r.required
                  .filter((t) => statuses.get(t) === 'rejected')
                  .map((t) => DOCUMENT_TYPES[t])
                  .join(', ')}
                .
              </p>
            )
          )}
        </li>
      </ol>

      {!isBird && (
        <details className="card">
          <summary>Conditions pour obtenir un passeport</summary>
          <table className="table">
            <thead>
              <tr>
                <th>Condition</th>
                <th>Obligatoire ?</th>
                <th>Explication</th>
              </tr>
            </thead>
            <tbody>
              {PASSPORT_CONDITIONS.map((c) => (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td>{c.required}</td>
                  <td>{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <details className="card">
        <summary>Aperçu du passeport numérique</summary>
        <DigitalPassport pet={pet} />
      </details>
    </div>
  )
}
