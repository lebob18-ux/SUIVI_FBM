/* ---- export 20 chantier ---- */
async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const violet = [124, 34, 112];
    const blanc  = [255, 255, 255];
    const marge  = 10;

    // Titre
    doc.setFillColor(...violet);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, "F");
    doc.setTextColor(...blanc);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RÉCAPITULATIF CHANTIERS (Synthèse)", marge, 12);

    /* ---- Données ---- */
    const chantiersMap = {};
    baseSupports.forEach(s => {
      if (!chantiersMap[s.chantier]) {
        chantiersMap[s.chantier] = { total: 0, effectues: 0, m3TotalPrevu: 0, m3PrevuEffectue: 0, m3Reel: 0 };
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

    // Préparation des données pour le tableau
    const tableData = Object.entries(chantiersMap).map(([nom, c]) => [
      nom,
      c.total,
      c.effectues,
      c.m3TotalPrevu.toFixed(1),
      c.m3Reel.toFixed(1),
      (c.m3Reel - c.m3PrevuEffectue).toFixed(1)
    ]);

    // Tableau unique optimisé
    doc.autoTable({
      startY: 25,
      head: [["Chantier", "Total", "Fait", "Prévu (m³)", "Réel (m³)", "Écart"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: violet, textColor: blanc },
      columnStyles: { 0: { cellWidth: 50 } }
    });

    // Sauvegarde
    doc.save("RECAP_SYNTHESE_" + new Date().toISOString().slice(0, 10) + ".pdf");

  } catch (err) {
    console.error(err);
    alert("Erreur PDF : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
