import { useState, type ChangeEvent, type ReactNode } from 'react'
import { resizePhoto } from '../lib/photo'
import { newId } from '../lib/storage'
import { SPECIES_EMOJI, SPECIES_LABELS, type Pet } from '../types'
import { Field } from './ui'

interface Props {
  initial: Pet
  onSave: (pet: Pet) => void
  onCancel: () => void
}

type Item = { id: string }

/** Liste éditable de lignes (vaccins, traitements…). */
function ListEditor<T extends Item>({
  title,
  items,
  onChange,
  create,
  render,
  addLabel,
}: {
  title: string
  items: T[]
  onChange: (items: T[]) => void
  create: () => T
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode
  addLabel: string
}) {
  return (
    <fieldset className="card">
      <legend>{title}</legend>
      {items.length === 0 && <p className="muted">Aucune entrée pour l'instant.</p>}
      {items.map((item) => (
        <div key={item.id} className="list-row">
          <div className="grid">
            {render(item, (patch) => onChange(items.map((i) => (i.id === item.id ? { ...i, ...patch } : i))))}
          </div>
          <button type="button" className="btn-link danger" onClick={() => onChange(items.filter((i) => i.id !== item.id))}>
            Supprimer
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => onChange([...items, create()])}>
        + {addLabel}
      </button>
    </fieldset>
  )
}

export function PetForm({ initial, onSave, onCancel }: Props) {
  const [pet, setPet] = useState<Pet>(initial)
  const [photoError, setPhotoError] = useState('')
  const isBird = pet.species === 'bird'

  const set = <K extends keyof Pet>(key: K, value: Pet[K]) => setPet((p) => ({ ...p, [key]: value }))
  const text = (key: 'name' | 'breed' | 'birthDate' | 'color' | 'marks') => ({
    value: pet[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
  })
  const owner = (key: 'firstName' | 'lastName' | 'address' | 'country' | 'phone' | 'email') => ({
    value: pet.owner[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      // Modifier les informations annule la signature précédente.
      setPet((p) => ({ ...p, owner: { ...p.owner, [key]: e.target.value, signedAt: undefined } })),
  })
  const chip = (key: 'number' | 'tattoo' | 'implantDate' | 'location') => ({
    value: pet.microchip[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setPet((p) => ({ ...p, microchip: { ...p.microchip, [key]: e.target.value } })),
  })

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('photo', await resizePhoto(file))
      setPhotoError('')
    } catch {
      setPhotoError("Impossible de lire cette image.")
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(pet)
      }}
    >
      <h2>
        {SPECIES_EMOJI[pet.species]} {initial.name ? `Modifier ${initial.name}` : `Nouveau profil : ${SPECIES_LABELS[pet.species].toLowerCase()}`}
      </h2>

      <fieldset className="card">
        <legend>Animal</legend>
        <div className="photo-row">
          <div className="photo-preview">{pet.photo ? <img src={pet.photo} alt="" /> : <span>{SPECIES_EMOJI[pet.species]}</span>}</div>
          <Field label="Photo" hint={photoError || 'Une photo récente, de face si possible.'}>
            <input type="file" accept="image/*" onChange={onPhoto} />
          </Field>
        </div>
        <div className="grid">
          <Field label="Nom *">
            <input required {...text('name')} />
          </Field>
          <Field label={isBird ? 'Espèce exacte (ex. perruche ondulée)' : 'Race'}>
            <input {...text('breed')} />
          </Field>
          <Field label="Sexe">
            <select value={pet.sex} onChange={(e) => set('sex', e.target.value as Pet['sex'])}>
              <option value="">—</option>
              <option value="M">Mâle</option>
              <option value="F">Femelle</option>
            </select>
          </Field>
          <Field label="Date de naissance">
            <input type="date" {...text('birthDate')} />
          </Field>
          <Field label={isBird ? 'Couleur / plumage' : 'Couleur / robe'}>
            <input {...text('color')} />
          </Field>
        </div>
        <Field label="Signes particuliers">
          <textarea rows={2} {...text('marks')} />
        </Field>
      </fieldset>

      <fieldset className="card">
        <legend>Identification</legend>
        {isBird && <p className="muted">Pour un oiseau : numéro de bague ou de puce, si l'oiseau en a une.</p>}
        <div className="grid">
          <Field label={isBird ? 'Numéro de bague ou de puce' : 'Numéro de puce (15 chiffres)'}>
            <input inputMode="numeric" {...chip('number')} />
          </Field>
          {!isBird && (
            <Field label="Ou numéro de tatouage" hint="Accepté seulement s'il a été fait avant le 3 juillet 2011 et reste lisible.">
              <input {...chip('tattoo')} />
            </Field>
          )}
          <Field label="Date d'identification">
            <input type="date" {...chip('implantDate')} />
          </Field>
          <Field label="Emplacement">
            <input placeholder="ex. côté gauche du cou" {...chip('location')} />
          </Field>
        </div>
        {!isBird && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={pet.microchip.icadRegistered}
              onChange={(e) => setPet((p) => ({ ...p, microchip: { ...p.microchip, icadRegistered: e.target.checked } }))}
            />
            L'identification est enregistrée au fichier national I-CAD
          </label>
        )}
      </fieldset>

      <fieldset className="card">
        <legend>Propriétaire</legend>
        <div className="grid">
          <Field label="Prénom *">
            <input required {...owner('firstName')} />
          </Field>
          <Field label="Nom *">
            <input required {...owner('lastName')} />
          </Field>
          <Field label="Adresse">
            <input {...owner('address')} />
          </Field>
          <Field label="Pays">
            <input {...owner('country')} />
          </Field>
          <Field label="Téléphone">
            <input type="tel" {...owner('phone')} />
          </Field>
          <Field label="E-mail">
            <input type="email" {...owner('email')} />
          </Field>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={!!pet.owner.signedAt}
            onChange={(e) => setPet((p) => ({ ...p, owner: { ...p.owner, signedAt: e.target.checked ? new Date().toISOString() : undefined } }))}
          />
          Je certifie que ces informations sont exactes (signature du propriétaire)
        </label>
      </fieldset>

      {!isBird && (
        <ListEditor
          title="Vaccination antirabique"
          addLabel="Ajouter une vaccination"
          items={pet.rabies}
          onChange={(v) => set('rabies', v)}
          create={() => ({ id: newId(), date: '', validUntil: '', manufacturer: '', vaccine: '', batch: '', vet: '' })}
          render={(v, update) => (
            <>
              <Field label="Date de vaccination">
                <input type="date" value={v.date} onChange={(e) => update({ date: e.target.value })} />
              </Field>
              <Field label="Valable jusqu'au">
                <input type="date" value={v.validUntil} onChange={(e) => update({ validUntil: e.target.value })} />
              </Field>
              <Field label="Fabricant">
                <input value={v.manufacturer} onChange={(e) => update({ manufacturer: e.target.value })} />
              </Field>
              <Field label="Nom du vaccin">
                <input value={v.vaccine} onChange={(e) => update({ vaccine: e.target.value })} />
              </Field>
              <Field label="Numéro de lot">
                <input value={v.batch} onChange={(e) => update({ batch: e.target.value })} />
              </Field>
              <Field label="Vétérinaire">
                <input value={v.vet} onChange={(e) => update({ vet: e.target.value })} />
              </Field>
            </>
          )}
        />
      )}

      {!isBird && (
        <ListEditor
          title="Titrage antirabique"
          addLabel="Ajouter un titrage"
          items={pet.titerTests}
          onChange={(v) => set('titerTests', v)}
          create={() => ({ id: newId(), sampleDate: '', result: '', lab: '' })}
          render={(t, update) => (
            <>
              <Field label="Date de la prise de sang">
                <input type="date" value={t.sampleDate} onChange={(e) => update({ sampleDate: e.target.value })} />
              </Field>
              <Field label="Résultat (UI/ml)">
                <input inputMode="decimal" value={t.result} onChange={(e) => update({ result: e.target.value })} />
              </Field>
              <Field label="Laboratoire">
                <input value={t.lab} onChange={(e) => update({ lab: e.target.value })} />
              </Field>
            </>
          )}
        />
      )}

      {pet.species === 'dog' && (
        <ListEditor
          title="Traitements contre l'échinococcose (ténia)"
          addLabel="Ajouter un traitement"
          items={pet.tapewormTreatments}
          onChange={(v) => set('tapewormTreatments', v)}
          create={() => ({ id: newId(), dateTime: '', product: '', vet: '' })}
          render={(t, update) => (
            <>
              <Field label="Date et heure">
                <input type="datetime-local" value={t.dateTime} onChange={(e) => update({ dateTime: e.target.value })} />
              </Field>
              <Field label="Produit">
                <input value={t.product} onChange={(e) => update({ product: e.target.value })} />
              </Field>
              <Field label="Vétérinaire">
                <input value={t.vet} onChange={(e) => update({ vet: e.target.value })} />
              </Field>
            </>
          )}
        />
      )}

      <ListEditor
        title="Autres vaccinations"
        addLabel="Ajouter un vaccin"
        items={pet.otherVaccinations}
        onChange={(v) => set('otherVaccinations', v)}
        create={() => ({ id: newId(), date: '', disease: '', vaccine: '', vet: '' })}
        render={(v, update) => (
          <>
            <Field label="Date">
              <input type="date" value={v.date} onChange={(e) => update({ date: e.target.value })} />
            </Field>
            <Field label="Maladie(s)">
              <input placeholder="ex. typhus, coryza" value={v.disease} onChange={(e) => update({ disease: e.target.value })} />
            </Field>
            <Field label="Vaccin">
              <input value={v.vaccine} onChange={(e) => update({ vaccine: e.target.value })} />
            </Field>
            <Field label="Vétérinaire">
              <input value={v.vet} onChange={(e) => update({ vet: e.target.value })} />
            </Field>
          </>
        )}
      />

      <ListEditor
        title="Examens cliniques"
        addLabel="Ajouter un examen"
        items={pet.clinicalExams}
        onChange={(v) => set('clinicalExams', v)}
        create={() => ({ id: newId(), date: '', notes: '', vet: '' })}
        render={(x, update) => (
          <>
            <Field label="Date">
              <input type="date" value={x.date} onChange={(e) => update({ date: e.target.value })} />
            </Field>
            <Field label="Observations">
              <input value={x.notes} onChange={(e) => update({ notes: e.target.value })} />
            </Field>
            <Field label="Vétérinaire">
              <input value={x.vet} onChange={(e) => update({ vet: e.target.value })} />
            </Field>
          </>
        )}
      />

      <div className="actions sticky-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary">
          Enregistrer
        </button>
      </div>
    </form>
  )
}
