import type { ReactNode } from 'react'
import { formatDate } from '../lib/dates'
import { SPECIES_LABELS, type Pet } from '../types'

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="pp-section">
      <h4>
        <span className="pp-num">{n}</span> {title}
      </h4>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="pp-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

export function DigitalPassport({ pet }: { pet: Pet }) {
  const p = pet.passport
  const isBird = pet.species === 'bird'
  return (
    <article className="passport">
      <header className="pp-cover">
        <div className="pp-stars" aria-hidden>
          ★ ★ ★ ★ ★ ★
        </div>
        <div>
          <div className="pp-eu">UNION EUROPÉENNE · FRANCE</div>
          <h3>{isBird ? "Fiche d'identité numérique" : 'Passeport pour animal de compagnie'}</h3>
        </div>
        <div className="pp-number">
          <span>N°</span>
          <strong>{p?.number ?? 'non délivré'}</strong>
        </div>
      </header>
      <p className="pp-demo">
        Démonstration, document non officiel. Seul un vétérinaire habilité peut délivrer le passeport européen officiel.
      </p>

      <div className="pp-body">
        <Section n="I" title="Propriétaire">
          <Row label="Nom, prénom" value={`${pet.owner.lastName.toUpperCase()} ${pet.owner.firstName}`.trim()} />
          <Row label="Adresse" value={pet.owner.address} />
          <Row label="Pays" value={pet.owner.country} />
          <Row label="Coordonnées" value={[pet.owner.phone, pet.owner.email].filter(Boolean).join(' · ')} />
          <Row label="Signature" value={pet.owner.signedAt ? `Signé le ${formatDate(pet.owner.signedAt)}` : undefined} />
        </Section>

        <Section n="II" title="Description de l'animal">
          <div className="pp-animal">
            {pet.photo && <img src={pet.photo} alt={pet.name} />}
            <div>
              <Row label="Nom" value={pet.name} />
              <Row label="Espèce" value={SPECIES_LABELS[pet.species]} />
              <Row label="Race" value={pet.breed} />
              <Row label="Sexe" value={pet.sex === 'M' ? 'Mâle' : pet.sex === 'F' ? 'Femelle' : ''} />
              <Row label="Couleur" value={pet.color} />
              <Row label="Date de naissance" value={formatDate(pet.birthDate)} />
              <Row label="Signes particuliers" value={pet.marks} />
            </div>
          </div>
        </Section>

        <Section n="III" title="Identification">
          <Row label={pet.microchip.number ? 'Puce électronique' : 'Tatouage'} value={pet.microchip.number || pet.microchip.tattoo} />
          <Row label="Date" value={formatDate(pet.microchip.implantDate)} />
          <Row label="Emplacement" value={pet.microchip.location} />
          {!isBird && <Row label="Fichier I-CAD" value={pet.microchip.icadRegistered ? 'Enregistré' : 'Non enregistré'} />}
        </Section>

        <Section n="IV" title="Délivrance du document">
          <Row label="Vétérinaire" value={p?.vet.name} />
          <Row label="Adresse" value={p?.vet.address} />
          <Row label="Coordonnées" value={p?.vet.contact} />
          <Row label="N° ordinal" value={p?.vet.ordinal} />
          <Row label="Date de délivrance" value={p ? formatDate(p.issuedAt) : undefined} />
        </Section>

        {!isBird && (
          <Section n="V" title="Vaccination antirabique">
            {pet.rabies.length === 0 ? (
              <p className="muted">Aucune vaccination enregistrée.</p>
            ) : (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fabricant · vaccin</th>
                    <th>Lot</th>
                    <th>Valable jusqu'au</th>
                    <th>Vétérinaire</th>
                  </tr>
                </thead>
                <tbody>
                  {pet.rabies.map((v) => (
                    <tr key={v.id}>
                      <td>{formatDate(v.date)}</td>
                      <td>{[v.manufacturer, v.vaccine].filter(Boolean).join(' · ') || '—'}</td>
                      <td>{v.batch || '—'}</td>
                      <td>{formatDate(v.validUntil)}</td>
                      <td>{v.vet || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )}

        {!isBird && (
          <Section n="VI" title="Titrage des anticorps antirabiques">
            {pet.titerTests.length === 0 ? (
              <p className="muted">Aucun titrage (seulement nécessaire pour certains pays).</p>
            ) : (
              pet.titerTests.map((t) => (
                <Row key={t.id} label={`Prélèvement du ${formatDate(t.sampleDate)}`} value={`${t.result || '?'} UI/ml${t.lab ? ` · ${t.lab}` : ''}`} />
              ))
            )}
          </Section>
        )}

        {pet.species === 'dog' && (
          <Section n="VII" title="Traitement contre Echinococcus multilocularis">
            {pet.tapewormTreatments.length === 0 ? (
              <p className="muted">Aucun traitement enregistré.</p>
            ) : (
              pet.tapewormTreatments.map((t) => (
                <Row key={t.id} label={formatDate(t.dateTime)} value={[t.product, t.vet].filter(Boolean).join(' · ')} />
              ))
            )}
          </Section>
        )}

        <Section n="VIII" title="Autres données sanitaires">
          {pet.otherVaccinations.length === 0 && pet.clinicalExams.length === 0 && <p className="muted">Aucune donnée.</p>}
          {pet.otherVaccinations.map((v) => (
            <Row key={v.id} label={`Vaccin du ${formatDate(v.date)}`} value={[v.disease, v.vaccine, v.vet].filter(Boolean).join(' · ')} />
          ))}
          {pet.clinicalExams.map((x) => (
            <Row key={x.id} label={`Examen du ${formatDate(x.date)}`} value={[x.notes, x.vet].filter(Boolean).join(' · ')} />
          ))}
        </Section>
      </div>
    </article>
  )
}
