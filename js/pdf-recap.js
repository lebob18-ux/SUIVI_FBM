/* ============================================================
   EXPORT PDF RÉCAPITULATIF AVANCEMENT CHANTIERS
   Style AINM — violet #7C2270 (avec camemberts d'avancement)
   ============================================================ */

async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const violet    = [124, 34, 112];
    const violetCl  = [240, 228, 238];
    const gris      = [90, 90, 90];
    const grisCl    = [225, 225, 225];
    const blanc     = [255, 255, 255];
    const vert      = [22, 163, 74];
    const orange    = [245, 158, 11];
    const rouge     = [220, 38, 38];

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const marge  = 12;
    const colW   = pageW - marge * 2;
    let y = 0;

    /* ---- Logo AINM ---- */
    let logoAinmDataUrl = null;
    if (typeof logoAINMversPNG === "function") {
      logoAinmDataUrl = await logoAINMversPNG(737, 291);
    }

    /* ---- En-tête ---- */
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 30, "F");

    if (logoAinmDataUrl) {
      const logoH = 12;
      const logoW = logoH / (291 / 737);
      doc.addImage(logoAinmDataUrl, "PNG", marge, 9, logoW, logoH);
    }

    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RÉCAPITULATIF AVANCEMENT CHANTIERS", pageW / 2, 13, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleString("fr-FR");
    doc.text("Édité le : " + dateStr, pageW / 2, 20, { align: "center" });

    if (window.numeroRJ) {
      doc.text("RJ : " + window.numeroRJ, pageW - marge, 20, { align: "right" });
    }

    y = 36;

    /* ---- Données (Tous les chantiers inclus) ---- */
    const chantiersMap = {};
    baseSupports.forEach(s => {
      if (!chantiersMap[s.chantier]) {
        chantiersMap[s.chantier] = { 
          total: 0, 
          effectues: 0, 
          m3TotalPrevu: 0,     
          m3PrevuEffectue: 0,  
          m3Reel: 0 
        };
      }
      const c = chantiersMap[s.chantier];
      c.total++;
      
      const m3PrevuVal = parseFloat(s.m3_prevu) || 0;
      c.m3TotalPrevu += m3PrevuVal;

      const valEff = s.EFFECTUE !== undefined ? s.EFFECTUE : (s.effectue !== undefined ? s.effectue : "");

      if (valEff === 1 || String(valEff).trim() === "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3PrevuVal;
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
    });

    /* ---- Bloc par chantier ---- */
    Object.entries(chantiersMap).forEach(([nom, c]) => {
      const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
      const couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
      const ecart = c.m3Reel - c.m3PrevuEffectue;
      const couleurEcart = ecart > 0 ? rouge : vert;

      if (y + 52 > pageH - 15) {
        piedDePage();
        doc.addPage();
        y = 15;
      }

      // En-tête du bloc chantier
      doc.setFillColor(...violet);
      doc.roundedRect(marge, y, colW, 7, 1, 1, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CHANTIER " + nom, marge + 3, y + 4.8);
      
      doc.setFontSize(8);
      doc.text("Total béton prévu : " + c.m3TotalPrevu.toFixed(2) + " m³", pageW - marge - 3, y + 4.8, { align: "right" });
      y += 8;

      // Corps du bloc
      doc.setFillColor(250, 248, 250);
      doc.setDrawColor(220, 210, 220);
      doc.roundedRect(marge, y, colW, 40, 2, 2, "FD");

      let innerY = y + 6;

      const leftInfoX = marge + 6;
      const rightChartX = pageW - marge - 18;
      const chartY = innerY + 11;

      // Texte Massifs et pourcentage
      doc.setTextColor(...gris);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Massifs réalisés :", leftInfoX, innerY);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(c.effectues + " / " + c.total, leftInfoX + 38, innerY);

      innerY += 6;

      // Barre de progression linéaire
      doc.setFillColor(...grisCl);
      doc.roundedRect(leftInfoX, innerY, colW - 38, 3, 1.5, 1.5, "F");
      if (pct > 0) {
        doc.setFillColor(...couleurBarre);
        doc.roundedRect(leftInfoX, innerY, (colW - 38) * pct / 100, 3, 1.5, 1.5, "F");
      }

      // Indicateur Donut / Camembert à droite
      const rayonDonut = 9;
      doc.setFillColor(...grisCl);
      doc.circle(rightChartX, chartY, rayonDonut, "F");
      doc.setFillColor(...couleurBarre);
      doc.circle(rightChartX, chartY, rayonDonut, "F");
      doc.setFillColor(250, 248, 250);
      doc.circle(rightChartX, chartY, rayonDonut * 0.6, "F");

      doc.setTextColor(...couleurBarre);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(pct + "%", rightChartX, chartY + 2.5, { align: "center" });

      innerY += 10;

      // Tableau m³
      doc.autoTable({
        startY: innerY,
        margin: { left: leftInfoX, right: marge + 28 },
        head: [["m³ prévu (faits)", "m³ réel", "Écart"]],
        body: [[
          c.m3PrevuEffectue.toFixed(2),
          c.m3Reel.toFixed(2),
          (ecart >= 0 ? "+" : "") + ecart.toFixed(2)
        ]],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, halign: "center", lineColor: [210, 200, 210] },
        headStyles: { fillColor: violet, textColor: blanc, fontStyle: "bold" },
        bodyStyles: { fontStyle: "bold", textColor: [50, 50, 50] },
        columnStyles: {
          1: { textColor: couleurEcart },
          2: { textColor: couleurEcart }
        },
      });

      y += 44;
    });

    /* ---- Pied de page ---- */
    function piedDePage() {
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...violetCl);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(...violet);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("AINM — Récapitulatif chantiers", marge, pageH - 4);
        doc.text("Page " + p + " / " + totalPages, pageW - marge, pageH - 4, { align: "right" });
      }
    }
    piedDePage();

    /* ---- Partage ou téléchargement ---- */
    const nomFichier = "RECAP_CHANTIERS_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], nomFichier, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: "Récapitulatif Avancement Chantiers",
        text: "AINM — Récapitulatif chantiers édité le " + dateStr
      });
    } else {
      doc.save(nomFichier);
    }

  } catch (err) {
    console.error("Erreur PDF récap :", err);
    alert("⚠️ Erreur lors de la génération du PDF :\n" + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
