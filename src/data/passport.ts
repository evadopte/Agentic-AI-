import type { Pet, Species } from '../types'
import type { DocumentType } from './documents'

/** Documents à fournir (et à faire vérifier) pour obtenir le passeport numérique. */
export const PASSPORT_DOCUMENTS: Record<Species, DocumentType[]> = {
  dog: ['microchip-certificate', 'owner-id'],
  cat: ['microchip-certificate', 'owner-id'],
  ferret: ['microchip-certificate', 'owner-id'],
  bird: ['health-certificate', 'owner-id'],
}

/** Documents conseillés mais non bloquants pour le passeport. */
export const PASSPORT_OPTIONAL_DOCUMENTS: Record<Species, { type: DocumentType; why: string }[]> = {
  dog: [{ type: 'rabies-certificate', why: "Nécessaire pour voyager dans l'UE, pas pour obtenir le passeport." }],
  cat: [{ type: 'rabies-certificate', why: "Nécessaire pour voyager dans l'UE, pas pour obtenir le passeport." }],
  ferret: [{ type: 'rabies-certificate', why: "Nécessaire pour voyager dans l'UE, pas pour obtenir le passeport." }],
  bird: [],
}

/** Conditions d'obtention du passeport (France), affichées à l'utilisateur. */
export const PASSPORT_CONDITIONS: { label: string; required: string; detail: string }[] = [
  { label: 'Identification par puce électronique', required: 'Oui', detail: "L'animal doit être identifié. Certains tatouages réalisés avant le 3 juillet 2011 sont acceptés s'ils sont lisibles." },
  { label: 'Enregistrement I-CAD', required: 'Oui, en France', detail: "L'identification doit être enregistrée dans le fichier national." },
  { label: 'Vaccination antirabique', required: "Pour voyager dans l'UE", detail: "L'animal doit être identifié avant la vaccination contre la rage. Après une première vaccination, il faut attendre au moins 21 jours avant de voyager." },
  { label: 'Âge minimum', required: 'Variable', detail: 'Le passeport peut être délivré jeune, mais la première vaccination antirabique se fait à partir de 12 semaines (voyage possible vers 15 semaines).' },
  { label: 'Consultation vétérinaire', required: 'Oui', detail: 'Seul un vétérinaire habilité peut délivrer le passeport.' },
  { label: 'Stérilisation', required: 'Non', detail: "Elle n'est pas nécessaire." },
  { label: 'Vaccins classiques (typhus, coryza…)', required: 'Non', detail: 'Recommandés selon l’animal, mais pas obligatoires pour obtenir le passeport.' },
]

/** Champs du profil indispensables avant de demander le passeport. */
export function missingPassportFields(pet: Pet): string[] {
  const missing: string[] = []
  if (!pet.name.trim()) missing.push("le nom de l'animal")
  if (!pet.birthDate) missing.push('la date de naissance')
  if (!pet.sex) missing.push('le sexe')
  if (!pet.photo) missing.push('une photo')
  if (!pet.owner.firstName.trim() || !pet.owner.lastName.trim()) missing.push('le nom et prénom du propriétaire')
  if (!pet.owner.address.trim()) missing.push("l'adresse du propriétaire")
  if (!pet.owner.signedAt) missing.push('la signature du propriétaire')
  if (pet.species !== 'bird') {
    if (!pet.microchip.number.trim() && !pet.microchip.tattoo.trim()) missing.push('le numéro de puce (ou de tatouage)')
    if (!pet.microchip.implantDate) missing.push("la date d'identification")
    if (!pet.microchip.icadRegistered) missing.push("l'enregistrement I-CAD")
  }
  return missing
}

export interface PassportReadiness {
  missingFields: string[]
  required: DocumentType[]
  verified: number
  pending: number
  rejected: number
  missingDocs: number
  /** Tous les champs sont remplis et tous les documents requis sont vérifiés */
  ready: boolean
}

export function passportReadiness(pet: Pet, statuses: Map<DocumentType, 'pending' | 'verified' | 'rejected'>): PassportReadiness {
  const required = PASSPORT_DOCUMENTS[pet.species]
  const missingFields = missingPassportFields(pet)
  const count = (s: string) => required.filter((t) => statuses.get(t) === s).length
  const verified = count('verified')
  return {
    missingFields,
    required,
    verified,
    pending: count('pending'),
    rejected: count('rejected'),
    missingDocs: required.filter((t) => !statuses.has(t)).length,
    ready: missingFields.length === 0 && verified === required.length,
  }
}

/** Numéro de passeport de démonstration : code pays + 9 chiffres. */
export function generatePassportNumber(): string {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b % 10).join('')
  return `FR${digits}`
}
