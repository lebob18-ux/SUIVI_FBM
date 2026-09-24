/* ============================================================
   RÉCAPITULATIF PAR CHANTIER & GESTION DES ONGLETS
   ============================================================ */

const RECAP_EMAILS_AUTORISES = [
  "robert.lavignon@reseau.sncf.fr"
];

// Fonction pour gérer l'ouverture en mode accordéon des détails de chantier
window.basculerDetailChantier = function(idDetail) {
  const elementCible = document.getElementById(idDetail);
  if (!elementCible) return;

  const estDejaOuvert = elementCible.style.display === 'block';

  // 1. Fermer tous les blocs de détails de chantiers ouverts
  document.querySelectorAll('.detail-chantier-bloc').forEach(el => {
    el.style.display = 'none';
  });

  // 2. Si celui qu'on vient de cliquer n'était pas ouvert, on l'ouvre
  if (!estDejaOuvert) {
    elementCible.style.display = 'block';
  }
};

// Fonction pour gérer l'ouverture du sous-sous-détail (Cotes A, B, H réelles par support)
window.basculerDetailSupport = function(idSupportBloc) {
  const elementCible = document.getElementById(idSupportBloc);
  if (!elementCible) return;

  const estOuvert = elementCible.style.display === 'table-row';
  
  // Fermer les autres sous-détails de supports ouverts dans ce même tableau
  document.querySelectorAll('.detail-support-bloc').forEach(el => {
    el.style.display = 'none';
  });

  elementCible.style.display = estOuvert ? 'none' : 'table-row';
};

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

      // ID unique pour cibler le détail de ce chantier
      const idDetail = `detail-chantier-${nom.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Filtrer les supports appartenant à ce chantier pour le tableau détaillé
      const supportsDuChantier = dataBlindage.filter(row => (row.chantier ? String(row.chantier).trim().toUpperCase() : "INCONNU") === nom);

      let htmlLignesDetails = "";
      supportsDuChantier.forEach((s, index) => {
        const nomSupport = s.support || "-";
        const prevu = parseFloat(s.m3_prevu || s.m3_prevu_total || 0).toFixed(2);
        const reel = parseFloat(s.m3_reel || s.m3_reel_date || 0).toFixed(2);
        const valEff = s.effectue !== undefined ? s.effectue : s.Fait;
        const estFait = (parseFloat(reel) > 0) || (valEff === 1 || valEff === true || String(valEff).trim() === "1" || String(valEff).trim() === "OUI");
        const statutTxt = estFait ? "✅ Fait" : "⏳ En cours";
        const couleurStatut = estFait ? "#16a34a" : "#d97706";

        // Récupération des cotes réelles depuis les colonnes demandées
        const aReel = s.a_reel !== undefined && s.a_reel !== null && s.a_reel !== "" ? s.a_reel : "-";
        const bReel = s.b_reel !== undefined && s.b_reel !== null && s.b_reel !== "" ? s.b_reel : "-";
        const hReel = s.h_reel !== undefined && s.h_reel !== null && s.h_reel !== "" ? s.h_reel : "-";

        // ID unique pour le sous-bloc des cotes de ce support
        const idSupportBloc = `support-detail-${nom}-${nomSupport}-${index}`.replace(/[^a-zA-Z0-9]/g, '_');

        htmlLignesDetails += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:left; font-weight:bold;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>${nomSupport}</span>
                <button onclick="basculerDetailSupport('${idSupportBloc}')" style="background:#7C2270; color:#fff; border:none; border-radius:3px; padding:2px 5px; font-size:0.7em; cursor:pointer;" title="Afficher les cotes réelles A, B, H">📐 Cotes</button>
              </div>
            </td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center;">${prevu}</td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center;">${reel}</td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center; color:${couleurStatut}; font-weight:bold;">${statutTxt}</td>
          </tr>
          <!-- Sous-sous-détail masqué par défaut pour les cotes A, B, H réelles -->
          <tr id="${idSupportBloc}" class="detail-support-bloc" style="display:none; background:#faf5fa;">
            <td colspan="4" style="padding:6px 10px; border:1px solid #ddd;">
              <div style="font-size:0.75em; color:#7C2270; font-weight:bold; margin-bottom:3px;">🔍 Cotes réelles mesurées :</div>
              <div style="display:flex; justify-content:space-around; font-size:0.75em; color:#333; background:#fff; padding:4px; border-radius:3px; border:1px solid #e5d5e5;">
                <span>A réel : <strong>${aReel}</strong></span>
                <span>B réel : <strong>${bReel}</strong></span>
                <span>H réel : <strong>${hReel}</strong></span>
              </div>
            </td>
          </tr>
        `;
      });

      html += `
      <div style="margin-bottom:12px; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden; background:#fff;">
        <!-- En-tête cliquable avec la fonction accordéon -->
        <div onclick="basculerDetailChantier('${idDetail}')" style="background:linear-gradient(to right,#f7f0f6,#f5f5f5); padding:8px 10px; font-weight:bold; font-size:0.82em; color:#7C2270; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" title="Cliquer pour afficher/masquer le détail fouille par fouille">
          <span>📁 ${nom} <span style="font-size:0.8em; color:#666; font-weight:normal;">(Cliquer pour le détail)</span></span>
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

          <!-- Zone de détail avec la classe commune 'detail-chantier-bloc' pour l'accordéon -->
          <div id="${idDetail}" class="detail-chantier-bloc" style="display:none; margin-top:10px; border-top:1px dashed #ccc; padding-top:8px;">
            <div style="font-size:0.8em; font-weight:bold; color:#7C2270; margin-bottom:6px;">🔍 Détail des fouilles / supports :</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.75em;">
              <thead>
                <tr style="background:#fafafa;">
                  <th style="padding:4px 6px; border:1px solid #ddd; text-align:left; color:#555;">Support</th>
                  <th style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#555;">Prévu (m³)</th>
                  <th style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#555;">Réel (m³)</th>
                  <th style="padding:4px 6px; border:1px solid #ddd; text-align:center; color:#555;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${htmlLignesDetails}
              </tbody>
            </table>
          </div>

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
