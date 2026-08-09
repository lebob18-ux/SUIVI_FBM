/* ============================================================
    EXPORT PDF SUIVI GC PCLE-MMM — 2 PAGES (CPT & CHANTIER)
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
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
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

    const pageW = doc.internal.pageSize.getWidth();
    const marge = 8;

    // --- Récupération de la date la plus récente (MAX) ---
    const dates = baseSupports
      .map(s => s.date)
      .filter(d => d)
      .sort();

    const derniereDate = dates.length > 0 ? dates[dates.length - 1] : "N/A";
    const dateAffichee = derniereDate !== "N/A" 
      ? derniereDate.split('-').reverse().join('/') 
      : "Aucune date";

    // ================================================================
    // PAGE 1 : SUIVI PAR CPT
    // ================================================================
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 12, "F");
    doc.setTextColor(...blanc);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("SUIVI PAR CPT", pageW / 2, 7, { align: "center" });
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Dernier relevé : " + dateAffichee, pageW / 2, 11, { align: "center" });

    const cptMap = {};
    baseSupports.forEach(s => {
      const cpt = (s.CPT || "SANS CPT").trim();
      if (!cptMap[cpt]) cptMap[cpt] = { total:0, effectues:0, m3Prevu:0, m3PrevuEffectue:0, chantiers:{} };
      const cc = cptMap[cpt];
      cc.total++;
      const m3p = parseFloat(s.m3_prevu) || 0;
      cc.m3Prevu += m3p;
      const ch = s.chantier || "?";
      if (!cc.chantiers[ch]) cc.chantiers[ch] = { total:0, effectues:0 };
      cc.chantiers[ch].total++;
      if (String(s.EFFECTUE).trim() === "1") {
        cc.effectues++;
        cc.m3PrevuEffectue += m3p;
        cc.chantiers[ch].effectues++;
      }
    });

    let cptY = 16;
    const cptEntries = Object.entries(cptMap).sort((a, b) => a[0].localeCompare(b[0]));
    const couleurCPT = [124, 34, 112];

    cptEntries.forEach(([cptNom, cc]) => {
      if (cptY + 35 > 280) { doc.addPage(); cptY = 8; }

      const pct = cc.total > 0 ? Math.round((cc.effectues / cc.total) * 100) : 0;
      const coulBarre = pct === 100 ? vert : pct >= 50 ? orange : couleurCPT;
      const ecart = cc.m3PrevuEffectue - cc.m3Prevu; // Écart basé sur m3 fait vs m3 prévu total

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
      doc.text(`m³ fait : ${cc.m3PrevuEffectue.toFixed(1)}`, statsX, cptY + 14);
      const coulEcart = ecart > 0 ? rouge : vert;
      doc.setTextColor(...coulEcart); doc.setFont("helvetica", "bold");
      doc.text(`Écart : ${ecart >= 0 ? "+" : ""}${ecart.toFixed(1)} m³`, statsX, cptY + 19);

      // Mini-liste chantiers (forcée sur 2 colonnes dès le 1er chantier)
      const chEntriesCPT = Object.entries(cc.chantiers);
      const listeX = statsX + 50;
      doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      
      chEntriesCPT.slice(0, 8).forEach(([ch, cv], idx) => {
        const p = cv.total > 0 ? Math.round((cv.effectues/cv.total)*100) : 0;
        const col = idx % 2; 
        const row = Math.floor(idx / 2);
        const cx2 = listeX + col * 35; 
        const cy2 = cptY + row * 5;
        
        doc.setTextColor(80,80,80); 
        doc.text(ch, cx2, cy2 + 3.5);
        
        // mini-barre
        doc.setFillColor(...grisClair); 
        doc.roundedRect(cx2, cy2 + 3.8, 20, 1.2, 0.2, 0.2, "F");
        if (p > 0) { 
          doc.setFillColor(...coulBarre); 
          doc.roundedRect(cx2, cy2 + 3.8, 20*p/100, 1.2, 0.2, 0.2, "F"); 
        }
        doc.setTextColor(...coulBarre); 
        doc.setFont("helvetica","bold"); 
        doc.setFontSize(5.5);
        doc.text(p+"%", cx2+21, cy2+4.5);
      });

      if (chEntriesCPT.length > 8) {
        doc.setTextColor(150,150,150); doc.setFontSize(5.5);
        doc.text("+" + (chEntriesCPT.length-8) + " autres", listeX, cptY + 22);
      }

      cptY += donutMM + 5;
    });

    // ================================================================
    // PAGE 2 : SUIVI PAR CHANTIER
    // ================================================================
    doc.addPage();

    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 12, "F");
    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("SUIVI PAR CHANTIER", pageW / 2, 7, { align: "center" });
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Dernier relevé : " + dateAffichee, pageW / 2, 11, { align: "center" });

    const chantierMap = {};
    baseSupports.forEach(s => {
      const ch = s.chantier || "INCONNU";
      const ee = (s.EE || "?").trim().toUpperCase();
      if (!chantierMap[ch]) chantierMap[ch] = {
        total:0, effectues:0, m3Prevu:0, m3PrevuEffectue:0, ees:{}
      };
      const cc = chantierMap[ch];
      cc.total++;
      const m3p = parseFloat(s.m3_prevu) || 0;
      cc.m3Prevu += m3p;
      if (!cc.ees[ee]) cc.ees[ee] = { total:0, effectues:0, couleur: couleursEE[ee] || [100,100,100] };
      cc.ees[ee].total++;
      if (String(s.EFFECTUE).trim() === "1") {
        cc.effectues++;
        cc.m3PrevuEffectue += m3p;
        cc.ees[ee].effectues++;
      }
    });

    const chEntries = Object.entries(chantierMap).sort((a, b) => a[0].localeCompare(b[0]));
    const nbCol3   = 3;
    const chGap    = 3;
    const colW3    = (pageW - marge * 2 - chGap * (nbCol3 - 1)) / nbCol3;
    const chBlockH = 30;
    let chY        = 16;

    chEntries.forEach(([chNom, cc], idx) => {
      const col = idx % nbCol3;
      
      if (col === 0 && idx > 0) chY += chBlockH + chGap;
      if (chY + chBlockH > 280) { doc.addPage(); chY = 8; }

      const x = marge + col * (colW3 + chGap);
      const pct = cc.total > 0 ? Math.round((cc.effectues / cc.total) * 100) : 0;
      const coulBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
      const ecart = cc.m3PrevuEffectue - cc.m3Prevu; // Remplacement réel par fait

      doc.setFillColor(...violet);
      doc.roundedRect(x, chY, colW3, 5.5, 0.5, 0.5, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
      doc.text(chNom, x + 1.5, chY + 3.8);
      doc.text(pct + "%", x + colW3 - 1.5, chY + 3.8, { align: "right" });

      doc.setFillColor(250, 248, 250);
      doc.setDrawColor(220, 210, 220);
      doc.roundedRect(x, chY + 5.5, colW3, chBlockH - 5.5, 0.5, 0.5, "FD");

      const donutSz = 13;
      const donutImg = genererDonut(cc.effectues, cc.total, coulBarre);
      doc.addImage(donutImg, "JPEG", x + 1, chY + 6.5, donutSz, donutSz);

      const sX = x + donutSz + 3;
      const sY = chY + 9;
      doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
      doc.text(`${cc.effectues}/${cc.total} massifs`, sX, sY);
      doc.text(`Prévu: ${cc.m3Prevu.toFixed(1)} m³`, sX, sY + 4.5);
      doc.text(`Fait:  ${cc.m3PrevuEffectue.toFixed(1)} m³`, sX, sY + 8.5); // Affichage m3 fait
      doc.setTextColor(...(ecart > 0 ? rouge : vert));
      doc.setFont("helvetica", "bold");
      doc.text(`Écart: ${ecart >= 0 ? "+" : ""}${ecart.toFixed(1)}`, sX, sY + 12.5);

      const eeX = x + colW3 - 32;
      let eeY = chY + 8;
      Object.entries(cc.ees).forEach(([eeNom, ev]) => {
        const eeP = ev.total > 0 ? Math.round((ev.effectues / ev.total) * 100) : 0;
        const eeCoul = ev.couleur || [100,100,100];
        
        doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
        doc.text(eeNom, eeX, eeY);

        doc.setFillColor(...grisClair);
        doc.roundedRect(eeX, eeY + 1, 18, 2, 0.3, 0.3, "F");
        if (eeP > 0) {
          doc.setFillColor(...eeCoul);
          doc.roundedRect(eeX, eeY + 1, 18 * eeP / 100, 2, 0.3, 0.3, "F");
        }
        doc.setTextColor(...eeCoul); doc.setFont("helvetica", "bold"); doc.setFontSize(5);
        doc.text(eeP + "%", eeX + 19, eeY + 2.5);
        
        eeY += 6;
      });
    });

    // ================================================================
    // PIED DE PAGE GLOBAL
    // ================================================================
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(240, 228, 238);
      doc.rect(0, doc.internal.pageSize.getHeight() - 6, pageW, 6, "F");
      doc.setTextColor(...violet); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text("AINM — SUIVI GC PCLE-MMM", marge, doc.internal.pageSize.getHeight() - 2);
      doc.text("Page " + p + " / " + totalPages, pageW - marge, doc.internal.pageSize.getHeight() - 2, { align: "right" });
    }

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
