/* ============================================================
   EXPORT PDF SUIVI GC PCLE-MMM — COMPLET AVEC CAMEMBERTS
   ============================================================ */

async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const violet = [124, 34, 112];
    const violetCl = [240, 228, 238];
    const blanc = [255, 255, 255];
    const vert = [22, 163, 74];
    const orange = [245, 158, 11];
    const rouge = [220, 38, 38];
    const gris = [200, 200, 200];

    const couleursEE = {
      "TSO": [30, 144, 255],
      "ETF": [29, 78, 216],
      "HP-ELECT": [15, 23, 42],
      "SANS ENTREPRISE": [100, 100, 100]
    };

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marge = 8;
    const gap = 3;
    const colW = (pageW - marge * 2 - gap) / 2;
    const blockH = 21; // Hauteur ajustée pour faire tenir 20 chantiers

    // ---- Regroupement ----
    const entreprisesMap = {};
    baseSupports.forEach(s => {
      const eeNom = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const ch = s.chantier || "INCONNU";
      if (!entreprisesMap[eeNom]) entreprisesMap[eeNom] = {};
      if (!entreprisesMap[eeNom][ch]) entreprisesMap[eeNom][ch] = { total: 0, effectues: 0, m3TotalPrevu: 0, m3PrevuEffectue: 0, m3Reel: 0 };
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

    // ---- Fonctions de dessin ----
    function dessinerCamembert(doc, x, y, rayon, pct, couleur) {
      doc.setFillColor(...gris);
      doc.circle(x, y, rayon, "F");
      if (pct > 0) {
        doc.setFillColor(...couleur);
        doc.moveTo(x, y);
        doc.arc(x, y, rayon, -Math.PI / 2, (pct * 3.6 - 90) * Math.PI / 180);
        doc.lineTo(x, y);
        doc.fill();
      }
      doc.setFillColor(255, 255, 255);
      doc.circle(x, y, rayon * 0.6, "F");
    }

function dessinerCamembert(doc, x, y, rayon, pct, couleur) {
      // 1. Fond gris
      doc.setFillColor(...gris);
      doc.circle(x, y, rayon, "F");

      // 2. Secteur coloré (partie effectuée)
      if (pct > 0) {
        doc.setFillColor(...couleur);
        // On définit le chemin pour un secteur de cercle
        // 'm' = move, 'a' = arc (déplacement relatif)
        const angle = (pct * 3.6); 
        doc.moveTo(x, y);
        // On dessine le secteur via un path SVG simple
        doc.path([{op: 'm', c: [x, y]}, 
                  {op: 'l', c: [x, y - rayon]}, 
                  {op: 'a', c: [rayon, rayon, 0, (angle > 180 ? 1 : 0), 1, 
                               x + rayon * Math.sin(angle * Math.PI / 180), 
                               y - rayon * Math.cos(angle * Math.PI / 180)]}, 
                  {op: 'l', c: [x, y]}], 'F');
      }

      // 3. Cercle blanc au centre (effet donut)
      doc.setFillColor(255, 255, 255);
      doc.circle(x, y, rayon * 0.6, "F");
    }

    // ---- En-tête Global ----
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 15, "F");
    doc.setTextColor(...blanc);
    doc.setFontSize(10);
    doc.text("SUIVI GC PCLE-MMM", pageW / 2, 9, { align: "center" });

    // ---- Boucle Entreprises ----
    let currentY = 18;
    Object.entries(entreprisesMap).forEach(([eeNom, chantiersEE], idx) => {
      if (currentY > 250) { doc.addPage(); currentY = 10; }
      
      const couleurEE = couleursEE[eeNom] || [30, 144, 255];
      doc.setTextColor(...couleurEE);
      doc.setFontSize(8);
      doc.text("■ " + eeNom, marge, currentY);
      currentY += 4;

      Object.entries(chantiersEE).forEach(([nom, c], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marge + col * (colW + gap);
        const y = currentY + row * (blockH + 2);
        dessinerChantier(x, y, nom, c, couleurEE);
        if (i === Object.keys(chantiersEE).length - 1) currentY = y + blockH + 5;
      });
    });

    // ---- Exportation ----
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
