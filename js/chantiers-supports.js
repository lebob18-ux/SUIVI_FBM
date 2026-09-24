// Variable globale pour stocker l'état initial des cases au chargement du support
let phasesInitialesCount = 0;

// Fonction à appeler lorsque tu charges / affiches les données d'un support
function memoriserEtatInitialPhases() {
    const f = document.getElementById('check_fouille')?.checked ? 1 : 0;
    const b = document.getElementById('check_beton')?.checked ? 1 : 0;
    const m = document.getElementById('check_matage')?.checked ? 1 : 0;
    phasesInitialesCount = f + b + m;
}

function logoSVGversPNG(largeurPx, hauteurPx) {
  return new Promise((resolve) => {
    fetch("assets/logo.svg")
      .then((r) => {
        if (!r.ok) throw new Error("logo.svg introuvable");
        return r.text();
      })
      .then((svgData) => {
        const svg64 = btoa(unescape(encodeURIComponent(svgData)));
        const image64 = "data:image/svg+xml;base64," + svg64;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = largeurPx;
          canvas.height = hauteurPx;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, largeurPx, hauteurPx);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        img.src = image64;
      })
      .catch(() => resolve(null));
  });
}

/* ============================================================
   EXPORT PDF — document structuré (pas une capture d'écran)
   ============================================================ */
