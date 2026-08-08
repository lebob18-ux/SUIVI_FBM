/* ============================================================
   EXPORT PDF SUIVI GC PCLE-MMM — Optimisé mono-page
   ============================================================ */

async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const violet    = [124, 34, 112];
    const violetCl  = [240, 228, 238];
    const blanc     = [255, 255, 255];
    const gris      = [90, 90, 90];
    const vert      = [22, 163, 74];
    const orange    = [245, 158, 11];
    const rouge     = [220, 38, 38];

    const couleursEE = {
      "TSO":             [30, 144, 255],
      "ETF":             [29, 78, 216],
      "HP-ELECT":        [15, 23, 42],
      "SANS ENTREPRISE": [100, 100, 100]
    };

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const marge  = 8;
    const gap    = 3;
    const colW   = (pageW - marge * 2 - gap) / 2;
    const footerH    = 7;
    const globalHdrH = 18;
    const eeHdrH     = 6;
    const blockH     = 15; // chantier block height
    const usableH    = pageH - footerH;

    let logoAinmDataUrl = null;
    if (typeof logoAINMversPNG === "function") {
      logoAinmDataUrl = await logoAINMversPNG(300, 118);
    }
    const dateStr = new Date().toLocaleString("fr-FR");

    // ---- Regroupement ----
    const entreprisesMap = {};
    baseSupports.forEach(s => {
      const eeNom = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const ch    = s.chantier || "INCONNU";
      if (!entreprisesMap[eeNom]) entreprisesMap[eeNom] = {};
      if (!entreprisesMap[eeNom][ch]) entreprisesMap[eeNom][ch] = { total:0, effectues:0, m3TotalPrevu:0, m3PrevuEffectue:0, m3Reel:0 };
      const c = entreprisesMap[eeNom][ch];
      c.total++;
      const m3p = parseFloat(s.m3_prevu) || 0;
      c.m3TotalPrevu += m3p;
      if (String(s.EFFECTUE).trim() === "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3p;
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
    });

    if (Object.keys(entreprisesMap).length === 0) { alert("⚠️ Aucune donnée."); return; }

    // ---- En-tête global unique ----
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, globalHdrH, "F");

    if (logoAinmDataUrl) {
      const lH = 10; const lW = lH / (118 / 300);
      doc.addImage(logoAinmDataUrl, "JPEG", marge, 4, lW, lH);
    }

    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SUIVI GC PCLE-MMM", pageW / 2, 9, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Édité le : " + dateStr, pageW / 2, 14.5, { align: "center" });
    if (window.numeroRJ) doc.text("RJ : " + window.numeroRJ, pageW - marge, 14.5, { align: "right" });

    let currentY = globalHdrH + 3;

    // ---- Helpers ----
    function nouvellePageSiNecessaire(h) {
      if (currentY + h > usableH) {
        doc.addPage();
        currentY = 6;
        return true;
      }
      return false;
    }

    function dessinerChantier(x, y, nom, c, couleurEE) {
      const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
      let couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : couleurEE;
      const ecart = c.m3Reel - c.m3PrevuEffectue;
      const couleurEcart = ecart > 0 ? rouge : vert;

      // En-tête chantier : nom + barre progression + stats
      doc.setFillColor(...couleurEE);
      doc.roundedRect(x, y, colW, 5.5, 0.5, 0.5, "F");

      // Nom du chantier
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(nom, x + 1.5, y + 2.3);

      // Massifs
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(c.effectues + "/" + c.total, x + 1.5, y + 4.5);

      // Barre de progression (centre de l'en-tête)
      const pbX = x + 20;
      const pbY = y + 3.2;
      const pbW = colW - 42;
      const pbH = 1.8;
      doc.setFillColor(255, 255, 255);
      doc.setFillColor(200, 200, 200);
      doc.roundedRect(pbX, pbY, pbW, pbH, 0.4, 0.4, "F");
      if (pct > 0) {
        doc.setFillColor(...couleurBarre);
        doc.roundedRect(pbX, pbY, pbW * pct / 100, pbH, 0.4, 0.4, "F");
      }

      // % et total
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text(pct + "%", x + colW - 14, y + 2.3);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(c.m3TotalPrevu.toFixed(1) + "m³", x + colW - 1.5, y + 4.5, { align: "right" });

      // Corps : tableau des m³ (pleine largeur)
      const bodyY = y + 6;
      doc.autoTable({
        startY: bodyY,
        margin: { left: x + 1, right: pageW - (x + colW) + 1 },
        head: [["Prévu", "Fait", "Réel", "Écart"]],
        body: [[
          c.m3TotalPrevu.toFixed(1),
          c.m3PrevuEffectue.toFixed(1),
          c.m3Reel.toFixed(1),
          (ecart >= 0 ? "+" : "") + ecart.toFixed(1)
        ]],
        theme: "grid",
        styles: { fontSize: 5.5, cellPadding: 0.8, halign: "center", lineColor: [215, 205, 215] },
        headStyles: { fillColor: couleurEE, textColor: blanc, fontStyle: "bold" },
        bodyStyles: { fontStyle: "bold", textColor: [50, 50, 50] },
        columnStyles: { 2: { textColor: couleurEcart }, 3: { textColor: couleurEcart } },
      });
    }

    // ---- Génération par EE ----
    Object.entries(entreprisesMap).forEach(([eeNom, chantiersEE]) => {
      const couleurEE = couleursEE[eeNom] || [30, 144, 255];

      // Bande EE compacte
      nouvellePageSiNecessaire(eeHdrH + blockH);
      doc.setFillColor(...couleurEE.map(v => Math.min(255, v + 80)));
      doc.rect(marge, currentY, pageW - marge * 2, eeHdrH - 1, "F");
      doc.setFillColor(...couleurEE);
      doc.rect(marge, currentY, 3, eeHdrH - 1, "F");
      doc.setTextColor(...couleurEE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("■  " + eeNom, marge + 5, currentY + 4);
      currentY += eeHdrH;

      // Chantiers 2 colonnes
      const entries = Object.entries(chantiersEE);
      entries.forEach(([nom, c], idx) => {
        const colIndex = idx % 2;
        if (colIndex === 0) nouvellePageSiNecessaire(blockH);
        const x = marge + colIndex * (colW + gap);
        dessinerChantier(x, currentY, nom, c, couleurEE);
        if (colIndex === 1 || idx === entries.length - 1) currentY += blockH;
      });

      currentY += 3;
    });

    // ---- Pied de page toutes pages ----
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFillColor(...violetCl);
      doc.rect(0, pageH - footerH, pageW, footerH, "F");
      doc.setTextColor(...violet);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("AINM — SUIVI GC PCLE-MMM", marge, pageH - 2.5);
      doc.text("Page " + p + " / " + total, pageW - marge, pageH - 2.5, { align: "right" });
    }

    // ---- Partage ----
    const nomFichier = "SUIVI_GC_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    if (typeof partagerPDF === "function") {
      partagerPDF(pdfBlob, nomFichier, "Suivi GC PCLE-MMM");
    } else {
      doc.save(nomFichier);
    }

  } catch (err) {
    console.error("Erreur PDF :", err);
    alert("⚠️ Erreur : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
