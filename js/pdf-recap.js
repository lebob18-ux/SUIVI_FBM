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
    const marge  = 10;
    const colW   = pageW - marge * 2;

    /* ---- Logo AINM ---- */
    let logoAinmDataUrl = null;
    if (typeof logoAINMversPNG === "function") {
      logoAinmDataUrl = await logoAINMversPNG(737, 291);
    }

    const dateStr = new Date().toLocaleString("fr-FR");

    /* ---- Étape 1 : Organiser et regrouper les données par Entreprise (EE) puis par Chantier ---- */
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

    /* ---- Étape 2 : Générer une page par Entreprise ---- */
    let isFirstPage = true;

    entriesEntreprises.forEach(([eeNom, chantiersMap]) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      let y = 10;

      /* -- En-tête de page pour l'entreprise -- */
      doc.setFillColor(...violet);
      doc.rect(0, y, pageW, 22, "F");

      if (logoAinmDataUrl) {
        const logoH = 10;
        const logoW = logoH / (291 / 737);
        doc.addImage(logoAinmDataUrl, "PNG", marge, y + 6, logoW, logoH);
      }

      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("ENTREPRISE : " + eeNom, pageW / 2, y + 9, { align: "center" });

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("Édité le : " + dateStr, pageW / 2, y + 16, { align: "center" });

      if (window.numeroRJ) {
        doc.text("RJ : " + window.numeroRJ, pageW - marge, y + 16, { align: "right" });
      }

      y += 26;

      /* -- Dessiner les 10 chantiers de manière compacte pour tenir sur la page -- */
      const entriesChantiers = Object.entries(chantiersMap);
      
      entriesChantiers.forEach(([nom, c]) => {
        const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
        const couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : violet;
        const ecart = c.m3Reel - c.m3PrevuEffectue;
        const couleurEcart = ecart > 0 ? rouge : vert;

        // Dimensions réduites pour caser ~10 chantiers sur une seule page A4
        const blockH = 22; 

        // En-tête du bloc chantier
        doc.setFillColor(...violet);
        doc.roundedRect(marge, y, colW, 5, 0.8, 0.8, "F");
        doc.setTextColor(...blanc);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("CHANTIER " + nom, marge + 2, y + 3.5);
        
        doc.setFontSize(7);
        doc.text("Prévu total : " + c.m3TotalPrevu.toFixed(1) + " m³", pageW - marge - 2, y + 3.5, { align: "right" });
        y += 5.5;

        // Corps compact du bloc chantier
        doc.setFillColor(250, 248, 250);
        doc.setDrawColor(220, 210, 220);
        doc.roundedRect(marge, y, colW, blockH, 1, 1, "FD");

        let innerY = y + 4;
        const leftInfoX = marge + 4;
        const rightChartX = pageW - marge - 12;
        const chartY = innerY + 7.5;

        // Infos Massifs et Barre de progression
        doc.setTextColor(...gris);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("Massifs : " + c.effectues + " / " + c.total, leftInfoX, innerY);

        // Mini barre linéaire
        doc.setFillColor(...grisCl);
        doc.roundedRect(leftInfoX + 38, innerY - 2.5, 65, 2, 1, 1, "F");
        if (pct > 0) {
          doc.setFillColor(...couleurBarre);
          doc.roundedRect(leftInfoX + 38, innerY - 2.5, 65 * pct / 100, 2, 1, 1, "F");
        }

        // Mini Camembert / Donut à droite
        const rayonDonut = 7;
        doc.setFillColor(...grisCl);
        doc.circle(rightChartX, chartY, rayonDonut, "F");
        doc.setFillColor(...couleurBarre);
        doc.circle(rightChartX, chartY, rayonDonut, "F");
        doc.setFillColor(250, 248, 250);
        doc.circle(rightChartX, chartY, rayonDonut * 0.6, "F");

        doc.setTextColor(...couleurBarre);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(pct + "%", rightChartX, chartY + 2, { align: "center" });

        innerY += 4.5;

        // Mini Tableau m³ ultra compact
        doc.autoTable({
          startY: innerY,
          margin: { left: leftInfoX, right: marge + 22 },
          head: [["m³ tot.", "m³ fait", "m³ réel", "Écart"]],
          body: [[
            c.m3TotalPrevu.toFixed(1),
            c.m3PrevuEffectue.toFixed(1),
            c.m3Reel.toFixed(1),
            (ecart >= 0 ? "+" : "") + ecart.toFixed(1)
          ]],
          theme: "grid",
          styles: { fontSize: 6.5, cellPadding: 0.8, halign: "center", lineColor: [215, 205, 215] },
          headStyles: { fillColor: violet, textColor: blanc, fontStyle: "bold", cellPadding: 0.8 },
          bodyStyles: { fontStyle: "bold", textColor: [50, 50, 50] },
          columnStyles: {
            2: { textColor: couleurEcart },
            3: { textColor: couleurEcart }
          },
        });

        y += blockH + 2.5; // Espacement serré entre les chantiers
      });

      /* -- Pied de page propre par entreprise -- */
      doc.setFillColor(...violetCl);
      doc.rect(0, pageH - 8, pageW, 8, "F");
      doc.setTextColor(...violet);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text("AINM — Récapitulatif Entreprise " + eeNom, marge, pageH - 3);
      doc.text("Page " + doc.internal.getNumberOfPages(), pageW - marge, pageH - 3, { align: "right" });
    });

    /* ---- Étape 3 : Partage natif ou téléchargement global ---- */
    const nomFichier = "RECAP_ENTREPRISES_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], nomFichier, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: "Récapitulatif Chantiers par Entreprise",
        text: "AINM — Récapitulatif des chantiers par entreprise édité le " + dateStr
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
