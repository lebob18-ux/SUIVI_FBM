/* ============================================================
   NUMERO RJ — popup au lancement, conservé pendant toute la
   plage de nuit (20h -> 8h), redemandé en dehors de cette plage
   ou pour une nouvelle nuit
   ============================================================ */

const CLE_RJ = "fbm_rj_nuit";

function calculerIdNuit(d) {
  const jour = new Date(d);
  if (d.getHours() < 8) {
    jour.setDate(jour.getDate() - 1);
  }
  return jour.toISOString().slice(0, 10);
}

function estEnPlageNuit(d) {
  const h = d.getHours();
  return (h >= 20 || h < 8);
}

function appliquerRJ(valeur) {
  window.numeroRJ = valeur;
  const badge = document.getElementById("rjBadge");
  if (badge) badge.innerText = "RJ : " + valeur;
}

function validerRJPopup() {
  const valeur = document.getElementById("rjInput").value.trim();

  if (valeur === "") {
    alert("⚠️ Le numéro RJ est obligatoire.");
    document.getElementById("rjInput").focus();
    return;
  }

  const maintenant = new Date();
  const sauvegarde = { valeur: valeur, idNuit: calculerIdNuit(maintenant) };
  try {
    localStorage.setItem(CLE_RJ, JSON.stringify(sauvegarde));
  } catch (e) {
    console.error("Erreur sauvegarde RJ :", e);
  }

  appliquerRJ(valeur);
  document.getElementById("divRJModal").style.display = "none";
}

function initRJ() {
  const maintenant = new Date();
  const brut = localStorage.getItem(CLE_RJ);
  const sauvegarde = brut ? JSON.parse(brut) : null;

  if (estEnPlageNuit(maintenant) && sauvegarde && sauvegarde.idNuit === calculerIdNuit(maintenant)) {
    appliquerRJ(sauvegarde.valeur);
  } else {
    document.getElementById("divRJModal").style.display = "flex";
  }
}

window.addEventListener("load", initRJ);
