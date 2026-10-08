import type { Species } from '../types'
import type { DocumentType } from './documents'

/**
 * Vérifications automatiques à partir des données de l'animal.
 * Voir src/lib/checklist.ts pour leur évaluation.
 */
export type Check =
  | { kind: 'microchip' }
  | { kind: 'rabies'; waitDays: number; minAgeWeeks: number }
  | { kind: 'minAge'; weeks: number }
  | { kind: 'tapeworm'; minHours: number; maxHours: number }
  | { kind: 'titer'; minResult: number; waitDays: number }
  | { kind: 'deadline'; daysBefore: number; label: string }
  | { kind: 'rabiesCount'; count: number; minIntervalDays: number }

/** Entrée dans le pays, ou retour en France / dans l'UE. */
export type Phase = 'entry' | 'return'

export interface Requirement {
  id: string
  /** 'entry' par défaut */
  phase?: Phase
  title: string
  details: string
  /** Espèces concernées (toutes si absent) */
  species?: Species[]
  /** Document à téléverser pour cette étape */
  upload?: DocumentType
  /** Doit être fait par un vétérinaire */
  vet?: boolean
  check?: Check
  /** Date utilisée pour la vérification (par défaut : arrivée pour 'entry', retour pour 'return') */
  checkAt?: 'arrival' | 'return'
}

export interface Destination {
  id: string
  name: string
  flag: string
  summary: string
  sources: { label: string; url: string }[]
  /** Espèces dont l'entrée n'est pas possible / pas couverte par l'app */
  notAllowed?: Partial<Record<Species, string>>
  /** Races interdites, quarantaine, transport… */
  restrictions?: string[]
  /** Pays hors UE : statut pour le retour (voir RETURN_*) */
  outsideEu?: boolean
  requirements: Requirement[]
}

/** Date de dernière vérification des règles. */
export const RULES_CHECKED_ON = '2026-10-08'

const CARNIVORES: Species[] = ['dog', 'cat', 'ferret']

/** Socle commun UE (règlement (UE) n° 576/2013) pour chiens, chats et furets. */
const EU_BASE: Requirement[] = [
  {
    id: 'microchip',
    title: 'Identification par puce électronique',
    details:
      "Puce conforme à la norme ISO 11784/11785 (15 chiffres), implantée avant ou le même jour que la vaccination antirabique. Un tatouage lisible fait avant le 3 juillet 2011 reste accepté.",
    species: CARNIVORES,
    upload: 'microchip-certificate',
    vet: true,
    check: { kind: 'microchip' },
  },
  {
    id: 'rabies',
    title: 'Vaccination antirabique valide',
    details:
      "Vaccin fait à partir de 12 semaines, après la pose de la puce. Pour une primovaccination, attendre 21 jours avant le voyage. Les rappels faits avant la date d'expiration ne nécessitent pas de nouvelle attente.",
    species: CARNIVORES,
    upload: 'rabies-certificate',
    vet: true,
    check: { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 },
  },
  {
    id: 'eu-passport',
    title: 'Passeport européen pour animal de compagnie',
    details:
      "Délivré uniquement par un vétérinaire habilité. Il doit mentionner l'identification et la vaccination antirabique en cours de validité.",
    species: CARNIVORES,
    upload: 'eu-passport',
    vet: true,
  },
  {
    id: 'min-age',
    title: 'Âge minimum : 15 semaines',
    details:
      "Conséquence des 12 semaines minimum pour le vaccin + 21 jours d'attente. Certains pays acceptent des animaux plus jeunes sous conditions, mais pas la majorité.",
    species: CARNIVORES,
    check: { kind: 'minAge', weeks: 15 },
  },
]

const TAPEWORM: Requirement = {
  id: 'tapeworm',
  title: 'Traitement contre le ténia (Echinococcus multilocularis)',
  details:
    "Chiens uniquement. Un vétérinaire administre un traitement à base de praziquantel entre 24 h et 120 h (1 à 5 jours) avant l'arrivée, et l'inscrit dans le passeport.",
  species: ['dog'],
  upload: 'tapeworm-certificate',
  vet: true,
  check: { kind: 'tapeworm', minHours: 24, maxHours: 120 },
}

