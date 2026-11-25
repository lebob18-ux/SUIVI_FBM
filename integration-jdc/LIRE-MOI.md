# Régénérer la fiche embarquée dans Journal de chantier

Modifiez le `index.html` autonome, à côté du dossier `integration-jdc`. Depuis ce même répertoire, exécutez avec Python 3 :

```sh
python3 integration-jdc/regenerer.py
```

Le répertoire `sortie-jdc/fbm/` contient la copie à remettre à l’intégrateur du Journal. Le formulaire à la racine reste celui que vous maintenez. Le générateur reprend également `manifest.json` et les fichiers de `assets/`. Placez les nouvelles ressources locales du formulaire sous `assets/`.

`index.patch` contient les adaptations de la fiche de Bob à JDC. Le dossier `integration-jdc/fbm/` fournit l’interface photo, le pont des brouillons et des PDF, la feuille de style iPhone et le modèle du cache JDC. Si une modification touche le texte de référence d’un bloc du patch, la commande indique le bloc à rapprocher. La dernière copie générée reste disponible. Si vous avez édité directement la copie générée, vous pouvez conserver cette version et produire la suivante dans un autre répertoire :

```sh
python3 integration-jdc/regenerer.py --sortie autre-sortie-jdc
```

Conservez le fichier `empreintes-generation.json` à côté du dossier généré `fbm/` pour les régénérations suivantes. La version embarquée utilise les composants, l’authentification et le module d’archivage du Journal parent. Une version modifiée de cette copie doit être incluse dans une nouvelle livraison JDC avec son verrou de ressources à jour.
