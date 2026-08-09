/* ============================================================
   EXPORT PDF SUIVI GC PCLE-MMM — VERSION AVEC BARRE PROGRESSION
   ============================================================ */
function genererDonut(effectues, total, couleur) {
  const s = 120;
  const canvas = document.createElement("canvas");
  canvas.width = s; canvas.height = s;
  const ctx = canvas.getContext("2d");
  const cx = s/2, cy = s/2, rExt = s/2 - 4, rInt = rExt * 0.52;
  const pct = total > 0 ? effectues / total : 0;

  // Fond gris
  ctx.beginPath(); ctx.arc(cx, cy, rExt, 0, 2*Math.PI);
  ctx.fillStyle = "#e5e7eb"; ctx.fill();

  // Arc coloré
  if (pct > 0) {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rExt, -Math.PI/2, -Math.PI/2 + 2*Math.PI*pct);
    ctx.closePath();
    ctx.fillStyle = `rgb(${couleur[0]},${couleur[1]},${couleur[2]})`; ctx.fill();
  }

  // Trou central blanc
  ctx.beginPath(); ctx.arc(cx, cy, rInt, 0, 2*Math.PI);
  ctx.fillStyle = "white"; ctx.fill();

  // Texte %
  const pctCouleur = pct === 1 ? "#16a34a" : pct >= 0.5 ? "#f59e0b" : `rgb(${couleur[0]},${couleur[1]},${couleur[2]})`;
  ctx.fillStyle = pctCouleur;
  ctx.font = `bold ${Math.round(s*0.22)}px Arial`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(Math.round(pct*100) + "%", cx, cy);

  return canvas.toDataURL("image/jpeg", 0.9);
}
async function exporterRecapPDF() {
  // Désactive le bouton pendant la génération pour éviter les clics multiples
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    // Création du document PDF (Format A4 standard)
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // --- Configuration des couleurs ---
    const violet = [124, 34, 112];
    const blanc = [255, 255, 255];
    const vert = [22, 163, 74];
    const orange = [245, 158, 11];
    const rouge = [220, 38, 38];
    const grisClair = [230, 230, 230];

    const couleursEE = {
      "TSO": [30, 144, 255],
      "ETF": [29, 78, 216],
      "HP-ELECT": [15, 23, 42],
      "SANS ENTREPRISE": [100, 100, 100]
    };

    // --- Paramètres de mise en page ---
    const pageW = doc.internal.pageSize.getWidth();
    const marge = 8;
    const gap = 3; // Espace entre les deux colonnes
    const colW = (pageW - marge * 2 - gap) / 2; // Largeur d'une colonne
    const blockH = 22; // Hauteur totale d'un bloc chantier

    // --- Regroupement des données ---
    const entreprisesMap = {};
    baseSupports.forEach(s => {
      const eeNom = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const ch = s.chantier || "INCONNU";
      
      if (!entreprisesMap[eeNom]) entreprisesMap[eeNom] = {};
      if (!entreprisesMap[eeNom][ch]) {
        entreprisesMap[eeNom][ch] = { total: 0, effectues: 0, m3TotalPrevu: 0, m3PrevuEffectue: 0, m3Reel: 0 };
      }
      
      const c = entreprisesMap[eeNom][ch];
      c.total++;
      const m3p = parseFloat(s.m3_prevu) || 0;
      c.m3TotalPrevu += m3p;
      
      // Si la colonne EFFECTUE vaut 1, on cumule
      if (String(s.EFFECTUE).trim() === "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3p;
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
    });

    // --- Fonction pour dessiner chaque bloc chantier ---
    function dessinerChantier(x, y, nom, c, couleurEE) {
      // Calcul du pourcentage d'avancement
      const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
      // Couleur de la barre : Vert si fini, Orange si en cours, Bleu (EE) sinon
      let couleurBarre = pct === 100 ? vert : (pct >= 50 ? orange : couleurEE);
      const ecart = c.m3Reel - c.m3PrevuEffectue;

// 1. En-tête du bloc chantier
doc.setFillColor(...couleurEE);
doc.roundedRect(x, y, colW, 6, 0.5, 0.5, "F");

doc.setTextColor(...blanc);
doc.setFont("helvetica", "bold");
doc.setFontSize(6.5);

// Nom du chantier à gauche
doc.text("CH. " + nom, x + 1.5, y + 4);

// Avancement à droite
doc.text(
  pct + "%",
  x + colW - 1.5,
  y + 4,
  { align: "right" }
);


// 2. Barre d'avancement des fouilles
const barX = x + 1.5;
const barY = y + 7;
const barW = colW - 3;
const barH = 2.5;

// Fond de la barre
doc.setFillColor(...grisClair);
doc.roundedRect(barX, barY, barW, barH, 0.5, 0.5, "F");

// Partie colorée
if (pct > 0) {
  doc.setFillColor(...couleurBarre);
  doc.roundedRect(
    barX,
    barY,
    barW * (pct / 100),
    barH,
    0.5,
    0.5,
    "F"
  );
}

// Pourcentage d'avancement
doc.setFont("helvetica", "bold");
doc.setFontSize(6);
doc.setTextColor(...couleurBarre);


      // 3. Tableau des volumes (autoTable est idéal pour les colonnes propres)
      doc.autoTable({
        startY: y + 10,
        margin: { left: x, right: pageW - (x + colW) },
        head: [["Prév.", "Fait", "Réel", "Écart"]],
        body: [[
          c.m3TotalPrevu.toFixed(1),      // Volume prévu total
          c.m3PrevuEffectue.toFixed(1),  // Volume prévu des effectués
          c.m3Reel.toFixed(1),           // Volume réel mesuré
          (ecart >= 0 ? "+" : "") + ecart.toFixed(1) // Écart
        ]],
        theme: "grid",
        styles: { fontSize: 5.5, cellPadding: 0.5, halign: "center" },
        headStyles: { fillColor: [80, 80, 80], textColor: blanc },
        columnStyles: { 3: { textColor: ecart > 0 ? rouge : vert } } // Rouge si dépassement
      });
    }

// 1. Récupération de la date la plus récente (MAX)
const dates = baseSupports
  .map(s => s.date) // On extrait toutes les dates
  .filter(d => d)   // On enlève les vides
  .sort();          // On trie par ordre alphabétique (le format ISO rend le tri parfait)

const derniereDate = dates.length > 0 ? dates[dates.length - 1] : "N/A";

// 2. Conversion pour l'affichage (ex: 2026-08-08 -> 08/08/2026)
const dateAffichee = derniereDate !== "N/A" 
  ? derniereDate.split('-').reverse().join('/') 
  : "Aucune date";


     
    // --- Construction du PDF ---
    // Titre Global
// Titre Global avec la date dynamique
doc.setFillColor(...violet);
doc.rect(0, 0, pageW, 15, "F");
doc.setTextColor(...blanc);
doc.setFontSize(12);
doc.text("SUIVI GC PCLE-MMM", pageW / 2, 8, { align: "center" });
doc.setFontSize(8);
doc.text("Dernier relevé : " + dateAffichee, pageW / 2, 13, { align: "center" });

    let currentY = 20;
    // Boucle sur chaque entreprise
    Object.entries(entreprisesMap).forEach(([eeNom, chantiersEE]) => {
      // Nouvelle page si on dépasse le bas de la feuille
      if (currentY > 260) { doc.addPage(); currentY = 15; }
      
      const couleurEE = couleursEE[eeNom] || [30, 144, 255];
      doc.setTextColor(...couleurEE);
      doc.setFontSize(9);
      doc.text("■ " + eeNom, marge, currentY);
      currentY += 5;

      // Boucle sur les chantiers (2 colonnes)
      Object.entries(chantiersEE).forEach(([nom, c], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marge + col * (colW + gap);
        const y = currentY + row * (blockH + 5);
        dessinerChantier(x, y, nom, c, couleurEE);
        // Mise à jour de la position Y pour le prochain groupe
        if (i === Object.keys(chantiersEE).length - 1) currentY = y + blockH + 10;
      });
    });
     
// ================================================================
// PAGE 2 : SUIVI PAR CPT
// ================================================================
doc.addPage();

// En-tête page 2
doc.setFillColor(...violet);
doc.rect(0, 0, pageW, 12, "F");
doc.setTextColor(...blanc);
doc.setFontSize(11); doc.setFont("helvetica", "bold");
doc.text("SUIVI PAR CPT", pageW / 2, 7, { align: "center" });
doc.setFontSize(7); doc.setFont("helvetica", "normal");
doc.text("Dernier relevé : " + dateAffichee, pageW / 2, 11, { align: "center" });

// Regroupement par CPT
const cptMap = {};
baseSupports.forEach(s => {
  const cpt = (s.CPT || "SANS CPT").trim();
  if (!cptMap[cpt]) cptMap[cpt] = { total:0, effectues:0, m3Prevu:0, m3Reel:0, chantiers:{} };
  const cc = cptMap[cpt];
  cc.total++;
  const m3p = parseFloat(s.m3_prevu) || 0;
  cc.m3Prevu += m3p;
  const ch = s.chantier || "?";
  if (!cc.chantiers[ch]) cc.chantiers[ch] = { total:0, effectues:0 };
  cc.chantiers[ch].total++;
  if (String(s.EFFECTUE).trim() === "1") {
    cc.effectues++;
    cc.m3Reel += parseFloat(s.m3_reel) || 0;
    cc.chantiers[ch].effectues++;
  }
});

let cptY = 16;
const cptEntries = Object.entries(cptMap).sort((a, b) => a[0].localeCompare(b[0]));
const couleurCPT = [124, 34, 112]; // violet AINM pour CPT

cptEntries.forEach(([cptNom, cc]) => {
  // Vérifier espace
  if (cptY + 35 > 280) { doc.addPage(); cptY = 8; }

  const pct = cc.total > 0 ? Math.round((cc.effectues / cc.total) * 100) : 0;
  const coulBarre = pct === 100 ? vert : pct >= 50 ? orange : couleurCPT;
  const ecart = cc.m3Reel - cc.m3Prevu;

  // Bande CPT
  doc.setFillColor(...couleurCPT.map(v => Math.min(255, v + 100)));
  doc.rect(marge, cptY, pageW - marge*2, 6, "F");
  doc.setFillColor(...couleurCPT);
  doc.rect(marge, cptY, 3, 6, "F");
  doc.setTextColor(...couleurCPT);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("CPT : " + cptNom, marge + 5, cptY + 4.3);
  cptY += 7;

  // Donut (gauche)
  const donutImg = genererDonut(cc.effectues, cc.total, coulBarre);
  const donutMM = 20;
  doc.addImage(donutImg, "JPEG", marge, cptY, donutMM, donutMM);

  // Stats (droite du donut)
  const statsX = marge + donutMM + 4;
  doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.text(`Massifs : ${cc.effectues} / ${cc.total}`, statsX, cptY + 4);
  doc.text(`m³ prévu total : ${cc.m3Prevu.toFixed(1)}`, statsX, cptY + 9);
  doc.text(`m³ réel : ${cc.m3Reel.toFixed(1)}`, statsX, cptY + 14);
  const coulEcart = ecart > 0 ? rouge : vert;
  doc.setTextColor(...coulEcart); doc.setFont("helvetica", "bold");
  doc.text(`Écart : ${ecart >= 0 ? "+" : ""}${ecart.toFixed(1)} m³`, statsX, cptY + 19);

  // Mini-liste chantiers (à droite)
  const chEntries = Object.entries(cc.chantiers);
  const listeX = statsX + 50;
  doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  chEntries.slice(0, 8).forEach(([ch, cv], idx) => {
    const p = cv.total > 0 ? Math.round((cv.effectues/cv.total)*100) : 0;
    const col = idx % 2; const row = Math.floor(idx / 2);
    const cx2 = listeX + col * 35; const cy2 = cptY + row * 5;
    doc.setTextColor(80,80,80); doc.text(ch, cx2, cy2 + 3.5);
    // mini-barre
    doc.setFillColor(...grisClair); doc.roundedRect(cx2, cy2 + 3.8, 20, 1.2, 0.2, 0.2, "F");
    if (p > 0) { doc.setFillColor(...coulBarre); doc.roundedRect(cx2, cy2 + 3.8, 20*p/100, 1.2, 0.2, 0.2, "F"); }
    doc.setTextColor(...coulBarre); doc.setFont("helvetica","bold"); doc.setFontSize(5.5);
    doc.text(p+"%", cx2+21, cy2+4.5);
  });
  if (chEntries.length > 8) {
    doc.setTextColor(150,150,150); doc.setFontSize(5.5);
    doc.text("+" + (chEntries.length-8) + " autres", listeX, cptY + 22);
  }

  cptY += donutMM + 5;
});
// ================================================================
// FIN PAGE 2
// ================================================================
 // ================================================================
// PAGE 3 : SUIVI PAR CHANTIER (2 par ligne)
// ================================================================
doc.addPage();

// En-tête
doc.setFillColor(...violet);
doc.rect(0, 0, pageW, 12, "F");
doc.setTextColor(...blanc);
doc.setFont("helvetica", "bold"); doc.setFontSize(11);
doc.text("SUIVI PAR CHANTIER", pageW / 2, 7, { align: "center" });
doc.setFontSize(7); doc.setFont("helvetica", "normal");
doc.text("Dernier relevé : " + dateAffichee, pageW / 2, 11, { align: "center" });

// Regroupement par chantier (toutes EE confondues)
const chantierMap = {};
baseSupports.forEach(s => {
  const ch = s.chantier || "INCONNU";
  const ee = (s.EE || "?").trim().toUpperCase();
  if (!chantierMap[ch]) chantierMap[ch] = {
    total:0, effectues:0, m3Prevu:0, m3Reel:0, ees:{}
  };
  const cc = chantierMap[ch];
  cc.total++;
  const m3p = parseFloat(s.m3_prevu) || 0;
  cc.m3Prevu += m3p;
  if (!cc.ees[ee]) cc.ees[ee] = { total:0, effectues:0, couleur: couleursEE[ee] || [100,100,100] };
  cc.ees[ee].total++;
  if (String(s.EFFECTUE).trim() === "1") {
    cc.effectues++;
    cc.m3Reel += parseFloat(s.m3_reel) || 0;
    cc.ees[ee].effectues++;
  }
});

const chEntries = Object.entries(chantierMap).sort((a, b) => a[0].localeCompare(b[0]));
const chBlockH = 30;
const chGap    = 4;
let chY        = 16;

chEntries.forEach(([chNom, cc], idx) => {
  const col = idx % 2;
  
  // Nouvelle ligne → vérifier l'espace
  if (col === 0 && idx > 0) chY += chBlockH + chGap;
  if (chY + chBlockH > 280) { doc.addPage(); chY = 8; }

  const x = marge + col * (colW + gap);
  const pct = cc.total > 0 ? Math.round((cc.effectues / cc.total) * 100) : 0;
  const coulBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
  const ecart = cc.m3Reel - cc.m3Prevu;

  // En-tête du bloc
  doc.setFillColor(...violet);
  doc.roundedRect(x, chY, colW, 5.5, 0.5, 0.5, "F");
  doc.setTextColor(...blanc);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
  doc.text(chNom, x + 1.5, chY + 3.8);
  doc.text(pct + "%", x + colW - 1.5, chY + 3.8, { align: "right" });

  // Corps du bloc
  doc.setFillColor(250, 248, 250);
  doc.setDrawColor(220, 210, 220);
  doc.roundedRect(x, chY + 5.5, colW, chBlockH - 5.5, 0.5, 0.5, "FD");

  // Donut (16x16mm)
  const donutSz = 16;
  const donutImg = genererDonut(cc.effectues, cc.total, coulBarre);
  doc.addImage(donutImg, "JPEG", x + 1, chY + 6.5, donutSz, donutSz);

  // Stats centre
  const sX = x + donutSz + 3;
  const sY = chY + 9;
  doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  doc.text(`${cc.effectues}/${cc.total} massifs`, sX, sY);
  doc.text(`Prévu: ${cc.m3Prevu.toFixed(1)} m³`, sX, sY + 4.5);
  doc.text(`Réel:  ${cc.m3Reel.toFixed(1)} m³`, sX, sY + 8.5);
  doc.setTextColor(...(ecart > 0 ? rouge : vert));
  doc.setFont("helvetica", "bold");
  doc.text(`Écart: ${ecart >= 0 ? "+" : ""}${ecart.toFixed(1)}`, sX, sY + 12.5);

  // Mini-barres EE (à droite)
  const eeX = x + colW - 32;
  let eeY = chY + 8;
  Object.entries(cc.ees).forEach(([eeNom, ev]) => {
    const eeP = ev.total > 0 ? Math.round((ev.effectues / ev.total) * 100) : 0;
    const eeCoul = ev.couleur || [100,100,100];
    
    doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
    doc.text(eeNom, eeX, eeY);

    // Mini-barre (22mm)
    doc.setFillColor(...grisClair);
    doc.roundedRect(eeX, eeY + 1, 22, 2, 0.3, 0.3, "F");
    if (eeP > 0) {
      doc.setFillColor(...eeCoul);
      doc.roundedRect(eeX, eeY + 1, 22 * eeP / 100, 2, 0.3, 0.3, "F");
    }
    doc.setTextColor(...eeCoul); doc.setFont("helvetica", "bold"); doc.setFontSize(5);
    doc.text(eeP + "%", eeX + 23, eeY + 2.5);
    
    eeY += 6;
  });
});

// Pied de page toutes pages
const totalPages2 = doc.internal.getNumberOfPages();
for (let p = 1; p <= totalPages2; p++) {
  doc.setPage(p);
  doc.setFillColor(240, 228, 238);
  doc.rect(0, doc.internal.pageSize.getHeight() - 6, pageW, 6, "F");
  doc.setTextColor(...violet); doc.setFontSize(6); doc.setFont("helvetica", "bold");
  doc.text("AINM — SUIVI GC PCLE-MMM", marge, doc.internal.pageSize.getHeight() - 2);
  doc.text("Page " + p + " / " + totalPages2, pageW - marge, doc.internal.pageSize.getHeight() - 2, { align: "right" });
}
// ================================================================
// FIN PAGE 3
// ================================================================    
    // --- Exportation (Partage prioritaire) ---
    const nomFichier = "SUIVI_GC_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], nomFichier, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile], title: "Suivi GC", text: "AINM" });
    } else {
      doc.save(nomFichier);
    }

  } catch (err) {
    alert("Erreur : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
