import { describe, expect, it } from 'vitest'
import { getDestination } from '../data/destinations'
import { passportReadiness } from '../data/passport'
import { emptyPet } from './storage'
import { buildChecklist, evaluateCheck } from './checklist'
import type { Pet } from '../types'

const today = new Date('2026-10-08T00:00:00')

function dog(overrides: Partial<Pet> = {}): Pet {
  return {
    ...emptyPet('dog'),
    name: 'Rex',
    birthDate: '2025-01-01',
    microchip: { number: '250269812345678', tattoo: '', implantDate: '2025-03-01', location: 'cou', icadRegistered: true },
    rabies: [{ id: 'r1', date: '2025-04-01', validUntil: '2028-04-01', manufacturer: '', vaccine: 'Rabisin', batch: '', vet: '' }],
    ...overrides,
  }
}

const trip = (arrivalDate: string, destinationId = 'eu', returnDate = '') => ({ destinationId, arrivalDate, returnDate })

describe('rabies', () => {
  const check = { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 } as const

  it('accepts a valid vaccine', () => {
    expect(evaluateCheck(check, dog(), trip('2026-11-01'), today).status).toBe('ok')
  })

  it('requires 21 days after a first vaccination', () => {
    const pet = dog({ rabies: [{ id: 'r', date: '2026-10-20', validUntil: '2027-10-20', manufacturer: '', vaccine: '', batch: '', vet: '' }] })
    const r = evaluateCheck(check, pet, trip('2026-11-01'), today)
    expect(r.status).toBe('missing')
    expect(r.message).toContain('10/11/2026')
  })

  it('does not require a wait for a booster given before expiry', () => {
    const pet = dog({
      rabies: [
        { id: 'a', date: '2025-04-01', validUntil: '2026-10-25', manufacturer: '', vaccine: '', batch: '', vet: '' },
        { id: 'b', date: '2026-10-20', validUntil: '2029-10-20', manufacturer: '', vaccine: '', batch: '', vet: '' },
      ],
    })
    expect(evaluateCheck(check, pet, trip('2026-11-01'), today).status).toBe('ok')
  })

  it('flags a vaccine done before the microchip', () => {
    const pet = dog({ microchip: { ...dog().microchip, implantDate: '2025-05-01' } })
    expect(evaluateCheck(check, pet, trip('2026-11-01'), today).status).toBe('warning')
  })
})

describe('tapeworm window', () => {
  it('asks for a treatment 1 to 5 days before arrival', () => {
    const r = evaluateCheck({ kind: 'tapeworm', minHours: 24, maxHours: 120 }, dog(), trip('2026-11-10'), today)
    expect(r.status).toBe('todo')
    expect(r.message).toContain('05/11/2026')
    expect(r.message).toContain('09/11/2026')
  })

  it('accepts a treatment inside the window', () => {
    const pet = dog({ tapewormTreatments: [{ id: 't', dateTime: '2026-11-08T10:00', product: 'Milbemax', vet: '' }] })
    expect(evaluateCheck({ kind: 'tapeworm', minHours: 24, maxHours: 120 }, pet, trip('2026-11-10'), today).status).toBe('ok')
  })
})

describe('minimum age', () => {
  it('blocks a puppy younger than 15 weeks', () => {
    const pet = dog({ birthDate: '2026-09-01' })
    expect(evaluateCheck({ kind: 'minAge', weeks: 15 }, pet, trip('2026-11-01'), today).status).toBe('missing')
  })
})

describe('titer test', () => {
  it('gives the latest sample date for Japan', () => {
    const r = evaluateCheck({ kind: 'titer', minResult: 0.5, waitDays: 180 }, dog(), trip('2027-12-01', 'jp'), today)
    expect(r.status).toBe('todo')
    expect(r.message).toContain('04/06/2027')
  })
})

describe('checklists', () => {
  it('adds the tapeworm treatment for dogs going to the UK, not for cats', () => {
    const gb = getDestination('gb')!
    expect(buildChecklist(gb, dog(), trip('2026-11-01', 'gb')).some((i) => i.requirement.id === 'tapeworm')).toBe(true)
    const cat = { ...dog(), species: 'cat' as const }
    expect(buildChecklist(gb, cat, trip('2026-11-01', 'gb')).some((i) => i.requirement.id === 'tapeworm')).toBe(false)
  })

  it('requires a titer test before leaving for Morocco, checked against departure', () => {
    const items = buildChecklist(getDestination('ma')!, dog(), trip('2026-11-01', 'ma', '2026-11-20'), new Map(), today)
    const titer = items.find((i) => i.requirement.id === 'return-titer')!
    expect(titer.requirement.phase).toBe('return')
    expect(titer.result.status).toBe('todo')
    expect(titer.result.message).toContain('01/11/2026')
  })

  it('uses verification status for document-only steps', () => {
    const items = buildChecklist(getDestination('eu')!, dog(), trip('2026-11-01'), new Map([['eu-passport', 'rejected']]))
    expect(items.find((i) => i.requirement.id === 'eu-passport')!.result.status).toBe('missing')
  })
})

describe('passport readiness', () => {
  it('needs every required document verified', () => {
    const pet = dog({
      sex: 'M',
      photo: 'data:',
      owner: { firstName: 'Eva', lastName: 'D', address: '1 rue', country: 'France', phone: '', email: '', signedAt: '2026-10-08' },
    })
    expect(passportReadiness(pet, new Map([['microchip-certificate', 'verified']])).ready).toBe(false)
    expect(
      passportReadiness(pet, new Map([['microchip-certificate', 'verified'], ['owner-id', 'verified']])).ready,
    ).toBe(true)
  })

  it('does not require a rabies vaccine for the passport itself', () => {
    const pet = dog({ rabies: [] })
    expect(passportReadiness(pet, new Map()).missingFields.join()).not.toContain('rabique')
  })
})
