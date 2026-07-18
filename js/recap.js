/* ============================================================
   RÉCAPITULATIF PAR CHANTIER
   - Nombre de massifs effectués / total
   - m3 béton prévu total et réel total par chantier
   ============================================================ */

/* Emails autorisés à voir l'onglet Admin / récapitulatif */
const RECAP_EMAILS_AUTORISES = [
  "robert.lavignon@reseau.sncf.fr"
];

function genererRecap(containerId) {
   if (typeof baseSupports === "undefined") {
        console.error("ERREUR : baseSupports n'est pas défini !");
        return;
    }
   console.log("Tentative de génération dans :", containerId);
  console.log("Données trouvées :", baseSupports); // <--- AJOUTE ÇA
  const cid = containerId || "recap-content";
  const container = document.getElementById(cid);
  if (!container) return;

  const chantiersMap = {};
  baseSupports.forEach(s => {
    if (!chantiersMap[s.chantier]) {
      chantiersMap[s.chantier] = { total: 0, effectues: 0, m3Prevu: 0, m3Reel: 0 };
    }
    const c = chantiersMap[s.chantier];
    c.total++;
    c.m3Prevu += parseFloat(s.m3_prevu) || 0;
    c.m3Reel  += parseFloat(s.m3_reel)  || 0;
    if (s.EFFECTUE == 1) c.effectues++;
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
    const ecart = c.m3Reel - c.m3Prevu;
    const couleurEcart = ecart > 0 ? "#dc2626" : "#16a34a";

    html += `
      <div style="margin-bottom:12px; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden;">
        <div style="background:linear-gradient(to right,#f7f0f6,#f5f5f5); padding:6px 10px; font-weight:bold; font-size:0.82em; color:#7C2270;">
          📁 ${nom}
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
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ prévu</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ réel</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold;">${c.m3Prevu.toFixed(2)}</td>
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

/* Contrôle visibilité onglet Admin selon email */
function controlerVisibiliteRecap() {
  const btnAdmin = document.getElementById("tabAdmin");
  if (!btnAdmin) return;
  try {
    const identite = JSON.parse(localStorage.getItem("fbm_identite_redacteur") || "{}");
    const email = (identite.email || "").toLowerCase().trim();
    const autorise = RECAP_EMAILS_AUTORISES.includes(email);
    btnAdmin.style.display = autorise ? "" : "none";
  } catch (e) {
    if (btnAdmin) btnAdmin.style.display = "none";
  }
}

/* Bascule entre onglets FBM / Admin */


const _origToggle = typeof toggleSection === "function" ? toggleSection : null;


window.addEventListener("load", controlerVisibiliteRecap);
