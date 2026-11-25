# Suivi FBM — sources pour Bob

Pour modifier la fiche, ouvre **`SUIVI_FBM-main/index.html`**. Les chemins de ce guide partent de la racine `SUIVI_FBM-main`. C’est ta version du 24 novembre 2026, avec les trois dates de fouille, de béton et de matage. Le formulaire, ses calculs, l’export PDF et les échanges avec ton projet Supabase sont dans ce fichier, comme dans ton ZIP d’origine. Les icônes et logos sont dans `assets/`.

## Ouvrir la fiche sur ton ordinateur

Tu peux continuer à utiliser ton hébergement habituel. Pour tester une modification sur ton ordinateur avec Python 3, ouvre un terminal dans `SUIVI_FBM-main` et lance :

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Ouvre ensuite `http://127.0.0.1:8000/` dans ton navigateur. Sur Windows, tu peux remplacer `python3` par `py`. Comme dans ta version, la fiche autonome charge ses bibliothèques en ligne et utilise tes accès FBM habituels pour les données du chantier.

## Retrouver les ajouts du Journal

| Emplacement | Contenu |
| --- | --- |
| `index.html`, `assets/`, `manifest.json`, `sw.js` | Sources de l’application autonome. C’est ici que tu modifies le formulaire pour les deux versions. |
| `integration-jdc/` | Adaptations du formulaire pour le Journal, scripts photo et outil de génération. |
| `sortie-jdc/fbm/` | Copie prête à lire du module FBM intégré à la version 16.4.16 du Journal. Ce dossier est régénéré à partir des sources. |
| `integration-jdc/cote-journal/` | Code du Journal qui reçoit les photos, vérifie le chantier et les classe. Le fichier SQL concerne exclusivement la base du Journal. |

Dans le Journal, l’agent prend sa photo depuis la phase de la fiche. Le support et le BL déjà saisis servent au classement. Le bouton **Voir les photos du support** rassemble les photos de phase, les bons de livraison et les essais de slump. Ces fonctions utilisent la session du chantier ouverte dans JDC.

Après une modification de la fiche autonome, tu peux préparer la copie pour JDC depuis la racine :

```sh
python3 integration-jdc/regenerer.py
```

Cette commande prépare des fichiers sur ton ordinateur. Tu peux ensuite renvoyer le projet modifié pour la prochaine mise à jour du Journal.
