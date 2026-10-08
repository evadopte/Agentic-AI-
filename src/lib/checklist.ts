import type { Check, Destination, Requirement } from '../data/destinations'
import type { DocumentType } from '../data/documents'
import type { ReviewStatus } from './files'
import type { Pet, Trip } from '../types'
import { addDays, daysBetween, formatDate, parseDate } from './dates'

export type Status = 'ok' | 'todo' | 'missing' | 'warning' | 'info'

export interface CheckResult {
  status: Status
  message: string
}

export interface ChecklistItem {
  requirement: Requirement
  result: CheckResult
}

const HOUR = 60 * 60 * 1000

function ageInDays(pet: Pet, at: Date): number | null {
  const birth = parseDate(pet.birthDate)
  return birth ? daysBetween(birth, at) : null
}

function sortedRabies(pet: Pet) {
  return pet.rabies
    .filter((v) => parseDate(v.date))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function evaluateCheck(check: Check, pet: Pet, trip: Trip, today: Date = new Date()): CheckResult {
  const arrival = parseDate(trip.arrivalDate)
  if (!arrival) return { status: 'info', message: "Indiquez les dates du voyage pour vérifier cette étape." }

  switch (check.kind) {
    case 'microchip': {
      const n = pet.microchip.number.replace(/\s/g, '')
      if (!n && pet.microchip.tattoo.trim()) {
        const d = parseDate(pet.microchip.implantDate)
        if (d && d < new Date('2011-07-03T00:00:00')) {
          return { status: 'ok', message: `Tatouage ${pet.microchip.tattoo} réalisé avant le 3 juillet 2011 (doit rester lisible).` }
        }
        return { status: 'missing', message: "Un tatouage n'est accepté que s'il a été fait avant le 3 juillet 2011 : une puce est nécessaire." }
      }
      if (!n) return { status: 'missing', message: 'Aucun numéro de puce enregistré.' }
      if (!/^\d{15}$/.test(n)) {
        return { status: 'warning', message: `Le numéro « ${n} » ne fait pas 15 chiffres : vérifiez qu'il s'agit d'une puce ISO.` }
      }
      return { status: 'ok', message: `Puce n° ${n}.` }
    }

    case 'minAge': {
      const age = ageInDays(pet, arrival)
      if (age === null) return { status: 'missing', message: 'Date de naissance manquante.' }
      const minDays = check.weeks * 7
      if (age >= minDays) return { status: 'ok', message: `L'animal aura ${Math.floor(age / 7)} semaines à l'arrivée.` }
      const birth = parseDate(pet.birthDate)!
      return {
        status: 'missing',
        message: `Trop jeune : il faut ${check.weeks} semaines minimum, soit un voyage à partir du ${formatDate(addDays(birth, minDays))}.`,
      }
    }

    case 'rabies': {
      const all = sortedRabies(pet)
      if (all.length === 0) return { status: 'missing', message: 'Aucune vaccination antirabique enregistrée.' }
      const valid = all.filter((v) => {
        const until = parseDate(v.validUntil)
        return until && until >= arrival
      })
      const last = valid.at(-1)
      if (!last) {
        return { status: 'missing', message: `Le dernier vaccin (${formatDate(all.at(-1)!.date)}) ne sera plus valide le jour de l'arrivée.` }
      }
      const date = parseDate(last.date)!
      const chip = parseDate(pet.microchip.implantDate)
      if (chip && date < chip) {
        return { status: 'warning', message: 'Le vaccin a été fait avant la pose de la puce : il doit être refait après.' }
      }
      const birth = parseDate(pet.birthDate)
      if (birth && daysBetween(birth, date) < check.minAgeWeeks * 7) {
        return { status: 'warning', message: `Le vaccin a été fait avant ${check.minAgeWeeks} semaines d'âge : il n'est pas reconnu.` }
      }
      // Un rappel fait avant l'expiration du vaccin précédent est valable tout de suite.
      // Sinon c'est une primovaccination : il faut attendre waitDays jours.
      const previous = all[all.indexOf(last) - 1]
      const previousUntil = previous ? parseDate(previous.validUntil) : null
      const isBooster = previousUntil !== null && previousUntil >= date
      const readyOn = addDays(date, check.waitDays)
      if (!isBooster && check.waitDays > 0 && readyOn > arrival) {
        return {
          status: 'missing',
          message: `Primovaccination du ${formatDate(last.date)} : l'animal ne pourra voyager qu'à partir du ${formatDate(readyOn)} (${check.waitDays} jours après l'injection).`,
        }
      }
      return { status: 'ok', message: `Vaccin du ${formatDate(last.date)}, valide jusqu'au ${formatDate(last.validUntil)}.` }
    }

    case 'rabiesCount': {
      const chip = parseDate(pet.microchip.implantDate)
      const all = sortedRabies(pet).filter((v) => !chip || parseDate(v.date)! >= chip)
      if (all.length < check.count) {
        return { status: 'missing', message: `${all.length} vaccination(s) faite(s) après la puce, ${check.count} nécessaires.` }
      }
      const [a, b] = all.slice(-check.count)
      if (daysBetween(parseDate(a.date)!, parseDate(b.date)!) < check.minIntervalDays) {
        return { status: 'warning', message: `Les deux dernières injections sont espacées de moins de ${check.minIntervalDays} jours.` }
      }
      const until = parseDate(all.at(-1)!.validUntil)
      if (!until || until < arrival) {
        return { status: 'missing', message: "La dernière vaccination ne sera plus valide le jour de l'arrivée." }
      }
      return { status: 'ok', message: `${all.length} vaccinations enregistrées, la dernière valide jusqu'au ${formatDate(until)}.` }
    }

    case 'titer': {
      const latestSampleDate = addDays(arrival, -check.waitDays)
      const tests = pet.titerTests
        .filter((t) => parseDate(t.sampleDate) && Number(t.result.replace(',', '.')) >= check.minResult)
        .sort((a, b) => a.sampleDate.localeCompare(b.sampleDate))
      const ok = tests.find((t) => parseDate(t.sampleDate)! <= latestSampleDate)
      if (ok) return { status: 'ok', message: `Titrage du ${formatDate(ok.sampleDate)} : ${ok.result} UI/ml.` }
      if (tests.length > 0) {
        const t = tests.at(-1)!
        return {
          status: 'warning',
          message: `Titrage valide du ${formatDate(t.sampleDate)}, mais l'arrivée n'est possible qu'à partir du ${formatDate(addDays(parseDate(t.sampleDate)!, check.waitDays))}.`,
        }
      }
      if (latestSampleDate < today) {
        return {
          status: 'missing',
          message: `Trop tard pour cette date : la prise de sang aurait dû être faite avant le ${formatDate(latestSampleDate)}. Arrivée possible au plus tôt le ${formatDate(addDays(today, check.waitDays))}.`,
        }
      }
      return { status: 'todo', message: `Prise de sang à faire au plus tard le ${formatDate(latestSampleDate)}.` }
    }

    case 'tapeworm': {
      // L'heure d'arrivée n'est pas connue : on suppose une arrivée vers midi.
      const arrivalNoon = new Date(arrival.getTime() + 12 * HOUR)
      const windowStart = new Date(arrivalNoon.getTime() - check.maxHours * HOUR)
      const windowEnd = new Date(arrivalNoon.getTime() - check.minHours * HOUR)
      const done = pet.tapewormTreatments.find((t) => {
        const d = parseDate(t.dateTime)
        return d && d >= windowStart && d <= windowEnd
      })
      if (done) return { status: 'ok', message: `Traitement fait le ${formatDate(done.dateTime)}.` }
      return {
        status: 'todo',
        message: `À faire chez le vétérinaire entre le ${formatDate(windowStart)} et le ${formatDate(windowEnd)} (pour une arrivée le ${formatDate(arrival)} vers midi ; à ajuster selon l'heure réelle).`,
      }
    }

    case 'deadline': {
      const by = addDays(arrival, -check.daysBefore)
      if (by < today) return { status: 'warning', message: `${check.label} ${formatDate(by)} : la date est dépassée.` }
      return { status: 'todo', message: `${check.label} ${formatDate(by)}.` }
    }
  }
}

export function requirementsFor(destination: Destination, pet: Pet): Requirement[] {
  return destination.requirements.filter((r) => !r.species || r.species.includes(pet.species))
}

export type DocumentStatuses = Map<DocumentType, ReviewStatus>

function documentOnlyResult(requirement: Requirement, documents: DocumentStatuses): CheckResult {
  if (!requirement.upload) return { status: 'info', message: '' }
  switch (documents.get(requirement.upload)) {
    case 'verified':
      return { status: 'ok', message: 'Document vérifié.' }
    case 'pending':
      return { status: 'todo', message: 'Document téléversé, en attente de vérification.' }
    case 'rejected':
      return { status: 'missing', message: 'Document refusé : téléversez-en un nouveau.' }
    default:
      return { status: 'todo', message: 'Document à téléverser.' }
  }
}

export function buildChecklist(
  destination: Destination,
  pet: Pet,
  trip: Trip,
  documents: DocumentStatuses = new Map(),
  today?: Date,
): ChecklistItem[] {
  return requirementsFor(destination, pet).map((requirement) => {
    const at = requirement.checkAt ?? (requirement.phase === 'return' ? 'return' : 'arrival')
    const checkedTrip = at === 'return' ? { ...trip, arrivalDate: trip.returnDate } : trip
    return {
      requirement,
      result: requirement.check
        ? evaluateCheck(requirement.check, pet, checkedTrip, today)
        : documentOnlyResult(requirement, documents),
    }
  })
}
