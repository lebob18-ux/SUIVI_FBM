/* ============================================================
   VARIABLES GLOBALES ET INITIALISATION DES PHASES
   ============================================================ */
let phasesInitialesCount = 0;

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
   CHARGEMENT ET SELECTION DES SUPPORTS ET CHANTIERS
   ============================================================ */
function initChantiers() {
  const select = document.getElementById("selectChantier");
  if (!select) return;

  const chantiersMap = {};
  baseSupports.forEach(s => {
    const chantierNom = s.chantier || s.CHANTIER;
    if (!chantierNom) return;

    if (!chantiersMap[chantierNom]) {
      chantiersMap[chantierNom] = { total: 0, effectues: 0 };
    }
    chantiersMap[chantierNom].total++;
    
    // Un support est terminé si les 3 dates sont remplies
    const df = s.date_fouille || s.DATE_FOUILLE;
    const db = s.date_beton || s.DATE_BETON;
    const dm = s.date_matage || s.DATE_MATAGE;

    if (df && db && dm) {
      chantiersMap[chantierNom].effectues++;
    }
  });

  select.innerHTML = '<option value="">-- Sélectionner un chantier --</option>';
  const chantiersUniques = [...new Set(baseSupports.map(s => s.chantier || s.CHANTIER))].filter(Boolean);

  chantiersUniques.forEach(c => {
    const data = chantiersMap[c];

    // Masque le chantier s'il est 100% terminé
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
  
  if (typeof largeurEchantillon !== "undefined") largeurEchantillon = 0;
  if (typeof profondeurEchantillon !== "undefined") profondeurEchantillon = 0;

  document.getElementById("blindageCheck").checked = false;
  document.getElementById("carotte").checked = false;
  if (window.refreshBlocs) window.refreshBlocs();

  if (typeof calculer === "function") calculer();
}

function filtrerSupports() {
    const chantierSelect = document.getElementById("selectChantier");
    const chantier = chantierSelect ? chantierSelect.value : "";
    const supportSelect = document.getElementById("selectSupport");

    if (!supportSelect) return;

    resetSaisieAvantSupport();
    supportSelect.innerHTML = `<option value="">-- choisir support --</option>`;

    if (!chantier) return;

    // Filtre : on garde les supports où il manque au moins une des 3 dates
    const filtres = baseSupports.filter(s => {
        const nomChantier = s.chantier || s.CHANTIER;
        if (nomChantier !== chantier) return false;
        
        const df = s.date_fouille || s.DATE_FOUILLE;
        const db = s.date_beton || s.DATE_BETON;
        const dm = s.date_matage || s.DATE_MATAGE;

        return !(df && db && dm);
    });
    
    filtres.forEach(s => {
        const numSupport = s.support || s.SUPPORT;
        if (!numSupport) return;

        let opt = document.createElement("option");
        opt.value = numSupport;
        opt.textContent = numSupport;
        supportSelect.appendChild(opt);
    });
}

function chargerSupport() {
    const selectSupport = document.getElementById("selectSupport");
    const data = baseSupports.find(s => (s.support || s.SUPPORT) === selectSupport.value);

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

    const valP = (data.P !== undefined && data.P !== null) ? parseFloat(data.P) : 0;
    const valeurAbsolueP = Math.abs(valP);

    document.getElementById("P_ref_N").innerText = valeurAbsolueP;
    document.getElementById("P_ref_S").innerText = valeurAbsolueP;

    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");

    if (valP >= 0) {
        document.getElementById("valP_S").value = valeurAbsolueP;
        document.getElementById("valP_N").value = "";
        if (blocS) blocS.style.display = "block";
        if (blocN) blocN.style.display = "none";
    } else {
        document.getElementById("valP_N").value = valeurAbsolueP;
        document.getElementById("valP_S").value = "";
        if (blocN) blocN.style.display = "block";
        if (blocS) blocS.style.display = "none";
    }

    if (typeof appliquerEchantillon === "function") {
        appliquerEchantillon(data.ECH);
    }
    
    // Initialisation des cases à cocher selon les dates présentes
    const chkF = document.getElementById('check_fouille');
    const chkB = document.getElementById('check_beton');
    const chkM = document.getElementById('check_matage');

    if (chkF) chkF.checked = !!(data.date_fouille || data.DATE_FOUILLE);
    if (chkB) chkB.checked = !!(data.date_beton || data.DATE_BETON);
    if (chkM) chkM.checked = !!(data.date_matage || data.DATE_MATAGE);
    
    memoriserEtatInitialPhases();

    document.getElementById("blindageCheck").checked = (data.BLIND === "OUI");
    document.getElementById("carotte").checked = (data.CARO === "OUI");
    document.getElementById("display_type").innerText = data.TYPE ? "🧊 " + data.TYPE : "";

    if (typeof refreshBlocs === "function") refreshBlocs();
    if (typeof restaurerLocal === "function") restaurerLocal();
    if (typeof rechargerBLsSupport === "function") rechargerBLsSupport();
    if (typeof calculer === "function") calculer();
}

/* ============================================================
   ECHANTILLONNAGE
   ============================================================ */
const aliasEchantillon = {
"HE180A":"HEA180", "HEA180":"HEA180",
"HE200A":"HEA200", "HEA200":"HEA200",
"HE220A":"HEA220", "HEA220":"HEA220",
"HE240A":"HEA240", "HEA240":"HEA240",
"HE300A":"HEA300", "HEA300":"HEA300",
"HE320A":"HEA320", "HEA320":"HEA320",
"HE220B":"HEB220", "HEB220":"HEB220",
"HE240B":"HEB240", "HEB240":"HEB240",
"HE260B":"HEB260", "HEB260":"HEB260",
"HE300B":"HEB300", "HEB300":"HEB300",
"HE320B":"HEB320", "HEB320":"HEB320",
"JHE280A":"JHEA280", "JHEA280":"JHEA280",
"JHE320A":"JHEA320", "JHEA320":"JHEA320",
"JHE280B":"JHEB280", "JHEB280":"JHEB280",
"JHE320B":"JHEB320", "JHEB320":"JHEB320",
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
  if (profil && typeof validerEchantillonPopup === "function") {
    validerEchantillonPopup(profil.valeur, profil.largeur, profil.nom);
  } else if (typeof validerEchantillonPopup === "function") {
    validerEchantillonPopup("manuel", "0", "Autre...");
    document.getElementById("E").value = cle;
    document.getElementById("display_prof").innerText = cle;
    if (typeof calculer === "function") calculer();
  }
}

function gérerVisibilitéP() {
    if (typeof calculer === "function") calculer();
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
  if (typeof calculer === "function") calculer();
}

/* ============================================================
   SYNCHRONISATION SUPABASE
   ============================================================ */
async function synchroniserSupportActuel() {
  const numSupportInput = document.getElementById("selectSupport")?.value.trim();
  const chantierSelect = document.getElementById("selectChantier");
  const nomChantier = (chantierSelect && chantierSelect.selectedIndex >= 0 && chantierSelect.options[chantierSelect.selectedIndex])
    ? chantierSelect.options[chantierSelect.selectedIndex].text
    : "";

  if (!numSupportInput) return false;

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
    return true;

  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err.message);
    alert("⚠️ Avertissement : Les données réelles n'ont pas pu être enregistrées dans Supabase, mais le PDF va quand même se générer.");
    return false;
  }
}
