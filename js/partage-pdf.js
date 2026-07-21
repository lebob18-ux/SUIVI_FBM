/* ============================================================
   PARTAGE PDF UNIFIÉ
   - Choix : Email (liste de distribution) ou Autre (WhatsApp…)
   - Email : liste fixe (LISTE_EMAILS) + saisie manuelle
   - Autre : navigator.share() avec le PDF en pièce jointe
   ============================================================ */

let _pdfBlob = null;
let _pdfNom  = null;
let _pdfTitre = null;
let _emailsManuels = [];

/* ---- Point d'entrée appelé par pdf-export.js et pdf-recap.js ---- */
function partagerPDF(blob, nomFichier, titre) {
  _pdfBlob  = blob;
  _pdfNom   = nomFichier;
  _pdfTitre = titre || "Document AINM";
  document.getElementById("divPartageModal").style.display = "flex";
}

/* ---- Choix Email ---- */
function choisirEmail() {
  document.getElementById("divPartageModal").style.display = "none";
  _emailsManuels = [];
  afficherEmailsManuels();
  document.querySelectorAll(".email-fixe-cb").forEach(cb => cb.checked = false);
  document.getElementById("divEmailModal").style.display = "flex";
}

/* ---- Choix Autre (WhatsApp, etc.) ---- */
async function choisirAutre() {
  document.getElementById("divPartageModal").style.display = "none";
  const pdfFile = new File([_pdfBlob], _pdfNom, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({ files: [pdfFile], title: _pdfTitre });
    } catch (e) {
      if (e.name !== "AbortError") telechargerPDF();
    }
  } else {
    telechargerPDF();
  }
}

/* ---- Téléchargement direct ---- */
function telechargerPDF() {
  const url = URL.createObjectURL(_pdfBlob);
  const a = document.createElement("a");
  a.href = url; a.download = _pdfNom; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---- Gestion emails manuels ---- */
function ajouterEmailManuel() {
  const input = document.getElementById("email-manuel-input");
  const val = (input?.value || "").trim().toLowerCase();
  if (!val || !val.includes("@")) { alert("⚠️ Email invalide."); return; }
  if (_emailsManuels.includes(val)) return;
  _emailsManuels.push(val);
  afficherEmailsManuels();
  input.value = "";
  input.focus();
}

function supprimerEmailManuel(index) {
  _emailsManuels.splice(index, 1);
  afficherEmailsManuels();
}

function afficherEmailsManuels() {
  const div = document.getElementById("email-manuel-liste");
  if (!div) return;
  div.innerHTML = _emailsManuels.map((email, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center;
                padding:3px 8px; background:#f9fafb; border-radius:4px;
                margin-bottom:3px; font-size:0.78em;">
      <span>${email}</span>
      <button onclick="supprimerEmailManuel(${i})"
        style="background:#fee2e2; color:#dc2626; padding:1px 6px; margin:0; font-size:0.7em;">✕</button>
    </div>`).join("");
}

/* ---- Confirmer et envoyer par email ---- */
function confirmerEmailPDF() {
  const emailsFixed = [...document.querySelectorAll(".email-fixe-cb:checked")].map(cb => cb.value);
  const tousEmails = [...emailsFixed, ..._emailsManuels];

  if (tousEmails.length === 0) {
    alert("⚠️ Sélectionne au moins un destinataire.");
    return;
  }

  // 1. Télécharger le PDF
  telechargerPDF();

  // 2. Ouvrir le client mail avec destinataires et sujet pré-remplis
  const sujet = encodeURIComponent(_pdfTitre);
  const corps = encodeURIComponent(
    "Bonjour,\n\nVeuillez trouver ci-joint le document : " + _pdfNom +
    "\n\n(Pensez à joindre le PDF téléchargé)\n\nCordialement,\nAINM"
  );
  setTimeout(() => {
    window.location.href = "mailto:" + tousEmails.join(",") +
      "?subject=" + sujet + "&body=" + corps;
  }, 600);

  document.getElementById("divEmailModal").style.display = "none";
}

/* ---- Initialisation liste fixe ---- */
function initEmailListeFixe() {
  const div = document.getElementById("email-liste-fixe");
  if (!div || typeof LISTE_EMAILS === "undefined" || LISTE_EMAILS.length === 0) {
    if (div) div.innerHTML = "<p style='color:#999; font-size:0.78em;'>Aucun contact prédéfini.</p>";
    return;
  }
  div.innerHTML = LISTE_EMAILS.map(contact => `
    <label style="display:flex; align-items:center; gap:7px; padding:5px 2px;
                  font-size:0.82em; cursor:pointer; border-bottom:1px solid #f0f0f0;">
      <input type="checkbox" class="email-fixe-cb" value="${contact.email}"
        style="width:16px; height:16px; margin:0; flex-shrink:0;">
      <span><strong>${contact.nom}</strong><br>
        <span style="color:#666; font-size:0.88em;">${contact.email}</span>
      </span>
    </label>`).join("");
}

window.addEventListener("load", initEmailListeFixe);
