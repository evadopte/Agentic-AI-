# PetPass

Application web pour :

1. **Créer le passeport numérique** de son animal (chien, chat, furet, oiseau) : on remplit son profil, on téléverse les documents demandés (carte I-CAD, pièce d'identité…), un vétérinaire les vérifie puis délivre le passeport.
2. **Préparer un voyage** : on choisit une destination et des dates, l'app liste exactement les démarches (entrée dans le pays et retour en France), vérifie les dates de l'animal (âge, vaccin antirabique, fenêtre du traitement contre le ténia, titrage…) et indique quel document téléverser à chaque étape.

> Démonstration : les données restent dans le navigateur (localStorage + IndexedDB) et le passeport affiché n'est pas un document officiel. Seul un vétérinaire habilité peut délivrer le passeport européen.

## Lancer

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # tests des règles de voyage
npm run build
```

## Où sont les règles

- `src/data/passport.ts` : conditions et documents pour obtenir le passeport.
- `src/data/destinations.ts` : exigences par destination (UE, Irlande/Finlande/Malte/Norvège, Suisse, Royaume-Uni, États-Unis, Canada, Japon, Australie, Nouvelle-Zélande, Émirats, Maroc, Thaïlande), séparées entre entrée et retour dans l'UE, avec les sources officielles.
- `src/lib/checklist.ts` : vérifications automatiques à partir des données de l'animal.

Les règles changent souvent : la date de dernière vérification est dans `RULES_CHECKED_ON`.