async function exporterPDF() {
  const numSupportInput = document.getElementById("selectSupport").value.trim();

  if (numSupportInput === "") {
    alert("⚠️ Saisie obligatoire :\nVous devez inscrire un N° Support avant de pouvoir exporter les résultats.");
    document.getElementById("selectSupport").focus();
    return;
  }

  // --- CONTRÔLE DES CASES À COCHER AVANT EXPORT ---
  const fouilleCoche = document.getElementById('check_fouille').checked;
  const betonCoche = document.getElementById('check_beton').checked;
  const matageCoche = document.getElementById('check_matage').checked;
  
  const isBlindage = document.getElementById('blindageCheck').checked;
  const isHorsP1 = document.getElementById('check_hors_p1')?.checked || false;

  const phasesActuellesCount = (fouilleCoche ? 1 : 0) + (betonCoche ? 1 : 0) + (matageCoche ? 1 : 0);

  if (isBlindage || isHorsP1) {
    // Cas Blindage ou Hors P1 : il faut au moins une phase validée, ET si des phases étaient déjà là, il en faut une de plus
    if (phasesActuellesCount === 0) {
      alert("⚠️ En mode Blindage / Hors P1, vous devez valider au moins une phase pour exporter.");
      return;
    }
    if (phasesActuellesCount <= phasesInitialesCount) {
      alert("⚠️ En mode Blindage / Hors P1, vous devez valider au moins une nouvelle phase supplémentaire par rapport à l'état initial.");
      return;
    }
  } else {
    // Cas général FBM classique : les 3 phases doivent être vraies ou validées par popup
    if (!fouilleCoche || !betonCoche || !matageCoche) {
      const confirmation = confirm("Voulez-vous valider les 3 Phase ?");
      if (!confirmation) {
        return; // Stoppe l'export si l'utilisateur refuse
      } else {
        // Coche automatiquement les 3 si l'utilisateur valide
        document.getElementById('check_fouille').checked = true;
        document.getElementById('check_beton').checked = true;
        document.getElementById('check_matage').checked = true;
      }
    }
  }
  // ------------------------------------------------

  // 🟢 Appel de notre fonction dédiée à la mise à jour Supabase
  await synchroniserSupportActuel();
  const btnPdf = document.getElementById("btnExportPdf");
  const btnOriginalHTML = btnPdf.innerHTML;
  btnPdf.innerHTML = "⏳...";
  btnPdf.disabled = true;

  try {
    const g = (id) => document.getElementById(id);
    const val = (id) => { const el = g(id); return el ? (el.value || "").toString().trim() : ""; };
    const txt = (id) => { const el = g(id); return el ? (el.innerText || "").toString().trim() : ""; };

    const clean = (s) => (s || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u2139\uFE0F]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    function lignesColorees(id) {
      const el = g(id);
      if (!el) return [];
      const brut = el.innerText || "";
      return brut.split("\n").map(l => l.trim()).filter(l => l.length > 0).map(l => {
        let couleur = [40, 40, 40];
        if (l.includes("🚨")) couleur = [200, 30, 40];
        else if (l.includes("✅")) couleur = [22, 140, 60];
        else if (l.includes("👉")) couleur = [110, 40, 160];
        else if (l.includes("ℹ️")) couleur = [90, 90, 90];
        return { texte: clean(l), couleur };
      });
    }

    const chantierSelect = g("selectChantier");
    const nomChantier = (chantierSelect.selectedIndex >= 0 && chantierSelect.options[chantierSelect.selectedIndex])
      ? chantierSelect.options[chantierSelect.selectedIndex].text
      : "";

    const typeSupport = clean(txt("display_type")).replace(/^Type\s*:\s*/i, "");
    const dateStr = new Date().toLocaleString("fr-FR");
    const supportData = baseSupports.find(s => s.support === numSupportInput);
    const idSupport = supportData?.ID || "";

    const verifVoie = g("verifVoie").checked;
    const verifCarotte = g("carotte").checked;
    const verifBlindage = g("blindageCheck").checked;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marge = 10;
    const violet = [124, 34, 112];
    const rouge = [228, 29, 37];
    const footerReserve = 14;

    const logoDataUrl = await logoSVGversPNG(216, 153);
    const logoRatio = 153 / 216;

    const logoAinmDataUrl = (typeof logoAINMversPNG === "function") ? await logoAINMversPNG(737, 291) : null;
    const logoAinmRatio = 291.02362 / 737.00789;

    function bandeauDegrade(y0, h) {
      const bandes = 60;
      for (let i = 0; i < bandes; i++) {
        const t = i / (bandes - 1);
        const r = Math.round(violet[0] + t * (rouge[0] - violet[0]));
        const gC = Math.round(violet[1] + t * (rouge[1] - violet[1]));
        const b = Math.round(violet[2] + t * (rouge[2] - violet[2]));
        doc.setFillColor(r, gC, b);
        doc.rect(pageW * i / bandes, y0, pageW / bandes + 0.6, h, 'F');
      }
    }

    function enteteComplete() {
      bandeauDegrade(0, 27);
      if (logoDataUrl) {
        const logoH = 15;
        const logoW = logoH / logoRatio;
        doc.addImage(logoDataUrl, "PNG", marge, 4.5, logoW, logoH);
      }
      if (logoAinmDataUrl) {
        const logoAinmH = 9;
        const logoAinmW = logoAinmH / logoAinmRatio;
        doc.addImage(logoAinmDataUrl, "PNG", pageW - marge - logoAinmW, 3, logoAinmW, logoAinmH);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14.5);
      doc.text("FICHE DE CONTROLE FOUILLE / BLINDAGE", pageW / 2, 9, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("SNCF Reseau  -  Outil FBM", pageW / 2, 14.5, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Chantier : " + (nomChantier || "-") + "    RJ : " + (window.numeroRJ || "-"), marge, 24);
      doc.text("Support : " + numSupportInput, pageW - marge, 24, { align: "right" });
    }

    function enteteAllegee() {
      doc.setFillColor(violet[0], violet[1], violet[2]);
      doc.rect(0, 0, pageW, 12, 'F');
      if (logoDataUrl) {
        const logoH = 8;
        const logoW = logoH / logoRatio;
        doc.addImage(logoDataUrl, "PNG", marge, 2, logoW, logoH);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("FICHE FOUILLE/BLINDAGE - Support " + numSupportInput, pageW / 2, 8, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("(suite)", pageW - marge, 8, { align: "right" });
    }

    function piedDePage(numPage, totalPages) {
      doc.setDrawColor(210, 210, 210);
      doc.line(marge, pageH - 10, pageW - marge, pageH - 10);
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.setFont("helvetica", "normal");
      doc.text("Document genere automatiquement - a verifier avant usage", marge, pageH - 5);
      doc.text("Page " + numPage + "/" + totalPages, pageW - marge, pageH - 5, { align: "right" });
    }

    let y = 0;
    enteteComplete();
    y = 33;
    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Genere le " + dateStr + (typeSupport ? "    -    Type : " + typeSupport : "") + (idSupport ? "    -    ID : " + idSupport : ""), marge, y);
    y += 4;

    function assurerPlace(hauteurNecessaire) {
      if (y + hauteurNecessaire > pageH - footerReserve) {
        doc.addPage();
        enteteAllegee();
        y = 18;
      }
    }

    function titreSection(titre, couleur) {
      assurerPlace(10);
      doc.setFillColor(couleur[0], couleur[1], couleur[2]);
      doc.rect(marge, y, pageW - marge * 2, 6.2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(titre, marge + 2, y + 4.4);
      y += 6.2 + 5;
    }

    titreSection("PARAMETRES DE FOUILLE", violet);

    const echValeur = (() => {
      const sel = g("E_select");
      if (sel && sel.style.display !== "none") {
        const opt = sel.options[sel.selectedIndex];
        return opt ? opt.text : sel.value;
      }
      return val("E") + " cm";
    })();

    const blocNVisible = g("bloc-N") && g("bloc-N").style.display !== "none";
    const valPActuel = blocNVisible ? val("valP_N") : val("valP_S");
    const refPActuel = blocNVisible ? txt("P_ref_N") : txt("P_ref_S");
    const sensPTexte = blocNVisible ? "amont" : "aval";

    const rowsFouille = [
      ["Implantation (I)", val("I") ? val("I") + " m" : "-", txt("I_ref")],
      ["Echantillon", echValeur || "-", txt("ECH_ref")],
      ["Arasement (AR)", val("AR") ? val("AR") + " Cm" : "-", txt("AR_ref")],
      ["Encastrement (Enc)", val("Enc") ? val("Enc") + " m" : "-", txt("Enc_ref")],
      ["Cote A", val("AF") ? val("AF") + " m" : "-", txt("AF_ref")],
      ["Cote B", val("B_Fouille") ? val("B_Fouille") + " m" : "-", txt("B_ref")],
      ["Cote H", val("H_Fouille") ? val("H_Fouille") + " m" : "-", txt("H_ref")],
      ["F", val("valF") || "-", txt("F_ref")],
      ["P (" + sensPTexte + " de SUP)", valPActuel || "-", refPActuel],
      ["SUP", val("valSUP") || "-", txt("SUP_ref")],
    ];

    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      head: [["Parametre", "Valeur saisie", "Reference"]],
      body: rowsFouille,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8, textColor: [40, 40, 40], lineColor: [225, 225, 225] },
      headStyles: { fillColor: violet, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 2: { textColor: [22, 130, 60], fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 5;

    titreSection("CONFIGURATION", [90, 90, 90]);
    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      head: [["Voies annoncees / interceptees (TES.D)", "Carottage", "Blindage"]],
      body: [[
        verifVoie ? "OUI" : "NON",
        verifCarotte ? "OUI" : "NON",
        verifBlindage ? "OUI" : "NON",
      ]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [90, 90, 90], textColor: 255, fontStyle: 'bold', fontSize: 7.3 },
      bodyStyles: { fontStyle: 'bold' },
    });
    y = doc.lastAutoTable.finalY + 5;

    if (verifCarotte) {
      titreSection("CAROTTAGE", [217, 119, 6]);
      const rowsCarotte = [
        ["A carotte", val("A_carotte") + " cm"],
        ["B carotte", val("B_carotte") + " cm"],
        ["Encastrement", val("H_carotte") + " cm"],
        ["Plus petit e1", val("E1_carotte") + " cm"],
        ["Plus petit e2", val("E2_carotte") + " cm"],
        ["P carotte", val("P_carotte") + " cm"],
        ["Profile", txt("display_nom") || "-"],
        ["Largeur profile", txt("display_larg") + " mm"],
        ["Profondeur profile", txt("display_prof") + " mm"],
        ["e1 cote A (haut/bas)", txt("calc_S1")],
        ["e1 cote B (gauche/droite)", txt("calc_S2")],
        ["e2 cote A (haut/bas)", txt("calc_S3")],
        ["e2 cote B (gauche/droite)", txt("calc_S4")],
      ];
      doc.autoTable({
        startY: y,
        margin: { left: marge, right: marge, bottom: footerReserve },
        body: rowsCarotte,
        theme: 'grid',
        styles: { fontSize: 7.8, cellPadding: 1.6 },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } },
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    if (verifBlindage) {
      titreSection("BLINDAGE", [3, 105, 161]);
      const rowsBlindage = [
        ["Bord blindage - bord rail", val("dist_blindage") + " m"],
        ["Traverse (LT)", val("LT") + " cm"],
        ["Sol -> Massif", val("SOL") + " m"],
        ["NiT -> Hbis", val("NIT") + " m"],
      ];
      doc.autoTable({
        startY: y,
        margin: { left: marge, right: marge, bottom: footerReserve },
        body: rowsBlindage,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.8 },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } },
      });
      y = doc.lastAutoTable.finalY + 3;

      const lignesAlerteBlindage = lignesColorees("alerte_blindage_bloc");
      if (lignesAlerteBlindage.length > 0) {
        assurerPlace(6 * lignesAlerteBlindage.length + 4);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        lignesAlerteBlindage.forEach(l => {
          doc.setTextColor(l.couleur[0], l.couleur[1], l.couleur[2]);
          doc.text(l.texte, marge + 1, y);
          y += 4.6;
        });
        y += 2;
      }
    }

    titreSection("VOLUMES", violet);
    const volCarotteVisible = g("display_vol_carotte") && g("display_vol_carotte").style.display !== "none";
    const headVolumes = ["Volume theorique", "Volume reel"];
    const rowVolumes = [txt("vol_prevu") || "-", txt("vol_modifie") || "-"];
    if (volCarotteVisible) {
      headVolumes.push("Beton net (hors carotte)");
      rowVolumes.push(txt("vol_carotte") || "-");
    }
    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      head: [headVolumes],
      body: [rowVolumes],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: violet, textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontStyle: 'bold', textColor: [0, 100, 180] },
    });
    y = doc.lastAutoTable.finalY + 5;

    if (typeof blsActuels !== "undefined" && blsActuels.length > 0) {
      titreSection("BONS DE LIVRAISON BÉTON", violet);
      const rowsBL = blsActuels.map((item, i) => [
        i + 1,
        item.bl,
        item.slumps.length > 0 ? item.slumps.join(" / ") + " cm" : "-"
      ]);
      doc.autoTable({
        startY: y,
        margin: { left: marge, right: marge, bottom: footerReserve },
        head: [["#", "N° BL", "Slump(s)"]],
        body: rowsBL,
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: violet, textColor: 255, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { fontStyle: "bold" },
          2: { halign: "center", textColor: [3, 105, 161] }
        },
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    titreSection("RESULTAT", rouge);

    const lignesTbf = lignesColorees("tbf");
    const ligneLtv = clean(txt("ltv"));
    const ligneILtv = clean(txt("I_LTV"));

    assurerPlace(6 * (lignesTbf.length + (ligneLtv ? 1 : 0) + (ligneILtv ? 1 : 0)) + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    lignesTbf.forEach(l => {
      doc.setTextColor(l.couleur[0], l.couleur[1], l.couleur[2]);
      doc.text(l.texte, marge + 1, y);
      y += 5;
    });
    if (ligneLtv) {
      doc.setTextColor(200, 30, 40);
      doc.text(ligneLtv, marge + 1, y);
      y += 5;
    }
    if (ligneILtv) {
      doc.setTextColor(110, 40, 160);
      doc.text(ligneILtv, marge + 1, y);
      y += 5;
    }
    y += 2;

    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      head: [["BMax", "DMin", "Hmax"]],
      body: [[
        clean(txt("BMax_display")) || "-",
        clean(txt("DMin_display")) || "-",
        clean(txt("Hmax_display")) || "-",
      ]],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [90, 90, 90], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontStyle: 'bold', textColor: [22, 130, 60] },
    });
    y = doc.lastAutoTable.finalY + 8;

    const nomRedacteur = val("nomRedacteur");
    const emailRedacteur = val("emailRedacteur");

    assurerPlace(16);
    doc.setDrawColor(180, 180, 180);
    doc.setFontSize(7.8);
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "bold");
    doc.text("Rédigé par : " + (nomRedacteur || "-"), marge, y);
    y += 5;
    if (emailRedacteur) {
      doc.setFont("helvetica", "normal");
      doc.text("Email : " + emailRedacteur, marge, y);
      y += 5;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      piedDePage(p, totalPages);
    }

    const nomFichier = "FBM_" + numSupportInput.replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".pdf";
    doc.save(nomFichier);

  } catch (err) {
    console.error(err);
    alert("⚠️ Erreur lors de la génération du PDF :\n" + err.message);
  } finally {
    btnPdf.innerHTML = btnOriginalHTML;
    btnPdf.disabled = false;
  }
}

