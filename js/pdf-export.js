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

  const btnPdf = document.getElementById("btnExportPdf");
  const btnOriginalHTML = btnPdf.innerHTML;
  btnPdf.innerHTML = "⏳...";
  btnPdf.disabled = true;

  try {
    const g = (id) => document.getElementById(id);
    const val = (id) => { const el = g(id); return el ? (el.value || "").toString().trim() : ""; };
    const txt = (id) => { const el = g(id); return el ? (el.innerText || "").toString().trim() : ""; };

    // Retire les émojis (non supportés par les polices PDF standard)
    const clean = (s) => (s || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u2139\uFE0F]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Découpe un bloc de résultat (avec <br>) en lignes, avec couleur déduite des émojis d'origine
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
// APRÈS
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

    // Rasterise le logo SNCF (SVG -> PNG) pour l'intégrer au PDF
const logoDataUrl = await logoSVGversPNG(120, 85);
const logoRatio = 85 / 120;

const logoAinmDataUrl = (typeof logoAINMversPNG === "function") ? await logoAINMversPNG(300, 118) : null;
const logoAinmRatio = 118 / 300;

    /* ---- bandeau dégradé (couleurs identité visuelle) ---- */
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

// APRÈS
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

    function enteteAllegee(numPage) {
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
  // APRÈS
doc.text("Genere le " + dateStr + (typeSupport ? "   -   Type : " + typeSupport : "") + (idSupport ? "   -   ID : " + idSupport : ""), marge, y);
    y += 4;

    // Vérifie qu'il reste assez de place, sinon ajoute une page (avec en-tête allégée)
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

    // ---------- Section 1 : paramètres de fouille ----------
    titreSection("PARAMETRES DE FOUILLE", violet);

    const echValeur = (() => {
      const sel = g("E_select");
      if (sel && sel.style.display !== "none") {
        const opt = sel.options[sel.selectedIndex];
        return opt ? opt.text : sel.value;
      }
      return val("E") + " cm";
    })();

// APRÈS
const blocNVisible = g("bloc-N") && g("bloc-N").style.display !== "none";
const valPActuel = blocNVisible ? val("valP_N") : val("valP_S");
const refPActuel = blocNVisible ? txt("P_ref_N") : txt("P_ref_S");
const sensPTexte = blocNVisible ? "amont" : "aval";

const rowsFouille = [
  ["Implantation (I)", val("I") ? val("I") + " m" : "-", txt("I_ref")],
  ["Echantillon", echValeur || "-", txt("ECH_ref")],
  ["Arasement (AR)", val("AR") ? val("AR") + " m" : "-", txt("AR_ref")],
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
      didDrawPage: function () { /* pagination gérée par autotable elle-même */ }
    });
    y = doc.lastAutoTable.finalY + 5;

    // ---------- Section 2 : configuration ----------
// APRÈS
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

    // ---------- Section 3 (option) : carottage ----------
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

    // ---------- Section 4 (option) : blindage ----------
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

    // ---------- Section 5 : volumes ----------
// APRÈS
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



// ---------- Section BL-BÉTON ----------
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
// ---------- Section BL-BÉTON ----------

    
    // ---------- Section 6 : résultat blindage / LTV ----------
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

    // ---------- Section 7 : seuils réglementaires ----------
// APRÈS
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


// APRÈS
    // ---------- Rédacteur ----------
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

    // ---------- Pied de page sur toutes les pages ----------
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      piedDePage(p, totalPages);
    }

// APRÈS
const nomFichier = "FBM_" + numSupportInput.replace(/[^a-zA-Z0-9_-]/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".pdf";

// APRÈS
const pdfBlob = doc.output("blob");
if (typeof partagerPDF === "function") {
  partagerPDF(pdfBlob, nomFichier, "Relevé FBM — Support : " + numSupportInput);
} else {
  doc.save(nomFichier);
}


    
  } catch (err) {
    console.error(err);
    alert("⚠️ Erreur lors de la génération du PDF :\n" + err.message);
  } finally {
    btnPdf.innerHTML = btnOriginalHTML;
    btnPdf.disabled = false;
  }
}

