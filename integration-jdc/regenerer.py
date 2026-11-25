"""Génère le module FBM pour Journal de chantier à partir du formulaire autonome de Bob."""
import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

INTEGRATION = Path(__file__).resolve().parent
SOURCE = INTEGRATION.parent
MARQUE = "empreintes-generation.json"
COMPLEMENTS = ("iphone-layout-v1614.css", "journal-bridge.js", "jdc-fbm-photos.js")


def empreinte(data):
    return hashlib.sha256(data).hexdigest()


def appliquer_patch(html, delta):
    """Applique chaque bloc uniquement à un emplacement identique et unique."""
    lignes = html.splitlines(keepends=True)
    patch = delta.splitlines(keepends=True)
    entetes = [i for i, ligne in enumerate(patch) if ligne.startswith("@@ ")]
    if not entetes:
        raise ValueError("Le fichier index.patch ne contient aucun bloc de modification.")
    resultat = []
    prochaine = 0
    for i, fin in zip(entetes, entetes[1:] + [len(patch)]):
        bloc = patch[i + 1:fin]
        if not bloc or any(ligne[:1] not in (" ", "-", "+") for ligne in bloc):
            raise ValueError("Bloc illisible dans index.patch, " + patch[i].strip())
        avant = [ligne[1:] for ligne in bloc if not ligne.startswith("+")]
        apres = [ligne[1:] for ligne in bloc if not ligne.startswith("-")]
        if not avant:
            raise ValueError("Le delta contient un ajout sans texte de référence.")
        positions = [p for p in range(prochaine, len(lignes) - len(avant) + 1)
                     if lignes[p] == avant[0] and lignes[p:p + len(avant)] == avant]
        if len(positions) != 1:
            raise ValueError("Conflit dans index.html. Le bloc " + patch[i].strip() +
                             " de index.patch a changé ou apparaît plusieurs fois. "
                             "Rapprochez les deux versions avant de régénérer.")
        p = positions[0]
        resultat.extend(lignes[prochaine:p])
        resultat.extend(apres)
        prochaine = p + len(avant)
    resultat.extend(lignes[prochaine:])
    return "".join(resultat)


def copier(chemin, cible):
    if chemin.is_symlink() or not chemin.is_file():
        raise ValueError("Fichier source absent ou lien symbolique : " + str(chemin))
    cible.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(chemin, cible)


def contenu(dossier):
    """Ne suit aucun lien symbolique lors de la vérification d'une sortie existante."""
    inventaire = {}
    for p in sorted(dossier.rglob("*")):
        if p.is_symlink():
            raise ValueError("Lien symbolique inattendu : " + str(p))
        if p.is_file():
            inventaire[p.relative_to(dossier).as_posix()] = empreinte(p.read_bytes())
    return inventaire


def preparer(nouveau):
    module = nouveau / "fbm"
    module.mkdir(parents=True)
    html = appliquer_patch((SOURCE / "index.html").read_text(encoding="utf-8-sig"),
                           (INTEGRATION / "index.patch").read_text(encoding="utf-8"))
    (module / "index.html").write_bytes(html.encode("utf-8"))
    copier(SOURCE / "manifest.json", module / "manifest.json")
    if (SOURCE / "README.md").exists():
        copier(SOURCE / "README.md", module / "README.md")
    assets = SOURCE / "assets"
    if not assets.is_dir() or assets.is_symlink():
        raise ValueError("Le dossier assets de FBM est introuvable.")
    for p in sorted(assets.rglob("*")):
        if p.is_symlink():
            raise ValueError("Lien symbolique inattendu dans assets : " + str(p))
        if p.is_file():
            copier(p, module / p.relative_to(SOURCE))
    for nom in COMPLEMENTS:
        copier(INTEGRATION / "fbm" / nom, module / nom)

    modele = (INTEGRATION / "fbm/sw.js").read_text(encoding="utf-8")
    table = re.search(r"^const ASSETS = (\{.*?\});$", modele, re.DOTALL | re.MULTILINE)
    if not table:
        raise ValueError("Table ASSETS absente du service worker JDC.")
    originales = json.loads(table[1])
    ressources = originales.copy()
    # Les empreintes des ressources du Journal parent appartiennent à sa livraison.
    for nom in originales:
        if not nom.startswith("../"):
            ressources[nom] = empreinte((module / nom).read_bytes())
    for nom, digest in contenu(module / "assets").items():
        ressources["assets/" + nom] = digest
    if ressources != originales:
        encodage = json.dumps(ressources, ensure_ascii=False, indent=2)
        modele = modele[:table.start(1)] + encodage + modele[table.end(1):]
        revision = empreinte(encodage.encode("utf-8"))[:16]
        modele, nb = re.subn(r"(const CACHE = OWN \+ '[^']+)';", r"\g<1>-" + revision + "';", modele)
        if nb != 1:
            raise ValueError("Version de cache introuvable dans le service worker JDC.")
    (module / "sw.js").write_bytes(modele.encode("utf-8"))
    # La marque reste à côté du module. Seul le dossier fbm/ est destiné au Journal.
    marque = json.dumps(contenu(module), ensure_ascii=False, indent=2) + "\n"
    (nouveau / MARQUE).write_bytes(marque.encode("utf-8"))