/**
 * Envoie les valeurs réelles de l'interface vers la table Supabase 'blindage'
 */
async function synchroniserSupportActuel() {
  const numSupportInput = document.getElementById("selectSupport")?.value.trim();
  const chantierSelect = document.getElementById("selectChantier");
  const nomChantier = (chantierSelect && chantierSelect.selectedIndex >= 0 && chantierSelect.options[chantierSelect.selectedIndex])
    ? chantierSelect.options[chantierSelect.selectedIndex].text
    : "";

  if (!numSupportInput) {
    console.warn("Synchronisation ignorée : aucun support sélectionné.");
    return false;
  }

  try {
    const volReelTexte = document.getElementById("vol_modifie") ? document.getElementById("vol_modifie").innerText : "0";
    const volReelNum = parseFloat(volReelTexte.replace("m³", "").trim()) || 0;

    let echValeur = null;
    const selEch = document.getElementById("E_select");
    if (selEch && selEch.style.display !== "none") {
      const opt = selEch.options[selEch.selectedIndex];
      echValeur = opt ? opt.text : selEch.value;
    } else {
      const inputE = document.getElementById("E");
      echValeur = inputE ? inputE.value : null;
    }

    const blocNVisible = document.getElementById("bloc-N") && document.getElementById("bloc-N").style.display !== "none";
    const pSaisi = blocNVisible ? document.getElementById("valP_N")?.value : document.getElementById("valP_S")?.value;

    const dateJour = new Date().toISOString().slice(0, 10);

    const iReel = document.getElementById("I")?.value;
    const arReel = document.getElementById("AR")?.value;
    const encReel = document.getElementById("Enc")?.value;
    const aReel = document.getElementById("AF")?.value;
    const bReel = document.getElementById("B_Fouille")?.value;
    const hReel = document.getElementById("H_Fouille")?.value;
    const fReel = document.getElementById("valF")?.value;
    const supReel = document.getElementById("valSUP")?.value;

    const fouilleCoche = document.getElementById('check_fouille')?.checked || false;
    const betonCoche = document.getElementById('check_beton')?.checked || false;
    const matageCoche = document.getElementById('check_matage')?.checked || false;

    const { error } = await supabaseClient
      .from('blindage')
      .update({
        i_reel: iReel ? parseFloat(iReel) : null,
        ech_reel: echValeur ? String(echValeur).trim() : null,
        ar_reel: arReel ? parseFloat(arReel) : null,
        enc_reel: encReel ? parseFloat(encReel) : null,
        a_reel: aReel ? parseFloat(aReel) : null,
        b_reel: bReel ? parseFloat(bReel) : null,
        h_reel: hReel ? parseFloat(hReel) : null,
        f_reel: fReel ? parseFloat(fReel) : null,
        p_reel: pSaisi ? parseFloat(pSaisi) : null,
        sup_reel: supReel ? parseFloat(supReel) : null,
        m3_reel: volReelNum,
        date_exec: dateJour,
        
        date_fouille: fouilleCoche ? dateJour : null,
        date_beton: betonCoche ? dateJour : null,
        date_matage: matageCoche ? dateJour : null
      })
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput);

    if (error) throw error;
    
    console.log(`✅ Support ${numSupportInput} (${nomChantier}) synchronisé avec succès dans Supabase.`);
    return true;

  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err.message);
    alert("⚠️ Avertissement : Les données réelles n'ont pas pu être enregistrées dans Supabase, mais le PDF va quand même se générer.");
    return false;
  }
}

