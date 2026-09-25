/* ============================================================
   INITIALISATION DES PHASES ET SECURITE GLOBALE
   ============================================================ */
if (typeof window.phasesInitialesCount === 'undefined') {
    window.phasesInitialesCount = 0;
}

function memoriserEtatInitialPhases() {
    const f = document.getElementById('check_fouille')?.checked ? 1 : 0;
    const b = document.getElementById('check_beton')?.checked ? 1 : 0;
    const m = document.getElementById('check_matage')?.checked ? 1 : 0;
    window.phasesInitialesCount = f + b + m;
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
  if (typeof baseSupports === "undefined") {
    console.warn("⚠️ baseSupports n'est pas encore défini.");
    return;
  }

  baseSupports.forEach(s => {
    const chantierNom = s.chantier || s.CHANTIER;
    if (!chantierNom) return;

    if (!chantiersMap[chantierNom]) {
      chantiersMap[chantierNom] = { total: 0, effectues: 0 };
    }
    chantiersMap[chantierNom].total++;
    
    const df = s.date_fouille || s.DATE_FOUILLE;
    const db = s.date_beton || s.DATE_BETON;
    const dm = s.date_matage || s.DATE_MATAGE;

    if (df && db && dm) {
      chantiersMap[chantierNom].effectues++;
    }
  });

  select.innerHTML = '<option value="">-- Sélectionner un chantier --</option>';
  
  const chantiersUniques = [...new Set(baseSupports.map(s => s.chantier || s.CHANTIER))].filter(Boolean).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

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

  // Met à jour automatiquement les boutons dans la sidebar
  if (typeof peuplerChantiersSidebar === 'function') {
      peuplerChantiersSidebar();
  }
}

function peuplerChantiersSidebar() {
    const selectOriginal = document.getElementById('selectChantier');
    const conteneurSidebar = document.getElementById('listeChantiersSidebar');
    
    if (!selectOriginal || !conteneurSidebar) return;
    
    conteneurSidebar.innerHTML = '';
    
    for (let i = 1; i < selectOriginal.options.length; i++) {
        const option = selectOriginal.options[i];
        const valeurChantier = option.value;
        const texteChantier = option.text;
        
        const btn = document.createElement('button');
        btn.textContent = "📍 " + texteChantier;
        btn.style.fontSize = "16px";
        btn.style.padding = "10px 20px";
        
        btn.onclick = function() {
            selectOriginal.value = valeurChantier;
            selectOriginal.dispatchEvent(new Event('change'));
            basculerMenuParametres();
        };
        
        conteneurSidebar.appendChild(btn);
    }
}

