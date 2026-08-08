/* ============================================================
   EXPORT PDF RÉCAPITULATIF - VERSION COMPACTE (1 Page)
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

    // Palette de couleurs
    const gris = [90, 90, 90];
    const grisCl = [225, 225, 225];
    const blanc = [255, 255, 255];
    const vert = [22, 163, 74];
    const orange = [245, 158, 11];
    const rouge = [220, 38, 38];

    const couleursEE = {
      "TSO": [30, 144, 255],
      "ETF": [29, 78, 216],
      "HP-ELECT": [15, 23, 42],
      "SANS ENTREPRISE": [100, 100, 100]
    };

    const pageW = doc.internal.pageSize.getWidth();
    const marge = 8;
    const gap = 4;
    const colW = (pageW - (marge * 2) - gap) / 2; 

    // ... (Logique de regroupement identique à votre code)
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

    // Génération
    let isFirstPage = true;
    Object.entries(entreprisesMap).forEach(([eeNom, chantiersMap]) => {
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const couleurEE = couleursEE[eeNom] || [30, 144, 255];
      let startY = 8;

      // En-tête simplifié
      doc.setFillColor(...couleurEE);
      doc.rect(0, startY, pageW, 12, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ENTREPRISE : " + eeNom, pageW / 2, startY + 7, { align: "center" });

      startY += 15;

      const entriesChantiers = Object.entries(chantiersMap);
      entriesChantiers.forEach(([nom, c], index) => {
        const colIndex = index % 2; 
        const rowIndex = Math.floor(index / 2);
        // HAUTEUR RÉDUITE : 21mm au lieu de 25mm
        const blockH = 21; 
        const rowGap = 2; // Réduit pour gagner de la place
        const x = marge + colIndex * (colW + gap);
        const y = startY + rowIndex * (blockH + rowGap);

        const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
        let couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : couleurEE;

        // Bloc compact
        doc.setFillColor(...couleurEE);
        doc.roundedRect(x, y, colW, 4, 0.5, 0.5, "F");
        doc.setTextColor(...blanc);
        doc.setFontSize(6);
        doc.text("CH. " + nom, x + 1, y + 2.8);
        
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y + 4, colW, blockH - 4, 0.5, 0.5, "FD");

        // Mini tableau ultra-compact
        doc.autoTable({
          startY: y + 4.5,
          margin: { left: x + 0.5, right: pageW - (x + colW) + 0.5 },
          head: [["Prév.", "Fait", "Réel", "Écart"]],
          body: [[
            c.m3TotalPrevu.toFixed(0),
            c.m3PrevuEffectue.toFixed(0),
            c.m3Reel.toFixed(0),
            (c.m3Reel - c.m3PrevuEffectue).toFixed(0)
          ]],
          theme: "grid",
          styles: { fontSize: 5, cellPadding: 0.3, halign: "center" },
          headStyles: { fillColor: couleurEE, textColor: blanc, cellPadding: 0.2 },
        });
      });
    });

    // 4. Exportation (le partage qui marchait)
    const nomFichier = "RECAP_" + new Date().toISOString().slice(0, 10) + ".pdf";
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
