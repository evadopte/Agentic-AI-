/** Types de documents que l'utilisateur peut téléverser. */
export const DOCUMENT_TYPES = {
  'eu-passport': 'Passeport européen pour animal de compagnie (pages remplies)',
  'microchip-certificate': "Certificat d'identification / carte I-CAD",
  'rabies-certificate': 'Certificat de vaccination antirabique',
  'tapeworm-certificate': 'Attestation du traitement contre le ténia (Echinococcus)',
  'titer-result': 'Résultat du titrage des anticorps antirabiques',
  'health-certificate': 'Certificat sanitaire vétérinaire',
  'cdc-receipt': 'Reçu du CDC Dog Import Form',
  'import-permit': "Permis d'importation",
  'advance-notice': 'Confirmation de la notification préalable',
  'cites-permit': 'Permis CITES (espèces protégées)',
  'owner-id': "Pièce d'identité du propriétaire",
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES

export const DOCUMENT_HINTS: Partial<Record<DocumentType, string>> = {
  'microchip-certificate': "Le document remis par le vétérinaire à la pose de la puce, avec le numéro à 15 chiffres.",
  'rabies-certificate': 'Le certificat signé par le vétérinaire, avec le nom du vaccin, le lot et la date de validité.',
  'health-certificate': "Certificat de bonne santé de moins de 10 jours, signé par un vétérinaire.",
  'owner-id': "Carte d'identité ou passeport, au nom du propriétaire inscrit dans le profil.",
}

export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
