import type { Pet, Species } from '../types'

const KEY = 'petpass.pets.v1'

export function loadPets(): Pet[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Pet[]) : []
  } catch {
    return []
  }
}

export function savePets(pets: Pet[]): void {
  localStorage.setItem(KEY, JSON.stringify(pets))
}

export function newId(): string {
  return crypto.randomUUID()
}

export function emptyPet(species: Species): Pet {
  return {
    id: newId(),
    species,
    name: '',
    breed: '',
    sex: '',
    birthDate: '',
    color: '',
    marks: '',
    microchip: { number: '', tattoo: '', implantDate: '', location: '', icadRegistered: false },
    owner: { firstName: '', lastName: '', address: '', country: 'France', phone: '', email: '' },
    rabies: [],
    otherVaccinations: [],
    titerTests: [],
    tapewormTreatments: [],
    clinicalExams: [],
    createdAt: new Date().toISOString(),
  }
}
