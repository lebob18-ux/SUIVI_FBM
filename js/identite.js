/* ============================================================
   IDENTITÉ RÉDACTEUR (nom + email) — popup au 1er lancement,
   sauvegardée durablement sur l'appareil, remplie automatiquement
   ============================================================ */

const CLE_IDENTITE = "fbm_identite_redacteur";

function chargerIdentite() {
  try {
    const brut = localStorage.getItem(CLE_IDENTITE);
    return brut ? JSON.parse(brut) : null;
  } catch (e) {
    return null;
  }
}

function appliquerIdentite(identite) {
  const champNom = document.getElementById("nomRedacteur");
  const champEmail = document.getElementById("emailRedacteur");
  if (champNom && identite.nom) champNom.value = identite.nom;
  if (champEmail && identite.email) champEmail.value = identite.email;
}

function validerIdentitePopup() {
  const nom = document.getElementById("identiteNomInput").value.trim();
  const email = document.getElementById("identiteEmailInput").value.trim();

  if (nom === "") {
    alert("⚠️ Le nom est obligatoire.");
    document.getElementById("identiteNomInput").focus();
    return;
  }

  const identite = { nom: nom, email: email };
  try {
    localStorage.setItem(CLE_IDENTITE, JSON.stringify(identite));
  } catch (e) {
    console.error("Erreur sauvegarde identité :", e);
  }

  appliquerIdentite(identite);
  document.getElementById("divIdentiteModal").style.display = "none";
}

function initIdentite() {
  const identite = chargerIdentite();
  if (identite) {
    appliquerIdentite(identite);
  } else {
    document.getElementById("divIdentiteModal").style.display = "flex";
  }
}

window.addEventListener("load", initIdentite);
