/* ============================================================
   RÉCAPITULATIF PAR CHANTIER & GESTION DES ONGLETS
   ============================================================ */

const RECAP_EMAILS_AUTORISES = [
  "robert.lavignon@reseau.sncf.fr"
];

async function genererRecap(containerId) {
  const cid = containerId || "recap-content-fbm";
  const container = document.getElementById(cid);
  if (!container) { console.warn("Container introuvable :", cid); return; }

  container.innerHTML = "<p style='color:#666; font-size:0.8em; text-align:center;'>Chargement des données...</p>";

  try {
    // 1. Récupération directe depuis Supabase (comme dans l'admin)
    const { data, error } = await supabaseClient
      .from('blindage')
      .select('*')
      .range(0, 9999);
    
    if (error) throw error;
    const dataBlindage = data || [];

    if (dataBlindage.length === 0) {
      container.innerHTML = "<p style='color:#999; font-size:0.8em; text-align:center;'>Aucune donnée disponible.</p>";
      return;
    }

    const chantiersMap = {};

    // 2. Traitement des données par chantier
    dataBlindage.forEach(row => {
      const nomChantier = row.chantier ? String(row.chantier).trim().toUpperCase() : "INCONNU";
      
      if (!chantiersMap[nomChantier]) {
        chantiersMap[nomChantier] = { 
          total: 0, 
          effectues: 0, 
          m3TotalPrevu: 0,   
          m3PrevuEffectue: 0, 
          m3ReelTotal: 0       
        };
      }
      
      const c = chantiersMap[nomChantier];
      c.total++;
      
      const m3PrevuVal = parseFloat(row.m3_prevu || row.m3_prevu_total || 0);
      const m3ReelVal = parseFloat(row.m3_reel || row.m3_reel_date || 0);

      c.m3TotalPrevu += m3PrevuVal;

      // Vérification si réalisé (via m3 réel > 0 ou colonne effectue/Fait)
      const valEff = row.effectue !== undefined ? row.effectue : row.Fait;
      const estRealise = (m3ReelVal > 0) || (valEff === 1 || valEff === true || String(valEff).trim() === "1" || String(valEff).trim() === "OUI");

      if (estRealise) {
        c.effectues++;
        c.m3PrevuEffectue += m3PrevuVal;
        c.m3ReelTotal += m3ReelVal;
      }
    });

    const chantiers = Object.keys(chantiersMap).sort();
    let html = "";

    chantiers.forEach(nom => {
      const c = chantiersMap[nom];
      const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
      const couleurBarre = pct === 100 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#7C2270";
      
      const ecart = c.m3ReelTotal - c.m3PrevuEffectue;
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
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ prévu (réalisé)</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ réel</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold;">${c.m3PrevuEffectue.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${couleurEcart};">${c.m3ReelTotal.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${couleurEcart};">${ecart >= 0 ? '+' : ''}${ecart.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error("Erreur chargement récap :", err);
    container.innerHTML = "<p style='color:#dc2626; font-size:0.8em; text-align:center;'>Erreur lors du chargement des données de récapitulatif.</p>";
  }
}

/* ============================================================
   GESTION DES ONGLETS (FBM / Admin)
   ============================================================ */

window.ouvrirOnglet = function(nom) {
  const fbmPage  = document.getElementById("fbmPage");
  const adminPage = document.getElementById("adminPage");
  
  if (fbmPage)  fbmPage.style.display   = nom === "fbm"   ? "block" : "none";
  if (adminPage) adminPage.style.display = nom === "admin" ? "block" : "none";
  
  document.getElementById("tabFBM")?.classList.toggle("active", nom === "fbm");
  document.getElementById("tabAdmin")?.classList.toggle("active", nom === "admin");
  
  if (nom === "admin") {
    setTimeout(() => genererRecap("recap-content-admin"), 100);
  }
};

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
