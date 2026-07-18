/* ==========================================
   BLOCS PLIABLES (sections avec titre cliquable)
   ========================================== */
function toggleSection(contentId) {
  const content = document.getElementById(contentId);
  if (!content) return;
  const section = content.closest(".section");
  if (section) section.classList.toggle("collapsed");
}

/* ==========================================
   OUVERTURE AUTOMATIQUE DU BLOC "ALERTES"
   S'ouvre uniquement s'il y a une alerte blindage
   et/ou une alerte LTV en cours. Se referme sinon.
   ========================================== */
function evaluerAlertes() {
  const wrap = document.getElementById("sec-alertes-wrap");
  if (!wrap) return;

  const ltvEl = document.getElementById("ltv");
  const tbfEl = document.getElementById("tbf");
  const alerteBlindageEl = document.getElementById("alerte_blindage_bloc");

  const alerteLTV = !!(ltvEl && ltvEl.innerText.trim() !== "");
  const alerteBlindageTbf = !!(tbfEl && tbfEl.innerText.includes("🚨"));
  const alerteBlindageBloc = !!(alerteBlindageEl && alerteBlindageEl.innerText.includes("🚨"));

  const uneAlerteActive = alerteLTV || alerteBlindageTbf || alerteBlindageBloc;

  wrap.classList.toggle("collapsed", !uneAlerteActive);
}
function ouvrirOnglet(nom) {
  // Pages
  document.getElementById("fbmPage").style.display = nom === "fbm" ? "" : "none";
  document.getElementById("adminPage").style.display = nom === "admin" ? "" : "none";

  // Onglets actifs
  document.getElementById("tabFBM").classList.toggle("active", nom === "fbm");
  document.getElementById("tabAdmin").classList.toggle("active", nom === "admin");

  // Générer le récap quand on ouvre l'admin
  if (nom === "admin" && typeof genererRecap === "function") genererRecap();
}
