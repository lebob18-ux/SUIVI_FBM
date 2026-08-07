async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const violet = [124, 34, 112];
    const blanc  = [255, 255, 255];
    const vertCl = [220, 252, 231]; // Vert très clair pour les chantiers terminés
    const marge  = 10;
    const pageW  = doc.internal.pageSize.getWidth();

    // En-tête
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 20, "F");
    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RÉCAPITULATIF CHANTIERS (Synthèse)", marge, 12);

    const dateStr = new Date().toLocaleString("fr-FR");

    /* ---- Données ---- */
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
      c.m3TotalPrevu += m3PrevuVal; // Total prévu du chantier

      const valEff = s.EFFECTUE !== undefined ? s.EFFECTUE : (s.effectue !== undefined ? s.effectue : "");
      if (valEff === 1 || String(valEff).trim() === "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3PrevuVal; // Prévu à date (réalisé)
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
    });

    // Préparation des données pour le tableau avec les 3 colonnes de m³
    const tableData = Object.entries(chantiersMap).map(([nom, c]) => {
      const ecart = c.m3Reel - c.m3PrevuEffectue;
      return [
        nom,
        c.total,
        c.effectues,
        c.m3TotalPrevu.toFixed(1),
        c.m3PrevuEffectue.toFixed(1),
        c.m3Reel.toFixed(1),
        (ecart >= 0 ? "+" : "") + ecart.toFixed(1)
      ];
    });

    // Tableau unique compact avec colonnes adaptées
    doc.autoTable({
      startY: 25,
      head: [["Chantier", "Tot.", "Fait", "Prévu", "Prév. date", "Réel", "Écart"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 1.2, halign: "center" },
      headStyles: { fillColor: violet, textColor: blanc },
      columnStyles: { 
        0: { cellWidth: 50, halign: "left" }, // Nom du chantier
        1: { cellWidth: 15 }, // Total massifs
        2: { cellWidth: 15 }, // Fait
        3: { cellWidth: 23 }, // m3 prévu total
        4: { cellWidth: 23 }, // m3 prévu à date
        5: { cellWidth: 23 }, // m3 réel
        6: { cellWidth: 23 }  // Écart
      },
      // Coloration en vert de toute la ligne si Fait === Total
      didParseCell: function (data) {
        if (data.section === 'body') {
          const total = parseInt(data.row.raw[1], 10);
          const fait = parseInt(data.row.raw[2], 10);
          if (total > 0 && fait === total) {
            data.cell.styles.fillColor = vertCl;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    /* ---- Partage natif (ou téléchargement en secours) ---- */
    const nomFichier = "RECAP_SYNTHESE_" + new Date().toISOString().slice(0, 10) + ".pdf";
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
    console.error(err);
    alert("⚠️ Erreur PDF : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