def verifier_sortie(sortie):
    if not sortie.exists():
        return
    if sortie.is_symlink() or not sortie.is_dir():
        raise ValueError("La destination existe et ne correspond pas à une sortie générée.")
    if set(p.name for p in sortie.iterdir()) != {"fbm", MARQUE}:
        raise ValueError("La destination contient d’autres éléments. Choisissez un nouveau dossier avec --sortie.")
    module = sortie / "fbm"
    marque = sortie / MARQUE
    if module.is_symlink() or not module.is_dir() or marque.is_symlink() or not marque.is_file():
        raise ValueError("La destination ne correspond pas à une sortie générée.")
    sauvegardees = json.loads(marque.read_text(encoding="utf-8"))
    if sauvegardees != contenu(module):
        raise ValueError("La copie générée a été modifiée. Conservez-la et choisissez une autre destination avec --sortie.")


def generer(sortie):
    # Vérifier les liens et les recouvrements avant de créer le répertoire de travail.
    if sortie.is_symlink():
        raise ValueError("La sortie ne peut pas être un lien symbolique.")
    sortie = sortie.resolve()
    if sortie == SOURCE or sortie in SOURCE.parents or INTEGRATION == sortie or INTEGRATION in sortie.parents:
        raise ValueError("Choisissez un dossier de sortie distinct des sources de FBM et de l’intégration.")
    if SOURCE / "assets" == sortie or SOURCE / "assets" in sortie.parents:
        raise ValueError("Le dossier assets sert à l’application autonome. Choisissez une autre sortie.")
    sortie.parent.mkdir(parents=True, exist_ok=True)
    verrou = sortie.with_name("." + sortie.name + "-en-cours")
    try:
        verrou.mkdir()
    except FileExistsError:
        raise ValueError("Génération déjà en cours. Si elle a été interrompue, inspectez le dossier " + str(verrou))
    ancienne = verrou / "ancienne"
    try:
        verifier_sortie(sortie)
        nouveau = verrou / "nouvelle"
        preparer(nouveau)
        if sortie.exists():
            if (nouveau / MARQUE).read_bytes() == (sortie / MARQUE).read_bytes():
                return
            sortie.rename(ancienne)
        try:
            nouveau.rename(sortie)
        except OSError:
            if ancienne.exists() and not sortie.exists():
                ancienne.rename(sortie)
            raise
        if ancienne.exists():
            shutil.rmtree(ancienne)
    finally:
        # Si une restauration échoue ou si le processus a été interrompu, garder la copie précédente.
        if not ancienne.exists():
            shutil.rmtree(verrou)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--sortie", type=Path, default=SOURCE / "sortie-jdc",
                     help="Dossier qui contiendra fbm/ et les empreintes de génération.")
    args = cli.parse_args()
    try:
        generer(args.sortie.expanduser())
    except (OSError, ValueError) as err:
        raise SystemExit("Génération interrompue. " + str(err)) from None
    print("Module disponible dans", args.sortie.expanduser().resolve() / "fbm")


if __name__ == "__main__":
    main()
