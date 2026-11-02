# Tablée · l'addition partagée

Prototype d'application de commande de repas à plusieurs : l'hôte compose la commande de toute la table, indique qui a pris quoi, et Tablée calcule la part de chacun au centime près.

Projet personnel réalisé avec Claude Code.

## Le problème

Quand on commande à plusieurs, une seule personne paie, puis tout le monde refait les calculs : qui a pris quoi, comment partager la pizza, comment répartir la TVA. Résultat : des erreurs, des centimes perdus et un remboursement qui traîne.

## Ce que fait le prototype

- **Menu et commande** : catégories, ajout de plats, quantités modifiables.
- **Convives** : jusqu'à 20 personnes, gestion des prénoms en double (« Léa », « Léa (2) »).
- **Trois façons de répartir un plat** :
  - une personne ;
  - à partager à parts égales entre certains convives ;
  - unité par unité, quand un plat a été commandé plusieurs fois : chaque unité a sa propre règle (par exemple un kombucha partagé à trois et un autre pour une seule personne).
- **Part de chacun en direct**, mise à jour à chaque modification.
- **Récapitulatif détaillé** par convive (plats, part du plat, TVA), copiable pour l'envoyer dans le groupe.
- **Paiement simulé** : aucune donnée bancaire n'est demandée ni transmise.
- **Historique des commandes**, conservé dans le navigateur.
- **Responsive** : utilisable sur mobile, avec une barre d'accès rapide à la commande.

## Choix techniques

- **Calculs en centimes entiers** (`src/lib/split.js`) pour éviter les erreurs d'arrondi des nombres à virgule.
- **Répartition par la méthode du plus fort reste** : la somme des parts est toujours exactement égale au total, et pour chaque convive, sous-total + TVA = total affiché.
- **Tests unitaires** (Vitest) sur toute la logique de calcul.
- React 19 + Vite, sans dépendance supplémentaire.

## Structure du projet

```
src/
  main.jsx            point d'entrée
  App.jsx             état de la commande (panier, convives, répartition)
  styles.css          styles et responsive
  components/         écrans et composants d'interface
  lib/split.js        calcul des parts (+ split.test.js)
  lib/history.js      historique des commandes
  data/menu.js        carte du restaurant
public/               icône
```

## Lancer le projet

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests unitaires
npm run lint     # vérification du code
npm run build    # version de production dans dist/
```

## Pistes pour la suite

- Lien de paiement envoyé à chaque convive (Lydia, Wero, Stripe).
- Chaque convive choisit lui-même ses plats depuis son téléphone (commande collaborative en temps réel).
- Pourboire réparti au prorata.