function chargerSupport() {
    const selectSupport = document.getElementById("selectSupport");
    const data = baseSupports.find(s => s.support === selectSupport.value);

    if (!data) return;

    const valOuVide = (val) => (val !== undefined && val !== null && val !== "") ? val : "";

    document.getElementById("valF").value = valOuVide(data.F);
    document.getElementById("valSUP").value = valOuVide(data.SUP);
    document.getElementById("I").value = valOuVide(data.I);
    document.getElementById("AF").value = valOuVide(data.AF);
    document.getElementById("B_Fouille").value = valOuVide(data.B);
    document.getElementById("H_Fouille").value = valOuVide(data.H);
    document.getElementById("AR").value = valOuVide(data.AR);
    document.getElementById("Enc").value = valOuVide(data.Enc);

    document.getElementById("F_ref").innerText = valOuVide(data.F);
    document.getElementById("SUP_ref").innerText = valOuVide(data.SUP);
    document.getElementById("I_ref").innerText = valOuVide(data.I);
    document.getElementById("AF_ref").innerText = valOuVide(data.AF);
    document.getElementById("B_ref").innerText = valOuVide(data.B);
    document.getElementById("H_ref").innerText = valOuVide(data.H);
    document.getElementById("AR_ref").innerText = valOuVide(data.AR);
    document.getElementById("Enc_ref").innerText = valOuVide(data.Enc);
    document.getElementById("ECH_ref").innerText = valOuVide(data.ECH);

    // Mémorisation de l'état initial des cases / dates de phases chargées depuis Supabase
    if (data.date_fouille || data.DATE_FOUILLE) document.getElementById('check_fouille').checked = true;
    if (data.date_beton || data.DATE_BETON) document.getElementById('check_beton').checked = true;
    if (data.date_matage || data.DATE_MATAGE) document.getElementById('check_matage').checked = true;
    memoriserEtatInitialPhases();

    const valP = (data.P !== undefined && data.P !== null) ? parseFloat(data.P) : 0;
    const valeurAbsolueP = Math.abs(valP);

    document.getElementById("P_ref_N").innerText = valeurAbsolueP;
    document.getElementById("P_ref_S").innerText = valeurAbsolueP;

    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");

    if (valP >= 0) {
        document.getElementById("valP_S").value = valeurAbsolueP;
        document.getElementById("valP_N").value = "";
        blocS.style.display = "block";
        blocN.style.display = "none";
    } else {
        document.getElementById("valP_N").value = valeurAbsolueP;
        document.getElementById("valP_S").value = "";
        blocN.style.display = "block";
        blocS.style.display = "none";
    }

    if (typeof appliquerEchantillon === "function") {
        appliquerEchantillon(data.ECH);
    }
    
    document.getElementById("blindageCheck").checked = (data.BLIND === "OUI");
    document.getElementById("carotte").checked = (data.CARO === "OUI");
    document.getElementById("display_type").innerText = data.TYPE ? "🧊 " + data.TYPE : "";

    if (typeof refreshBlocs === "function") refreshBlocs();
    if (typeof restaurerLocal === "function") restaurerLocal();
    if (typeof rechargerBLsSupport === "function") rechargerBLsSupport();
    calculer();
}

