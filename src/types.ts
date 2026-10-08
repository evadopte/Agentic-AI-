export type Species = 'dog' | 'cat' | 'ferret' | 'bird'

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Chien',
  cat: 'Chat',
  ferret: 'Furet',
  bird: 'Oiseau',
}

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: '🐶',
  cat: '🐱',
  ferret: '🦦',
  bird: '🐦',
}

export interface Owner {
  firstName: string
  lastName: string
  address: string
  country: string
  phone: string
  email: string
  /** Date à laquelle le propriétaire a signé (attesté) les informations */
  signedAt?: string
}

export interface Microchip {
  number: string
  /** Tatouage (accepté seulement s'il a été fait avant le 3 juillet 2011) */
  tattoo: string
  /** Date de pose de la puce ou du tatouage */
  implantDate: string
  location: string
  /** Enregistrement au fichier national I-CAD (France) */
  icadRegistered: boolean
}

export interface RabiesVaccination {
  id: string
  date: string
  validUntil: string
  manufacturer: string
  vaccine: string
  batch: string
  vet: string
}

export interface OtherVaccination {
  id: string
  date: string
  disease: string
  vaccine: string
  vet: string
}

export interface ClinicalExam {
  id: string
  date: string
  notes: string
  vet: string
}

export interface TiterTest {
  id: string
  sampleDate: string
  /** Résultat en UI/ml */
  result: string
  lab: string
}

export interface ParasiteTreatment {
  id: string
  /** Date et heure du traitement (datetime-local) */
  dateTime: string
  product: string
  vet: string
}

export interface Pet {
  id: string
  species: Species
  name: string
  breed: string
  sex: 'M' | 'F' | ''
  birthDate: string
  color: string
  marks: string
  photo?: string
  microchip: Microchip
  owner: Owner
  rabies: RabiesVaccination[]
  otherVaccinations: OtherVaccination[]
  titerTests: TiterTest[]
  tapewormTreatments: ParasiteTreatment[]
  clinicalExams: ClinicalExam[]
  passport?: IssuedPassport
  createdAt: string
}

export interface Veterinarian {
  name: string
  address: string
  contact: string
  /** Numéro d'inscription à l'Ordre des vétérinaires */
  ordinal: string
}

export interface IssuedPassport {
  number: string
  issuedAt: string
  vet: Veterinarian
}

export interface Trip {
  destinationId: string
  /** Date d'arrivée prévue (YYYY-MM-DD) */
  arrivalDate: string
  /** Date de retour en France prévue (YYYY-MM-DD), pays hors UE */
  returnDate: string
}
