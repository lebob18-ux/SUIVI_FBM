/* ============================================================
   RÉCAPITULATIF PAR CHANTIER
   ============================================================ */

const RECAP_EMAILS_AUTORISES = [
  "robert.lavignon@reseau.sncf.fr"
];

function genererRecap(containerId) {
  const cid = containerId || "recap-content-fbm";
  const container = document.getElementById(cid);
  if (!container) { console.warn("Container introuvable :", cid); return; }
  if (typeof baseSupports === "undefined") { console.error("baseSupports non défini"); return; }

  const chantiersMap = {};
  baseSupports.forEach(s => {
    if (!chantiersMap[s.chantier]) {
      chantiersMap[s.chantier] = { 
        total: 0, 
        effectues: 0, 
        m3TotalPrevu: 0,     // Total de TOUTES les fouilles du chantier
        m3PrevuEffectue: 0,  // Total prévu UNIQUEMENT pour les effectuées (avec 1)
        m3Reel: 0 
      };
    }
    const c = chantiersMap[s.chantier];
    c.total++;
    
    const m3PrevuVal = parseFloat(s.m3_prevu) || 0;

    // 1. On cumule toujours dans le total prévu du chantier (peu importe EFFECTUE)
    c.m3TotalPrevu += m3PrevuVal;

    // 2. On ne cumule dans le réalisé/effectué que si EFFECTUE == 1
    if (s.EFFECTUE == 1) {
      c.effectues++;
      c.m3PrevuEffectue += m3PrevuVal;
      c.m3Reel  += parseFloat(s.m3_reel) || 0;
    }
  });

  const chantiers = Object.keys(chantiersMap);
  if (chantiers.length === 0) {
    container.innerHTML = "<p style='color:#999; font-size:0.8em; text-align:center;'>Aucune donnée disponible.</p>";
    return;
  }

  let html = "";
  chantiers.forEach(nom => {
    const c = chantiersMap[nom];
    const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
    const couleurBarre = pct === 100 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#7C2270";
    
    // L'écart se calcule entre le réel et le prévu des éléments effectivement réalisés
    const ecart = c.m3Reel - c.m3PrevuEffectue;
    const couleurEcart = ecart > 0 ? "#dc2626" : "#16a34a";

    html += `
      <div style="margin-bottom:12px; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
        <div style="background:linear-gradient(to right,#f7f0f6,#f5f5f5); padding:6px 10px; font-weight:bold; font-size:0.82em; color:#7C2270; display:flex; justify-content:space-between; align-items:center;">
          <span>📁 ${nom}</span>
          <span style="font-size:0.95em; color:#333;">Total chantier : <strong>${c.m3TotalPrevu.toFixed(2)} m³</strong></span>
        </div>
        <div style="padding:8px 10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.78em; color:#555; margin-bottom:4px;">
            <span>Massifs : <strong>${c.effectues} / ${c.total}</strong></span>
            <span style="color:${couleurBarre}; font-weight:bold;">${pct}%</span>
          </div>
          <div style="background:#eee; border-radius:6px; height:8px; margin-bottom:8px;">
            <div style="background:${couleurBarre}; width:${pct}%; height:8px; border-radius:6px;"></div>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.78em;">
            <thead>
              <tr>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ prévu (faits)</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ réel</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold;">${c.m3PrevuEffectue.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${couleurEcart};">${c.m3Reel.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${couleurEcart};">${ecart >= 0 ? '+' : ''}${ecart.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

/* Bascule onglets FBM / Admin */
function ouvrirOnglet(nom) {
  const fbmPage   = document.getElementById("fbmPage");
  const adminPage = document.getElementById("adminPage");
  if (fbmPage)   fbmPage.style.display   = nom === "fbm"   ? "block" : "none";
  if (adminPage) adminPage.style.display = nom === "admin" ? "block" : "none";
  document.getElementById("tabFBM")?.classList.toggle("active", nom === "fbm");
  document.getElementById("tabAdmin")?.classList.toggle("active", nom === "admin");
  if (nom === "admin") setTimeout(() => genererRecap("recap-content-admin"), 100);

}

/* Visibilité onglet Admin selon email */
function controlerVisibiliteRecap() {
  const btnAdmin = document.getElementById("tabAdmin");
  if (!btnAdmin) return;
  try {
    const identite = JSON.parse(localStorage.getItem("fbm_identite_redacteur") || "{}");
    const email = (identite.email || "").toLowerCase().trim();
    btnAdmin.style.display = RECAP_EMAILS_AUTORISES.includes(email) ? "" : "none";
  } catch (e) {
    if (btnAdmin) btnAdmin.style.display = "none";
  }
}

/* Récap dans le bloc pliable FBM */
const _origToggle = typeof toggleSection === "function" ? toggleSection : null;
window.toggleSection = function(id) {
  if (_origToggle) _origToggle(id);
  if (id === "sec-recap-fbm") {
    setTimeout(() => {
      const section = document.getElementById(id);
      if (section && !section.closest(".section").classList.contains("collapsed")) {
        genererRecap("recap-content-fbm");
      }
    }, 50);
  }
};

window.addEventListener("load", controlerVisibiliteRecap);
