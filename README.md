# RELEVE_FOUILLE_CHANTIER (FBM)

Outil d'aide à la décision pour les relevés de fouille / blindage (chantiers SNCF).

## Structure du projet

```
.
├── index.html                 → structure HTML de la page
├── style.css                  → styles (mise en page, champs, modales…)
├── data.js                    → base de données des supports (baseSupports)
├── assets/
│   └── logo.svg                → logo SNCF (extrait du SVG inline)
├── js/
│   ├── state.js                 → variables globales partagées + init au chargement
│   ├── echantillon-modal.js     → popups "Cote A" et "Profilé (échantillon)"
│   ├── calculs.js                → moteur de calcul principal (calculer(), LTV, D/H max…)
│   ├── partage.js                → partage WhatsApp
│   ├── signature.js              → pad de signature tactile
│   ├── pdf-export.js             → conversion logo SVG→PNG + génération du PDF
│   ├── chantiers-supports.js     → sélection chantier/support, remplissage auto des champs
│   └── ui-events.js              → écouteurs globaux (carotte/blindage, focus, chargement page)
└── README.md
```

### Pourquoi ce découpage du JS

Chaque fichier de `js/` correspond à une responsabilité précise de l'outil.
Pour une future modification, va directement dans le fichier concerné :

- Une formule de calcul à corriger → `calculs.js`
- Le rendu du PDF à ajuster → `pdf-export.js`
- Le comportement du pad de signature → `signature.js`
- Le chargement des données d'un support → `chantiers-supports.js`
- Les popups de sélection (Cote A / profilé) → `echantillon-modal.js`

Les fichiers sont chargés en scripts classiques (pas de modules ES), donc
toutes les variables et fonctions restent globales et accessibles entre
fichiers — l'ordre de chargement dans `index.html` n'a pas besoin d'être
strictement respecté (aucun fichier n'a besoin qu'un autre soit déjà exécuté
pour se charger), mais on le garde stable pour rester lisible.

## Déploiement sur GitHub Pages

1. Crée un dépôt (ex. `fbm-fouille`) et pousse ces fichiers à la racine
   (ou dans un dossier `docs/` si tu préfères).
2. Dans les paramètres du dépôt → **Pages** → Source : choisis la branche
   et le dossier contenant `index.html`.
3. L'outil sera accessible à une URL du type :
   `https://<ton-user>.github.io/<nom-du-repo>/`

Aucune étape de build n'est nécessaire : c'est du HTML/CSS/JS statique,
avec html2canvas / jsPDF / jsPDF-AutoTable chargés depuis un CDN.

## Mettre à jour les données chantiers

Modifie simplement `data.js` (le tableau `baseSupports`), chaque ligne
correspond à un support avec ses cotes de référence.

## Notes

- Le logo est passé d'un `<svg>` inline à un fichier externe
  `assets/logo.svg`, référencé via `<img>` — le rendu visuel est identique.
  Pour le PDF, `pdf-export.js` va chercher ce fichier via `fetch()` afin de
  le convertir en image intégrable — ça ne fonctionne qu'en http/https
  (donc pas en ouvrant `index.html` en double-clic depuis le disque).
- Aucune logique métier n'a été modifiée : seul le découpage en fichiers
  a changé, pour faciliter le versionnement et le partage sur GitHub.
