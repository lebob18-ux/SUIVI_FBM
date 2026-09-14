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
  if (typeof baseSupports === "undefined") { console.error("baseSupports non défini"); return; }

  container.innerHTML = "<p style='color:#666; font-size:0.8em; text-align:center;'>Chargement des données...</p>";

  // 1. Récupération des données réelles depuis Supabase
  let dataSupabase = [];
  try {
    const { data, error } = await supabaseClient
      .from('blindage')
      .select('chantier, support, m3_reel, effectue');
    
    if (!error && data) {
      dataSupabase = data;
    }
  } catch (err) {
    console.warn("⚠️ Impossible de charger les volumes réels depuis Supabase :", err);
  }

  // Création d'une map pour retrouver rapidement les m3 réels de Supabase par Chantier_Support
  const supabaseMap = {};
  dataSupabase.forEach(row => {
    const cle = `${String(row.chantier).trim()}_${String(row.support).trim()}`;
    supabaseMap[cle] = {
      m3_reel: parseFloat(row.m3_reel) || 0,
      effectue: row.effectue
    };
  });

  const chantiersMap = {};
  baseSupports.forEach(s => {
    const nomChantier = String(s.chantier).trim();
    const nomSupport = String(s.support).trim();
    const cleSupabase = `${nomChantier}_${nomSupport}`;

    if (!chantiersMap[nomChantier]) {
      chantiersMap[nomChantier] = { 
        total: 0, 
        effectues: 0, 
        m3TotalPrevu: 0,      // Somme totale de tous les prévus du chantier
        m3PrevuEffectue: 0,   // Somme des m3 prévus des supports réalisés (pour l'écart)
        m3ReelTotal: 0        // Somme des vrais m3 réels saisis sur le terrain
      };
    }
    const c = chantiersMap[nomChantier];
    c.total++;
    
    const m3PrevuVal = parseFloat(s.m3_prevu) || 0;
    c.m3TotalPrevu += m3PrevuVal; // 1. Total global prévu du chantier

    // Données Supabase
    const supData = supabaseMap[cleSupabase];
    const valEff = supData ? supData.effectue : (s.EFFECTUE !== undefined ? s.EFFECTUE : (s.effectue !== undefined ? s.effectue : ""));
    
    // On prend STRICTEMENT le m3 réel saisi (sans fallback sur le prévu)
    const m3ReelVal = supData ? (parseFloat(supData.m3_reel) || 0) : 0;

    const estRealise = (m3ReelVal > 0) || (valEff === 1 || String(valEff).trim() === "1" || String(valEff).trim() === "OUI");

    if (estRealise) {
      c.effectues++;
      c.m3PrevuEffectue += m3PrevuVal; // Prévu des éléments réalisés
      c.m3ReelTotal += m3ReelVal;      // Vrai réel cumulé
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
    
    // Écart = Total des m3 réels - Total des m3 prévus des éléments réalisés
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