const BIRD_EU: Requirement[] = [
  {
    id: 'bird-health',
    title: 'Certificat sanitaire vétérinaire',
    details:
      "Les oiseaux ne sont pas couverts par le passeport européen. Un certificat de bonne santé récent est recommandé (et souvent exigé par la compagnie de transport). Les règles nationales et les restrictions liées à l'influenza aviaire peuvent s'appliquer.",
    species: ['bird'],
    upload: 'health-certificate',
    vet: true,
  },
  {
    id: 'bird-cites',
    title: 'Vérifier le statut CITES de l’espèce',
    details:
      "Beaucoup de perroquets (ex. gris du Gabon, aras) sont protégés : un permis ou un certificat CITES peut être nécessaire même pour un animal de compagnie.",
    species: ['bird'],
    upload: 'cites-permit',
  },
]

const HEALTH_CERT_EXPADON: Requirement = {
  id: 'export-certificate',
  title: "Certificat sanitaire d'exportation",
  details:
    "Rempli par le vétérinaire peu avant le départ, puis visé si besoin par les services vétérinaires officiels (DDPP) via la démarche en ligne Expadon.",
  species: CARNIVORES,
  upload: 'health-certificate',
  vet: true,
}

/**
 * Retour dans l'UE depuis un pays « listé » (annexe II du règlement (UE) n° 577/2013) :
 * pas de titrage, mais puce + vaccin antirabique valide + passeport.
 */
const RETURN_LISTED: Requirement[] = [
  {
    id: 'return-rabies',
    phase: 'return',
    title: 'Vaccin antirabique valide le jour du retour',
    details: "Vérifiez que le vaccin n'expire pas pendant le séjour. Sinon, faites le rappel avant de partir.",
    species: CARNIVORES,
    check: { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 },
  },
  {
    id: 'return-passport',
    phase: 'return',
    title: 'Passeport européen à jour',
    details: "Le passeport européen (puce + vaccin antirabique) suffit pour revenir en France depuis ce pays.",
    species: CARNIVORES,
    upload: 'eu-passport',
  },
]

/** Retour depuis un pays non listé : titrage antirabique obligatoire, à faire avant de quitter l'UE. */
const RETURN_UNLISTED: Requirement[] = [
  ...RETURN_LISTED,
  {
    id: 'return-titer',
    phase: 'return',
    title: "Titrage antirabique AVANT de quitter l'UE",
    details:
      "Pays non listé par l'UE : une prise de sang (au moins 30 jours après la vaccination, résultat ≥ 0,5 UI/ml) est obligatoire pour revenir. Faite avant le départ, elle évite d'attendre 3 mois avant de pouvoir rentrer.",
    species: CARNIVORES,
    upload: 'titer-result',
    vet: true,
    check: { kind: 'titer', minResult: 0.5, waitDays: 0 },
    checkAt: 'arrival',
  },
]