const aliasEchantillon = {
"HE180A":"HEA180",
"HEA180":"HEA180",
"HE200A":"HEA200",
"HEA200":"HEA200",
"HE220A":"HEA220",
"HEA220":"HEA220",
"HE240A":"HEA240",
"HEA240":"HEA240",
"HE300A":"HEA300",
"HEA300":"HEA300",
"HE320A":"HEA320",
"HEA320":"HEA320",
"HE220B":"HEB220",
"HEB220":"HEB220",
"HE240B":"HEB240",
"HEB240":"HEB240",
"HE260B":"HEB260",
"HEB260":"HEB260",
"HE300B":"HEB300",
"HEB300":"HEB300",
"HE320B":"HEB320",
"HEB320":"HEB320",
"JHE280A":"JHEA280",
"JHEA280":"JHEA280",
"JHE320A":"JHEA320",
"JHEA320":"JHEA320",
"JHE280B":"JHEB280",
"JHEB280":"JHEB280",
"JHE320B":"JHEB320",
"JHEB320":"JHEB320",
};

const profilsEchantillon = {
"HEA180":    { valeur: "180",     largeur: "171", nom: "HEA180"   },
"HEA200":    { valeur: "200",     largeur: "190", nom: "HEA200"   },
"HEA220":    { valeur: "220",     largeur: "210", nom: "HEA220"   },
"HEA240":    { valeur: "240",     largeur: "230", nom: "HEA240"   },
"HEA300":    { valeur: "300",     largeur: "290", nom: "HEA300"   },
"HEA320":    { valeur: "300",     largeur: "310", nom: "HEA320"   },    
"HEB220":    { valeur: "220",     largeur: "220", nom: "HEB220"   },
"HEB240":    { valeur: "240",     largeur: "240", nom: "HEB240"   },
"HEB260":    { valeur: "260",     largeur: "260", nom: "HEB260"   },
"HEB300":    { valeur: "300",     largeur: "300", nom: "HEB300"   },
"HEB320":    { valeur: "300",     largeur: "320", nom: "HEB320"   },
"JHEA280": { valeur: "280",     largeur: "820", nom: "JHEA280"  },
"JHEA320": { valeur: "300",     largeur: "860", nom: "JHEA320"  },
"JHEB280": { valeur: "280",     largeur: "830", nom: "JHEB280"  },
"JHEB320": { valeur: "300",     largeur: "870", nom: "JHEB320"  },
 "Epingle":{ valeur: "Epingle", largeur: "0",    nom: "Epingle" }
};

