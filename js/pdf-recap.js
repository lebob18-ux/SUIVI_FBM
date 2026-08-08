/* ============================================================
   EXPORT PDF SUIVI GC PCLE-MMM — VERSION AVEC BARRE PROGRESSION
   ============================================================ */

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

      // 1. En-tête du bloc
      doc.setFillColor(...couleurEE);
      doc.roundedRect(x, y, colW, 6, 0.5, 0.5, "F");
      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("CH. " + nom, x + 1.5, y + 4);

      // 2. Dessin de la barre de progression
      const barX = x + 1.5;
      const barY = y + 7;
      const barW = colW - 3;
      // Fond de la barre (gris)
      doc.setFillColor(...grisClair);
      doc.rect(barX, barY, barW, 2, "F");
      // Partie colorée (proportionnelle)
      doc.setFillColor(...couleurBarre);
      doc.rect(barX, barY, barW * (pct / 100), 2, "F");

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

    // --- Construction du PDF ---
    // Titre Global
    doc.setFillColor(...violet);
    doc.rect(0, 0, pageW, 15, "F");
    doc.setTextColor(...blanc);
    doc.setFontSize(12);
    doc.text("SUIVI GC PCLE-MMM", pageW / 2, 9, { align: "center" });

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