function resetSaisieAvantSupport() {
  const elI = document.getElementById("I"); if(elI) elI.value = "";
  const elAR = document.getElementById("AR"); if(elAR) elAR.value = "";
  const elEnc = document.getElementById("Enc"); if(elEnc) elEnc.value = "";
  const elAF = document.getElementById("AF"); if(elAF) elAF.value = "";
  const elBF = document.getElementById("B_Fouille"); if(elBF) elBF.value = "";
  const elHF = document.getElementById("H_Fouille"); if(elHF) elHF.value = "";

  const dt = document.getElementById("display_type"); if(dt) dt.innerText = "";
  const afr = document.getElementById("AF_ref"); if(afr) afr.innerText = "";
  const br = document.getElementById("B_ref"); if(br) br.innerText = "";
  const hr = document.getElementById("H_ref"); if(hr) hr.innerText = "";
  const ir = document.getElementById("I_ref"); if(ir) ir.innerText = "";
  const arr = document.getElementById("AR_ref"); if(arr) arr.innerText = "";
  const encr = document.getElementById("Enc_ref"); if(encr) encr.innerText = "";
  const echr = document.getElementById("ECH_ref"); if(echr) echr.innerText = "";

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
  
  const dNom = document.getElementById("display_nom"); if(dNom) dNom.innerText = "-";
  const dLarg = document.getElementById("display_larg"); if(dLarg) dLarg.innerText = "0";
  const dProf = document.getElementById("display_prof"); if(dProf) dProf.innerText = "0";
  
  if (typeof largeurEchantillon !== "undefined") largeurEchantillon = 0;
  if (typeof profondeurEchantillon !== "undefined") profondeurEchantillon = 0;

  const blind = document.getElementById("blindageCheck"); if(blind) blind.checked = false;
  const caro = document.getElementById("carotte"); if(caro) caro.checked = false;
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

    const filtres = baseSupports.filter(s => {
        const nomChantier = s.chantier || s.CHANTIER;
        if (nomChantier !== chantier) return false;
        
        const df = s.date_fouille || s.DATE_FOUILLE;
        const db = s.date_beton || s.DATE_BETON;
        const dm = s.date_matage || s.DATE_MATAGE;

        return !(df && db && dm);
    });
    
    filtres.sort((a, b) => {
        const supA = String(a.support || a.SUPPORT || "");
        const supB = String(b.support || b.SUPPORT || "");
        return supA.localeCompare(supB, undefined, { numeric: true, sensitivity: 'base' });
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
    if (!selectSupport) return;
    
    const data = baseSupports.find(s => (s.support || s.SUPPORT) === selectSupport.value);
    if (!data) return;

    const valOuVide = (val) => (val !== undefined && val !== null && val !== "") ? val : "";

    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
    const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

    setVal("valF", "");
    setVal("valSUP", "");
    setVal("I", "");
    setVal("AF", valOuVide(data.AF !== undefined ? data.AF : data.A));
    setVal("B_Fouille", "");
    setVal("H_Fouille", "");
    setVal("AR", "");
    setVal("Enc", "");
    setVal("valP_N", "");
    setVal("valP_S", "");

    setTxt("F_ref", valOuVide(data.F));
    setTxt("SUP_ref", valOuVide(data.SUP));
    setTxt("I_ref", valOuVide(data.I));
    setTxt("AF_ref", valOuVide(data.AF !== undefined ? data.AF : data.A));
    setTxt("B_ref", valOuVide(data.B));
    setTxt("H_ref", valOuVide(data.H));
    setTxt("AR_ref", valOuVide(data.AR));
    setTxt("Enc_ref", valOuVide(data.Enc));
    setTxt("ECH_ref", valOuVide(data.ECH));

    const valP = (data.P !== undefined && data.P !== null) ? parseFloat(data.P) : 0;
    const valeurAbsolueP = Math.abs(valP);

    setTxt("P_ref_N", valeurAbsolueP);
    setTxt("P_ref_S", valeurAbsolueP);

    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");

    if (valP >= 0) {
        if (blocS) blocS.style.display = "block";
        if (blocN) blocN.style.display = "none";
    } else {
        if (blocN) blocN.style.display = "block";
        if (blocS) blocS.style.display = "none";
    }

    if (typeof appliquerEchantillon === "function") {
        appliquerEchantillon(data.ECH);
    }
    
    const chkF = document.getElementById('check_fouille');
    const chkB = document.getElementById('check_beton');
    const chkM = document.getElementById('check_matage');

    if (chkF) chkF.checked = !!(data.date_fouille || data.DATE_FOUILLE);
    if (chkB) chkB.checked = !!(data.date_beton || data.DATE_BETON);
    if (chkM) chkM.checked = !!(data.date_matage || data.DATE_MATAGE);
    
    memoriserEtatInitialPhases();

    const blind = document.getElementById("blindageCheck"); if(blind) blind.checked = (data.BLIND === "OUI");
    const caro = document.getElementById("carotte"); if(caro) caro.checked = (data.CARO === "OUI");
    const dt = document.getElementById("display_type"); if(dt) dt.innerText = data.TYPE ? "🧊 " + data.TYPE : "";

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
    const elE = document.getElementById("E"); if(elE) elE.value = cle;
    const dProf = document.getElementById("display_prof"); if(dProf) dProf.innerText = cle;
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
    if(inputE) {
      inputE.style.display = "block";
      inputE.value = ""; 
      inputE.focus();
    }
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