export const DESTINATIONS: Destination[] = [
  {
    id: 'eu',
    name: 'Autre pays de l’UE (Espagne, Italie, Allemagne…)',
    flag: '🇪🇺',
    summary:
      "Voyage entre pays de l'Union européenne : puce, vaccin antirabique valide et passeport européen suffisent pour les chiens, chats et furets.",
    sources: [
      { label: 'Commission européenne – Voyager avec un animal', url: 'https://food.ec.europa.eu/animals/movement-pets_en' },
      { label: 'Ministère de l’Agriculture – Voyager avec son animal', url: 'https://agriculture.gouv.fr/voyager-avec-son-animal-de-compagnie' },
    ],
    requirements: [...EU_BASE, ...BIRD_EU],
  },
  {
    id: 'ie-fi-mt-no',
    name: 'Irlande, Finlande, Malte ou Norvège',
    flag: '🇮🇪',
    summary:
      'Mêmes règles que dans l’UE, avec en plus un traitement contre le ténia obligatoire pour les chiens.',
    sources: [
      { label: 'Commission européenne – Voyager avec un animal', url: 'https://food.ec.europa.eu/animals/movement-pets_en' },
    ],
    requirements: [...EU_BASE, TAPEWORM, ...BIRD_EU],
  },
  {
    id: 'ch',
    name: 'Suisse',
    flag: '🇨🇭',
    summary: 'La Suisse applique les mêmes règles que l’UE : le passeport européen est accepté.',
    sources: [
      { label: 'OSAV – Voyager avec des animaux de compagnie', url: 'https://www.blv.admin.ch/blv/fr/home/tiere/reisen-mit-heimtieren.html' },
    ],
    requirements: [...EU_BASE, ...BIRD_EU],
  },
  {
    id: 'gb',
    outsideEu: true,
    name: 'Royaume-Uni (Grande-Bretagne)',
    flag: '🇬🇧',
    summary:
      "Le passeport européen délivré dans l'UE est accepté. Les chiens doivent recevoir un traitement contre le ténia 1 à 5 jours avant l'arrivée. Le voyage doit se faire par une route et un transporteur agréés.",
    sources: [
      { label: 'GOV.UK – Bring your pet to Great Britain', url: 'https://www.gov.uk/bring-pet-to-great-britain' },
    ],
    requirements: [
      ...EU_BASE,
      TAPEWORM,
      {
        id: 'bird-gb',
        title: 'Déclaration et certificat pour oiseau',
        details:
          "Les oiseaux de compagnie entrant en Grande-Bretagne doivent avoir un certificat sanitaire et parfois être déclarés ou mis en quarantaine selon la situation de l'influenza aviaire.",
        species: ['bird'],
        upload: 'health-certificate',
        vet: true,
      },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'us',
    outsideEu: true,
    name: 'États-Unis',
    flag: '🇺🇸',
    summary:
      "Pour les chiens venant de France : au moins 6 mois, puce ISO et formulaire CDC Dog Import Form en ligne. Les chats n'ont pas d'exigence fédérale, mais certains États et compagnies aériennes demandent le vaccin antirabique.",
    sources: [
      { label: 'CDC – Bringing a dog into the United States', url: 'https://www.cdc.gov/importation/dogs/' },
      { label: 'USDA APHIS – Pet travel', url: 'https://www.aphis.usda.gov/pet-travel' },
      { label: 'Expadon – Certificats d’exportation (service-public)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R18010' },
    ],
    notAllowed: {
      bird:
        "L'importation d'oiseaux de compagnie aux États-Unis demande un permis USDA et une quarantaine de 30 jours. Contactez l'USDA APHIS avant tout projet.",
    },
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: "Puce compatible ISO, implantée avant l'arrivée. Le numéro doit figurer sur tous les documents.",
        species: ['dog'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'us-history',
        title: 'Pays visités pendant les 6 derniers mois',
        details:
          "Les règles simples ci-dessus valent pour un chien qui n'a séjourné que dans des pays à faible risque rabique (comme la France) pendant les 6 derniers mois. S'il est passé par un pays à haut risque, des exigences supplémentaires s'appliquent (certificat, titrage, port d'entrée imposé).",
        species: ['dog'],
      },
      {
        id: 'us-age',
        title: 'Âge minimum : 6 mois',
        details: 'Tous les chiens entrant aux États-Unis doivent avoir au moins 6 mois.',
        species: ['dog'],
        check: { kind: 'minAge', weeks: 26 },
      },
      {
        id: 'cdc-form',
        title: 'CDC Dog Import Form',
        details:
          "Formulaire gratuit à remplir en ligne, idéalement 2 à 10 jours avant l'arrivée, avec une photo récente du chien. Gardez le reçu pour le contrôle.",
        species: ['dog'],
        upload: 'cdc-receipt',
        check: { kind: 'deadline', daysBefore: 2, label: 'Remplir le formulaire au plus tard le' },
      },
      {
        id: 'us-rabies',
        title: 'Vaccin antirabique (recommandé)',
        details:
          "Pas exigé au niveau fédéral pour un chien venant de France, mais demandé par de nombreux États et compagnies aériennes. Obligatoire pour revenir dans l'UE.",
        species: CARNIVORES,
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 },
      },
      {
        id: 'us-ferret',
        title: 'Vérifier les règles de l’État de destination',
        details:
          "Les furets sont interdits dans certains États (Californie, Hawaï) et dans plusieurs villes. Vérifiez auprès de l'État avant de partir.",
        species: ['ferret'],
      },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'ca',
    outsideEu: true,
    name: 'Canada',
    flag: '🇨🇦',
    summary:
      'Chiens, chats et furets de plus de 3 mois : certificat de vaccination antirabique valide, en français ou en anglais.',
    sources: [
      { label: 'ACIA – Voyager avec un animal de compagnie', url: 'https://inspection.canada.ca/fr/importation-aliments-vegetaux-animaux/animaux-compagnie' },
    ],
    notAllowed: {
      bird:
        "Les oiseaux de compagnie peuvent entrer au Canada sous conditions (propriétaire présent, certificat, parfois permis). Contactez l'ACIA avant de partir.",
    },
    requirements: [
      {
        id: 'ca-rabies',
        title: 'Certificat de vaccination antirabique',
        details:
          "Obligatoire pour les animaux de 3 mois et plus. Le certificat doit indiquer l'animal (race, couleur, poids), le vaccin, la date et la durée de validité, signé par un vétérinaire.",
        species: CARNIVORES,
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 0, minAgeWeeks: 12 },
      },
      {
        id: 'microchip',
        title: 'Puce électronique (recommandée)',
        details: "Non exigée par le Canada, mais indispensable pour revenir dans l'UE.",
        species: CARNIVORES,
        check: { kind: 'microchip' },
      },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'jp',
    outsideEu: true,
    name: 'Japon',
    flag: '🇯🇵',
    summary:
      "Procédure longue : il faut s'y prendre au moins 7 mois à l'avance (2 vaccins antirabiques, titrage d'anticorps puis 180 jours d'attente, notification 40 jours avant).",
    sources: [
      { label: 'MAFF – Importing dogs and cats into Japan', url: 'https://www.maff.go.jp/aqs/english/animal/dog/import-other.html' },
    ],
    notAllowed: {
      ferret:
        "Les furets suivent une procédure différente (quarantaine, certificat spécifique). Contactez le service de quarantaine animale japonais (AQS).",
      bird: "Les oiseaux nécessitent un certificat sanitaire spécifique et une inspection à l'arrivée. Contactez l'AQS.",
    },
    restrictions: [
      "Si toutes les conditions ne sont pas remplies, l'animal peut être placé en quarantaine jusqu'à 180 jours à l'arrivée.",
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: 'Implantée avant la première vaccination antirabique.',
        species: ['dog', 'cat'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'jp-rabies',
        title: 'Deux vaccinations antirabiques',
        details:
          "Deux injections faites après la puce, à au moins 30 jours d'intervalle, la première à partir de 91 jours d'âge. La dernière doit être valide le jour de l'arrivée.",
        species: ['dog', 'cat'],
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabiesCount', count: 2, minIntervalDays: 30 },
      },
      {
        id: 'jp-titer',
        title: 'Titrage des anticorps + 180 jours d’attente',
        details:
          "Prise de sang analysée par un laboratoire agréé (résultat ≥ 0,5 UI/ml). L'animal ne peut arriver au Japon que 180 jours après la prise de sang.",
        species: ['dog', 'cat'],
        upload: 'titer-result',
        vet: true,
        check: { kind: 'titer', minResult: 0.5, waitDays: 180 },
      },
      {
        id: 'jp-notice',
        title: 'Notification préalable au service de quarantaine',
        details: "À envoyer à l'Animal Quarantine Service (en ligne via NACCS) au moins 40 jours avant l'arrivée.",
        species: ['dog', 'cat'],
        upload: 'advance-notice',
        check: { kind: 'deadline', daysBefore: 40, label: 'Notifier au plus tard le' },
      },
      {
        id: 'jp-certificate',
        title: 'Certificat sanitaire visé par la DDPP',
        details:
          "Certificat rempli par le vétérinaire peu avant le départ, puis visé par les services vétérinaires officiels (DDPP).",
        species: ['dog', 'cat'],
        upload: 'health-certificate',
        vet: true,
      },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'au',
    outsideEu: true,
    name: 'Australie',
    flag: '🇦🇺',
    summary:
      "L'une des destinations les plus strictes : permis d'importation, titrage d'anticorps, traitements antiparasitaires et 10 jours minimum de quarantaine à Melbourne. Comptez au moins 6 mois de préparation.",
    sources: [
      { label: 'Department of Agriculture – Cats and dogs', url: 'https://www.agriculture.gov.au/biosecurity-trade/cats-dogs' },
    ],
    notAllowed: {
      ferret: "L'importation de furets en Australie est interdite.",
      bird: "L'importation d'oiseaux de compagnie en Australie n'est pas autorisée depuis la France.",
    },
    restrictions: [
      'Quarantaine de 10 jours minimum à la station de Mickleham (Melbourne), à réserver à l’avance.',
      'Certaines races de chiens sont interdites (ex. Dogo Argentino, Fila Brasileiro, Tosa japonais, American Pit Bull Terrier).',
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: 'Lisible et implantée avant la vaccination antirabique.',
        species: ['dog', 'cat'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'au-rabies',
        title: 'Vaccination antirabique valide',
        details: 'Doit être valide au moment de la prise de sang pour le titrage et le jour du départ.',
        species: ['dog', 'cat'],
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 0, minAgeWeeks: 12 },
      },
      {
        id: 'au-titer',
        title: 'Titrage des anticorps (RNATT) + 180 jours',
        details:
          "Prise de sang par un vétérinaire officiel, analysée par un laboratoire agréé (≥ 0,5 UI/ml). L'animal peut entrer 180 jours après la prise de sang.",
        species: ['dog', 'cat'],
        upload: 'titer-result',
        vet: true,
        check: { kind: 'titer', minResult: 0.5, waitDays: 180 },
      },
      {
        id: 'au-permit',
        title: "Permis d'importation (BICON)",
        details: "À demander en ligne une fois le titrage obtenu, et à réserver avec une place en quarantaine à Mickleham.",
        species: ['dog', 'cat'],
        upload: 'import-permit',
      },
      {
        id: 'au-certificate',
        title: 'Certificat sanitaire officiel et traitements',
        details:
          'Examens et traitements antiparasitaires dans les jours précédant le départ (plus des tests sanguins pour les chiens), certifiés par un vétérinaire officiel.',
        species: ['dog', 'cat'],
        upload: 'health-certificate',
        vet: true,
      },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'nz',
    outsideEu: true,
    name: 'Nouvelle-Zélande',
    flag: '🇳🇿',
    summary:
      "Procédure stricte pour les chiens et chats : pays d'origine admissible, permis d'importation, titrage, examens sanitaires et quarantaine d'au moins 10 jours.",
    sources: [
      { label: 'MPI – Bringing pets to New Zealand', url: 'https://www.mpi.govt.nz/bring-send-to-nz/pets-travelling-to-nz/' },
    ],
    notAllowed: {
      ferret: "L'importation de furets en Nouvelle-Zélande est interdite.",
      bird: "L'importation d'oiseaux de compagnie n'est en pratique possible que depuis l'Australie. Contactez le MPI.",
    },
    restrictions: [
      'Quarantaine de 10 jours minimum dans une station agréée.',
      'Certaines races de chiens sont interdites (ex. American Pit Bull Terrier, Dogo Argentino, Fila Brasileiro, Tosa japonais).',
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: 'Implantée avant la vaccination antirabique et le titrage.',
        species: ['dog', 'cat'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'nz-rabies',
        title: 'Vaccination antirabique valide',
        details: 'Valide au moment de la prise de sang et pendant tout le voyage.',
        species: ['dog', 'cat'],
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 0, minAgeWeeks: 12 },
      },
      {
        id: 'nz-titer',
        title: 'Titrage antirabique (≥ 0,5 UI/ml)',
        details: "Prise de sang analysée par un laboratoire agréé. Un délai d'attente s'applique avant l'entrée : vérifiez-le auprès du MPI.",
        species: ['dog', 'cat'],
        upload: 'titer-result',
        vet: true,
        check: { kind: 'titer', minResult: 0.5, waitDays: 0 },
      },
      {
        id: 'nz-permit',
        title: "Permis d'importation (MPI)",
        details: 'À demander au ministère des Industries primaires et à combiner avec la réservation en quarantaine.',
        species: ['dog', 'cat'],
        upload: 'import-permit',
      },
      { ...HEALTH_CERT_EXPADON, species: ['dog', 'cat'] },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'ae',
    outsideEu: true,
    name: 'Émirats arabes unis',
    flag: '🇦🇪',
    summary:
      "Permis d'importation obligatoire, identification, vaccinations et documents sanitaires. Les exigences (dont le titrage) dépendent de la classification du pays d'origine par les autorités émiriennes.",
    sources: [
      { label: 'MOCCAE – Ministère du Changement climatique et de l’Environnement', url: 'https://www.moccae.gov.ae' },
      { label: 'Expadon – Certificats d’exportation (service-public)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R18010' },
    ],
    restrictions: [
      'Plusieurs races de chiens sont interdites (ex. Pit Bull, Mastiff, Rottweiler… liste à vérifier).',
      'Âge minimum généralement de 15 semaines.',
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: 'Obligatoire, lisible avec un lecteur standard.',
        species: ['dog', 'cat'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'ae-age',
        title: 'Âge minimum : 15 semaines',
        details: "Les animaux plus jeunes ne sont généralement pas acceptés.",
        species: ['dog', 'cat'],
        check: { kind: 'minAge', weeks: 15 },
      },
      {
        id: 'ae-rabies',
        title: 'Vaccination antirabique',
        details: 'Faite au moins 21 jours avant le départ et toujours valide. Les autres vaccins habituels (CHPPiL pour les chiens, typhus/coryza pour les chats) sont aussi demandés.',
        species: ['dog', 'cat'],
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 },
      },
      {
        id: 'ae-titer',
        title: 'Titrage antirabique (selon le pays d’origine)',
        details: "Exigé ou non selon la classification de la France par le MOCCAE au moment du voyage : à confirmer lors de la demande de permis.",
        species: ['dog', 'cat'],
        upload: 'titer-result',
      },
      {
        id: 'ae-permit',
        title: "Permis d'importation (MOCCAE)",
        details: 'À demander en ligne avant le départ ; il a une durée de validité limitée.',
        species: ['dog', 'cat'],
        upload: 'import-permit',
      },
      { ...HEALTH_CERT_EXPADON, species: ['dog', 'cat'] },
      ...RETURN_LISTED,
    ],
  },
  {
    id: 'ma',
    outsideEu: true,
    name: 'Maroc',
    flag: '🇲🇦',
    summary:
      "Identification, vaccination antirabique et certificat sanitaire conforme. Attention : le Maroc n'est pas un pays « listé » par l'UE, il faut un titrage antirabique pour revenir.",
    sources: [
      { label: 'ONSSA – Office national de sécurité sanitaire des produits alimentaires', url: 'https://www.onssa.gov.ma' },
      { label: 'Expadon – Certificats d’exportation (service-public)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R18010' },
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Identification (puce)',
        details: 'Puce électronique lisible, mentionnée sur les certificats.',
        species: CARNIVORES,
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'ma-rabies',
        title: 'Vaccination antirabique valide',
        details: "Faite au moins 30 jours avant l'entrée et en cours de validité (délai à confirmer auprès de l'ONSSA).",
        species: CARNIVORES,
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 30, minAgeWeeks: 12 },
      },
      HEALTH_CERT_EXPADON,
      ...RETURN_UNLISTED,
    ],
  },
  {
    id: 'th',
    outsideEu: true,
    name: 'Thaïlande',
    flag: '🇹🇭',
    summary:
      "Autorisation d'importation à demander avant l'arrivée, vaccinations et certificat sanitaire. La Thaïlande n'est pas un pays « listé » par l'UE : titrage antirabique obligatoire pour revenir.",
    sources: [
      { label: 'Ministère thaïlandais de l’Agriculture – Importation de chiens et chats', url: 'https://www.opsmoac.go.th/dc-news-files-431091791299' },
      { label: 'Expadon – Certificats d’exportation (service-public)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R18010' },
    ],
    requirements: [
      {
        id: 'microchip',
        title: 'Puce électronique ISO',
        details: 'Obligatoire, numéro reporté sur tous les documents.',
        species: ['dog', 'cat'],
        upload: 'microchip-certificate',
        vet: true,
        check: { kind: 'microchip' },
      },
      {
        id: 'th-rabies',
        title: 'Vaccination antirabique',
        details: "Faite au moins 21 jours avant le départ et depuis moins d'un an. Les vaccins habituels (leptospirose pour les chiens, etc.) sont aussi demandés.",
        species: ['dog', 'cat'],
        upload: 'rabies-certificate',
        vet: true,
        check: { kind: 'rabies', waitDays: 21, minAgeWeeks: 12 },
      },
      {
        id: 'th-permit',
        title: "Autorisation d'importation (DLD)",
        details: "À demander au Department of Livestock Development avant l'arrivée, avec les documents de l'animal.",
        species: ['dog', 'cat'],
        upload: 'import-permit',
      },
      { ...HEALTH_CERT_EXPADON, species: ['dog', 'cat'], details: 'Certificat de bonne santé établi dans les jours précédant le départ (souvent moins de 10 jours), visé par la DDPP.' },
      ...RETURN_UNLISTED,
    ],
  },
]

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id)
}
