/* ============================================================
   EXPORT PDF RÉCAPITULATIF AVANCEMENT CHANTIERS
   Style AINM — violet #7C2270
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
    // Bandeau violet
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 30, "F");

    // Logo AINM
    if (logoAinmDataUrl) {
      const logoH = 12;
      const logoW = logoH / (291 / 737);
      doc.addImage(logoAinmDataUrl, "PNG", marge, 9, logoW, logoH);
    }

    // Titre
    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RÉCAPITULATIF AVANCEMENT CHANTIERS", pageW / 2, 13, { align: "center" });

    // Date
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleString("fr-FR");
    doc.text("Édité le : " + dateStr, pageW / 2, 20, { align: "center" });

    // RJ si disponible
    if (window.numeroRJ) {
      doc.text("RJ : " + window.numeroRJ, pageW - marge, 20, { align: "right" });
    }

    y = 36;

    /* ---- Données ---- */
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

    /* ---- Bloc par chantier ---- */
    Object.entries(chantiersMap).forEach(([nom, c]) => {
      const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
      const couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
      const ecart = c.m3Reel - c.m3Prevu;
      const couleurEcart = ecart > 0 ? rouge : vert;

      // Vérifier espace restant
      if (y + 45 > pageH - 15) {
        piedDePage();
        doc.addPage();
        y = 15;
      }

      // Titre chantier
      doc.setFillColor(...violet);
      doc.rect(marge, y, colW, 7, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("📁 " + nom, marge + 3, y + 5);
      y += 9;

      // Massifs + pourcentage
      doc.setTextColor(...gris);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Massifs : " + c.effectues + " / " + c.total, marge, y + 4);
      doc.setTextColor(...couleurBarre);
      doc.setFont("helvetica", "bold");
      doc.text(pct + "%", pageW - marge, y + 4, { align: "right" });
      y += 6;

      // Barre de progression — fond gris
      doc.setFillColor(220, 220, 220);
      doc.roundedRect(marge, y, colW, 4, 2, 2, "F");
      // Barre remplie
      if (pct > 0) {
        doc.setFillColor(...couleurBarre);
        doc.roundedRect(marge, y, colW * pct / 100, 4, 2, 2, "F");
      }
      y += 8;

      // Tableau m³
      doc.autoTable({
        startY: y,
        margin: { left: marge, right: marge },
        head: [["m³ prévu", "m³ réel", "Écart"]],
        body: [[
          c.m3Prevu.toFixed(2),
          c.m3Reel.toFixed(2),
          (ecart >= 0 ? "+" : "") + ecart.toFixed(2)
        ]],
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, halign: "center" },
        headStyles: { fillColor: violet, textColor: blanc, fontStyle: "bold" },
        bodyStyles: { fontStyle: "bold" },
        columnStyles: {
          1: { textColor: couleurEcart },
          2: { textColor: couleurEcart }
        },
      });
      y = doc.lastAutoTable.finalY + 6;
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
