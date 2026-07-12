RELEVE_FOUILLE_CHANTIER (FBM)
Outil d'aide à la décision pour les relevés de fouille / blindage (chantiers SNCF).
Structure du projet
```
.
├── index.html      → structure HTML de la page
├── style.css       → styles (mise en page, champs, modales…)
├── data.js         → base de données des supports (baseSupports)
├── app.js          → logique de calcul, interactions, export PDF, signature
├── assets/
│   └── logo.svg    → logo SNCF (extrait du SVG inline)
└── README.md
```
Déploiement sur GitHub Pages
Crée un dépôt (ex. `fbm-fouille`) et pousse ces fichiers à la racine
(ou dans un dossier `docs/` si tu préfères).
Dans les paramètres du dépôt → Pages → Source : choisis la branche
et le dossier contenant `index.html`.
L'outil sera accessible à une URL du type :
`https://<ton-user>.github.io/<nom-du-repo>/`
Aucune étape de build n'est nécessaire : c'est du HTML/CSS/JS statique,
avec html2canvas / jsPDF / jsPDF-AutoTable chargés depuis un CDN.
Mettre à jour les données chantiers
Modifie simplement `data.js` (le tableau `baseSupports`), chaque ligne
correspond à un support avec ses cotes de référence.
Notes
Le logo est passé d'un `<svg>` inline à un fichier externe
`assets/logo.svg`, référencé via `<img>` — le rendu visuel est identique.
Aucune logique métier n'a été modifiée : seul le découpage en fichiers
a changé, pour faciliter le versionnement et le partage sur GitHub.
