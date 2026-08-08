/* ============================================================
   EXPORT PDF RÉCAPITULATIF (Optimisé pour 20 chantiers / page)
   ============================================================ */

async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { 
    btnPdf.disabled = true; 
    btnPdf.innerHTML = "⏳ Génération..."; 
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const gris = [90, 90, 90];
    const grisCl = [225, 225, 225];
    const blanc = [255, 255, 255];
    const vert = [22, 163, 74];
    const rouge = [220, 38, 38];
    const couleursEE = {
      "TSO": [30, 144, 255],
      "ETF": [29, 78, 216],
      "HP-ELECT": [15, 23, 42],
      "SANS ENTREPRISE": [100, 100, 100]
    };

    const pageW = doc.internal.pageSize.getWidth();
    const marge = 6; // Marges légèrement réduites
    const gap = 3;
    const colW = (pageW - (marge * 2) - gap) / 2;

    const entreprisesMap = {};
    baseSupports.forEach(s => {
      const eeNom = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const chantierNom = s.chantier || "INCONNU";
      if (!entreprisesMap[eeNom]) entreprisesMap[eeNom] = {};
      const c = entreprisesMap[eeNom][chantierNom] || { total: 0, effectues: 0, m3TotalPrevu: 0, m3PrevuEffectue: 0, m3Reel: 0 };
      c.total++;
      const m3PrevuVal = parseFloat(s.m3_prevu) || 0;
      c.m3TotalPrevu += m3PrevuVal;
      const valEff = s.EFFECTUE ?? s.effectue ?? "";
      if (valEff == 1 || String(valEff).trim() == "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3PrevuVal;
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
      entreprisesMap[eeNom][chantierNom] = c;
    });

    // Génération - On parcourt toutes les entreprises
    let isFirstPage = true;
    Object.entries(entreprisesMap).forEach(([eeNom, chantiersMap]) => {
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const couleurEE = couleursEE[eeNom] || [30, 144, 255];
      let startY = 8;

      doc.setFillColor(...couleurEE);
      doc.rect(0, startY, pageW, 12, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ENTREPRISE : " + eeNom, pageW / 2, startY + 7, { align: "center" });

      startY += 15;

      Object.entries(chantiersMap).forEach(([nom, c], index) => {
        const colIndex = index % 2; 
        const rowIndex = Math.floor(index / 2);
        // On garde une hauteur suffisante pour que le tableau soit visible
        const blockH = 22; 
        const rowGap = 2;
        const x = marge + colIndex * (colW + gap);
        const y = startY + rowIndex * (blockH + rowGap);

        // En-tête du bloc
        doc.setFillColor(...couleurEE);
        doc.roundedRect(x, y, colW, 4, 0.5, 0.5, "F");
        doc.setTextColor(...blanc);
        doc.setFontSize(6.5);
        doc.text("CH. " + nom, x + 1.5, y + 2.8);
        
        // Corps
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y + 4, colW, blockH - 4, 0.5, 0.5, "FD");

        // Tableau visible
        doc.autoTable({
          startY: y + 4.5,
          margin: { left: x + 0.5, right: pageW - (x + colW) + 0.5 },
          head: [["Prév.", "Fait", "Réel", "Écart"]],
          body: [[
            c.m3TotalPrevu.toFixed(1),
            c.m3PrevuEffectue.toFixed(1),
            c.m3Reel.toFixed(1),
            (c.m3Reel - c.m3PrevuEffectue).toFixed(1)
          ]],
          theme: "plain", // Changé pour être plus léger et lisible
          styles: { fontSize: 5.5, cellPadding: 0.4, halign: "center", textColor: [50, 50, 50] },
          headStyles: { fillColor: false, textColor: [80, 80, 80], fontStyle: "bold" },
        });
      });
    });

    // 4. Exportation (le partage qui fonctionnait)
    const nomFichier = "RECAP_ENTREPRISES_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], nomFichier, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile], title: "Récap", text: "AINM" });
    } else {
      doc.save(nomFichier);
    }
  } catch (err) {
    alert("Erreur : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
