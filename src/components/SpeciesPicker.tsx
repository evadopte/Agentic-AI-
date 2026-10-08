import { SPECIES_EMOJI, SPECIES_LABELS, type Species } from '../types'

const ALL: Species[] = ['dog', 'cat', 'ferret', 'bird']

export function SpeciesPicker({ onPick, onCancel }: { onPick: (s: Species) => void; onCancel: () => void }) {
  return (
    <section className="card">
      <h2>Quel animal voulez-vous ajouter ?</h2>
      <div className="species-grid">
        {ALL.map((s) => (
          <button key={s} className="species-tile" onClick={() => onPick(s)}>
            <span className="species-emoji">{SPECIES_EMOJI[s]}</span>
            {SPECIES_LABELS[s]}
          </button>
        ))}
      </div>
      <button className="btn-link" onClick={onCancel}>
        Annuler
      </button>
    </section>
  )
}
