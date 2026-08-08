/* ============================================================
   EXPORT PDF RÉCAPITULATIF PAR ENTREPRISE — MULTI-EE SUR UNE PAGE
   ============================================================ */

async function exporterRecapPDF() {
  const btnPdf = document.getElementById("btnRecapPdf");
  if (btnPdf) { btnPdf.disabled = true; btnPdf.innerHTML = "⏳ Génération..."; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const gris   = [90, 90, 90];
    const grisCl = [225, 225, 225];
    const blanc  = [255, 255, 255];
    const vert   = [22, 163, 74];
    const orange = [245, 158, 11];
    const rouge  = [220, 38, 38];

    const couleursEE = {
      "TSO":              [30, 144, 255],
      "ETF":              [29, 78, 216],
      "HP-ELECT":         [15, 23, 42],
      "SANS ENTREPRISE":  [100, 100, 100]
    };

    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const marge  = 8;
    const gap    = 4;
    const colW   = (pageW - marge * 2 - gap) / 2;
    const footerH   = 8;
    const headerEEH = 21;
    const blockH    = 28; // hauteur d'une rangée de 2 chantiers
    const usableH   = pageH - footerH;

    let logoAinmDataUrl = null;
    if (typeof logoAINMversPNG === "function") {
      logoAinmDataUrl = await logoAINMversPNG(300, 118);
    }

    const dateStr = new Date().toLocaleString("fr-FR");

    // ---- Regroupement par EE puis chantier ----
    const entreprisesMap = {};
    baseSupports.forEach(s => {
      const eeNom      = (s.EE || "SANS ENTREPRISE").trim().toUpperCase();
      const chantierNom = s.chantier || "INCONNU";
      if (!entreprisesMap[eeNom]) entreprisesMap[eeNom] = {};
      const ch = entreprisesMap[eeNom];
      if (!ch[chantierNom]) ch[chantierNom] = { total:0, effectues:0, m3TotalPrevu:0, m3PrevuEffectue:0, m3Reel:0 };
      const c = ch[chantierNom];
      c.total++;
      const m3p = parseFloat(s.m3_prevu) || 0;
      c.m3TotalPrevu += m3p;
      if (String(s.EFFECTUE).trim() === "1") {
        c.effectues++;
        c.m3PrevuEffectue += m3p;
        c.m3Reel += parseFloat(s.m3_reel) || 0;
      }
    });

    if (Object.keys(entreprisesMap).length === 0) { alert("⚠️ Aucune donnée."); return; }

    // ---- Suivi de position globale ----
    let currentY = 8;
    let lastCouleurEE = gris;
    let lastCouleurClEE = grisCl;
    let lastEENom = "";

    function nouvellePageSiNecessaire(hauteurNecessaire) {
      if (currentY + hauteurNecessaire > usableH) {
        doc.addPage();
        currentY = 8;
        return true;
      }
      return false;
    }

    // ---- Génération ----
    let premiereEE = true;

    Object.entries(entreprisesMap).forEach(([eeNom, chantiersEE]) => {
      const couleurEE = couleursEE[eeNom] || [30, 144, 255];
      const couleurClEE = couleurEE.map(v => Math.min(255, v + 150));
      lastCouleurEE = couleurEE;
      lastCouleurClEE = couleurClEE;
      lastEENom = eeNom;

      // Vérifier si l'en-tête EE + au moins 1 rangée tient
      const besoinsEE = headerEEH + blockH;
      if (!premiereEE) {
        nouvellePageSiNecessaire(besoinsEE);
      }
      premiereEE = false;

      // En-tête EE
      doc.setFillColor(...couleurEE);
      doc.rect(0, currentY, pageW, 18, "F");

      if (logoAinmDataUrl) {
        const logoH = 9;
        const logoW = logoH / (291 / 737);
        doc.addImage(logoAinmDataUrl, "JPEG", marge, currentY + 4.5, logoW, logoH);
      }

      doc.setTextColor(...blanc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ENTREPRISE : " + eeNom, pageW / 2, currentY + 7, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Édité le : " + dateStr, pageW / 2, currentY + 13, { align: "center" });
      if (window.numeroRJ) {
        doc.text("RJ : " + window.numeroRJ, pageW - marge, currentY + 13, { align: "right" });
      }
      currentY += headerEEH;

      // Chantiers en grille 2 colonnes
      const entries = Object.entries(chantiersEE);
      entries.forEach(([nom, c], idx) => {
        const colIndex = idx % 2;

        // Nouvelle ligne → vérifier l'espace
        if (colIndex === 0) {
          nouvellePageSiNecessaire(blockH);
        }

        const x = marge + colIndex * (colW + gap);
        const y = currentY;
        const pct = c.total > 0 ? Math.round((c.effectues / c.total) * 100) : 0;
        let couleurBarre = pct === 100 ? vert : pct >= 50 ? orange : couleurEE;
        if (eeNom === "TSO" && pct < 50) couleurBarre = [234, 179, 8];
        if (eeNom === "ETF" && pct < 50) couleurBarre = [220, 38, 38];
        const ecart = c.m3Reel - c.m3PrevuEffectue;
        const couleurEcart = ecart > 0 ? rouge : vert;

        // En-tête du mini-bloc
        doc.setFillColor(...couleurEE);
        doc.roundedRect(x, y, colW, 4.5, 0.6, 0.6, "F");
        doc.setTextColor(...blanc);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("CH. " + nom, x + 1.5, y + 3.2);
        doc.setFontSize(6.5);
        doc.text("Tot: " + c.m3TotalPrevu.toFixed(1) + "m³", x + colW - 1.5, y + 3.2, { align: "right" });

        let innerY = y + 5;
        doc.setFillColor(250, 248, 250);
        doc.setDrawColor(220, 210, 220);
        doc.roundedRect(x, innerY, colW, blockH - 5, 0.8, 0.8, "FD");

        let contentY = innerY + 3.5;
        const leftInfoX = x + 2.5;
        const rightChartX = x + colW - 10;
        const chartY = contentY + 5.5;

        doc.setTextColor(...gris);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text("Massifs: " + c.effectues + "/" + c.total, leftInfoX, contentY);

        // Donut miniature
        doc.setFillColor(...grisCl);
        doc.circle(rightChartX, chartY, 5.5, "F");
        doc.setFillColor(...couleurBarre);
        doc.circle(rightChartX, chartY, 5.5, "F");
        doc.setFillColor(250, 248, 250);
        doc.circle(rightChartX, chartY, 3.3, "F");
        doc.setTextColor(...couleurBarre);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.text(pct + "%", rightChartX, chartY + 1.8, { align: "center" });

        contentY += 4.5;
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
          headStyles: { fillColor: couleurEE, textColor: blanc, fontStyle: "bold", cellPadding: 0.5 },
          bodyStyles: { fontStyle: "bold", textColor: [50, 50, 50] },
          columnStyles: { 2: { textColor: couleurEcart }, 3: { textColor: couleurEcart } },
        });

        // Avancer currentY seulement après la colonne droite (ou si c'est le dernier)
        if (colIndex === 1 || idx === entries.length - 1) {
          currentY += blockH;
        }
      });

      currentY += 4; // espace entre EE
    });

    // ---- Pied de page sur toutes les pages ----
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...lastCouleurClEE);
      doc.rect(0, pageH - footerH, pageW, footerH, "F");
      doc.setTextColor(...lastCouleurEE);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("AINM — Récapitulatif chantiers", marge, pageH - 2.5);
      doc.text("Page " + p + " / " + totalPages, pageW - marge, pageH - 2.5, { align: "right" });
    }

    // ---- Partage ----
    const nomFichier = "RECAP_ENTREPRISES_" + new Date().toISOString().slice(0, 10) + ".pdf";
    const pdfBlob = doc.output("blob");
    if (typeof partagerPDF === "function") {
      partagerPDF(pdfBlob, nomFichier, "Récapitulatif Chantiers par Entreprise");
    } else {
      doc.save(nomFichier);
    }

  } catch (err) {
    console.error("Erreur PDF récap :", err);
    alert("⚠️ Erreur : " + err.message);
  } finally {
    if (btnPdf) { btnPdf.disabled = false; btnPdf.innerHTML = "📄 Exporter PDF"; }
  }
}
