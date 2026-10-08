import { useEffect, useState } from 'react'
import { PassportTab } from './components/PassportTab'
import { PetForm } from './components/PetForm'
import { SpeciesPicker } from './components/SpeciesPicker'
import { TravelTab } from './components/TravelTab'
import { VetDesk } from './components/VetDesk'
import { deletePetDocuments } from './lib/files'
import { emptyPet, loadPets, savePets } from './lib/storage'
import { SPECIES_EMOJI, SPECIES_LABELS, type Pet } from './types'

type View =
  | { name: 'home' }
  | { name: 'pick' }
  | { name: 'form'; pet: Pet }
  | { name: 'pet'; petId: string; tab: 'passport' | 'travel' }
  | { name: 'vet' }

export default function App() {
  const [pets, setPets] = useState<Pet[]>(loadPets)
  const [view, setView] = useState<View>({ name: 'home' })

  useEffect(() => savePets(pets), [pets])

  function upsert(pet: Pet) {
    setPets((list) => (list.some((p) => p.id === pet.id) ? list.map((p) => (p.id === pet.id ? pet : p)) : [...list, pet]))
  }

  async function remove(pet: Pet) {
    if (!confirm(`Supprimer le profil de ${pet.name || 'cet animal'} et tous ses documents ?`)) return
    await deletePetDocuments(pet.id)
    setPets((list) => list.filter((p) => p.id !== pet.id))
    setView({ name: 'home' })
  }

  const current = view.name === 'pet' ? pets.find((p) => p.id === view.petId) : undefined

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView({ name: 'home' })}>
          🐾 PetPass
        </button>
        <nav>
          <button className={view.name !== 'vet' ? 'active' : ''} onClick={() => setView({ name: 'home' })}>
            Mes animaux
          </button>
          <button className={view.name === 'vet' ? 'active' : ''} onClick={() => setView({ name: 'vet' })}>
            Espace vétérinaire
          </button>
        </nav>
      </header>

      <main>
        {view.name === 'home' && (
          <div className="stack">
            <section className="hero">
              <h1>Le passeport numérique de votre animal</h1>
              <p>Créez son profil, faites vérifier ses documents, et sachez exactement quoi préparer avant chaque voyage.</p>
              <button className="btn-primary" onClick={() => setView({ name: 'pick' })}>
                + Ajouter un animal
              </button>
            </section>
            {pets.length > 0 && (
              <div className="pet-grid">
                {pets.map((p) => (
                  <button key={p.id} className="pet-card" onClick={() => setView({ name: 'pet', petId: p.id, tab: 'passport' })}>
                    <div className="pet-avatar">{p.photo ? <img src={p.photo} alt="" /> : SPECIES_EMOJI[p.species]}</div>
                    <div>
                      <strong>{p.name || 'Sans nom'}</strong>
                      <span className="muted small">
                        {SPECIES_LABELS[p.species]}
                        {p.breed && ` · ${p.breed}`}
                      </span>
                      <span className={`badge ${p.passport ? 'badge-ok' : 'badge-todo'}`}>
                        {p.passport ? 'Passeport délivré' : 'Passeport en cours'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view.name === 'pick' && (
          <SpeciesPicker onPick={(s) => setView({ name: 'form', pet: emptyPet(s) })} onCancel={() => setView({ name: 'home' })} />
        )}

        {view.name === 'form' && (
          <PetForm
            key={view.pet.id}
            initial={view.pet}
            onCancel={() =>
              setView(pets.some((p) => p.id === view.pet.id) ? { name: 'pet', petId: view.pet.id, tab: 'passport' } : { name: 'home' })
            }
            onSave={(pet) => {
              upsert(pet)
              setView({ name: 'pet', petId: pet.id, tab: 'passport' })
            }}
          />
        )}

        {view.name === 'pet' && current && (
          <div className="stack">
            <div className="pet-header">
              <div className="pet-avatar large">{current.photo ? <img src={current.photo} alt="" /> : SPECIES_EMOJI[current.species]}</div>
              <div>
                <h2>{current.name || 'Sans nom'}</h2>
                <p className="muted">
                  {SPECIES_LABELS[current.species]}
                  {current.breed && ` · ${current.breed}`}
                </p>
              </div>
              <div className="pet-header-actions">
                <button className="btn-secondary small" onClick={() => setView({ name: 'form', pet: current })}>
                  Modifier
                </button>
                <button className="btn-link danger small" onClick={() => remove(current)}>
                  Supprimer
                </button>
              </div>
            </div>
            <div className="tabs" role="tablist">
              <button className={view.tab === 'passport' ? 'active' : ''} onClick={() => setView({ ...view, tab: 'passport' })}>
                🛂 Passeport
              </button>
              <button className={view.tab === 'travel' ? 'active' : ''} onClick={() => setView({ ...view, tab: 'travel' })}>
                ✈️ Voyager
              </button>
            </div>
            {view.tab === 'passport' ? (
              <PassportTab pet={current} onEdit={() => setView({ name: 'form', pet: current })} />
            ) : (
              <TravelTab key={current.id} pet={current} />
            )}
          </div>
        )}

        {view.name === 'vet' && <VetDesk pets={pets} onUpdatePet={upsert} />}
      </main>

      <footer className="app-footer muted small">
        PetPass est une démonstration : les données restent dans ce navigateur. Le passeport affiché n'est pas un document officiel.
      </footer>
    </div>
  )
}
