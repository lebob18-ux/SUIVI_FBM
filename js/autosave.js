/* ============================================================
   SAUVEGARDE LOCALE (par chantier + support)
   ============================================================ */

function cleAutosave() {
  const chantier = document.getElementById("selectChantier")?.value || "";
  const support = document.getElementById("selectSupport")?.value || "";
  if (!chantier || !support) return null;
  return "fbm_save_" + chantier + "_" + support;
}

function sauvegarderLocal() {
  const cle = cleAutosave();
  if (!cle) return;

  const donnees = {};
  document.querySelectorAll(".box input[id], .box select[id]").forEach(el => {
    if (el.id === "selectChantier" || el.id === "selectSupport") return;
    if (el.readOnly || el.disabled) return; // pas les champs calculés/référence
    donnees[el.id] = (el.type === "checkbox") ? el.checked : el.value;
  });

  try {
    localStorage.setItem(cle, JSON.stringify(donnees));
  } catch (e) {
    console.error("Erreur sauvegarde locale :", e);
  }
}

function restaurerLocal() {
  const cle = cleAutosave();
  if (!cle) return;

  const brut = localStorage.getItem(cle);
  if (!brut) return;

  try {
    const donnees = JSON.parse(brut);
    Object.keys(donnees).forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.readOnly || el.disabled) return;
      if (el.type === "checkbox") {
        el.checked = donnees[id];
      } else {
        el.value = donnees[id];
      }
    });
  } catch (e) {
    console.error("Erreur restauration locale :", e);
  }
}
