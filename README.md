# RELEVE_FOUILLE_CHANTIER (FBM)

Outil d'aide à la décision pour les relevés de fouille / blindage (chantiers SNCF).

## Structure du projet

```
.
├── index.html
├── style.css
├── data.js
├── README.md
├── assets/
│   └── logo.svg
└── js/
    ├── state.js
    ├── ui-sections.js
    ├── echantillon-modal.js
    ├── calculs.js
    ├── partage.js
    ├── signature.js
    ├── pdf-export.js
    ├── chantiers-supports.js
    └── ui-events.js
```

⚠️ **Important** : il y a bien **2 sous-dossiers** (`assets/` et `js/`) qui doivent
exister sur GitHub, pas seulement des fichiers à plat à la racine. Voir la
section [Déploiement](#déploiement-sur-github-pages) ci-dessous pour éviter
l'erreur classique (fichiers qui se retrouvent hors de leur dossier).

## Détail des fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure HTML de la page (blocs, champs, modales) |
| `style.css` | Tous les styles (mise en page, champs, blocs pliables, modales…) |
| `data.js` | Base de données des supports (`baseSupports`) |
| `assets/logo.svg` | Logo SNCF (fichier autonome, utilisé dans la page ET dans le PDF) |
| `js/state.js` | Variables globales partagées + lancement au chargement de la page |
| `js/ui-sections.js` | Gestion des blocs pliables (titres cliquables, ouverture/fermeture) |
| `js/echantillon-modal.js` | Popups "Cote A" et "Profilé (échantillon)" |
| `js/calculs.js` | Moteur de calcul principal (`calculer()`, LTV, D/H max…) |
| `js/partage.js` | Partage WhatsApp |
| `js/signature.js` | Pad de signature tactile |
| `js/pdf-export.js` | Conversion logo SVG→PNG + génération du PDF |
| `js/chantiers-supports.js` | Sélection chantier/support, remplissage auto des champs |
| `js/ui-events.js` | Écouteurs globaux (carotte/blindage, focus, chargement page) |

## Déploiement sur GitHub Pages

### Méthode recommandée : glisser tout le dossier d'un coup

1. Sur ton dépôt GitHub → **Add file** → **Upload files**
2. Glisse-dépose le **dossier `fbm` complet** (avec `assets/` et `js/` à
   l'intérieur) depuis ton explorateur de fichiers vers la zone d'upload.
   GitHub reconstitue automatiquement l'arborescence des sous-dossiers.
3. **Commit changes**.
4. Dans **Settings → Pages**, vérifie que la source pointe vers la bonne
   branche/dossier.
5. Ton site est à : `https://<ton-user>.github.io/<nom-du-repo>/`

### Si tu ajoutes les fichiers un par un

Dans le champ de nom de fichier, tape bien le chemin complet avec le `/` :
- `assets/logo.svg` (et pas juste `logo.svg`)
- `js/state.js`, `js/calculs.js`, etc. (et pas juste `state.js`, `calculs.js`…)

Le `/` dans le nom fait créer le dossier automatiquement par GitHub.

### Vérification après déploiement

1. Sur la page du repo, les dossiers **`assets`** et **`js`** doivent
   apparaître comme des dossiers cliquables (pas des fichiers à plat).
2. Sur ton URL github.io, ouvre la console du navigateur (F12) → onglet
   **Network**, recharge (`Ctrl+Shift+R`) : aucun fichier ne doit être en
   **404**.

## Mettre à jour les données chantiers

Modifie `data.js` (le tableau `baseSupports`), chaque ligne correspond à un
support avec ses cotes de référence.

## Notes techniques

- Aucune étape de build n'est nécessaire : HTML/CSS/JS statique, avec
  html2canvas / jsPDF / jsPDF-AutoTable chargés depuis un CDN.
- Les fichiers `.js` sont chargés comme scripts classiques (pas de modules
  ES) : toutes les variables et fonctions restent globales et partagées
  entre fichiers, donc l'ordre exact de chargement dans `index.html`
  n'est pas critique.
- Le logo est un fichier externe `assets/logo.svg`, référencé via `<img>`
  dans la page. Pour le PDF, `js/pdf-export.js` va chercher ce fichier via
  `fetch()` afin de le convertir en image intégrable — ça ne fonctionne
  qu'en http/https (donc pas en ouvrant `index.html` en double-clic
  depuis le disque, il faut passer par l'URL github.io ou un serveur local).
- Aucune logique métier n'a été modifiée lors des différentes étapes de
  découpage/mise en page : seule l'organisation des fichiers et
  l'habillage visuel ont changé.