function appliquerEchantillon(ech) {
  if (ech === undefined || ech === null || ech === "") return;

  let cle = String(ech).trim();

  if (typeof aliasEchantillon !== "undefined" && aliasEchantillon[cle]) {
    cle = aliasEchantillon[cle];
  }

  const profil = profilsEchantillon[cle];
  if (profil) {
    validerEchantillonPopup(profil.valeur, profil.largeur, profil.nom);
  } else {
    validerEchantillonPopup("manuel", "0", "Autre...");
    document.getElementById("E").value = cle;
    document.getElementById("display_prof").innerText = cle;
    calculer();
  }
}

function gérerVisibilitéP() {
    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");
    const inputActif = (blocN.style.display !== "none") ? document.getElementById("valP_N") : document.getElementById("valP_S");
    calculer();
}

function initChantiers() {
  const select = document.getElementById("selectChantier");
  if (!select) return;

  const chantiersMap = {};
  baseSupports.forEach(s => {
    if (!chantiersMap[s.chantier]) {
      chantiersMap[s.chantier] = { total: 0, effectues: 0 };
    }
    chantiersMap[s.chantier].total++;
    
    const df = s.date_fouille || s.DATE_FOUILLE;
    const db = s.date_beton || s.DATE_BETON;
    const dm = s.date_matage || s.DATE_MATAGE;

    if (df && db && dm) {
      chantiersMap[s.chantier].effectues++;
    }
  });

  select.innerHTML = '<option value="">-- Sélectionner un chantier --</option>';
  const chantiersUniques = [...new Set(baseSupports.map(s => s.chantier))];

  chantiersUniques.forEach(c => {
    const data = chantiersMap[c];

    if (data && data.total > 0 && data.effectues === data.total) {
      return; 
    }

    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function resetSaisieAvantSupport() {
  document.getElementById("I").value = "";
  document.getElementById("AR").value = "";
  document.getElementById("Enc").value = "";
  document.getElementById("AF").value = "";
  document.getElementById("B_Fouille").value = "";
  document.getElementById("H_Fouille").value = "";

  document.getElementById("display_type").innerText = "";
  document.getElementById("AF_ref").innerText = "";
  document.getElementById("B_ref").innerText = "";
  document.getElementById("H_ref").innerText = "";
  document.getElementById("I_ref").innerText = "";
  document.getElementById("AR_ref").innerText = "";
  document.getElementById("Enc_ref").innerText = "";
  document.getElementById("ECH_ref").innerText = "";

  let selectE = document.getElementById("E_select");
  let inputE = document.getElementById("E");
  if (selectE) {
    selectE.querySelectorAll('.temp-option').forEach(opt => opt.remove());
    selectE.value = "";
    selectE.removeAttribute('data-largeur');
  }
  if (inputE) {
    inputE.value = "";
    inputE.style.display = "none";
  }
  document.getElementById("display_nom").innerText = "-";
  document.getElementById("display_larg").innerText = "0";
  document.getElementById("display_prof").innerText = "0";
  largeurEchantillon = 0;
  profondeurEchantillon = 0;

  document.getElementById("blindageCheck").checked = false;
  document.getElementById("carotte").checked = false;
  if (window.refreshBlocs) window.refreshBlocs();

  calculer();
}

function filtrerSupports() {
    const chantier = document.getElementById("selectChantier").value;
    const supportSelect = document.getElementById("selectSupport");

    resetSaisieAvantSupport();

    supportSelect.innerHTML = `<option value="">-- choisir support --</option>`;

    const filtres = baseSupports.filter(s => {
        if (s.chantier !== chantier) return false;
        
        const df = s.date_fouille || s.DATE_FOUILLE;
        const db = s.date_beton || s.DATE_BETON;
        const dm = s.date_matage || s.DATE_MATAGE;

        return !(df && db && dm);
    });
    
    filtres.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.support;
        opt.textContent = s.support;
        supportSelect.appendChild(opt);
    });
}

function gererSaisieEchantillon() {
  let selectE = document.getElementById("E_select");
  let inputE = document.getElementById("E");
  if (selectE && (selectE.value === "manual" || selectE.value === "manuel")) {
    inputE.style.display = "block";
    inputE.value = ""; 
    inputE.focus();
  } else if(inputE) {
    inputE.style.display = "none";
  }
  calculer();
}
