/* ============================================================
   GESTION BONS DE LIVRAISON BÉTON (BL-BÉTON)
   - Saisie libre ou liste prédéfinie (autocomplete)
   - Scanner QR code (caméra Android)
   - Plusieurs BL par support, chacun avec plusieurs SLUMPs
   - Sauvegardés en localStorage par chantier/support
   ============================================================ */

let blsActuels = [];
// Structure : [{ bl: "BL-001", slumps: [18, 20] }, ...]

/* ---- Clé localStorage ---- */
function cleAutosaveBL() {
  const chantier = document.getElementById("selectChantier")?.value || "";
  const support  = document.getElementById("selectSupport")?.value || "";
  if (!chantier || !support) return null;
  return "fbm_bls_" + chantier + "_" + support;
}

/* ---- Charger les BL du support courant ---- */
function chargerBLs() {
  const cle = cleAutosaveBL();
  try {
    const brut = cle ? localStorage.getItem(cle) : null;
    const donnees = brut ? JSON.parse(brut) : [];
    // Migration ancienne structure (tableau de strings)
    blsActuels = donnees.map(item =>
      typeof item === "string" ? { bl: item, slumps: [] } : item
    );
  } catch (e) {
    blsActuels = [];
  }
  afficherBLs();
}

/* ---- Sauvegarder ---- */
function sauvegarderBLs() {
  const cle = cleAutosaveBL();
  if (!cle) return;
  try { localStorage.setItem(cle, JSON.stringify(blsActuels)); }
  catch (e) { console.error("Erreur sauvegarde BL :", e); }
}

/* ---- Ajouter un BL (avec slump initial optionnel) ---- */
function ajouterBL() {
  const blInput    = document.getElementById("bl-input");
  const slumpInput = document.getElementById("slump-input");
  const blVal      = (blInput?.value || "").trim();
  const slumpVal   = slumpInput?.value !== "" ? parseFloat(slumpInput.value) : null;

  if (!blVal) { alert("⚠️ Saisis ou scanne un numéro BL."); return; }

  const existant = blsActuels.find(item => item.bl === blVal);
  if (existant) {
    // BL déjà présent → ajoute juste le slump si renseigné
    if (slumpVal !== null && !isNaN(slumpVal)) {
      existant.slumps.push(slumpVal);
      sauvegarderBLs();
      afficherBLs();
    } else {
      alert("⚠️ Ce BL est déjà enregistré. Saisis un SLUMP pour l'ajouter.");
    }
  } else {
    // Nouveau BL
    blsActuels.push({ bl: blVal, slumps: slumpVal !== null && !isNaN(slumpVal) ? [slumpVal] : [] });
    sauvegarderBLs();
    afficherBLs();
  }

  blInput.value    = "";
  if (slumpInput) slumpInput.value = "";
  blInput.focus();
}

/* ---- Ajouter un slump à un BL existant ---- */
function ajouterSlump(index) {
  const val = prompt("Valeur SLUMP (cm) pour " + blsActuels[index].bl + " :");
  if (val === null || val.trim() === "") return;
  const num = parseFloat(val);
  if (isNaN(num)) { alert("⚠️ Valeur numérique invalide."); return; }
  blsActuels[index].slumps.push(num);
  sauvegarderBLs();
  afficherBLs();
}

/* ---- Supprimer un BL ---- */
function supprimerBL(index) {
  if (!confirm("Supprimer ce BL : " + blsActuels[index].bl + " ?")) return;
  blsActuels.splice(index, 1);
  sauvegarderBLs();
  afficherBLs();
}

/* ---- Supprimer un slump ---- */
function supprimerSlump(blIndex, slumpIndex) {
  blsActuels[blIndex].slumps.splice(slumpIndex, 1);
  sauvegarderBLs();
  afficherBLs();
}

/* ---- Afficher la liste ---- */
function afficherBLs() {
  const liste = document.getElementById("bl-liste");
  if (!liste) return;

  if (blsActuels.length === 0) {
    liste.innerHTML = "<p style='color:#999; font-size:0.8em; text-align:center; margin:6px 0;'>Aucun BL enregistré</p>";
    return;
  }

  liste.innerHTML = blsActuels.map((item, i) => {
    const slumpsHtml = item.slumps.length > 0
      ? item.slumps.map((s, si) => `
          <span style="background:#f0e4ee; color:#7C2270; font-weight:bold; padding:1px 6px;
                       border-radius:10px; font-size:0.75em; cursor:pointer;"
                onclick="supprimerSlump(${i}, ${si})" title="Supprimer ce slump">
            ${s} cm ✕
          </span>`).join(" ")
      : "<span style='color:#bbb; font-size:0.75em; font-style:italic;'>Aucun slump</span>";

    return `
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;
                  padding:6px 8px; margin-bottom:5px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:bold; color:#333; font-size:0.85em;">🧾 ${item.bl}</span>
          <div style="display:flex; gap:4px;">
            <button type="button" onclick="ajouterSlump(${i})"
              style="background:#e0f2fe; color:#0369a1; padding:2px 7px; font-size:0.72em; margin:0; border-radius:4px;">
              + Slump
            </button>
            <button type="button" onclick="supprimerBL(${i})"
              style="background:#fee2e2; color:#dc2626; padding:2px 7px; font-size:0.72em; margin:0; border-radius:4px;">✕</button>
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:3px;">
          ${slumpsHtml}
        </div>
      </div>`;
  }).join("");
}

/* ---- Initialiser le datalist depuis bl-liste.js ---- */
function initBLDatalist() {
  const dl = document.getElementById("bl-datalist");
  if (!dl || typeof LISTE_BL === "undefined") return;
  dl.innerHTML = LISTE_BL.map(bl => `<option value="${bl}">`).join("");
}

/* ---- Scanner QR / code-barres via caméra ---- */
async function scannerQR() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";

  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await createImageBitmap(file);

      if ("BarcodeDetector" in window) {
        const formats = ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "data_matrix"];
        const detector = new BarcodeDetector({ formats });
        const codes = await detector.detect(img);
        if (codes.length > 0) {
          document.getElementById("bl-input").value = codes[0].rawValue;
          document.getElementById("bl-input").focus();
        } else {
          alert("⚠️ Aucun code détecté. Réessaie avec une photo plus nette.");
        }
      } else if (typeof jsQR !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          document.getElementById("bl-input").value = code.data;
          document.getElementById("bl-input").focus();
        } else {
          alert("⚠️ Aucun QR code détecté dans la photo.");
        }
      } else {
        alert("⚠️ Scanner non disponible. Saisis le numéro manuellement.");
      }
    } catch (err) {
      console.error("Erreur scan QR :", err);
      alert("⚠️ Erreur lors du scan : " + err.message);
    }
  };
  input.click();
}

/* ---- Appelée depuis chargerSupport() ---- */
function rechargerBLsSupport() { chargerBLs(); }

/* ---- Init ---- */
window.addEventListener("load", () => {
  initBLDatalist();
  const blInput = document.getElementById("bl-input");
  if (blInput) blInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); ajouterBL(); }
  });
  const slumpInput = document.getElementById("slump-input");
  if (slumpInput) slumpInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); ajouterBL(); }
  });
});
