/* ============================================================
   RÉCAPITULATIF PAR CHANTIER & GESTION DES ONGLETS & POPUP
   ============================================================ */

const RECAP_EMAILS_AUTORISES = [
  "robert.lavignon@reseau.sncf.fr"
];

// Injection automatique du conteneur de la modale (Popup) s'il n'existe pas
function initialiserPopupSupport() {
  if (document.getElementById("modalDetailSupport")) return;

  const modalHtml = `
    <div id="modalDetailSupport" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center; padding:15px;">
      <div style="background:#fff; width:100%; max-width:420px; border-radius:10px; box-shadow:0 4px 15px rgba(0,0,0,0.3); overflow:hidden; animation: fadeInModal 0.2s ease-in-out;">
        
        <!-- En-tête de la popup -->
        <div style="background:#7C2270; color:#fff; padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">
          <h3 id="modalTitreSupport" style="margin:0; font-size:1em;">Détail du support</h3>
          <button onclick="fermerPopupSupport()" style="background:none; border:none; color:#fff; font-size:1.2em; cursor:pointer; font-weight:bold;">&times;</button>
        </div>

        <!-- Corps de la popup avec les informations -->
        <div id="modalCorpsSupport" style="padding:16px; font-size:0.85em; color:#333; max-height:70vh; overflow-y:auto;">
          <!-- Injecté dynamiquement -->
        </div>

        <!-- Pied de page de la popup -->
        <div style="background:#f5f5f5; padding:10px 16px; text-align:right; border-top:1px solid #ddd;">
          <button onclick="fermerPopupSupport()" style="background:#7C2270; color:#fff; border:none; padding:6px 14px; border-radius:5px; cursor:pointer; font-size:0.85em;">Fermer</button>
        </div>

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Fonction pour ouvrir la popup avec les données du support
window.ouvrirPopupSupport = function(supportJsonStr) {
  initialiserPopupSupport();
  try {
    const s = JSON.parse(decodeURIComponent(supportJsonStr));
    
    document.getElementById("modalTitreSupport").innerText = `Support : ${s.support || '-'}`;
    
    const fktVal = s.fkt || '-';
    const chantierVal = s.chantier || '-';
    const prevuM3 = parseFloat(s.m3_prevu || s.m3_prevu_total || 0).toFixed(2);
    const reelM3 = parseFloat(s.m3_reel || s.m3_reel_date || 0).toFixed(2);
    const dateBeton = s.date_beton ? s.date_beton : "Non coulée";
    
    const aReel = s.a_reel !== undefined && s.a_reel !== null && s.a_reel !== "" ? s.a_reel : "-";
    const bReel = s.b_reel !== undefined && s.b_reel !== null && s.b_reel !== "" ? s.b_reel : "-";
    const hReel = s.h_reel !== undefined && s.h_reel !== null && s.h_reel !== "" ? s.h_reel : "-";

    const aPrevu = s.a_prevu !== undefined && s.a_prevu !== null && s.a_prevu !== "" ? s.a_prevu : "-";
    const bPrevu = s.b_prevu !== undefined && s.b_prevu !== null && s.b_prevu !== "" ? s.b_prevu : "-";
    const hPrevu = s.h_prevu !== undefined && s.h_prevu !== null && s.h_prevu !== "" ? s.h_prevu : "-";

    const corpsHtml = `
      <div style="margin-bottom: 12px; background:#fdfbfd; padding:10px; border-radius:6px; border:1px solid #f0e6ef;">
        <p style="margin:4px 0;"><strong>Chantier :</strong> ${chantierVal}</p>
        <p style="margin:4px 0;"><strong>Point Kilométrique (FKT) :</strong> <span style="color:#7C2270; font-weight:bold;">${fktVal}</span></p>
        <p style="margin:4px 0;"><strong>Date béton :</strong> ${dateBeton}</p>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:12px;">
        <div style="flex:1; background:#f5f5f5; padding:8px; border-radius:6px; text-align:center;">
          <div style="font-size:0.75em; color:#666;">Volume Prévu</div>
          <div style="font-weight:bold; font-size:1.1em; color:#333;">${prevuM3} m³</div>
        </div>
        <div style="flex:1; background:#f5f5f5; padding:8px; border-radius:6px; text-align:center;">
          <div style="font-size:0.75em; color:#666;">Volume Réel</div>
          <div style="font-weight:bold; font-size:1.1em; color:#7C2270;">${reelM3} m³</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:8px; font-size:0.9em;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="border:1px solid #ddd; padding:6px; text-align:left;">Cotes</th>
            <th style="border:1px solid #ddd; padding:6px; text-align:center;">Prévues</th>
            <th style="border:1px solid #ddd; padding:6px; text-align:center;">Réelles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #ddd; padding:6px; font-weight:bold;">A</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center;">${aPrevu}</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center; color:#7C2270; font-weight:bold;">${aReel}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:6px; font-weight:bold;">B</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center;">${bPrevu}</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center; color:#7C2270; font-weight:bold;">${bReel}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:6px; font-weight:bold;">H</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center;">${hPrevu}</td>
            <td style="border:1px solid #ddd; padding:6px; text-align:center; color:#7C2270; font-weight:bold;">${hReel}</td>
          </tr>
        </tbody>
      </table>
    `;

    document.getElementById("modalCorpsSupport").innerHTML = corpsHtml;
    document.getElementById("modalDetailSupport").style.display = "flex";
  } catch (e) {
    console.error("Erreur ouverture popup support :", e);
  }
};

// Fonction pour fermer la popup
window.fermerPopupSupport = function() {
  const modal = document.getElementById("modalDetailSupport");
  if (modal) modal.style.display = "none";
};

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

async function genererRecap(containerId) {
  const cid = containerId || "recap-content-fbm";
  const container = document.getElementById(cid);
  if (!container) { console.warn("Container introuvable :", cid); return; }

  container.innerHTML = "<p style='color:#666; font-size:0.8em; text-align:center;'>Chargement des données...</p>";

  try {
    // 1. Récupération directe depuis Supabase
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

      // Vérification si réalisé : présence d'une date dans date_beton
      const dateBetonVal = row.date_beton ? String(row.date_beton).trim() : "";
      const estRealise = dateBetonVal !== "" && dateBetonVal !== "null" && dateBetonVal !== "undefined";

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

      const idDetail = `detail-chantier-${nom.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const supportsDuChantier = dataBlindage.filter(row => (row.chantier ? String(row.chantier).trim().toUpperCase() : "INCONNU") === nom);

      let htmlLignesDetails = "";
      supportsDuChantier.forEach((s) => {
        const nomSupport = s.support || "-";
        const fktVal = s.fkt || "-";
        const prevu = parseFloat(s.m3_prevu || s.m3_prevu_total || 0).toFixed(2);
        const reel = parseFloat(s.m3_reel || s.m3_reel_date || 0).toFixed(2);
        
        const dateBetonVal = s.date_beton ? String(s.date_beton).trim() : "";
        const estFait = dateBetonVal !== "" && dateBetonVal !== "null" && dateBetonVal !== "undefined";
        const statutTxt = estFait ? "✅ Fait" : "⏳ En cours";
        const couleurStatut = estFait ? "#16a34a" : "#d97706";

        // Encodage sécurisé de l'objet pour le passer dans le bouton de la popup
        const supportJsonEncoded = encodeURIComponent(JSON.stringify(s));

        htmlLignesDetails += `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:left; font-weight:bold;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <button onclick="ouvrirPopupSupport('${supportJsonEncoded}')" style="background:#7C2270; color:#fff; border:none; border-radius:3px; padding:3px 6px; font-size:0.7em; cursor:pointer;" title="Voir les détails complets">🔍 ${nomSupport}</button>
              </div>
            </td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center;">${prevu}</td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center;">${reel}</td>
            <td style="padding:5px 6px; border:1px solid #ddd; text-align:center; color:${couleurStatut}; font-weight:bold;">${statutTxt}</td>
          </tr>
        `;
      });

      html += `
      <div style="margin-bottom:12px; border:1px solid #e5e5e5; border-radius:8px; overflow:hidden; background:#fff;">
        <!-- En-tête cliquable -->
        <div onclick="basculerDetailChantier('${idDetail}')" style="background:linear-gradient(to right,#f7f0f6,#f5f5f5); padding:8px 10px; font-weight:bold; font-size:0.82em; color:#7C2270; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" title="Cliquer pour afficher/masquer le détail fouille par fouille">
          <span>📁 ${nom} </span>
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

          <!-- Zone de détail -->
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
