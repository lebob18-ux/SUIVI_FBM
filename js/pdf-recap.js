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
    const marge  = 8;
    
    // Calcul pour faire 2 colonnes côte à côte
    const gap = 4; // Espace entre les 2 colonnes
    const colW = (pageW - (marge * 2) - gap) / 2; 

    /* ---- Logo AINM ---- */
    let logoAinmDataUrl = null;
    if (typeof logoAINMversPNG === "function") {
      logoAinmDataUrl = await logoAINMversPNG(737, 291);
    }

    const dateStr = new Date().toLocaleString("fr-FR");

    /* ---- Étape 1 : Regrouper les données par Entreprise puis par Chantier ---- */
    const entreprisesMap = {};

    baseSupports.forEach(s => {
      const eeNom = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const chantierNom = s.chantier || "INCONNU";

      if (!entreprisesMap[eeNom]) {
        entreprisesMap[eeNom] = {};
      }
      
      const chantiersEE = entreprisesMap[eeNom];
      if (!chantiersEE[chantierNom]) {
        chantiersEE[chantierNom] = { 
          total: 0, 
          effectues: 0, 
          m3TotalPrevu: 0,     
          m3PrevuEffectue: 0,  
          m3Reel: 0 
        };
      }

      const c = chantiersEE[chantierNom];
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

    const entriesEntreprises = Object.entries(entreprisesMap);
    if (entriesEntreprises.length === 0) {
      alert("⚠️ Aucune donnée d'entreprise trouvée.");
      return;
    }

    /* ---- Étape 2 : Générer une page par Entreprise avec grille 2 colonnes ---- */
    let isFirstPage = true;

    entriesEntreprises.forEach(([eeNom, chantiersMap]) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      let startY = 8;

      /* -- En-tête de page -- */
      doc.setFillColor(...violet);
      doc.rect(0, startY, pageW, 18, "F");

      if (logoAinmDataUrl) {
        const logoH = 9;
        const logoW = logoH / (291 / 737);
        doc.addImage(logoAinmDataUrl, "PNG", marge, startY + 4.5, logoW, logoH);
      }

      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ENTREPRISE : " + eeNom, pageW / 2, startY + 7, { align: "center" });

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Édité le : " + dateStr, pageW / 2, startY + 13, { align: "center" });

      if (window.numeroRJ) {
        doc.text("RJ : " + window.numeroRJ, pageW - marge, startY + 13, { align: "right" });
      }

      startY += 21;

      /* -- Affichage en grille 2 colonnes -- */
      const entriesChantiers = Object.entries(chantiersMap);
      let index = 0;

      entriesChantiers.forEach(([nom, c]) => {
        const colIndex = index % 2; // 0 pour la colonne de gauche, 1 pour la droite
        const rowIndex = Math.floor(index / 2);

        const x = marge + colIndex * (colW + gap);
        // On calcule la position verticale selon la ligne (5 lignes max pour 10 chantiers)
        const blockH = 25;
        const rowGap = 3;
        const y = startY + rowIndex * (blockH + rowGap);

        const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
        const couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
        const ecart = c.m3Reel - c.m3PrevuEffectue;
        const couleurEcart = ecart > 0 ? rouge : vert;

        // En-tête du mini-bloc chantier
        doc.setFillColor(...violet);
        doc.roundedRect(x, y, colW, 4.5, 0.6, 0.6, "F");
        doc.setTextColor(...blanc);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("CH. " + nom, x + 1.5, y + 3.2);
        
        doc.setFontSize(6.5);
        doc.text("Tot: " + c.m3TotalPrevu.toFixed(1) + "m³", x + colW - 1.5, y + 3.2, { align: "right" });
        
        let innerY = y + 5;

        // Corps du mini-bloc
        doc.setFillColor(250, 248, 250);
        doc.setDrawColor(220, 210, 220);
        doc.roundedRect(x, innerY, colW, blockH - 4.5, 0.8, 0.8, "FD");

        let contentY = innerY + 3.5;
        const leftInfoX = x + 2.5;
        const rightChartX = x + colW - 10;
        const chartY = contentY + 5.5;

        // Infos massifs & camembert miniature
        doc.setTextColor(...gris);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text("Massifs: " + c.effectues + "/" + c.total, leftInfoX, contentY);

        // Petit camembert à droite
        const rayonDonut = 5.5;
        doc.setFillColor(...grisCl);
        doc.circle(rightChartX, chartY, rayonDonut, "F");
        doc.setFillColor(...couleurBarre);
        doc.circle(rightChartX, chartY, rayonDonut, "F");
        doc.setFillColor(250, 248, 250);
        doc.circle(rightChartX, chartY, rayonDonut * 0.6, "F");

        doc.setTextColor(...couleurBarre);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.text(pct + "%", rightChartX, chartY + 1.8, { align: "center" });

        contentY += 4.5;

        // Mini tableau des volumes adapté à la largeur de la colonne
        doc.autoTable({
          startY: contentY,
          margin: { left: leftInfoX, right: pageW - (x + colW) + 12 },
          head: [["Prév.", "Fait", "Réel", "Écart"]],
          body: [[
            c.m3TotalPrevu.toFixed(1),
            c.m3PrevuEffectue.toFixed(1),
            c.m3Reel.toFixed(1),
            (ecart >= 0 ? "+" : "") + ecart.toFixed(1)
          ]],
          theme: "grid",
          styles: { fontSize: 5.5, cellPadding: 0.5, halign: "center", lineColor: [215, 205, 215] },
          headStyles: { fillColor: violet, textColor: blanc, fontStyle: "bold", cellPadding: 0.5 },
          bodyStyles: { fontStyle: "bold", textColor: [50, 50, 50] },
          columnStyles: {
            2: { textColor: couleurEcart },
            3: { textColor: couleurEcart }
          },
        });

        index++;
      });

      /* -- Pied de page -- */
      doc.setFillColor(...violetCl);
      doc.rect(0, pageH - 7, pageW, 7, "F");
      doc.setTextColor(...violet);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text("AINM — Entreprise " + eeNom, marge, pageH - 2.5);
      doc.text("Page " + doc.internal.getNumberOfPages(), pageW - marge, pageH - 2.5, { align: "right" });
    });

    /* ---- Partage ou Téléchargement ---- */
    const nomFichier = "RECAP_ENTREPRISES_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], nomFichier, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: "Récapitulatif Chantiers par Entreprise",
        text: "AINM — Récapitulatif édité le " + dateStr
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
