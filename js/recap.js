/* ============================================================
   RÉCAPITULATIF PAR CHANTIER
   - Nombre de massifs effectués / total
   - m3 béton prévu total et réel total par chantier
   ============================================================ */

function genererRecap() {
  // On récupère tous les éléments ayant la classe .sec-recap-content 
  // (Assure-toi de mettre cette classe dans ton HTML à la place de l'ID pour le conteneur interne)
  const containers = document.querySelectorAll(".sec-recap-content");
  
  if (containers.length === 0) return;

  // 1. Regrouper les données par chantier
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
  let html = "";

  if (chantiers.length === 0) {
    html = "<p style='color:#999; font-size:0.8em; text-align:center;'>Aucune donnée disponible.</p>";
  } else {
    // 2. Construire le HTML pour chaque chantier
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
  }

  // 3. Appliquer le HTML à tous les conteneurs trouvés
  containers.forEach(container => {
    container.innerHTML = html;
  });
}

// Intercepter le toggle pour rafraîchir
const _origToggle = typeof toggleSection === "function" ? toggleSection : null;
window.toggleSection = function(id) {
  if (_origToggle) _origToggle(id);
  if (id === "sec-recap") {
    setTimeout(genererRecap, 50);
  }
};
// On s'assure que le contenu est généré même si l'onglet est masqué
window.addEventListener('load', () => {
    setTimeout(genererRecap, 500);
});
