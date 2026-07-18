/* ============================================================
   RÉCAPITULATIF PAR CHANTIER
   - Nombre de massifs effectués / total
   - m3 béton prévu et réel à date (sum des EFFECTUE=1)
   ============================================================ */

function genererRecap() {
  const container = document.getElementById("recap-content");
  if (!container) return;

  // Regrouper par chantier
  const chantiersMap = {};
  baseSupports.forEach(s => {
    if (!chantiersMap[s.chantier]) {
      chantiersMap[s.chantier] = { total: 0, effectues: 0, m3Prevu: 0, m3Reel: 0, m3PrevuTotal: 0 };
    }
    const c = chantiersMap[s.chantier];
    c.total++;
    c.m3PrevuTotal += parseFloat(s.m3_prevu) || 0;
    if (s.EFFECTUE === 1) {
      c.effectues++;
      c.m3Prevu += parseFloat(s.m3_prevu) || 0;
      c.m3Reel  += parseFloat(s.m3_reel)  || 0;
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
            <div style="background:${couleurBarre}; width:${pct}%; height:8px; border-radius:6px; transition:width 0.3s;"></div>
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:0.78em;">
            <thead>
              <tr>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:left; color:#555; border:1px solid #ddd;"></th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ prévu</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">m³ réel</th>
                <th style="background:#f5f5f5; padding:4px 6px; text-align:center; color:#555; border:1px solid #ddd;">Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px 6px; border:1px solid #ddd; color:#555;">À date (effectués)</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold;">${c.m3Prevu.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${c.m3Reel > c.m3Prevu ? '#dc2626' : '#16a34a'};">${c.m3Reel.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; font-weight:bold; color:${(c.m3Reel - c.m3Prevu) > 0 ? '#dc2626' : '#16a34a'};">${(c.m3Reel - c.m3Prevu) >= 0 ? '+' : ''}${(c.m3Reel - c.m3Prevu).toFixed(2)}</td>
              </tr>
              <tr style="background:#fafafa;">
                <td style="padding:4px 6px; border:1px solid #ddd; color:#999;">Total chantier (prévu)</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#999;">${c.m3PrevuTotal.toFixed(2)}</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#999;">-</td>
                <td style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#999;">-</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>`;
  });

  container.innerHTML = html;
}

// Regénérer le récap à chaque ouverture du bloc
const _origToggle = typeof toggleSection === "function" ? toggleSection : null;
window.toggleSection = function(id) {
  if (_origToggle) _origToggle(id);
  if (id === "sec-recap") {
    const section = document.getElementById(id);
    const estOuvert = section && !section.closest(".section")?.classList.contains("collapsed");
    if (estOuvert) genererRecap();
  }
};
