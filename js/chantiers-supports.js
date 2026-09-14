/* --- 1. FONCTIONS GLOBALES --- */

function verifierAdmin() {
    const identite = JSON.parse(localStorage.getItem("fbm_identite_redacteur"));
    if (!identite) return;
    const admins = ["robert.lavignon@reseau.sncf.fr"];
    const tabAdmin = document.getElementById("tabAdmin");
    if (tabAdmin) tabAdmin.style.display = admins.includes(identite.email) ? "block" : "none";
}

function resetChamps() {
    document.getElementById("valF").value = "";
    document.getElementById("valP").value = "";
    document.getElementById("valSUP").value = "";
    if (typeof majAffichageSensP === "function") majAffichageSensP("APRES");
    if (typeof calculer === "function") calculer();
}

/* --- 2. INITIALISATION DES ÉCOUTEURS D'INTERFACE --- */
document.addEventListener("DOMContentLoaded", function () {
    const chkCarotte = document.getElementById("carotte");
    const chkBlindage = document.getElementById("blindageCheck");
    const chkHorsP1 = document.getElementById("check_hors_p1");

    const checkFouille = document.getElementById("check_fouille");
    const checkBeton = document.getElementById("check_beton");
    const checkMatage = document.getElementById("check_matage");

    function refreshBlocs() {
        if (document.getElementById("bloc_saisie_carotte")) document.getElementById("bloc_saisie_carotte").style.display = chkCarotte?.checked ? "flex" : "none";
        if (document.getElementById("bloc_saisie_blindage")) document.getElementById("bloc_saisie_blindage").style.display = chkBlindage?.checked ? "flex" : "none";
    }

    function verifierEtatEtapes() {
        const estBlindage = chkBlindage ? chkBlindage.checked : false;
        const estHorsP1 = chkHorsP1 ? chkHorsP1.checked : false;

        if (!estBlindage && !estHorsP1) {
            if (checkFouille) { checkFouille.checked = true; checkFouille.disabled = true; }
            if (checkBeton) { checkBeton.checked = true; checkBeton.disabled = true; }
            if (checkMatage) { checkMatage.checked = true; checkMatage.disabled = true; }
        } else {
            if (checkFouille) checkFouille.disabled = false;
            if (checkBeton) checkBeton.disabled = false;
            if (checkMatage) checkMatage.disabled = false;
        }
    }

    if (chkCarotte) chkCarotte.addEventListener("change", refreshBlocs);
    
    if (chkBlindage) {
        chkBlindage.addEventListener("change", function() {
            refreshBlocs();
            verifierEtatEtapes();
        });
    }

    if (chkHorsP1) {
        chkHorsP1.addEventListener("change", function() {
            verifierEtatEtapes();
        });
    }

    window.refreshBlocs = refreshBlocs;
    window.verifierEtatEtapes = verifierEtatEtapes;

    refreshBlocs();
    verifierEtatEtapes();
});

/* --- 3. CHARGEMENT INITIAL --- */
window.addEventListener('load', function() {
    verifierAdmin();
    const selectChantier = document.getElementById("selectChantier");
    if (selectChantier && selectChantier.options.length > 1) {
        selectChantier.selectedIndex = 1;
        selectChantier.dispatchEvent(new Event('change'));
    }
});

document.addEventListener("focusin", function(e) {
  if (e.target.tagName === "INPUT" && e.target.type === "number" && !e.target.readOnly) {
    setTimeout(() => e.target.select(), 30);
  }
});

/* --- 4. GESTION SUPPORTS & ECHANTILLONS (SYNCHRO DESCENDANTE) --- */

async function chargerSupport() {
    const selectSupport = document.getElementById("selectSupport");
    const supportNom = selectSupport ? selectSupport.value.trim() : "";
    const chantierSelect = document.getElementById("selectChantier");
    const nomChantier = chantierSelect ? chantierSelect.value.trim() : "";

    const dataBase = baseSupports.find(s => String(s.support).trim() === supportNom);
    if (!dataBase) return;

    let dataSupabase = {};
    try {
        const { data, error } = await supabaseClient
            .from('blindage')
            .select('hors_p1, etape_fouille, etape_beton, etape_matage, blind, caro, bl_beton, type_beton, slump')
            .eq('chantier', nomChantier)
            .eq('support', supportNom)
            .limit(1);
        
        if (error) {
            console.error("❌ Erreur SQL Supabase:", error.message);
        } else if (data && data.length > 0) {
            console.log("✅ Données trouvées dans Supabase :", data[0]);
            dataSupabase = data[0];
        } else {
            console.warn("⚠️ Aucune ligne enregistrée pour ce support dans Supabase.");
        }
    } catch (err) {
        console.warn("❌ Erreur réseau Supabase:", err);
    }

    const valOuVide = (val) => (val !== undefined && val !== null && val !== "") ? val : "";

    const estVraiTexte = (val) => {
        if (val === true || val === 1 || val === "1") return true;
        if (typeof val === "string") {
            const v = val.trim().toLowerCase();
            return v === "true" || v === "oui" || v === "1" || v === "on";
        }
        return false;
    };

    // Remplissage des inputs standards
    document.getElementById("valF").value = valOuVide(dataBase.F);
    document.getElementById("valSUP").value = valOuVide(dataBase.SUP);
    document.getElementById("I").value = valOuVide(dataBase.I);
    document.getElementById("AF").value = valOuVide(dataBase.AF);
    document.getElementById("B_Fouille").value = valOuVide(dataBase.B);
    document.getElementById("H_Fouille").value = valOuVide(dataBase.H);
    document.getElementById("AR").value = valOuVide(dataBase.AR);
    document.getElementById("Enc").value = valOuVide(dataBase.Enc);

    document.getElementById("F_ref").innerText = valOuVide(dataBase.F);
    document.getElementById("SUP_ref").innerText = valOuVide(dataBase.SUP);
    document.getElementById("I_ref").innerText = valOuVide(dataBase.I);
    document.getElementById("AF_ref").innerText = valOuVide(dataBase.AF);
    document.getElementById("B_ref").innerText = valOuVide(dataBase.B);
    document.getElementById("H_ref").innerText = valOuVide(dataBase.H);
    document.getElementById("AR_ref").innerText = valOuVide(dataBase.AR);
    document.getElementById("Enc_ref").innerText = valOuVide(dataBase.Enc);
    document.getElementById("ECH_ref").innerText = valOuVide(dataBase.ECH);

    const valP = (dataBase.P !== undefined && dataBase.P !== null) ? parseFloat(dataBase.P) : 0;
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
        appliquerEchantillon(dataBase.ECH);
    }
    
    document.getElementById("display_type").innerText = dataBase.TYPE ? "🧊 " + dataBase.TYPE : "";

    // Application Blindage (colonne 'blind') et Carotte (colonne 'caro')
    const chkBlindage = document.getElementById("blindageCheck");
    if (chkBlindage) {
        chkBlindage.checked = (dataSupabase.blind !== undefined && dataSupabase.blind !== null) ? estVraiTexte(dataSupabase.blind) : (dataBase.BLIND === "OUI");
    }

    const chkCarotte = document.getElementById("carotte");
    if (chkCarotte) {
        chkCarotte.checked = (dataSupabase.caro !== undefined && dataSupabase.caro !== null) ? estVraiTexte(dataSupabase.caro) : (dataBase.CARO === "OUI");
    }

    // Application Hors P1
    const chkHorsP1 = document.getElementById("check_hors_p1");
    if (chkHorsP1) {
        chkHorsP1.checked = (dataSupabase.hors_p1 !== undefined && dataSupabase.hors_p1 !== null) ? estVraiTexte(dataSupabase.hors_p1) : false;
    }

    // Application BL Béton, Type de béton & Slump
    const inputBlBeton = document.getElementById("bl_beton");
    if (inputBlBeton) {
        inputBlBeton.value = (dataSupabase.bl_beton !== undefined && dataSupabase.bl_beton !== null) ? dataSupabase.bl_beton : "";
    }
    const inputTypeBeton = document.getElementById("type_beton");
    if (inputTypeBeton) {
        inputTypeBeton.value = (dataSupabase.type_beton !== undefined && dataSupabase.type_beton !== null) ? dataSupabase.type_beton : "";
    }
    const inputSlump = document.getElementById("slump");
    if (inputSlump) {
        inputSlump.value = (dataSupabase.slump !== undefined && dataSupabase.slump !== null) ? dataSupabase.slump : "";
    }

    // Actualisation des blocs et déverrouillage des étapes
    if (typeof window.refreshBlocs === "function") window.refreshBlocs();
    if (typeof window.verifierEtatEtapes === "function") window.verifierEtatEtapes();

    // Application des Étapes (Fouille, Béton, Matage)
    const checkFouille = document.getElementById("check_fouille");
    const checkBeton = document.getElementById("check_beton");
    const checkMatage = document.getElementById("check_matage");

    if (checkFouille) {
        checkFouille.checked = (dataSupabase.etape_fouille !== undefined && dataSupabase.etape_fouille !== null) ? estVraiTexte(dataSupabase.etape_fouille) : true;
    }
    if (checkBeton) {
        checkBeton.checked = (dataSupabase.etape_beton !== undefined && dataSupabase.etape_beton !== null) ? estVraiTexte(dataSupabase.etape_beton) : true;
    }
    if (checkMatage) {
        checkMatage.checked = (dataSupabase.etape_matage !== undefined && dataSupabase.etape_matage !== null) ? estVraiTexte(dataSupabase.etape_matage) : true;
    }

    // Statut
    const statutActif = dataBase.statut_blindage;
    const radiosStatut = document.querySelectorAll('input[name="statut_blindage"]');
    radiosStatut.forEach(radio => {
        radio.checked = (statutActif && radio.value === statutActif);
    });

    if (typeof restaurerLocal === "function") restaurerLocal();
    if (typeof rechargerBLsSupport === "function") rechargerBLsSupport();
    calculer();
}

/* --- ECHANTILLONS & CONFIG --- */
const aliasEchantillon = {
"HE180A":"HEA180","HEA180":"HEA180","HE200A":"HEA200","HEA200":"HEA200",
"HE220A":"HEA220","HEA220":"HEA220","HE240A":"HEA240","HEA240":"HEA240",
"HE300A":"HEA300","HEA300":"HEA300","HE320A":"HEA320","HEA320":"HEA320",
"HE220B":"HEB220","HEB220":"HEB220","HE240B":"HEB240","HEB240":"HEB240",
"HE260B":"HEB260","HEB260":"HEB260","HE300B":"HEB300","HEB300":"HEB300",
"HE320B":"HEB320","HEB320":"HEB320","JHE280A":"JHEA280","JHEA280":"JHEA280",
"JHE320A":"JHEA320","JHEA320":"JHEA320","JHE280B":"JHEB280","JHEB280":"JHEB280",
"JHE320B":"JHEB320","JHEB320":"JHEB320"
};

const profilsEchantillon = {
"HEA180": { valeur: "180", largeur: "171", nom: "HEA180" },
"HEA200": { valeur: "200", largeur: "190", nom: "HEA200" },
"HEA220": { valeur: "220", largeur: "210", nom: "HEA220" },
"HEA240": { valeur: "240", largeur: "230", nom: "HEA240" },
"HEA300": { valeur: "300", largeur: "290", nom: "HEA300" },
"HEA320": { valeur: "300", largeur: "310", nom: "HEA320" },    
"HEB220": { valeur: "220", largeur: "220", nom: "HEB220" },
"HEB240": { valeur: "240", largeur: "240", nom: "HEB240" },
"HEB260": { valeur: "260", largeur: "260", nom: "HEB260" },
"HEB300": { valeur: "300", largeur: "300", nom: "HEB300" },
"HEB320": { valeur: "300", largeur: "320", nom: "HEB320" }, 
"JHEA280": { valeur: "280", largeur: "820", nom: "JHEA280" },
"JHEA320": { valeur: "300", largeur: "860", nom: "JHEA320" },
"JHEB280": { valeur: "280", largeur: "830", nom: "JHEB280" },
"JHEB320": { valeur: "300", largeur: "870", nom: "JHEB320" },
"Epingle": { valeur: "Epingle", largeur: "0", nom: "Epingle" }
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

function initChantiers() {
  const select = document.getElementById("selectChantier");
  if (!select) return;

  const chantiersMap = {};
  baseSupports.forEach(s => {
    if (!chantiersMap[s.chantier]) {
      chantiersMap[s.chantier] = { total: 0, effectues: 0 };
    }
    chantiersMap[s.chantier].total++;
    const valEff = s.EFFECTUE !== undefined ? s.EFFECTUE : (s.effectue !== undefined ? s.effectue : "");
    if (valEff === 1 || String(valEff).trim() === "1") {
      chantiersMap[s.chantier].effectues++;
    }
  });

  select.innerHTML = '<option value="">-- Sélectionner un chantier --</option>';
  const chantiersUniques = [...new Set(baseSupports.map(s => s.chantier))];

  chantiersUniques.forEach(c => {
    const data = chantiersMap[c];
    if (data && data.total > 0 && data.effectues === data.total) return; 

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
  
  const inputBlBeton = document.getElementById("bl_beton");
  if (inputBlBeton) inputBlBeton.value = "";
  const inputTypeBeton = document.getElementById("type_beton");
  if (inputTypeBeton) inputTypeBeton.value = "";
  const inputSlump = document.getElementById("slump");
  if (inputSlump) inputSlump.value = "";

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

  document.getElementById("blindageCheck").checked = false;
  document.getElementById("carotte").checked = false;

  const chkHorsP1 = document.getElementById("check_hors_p1");
  if (chkHorsP1) chkHorsP1.checked = false;

  const checkFouille = document.getElementById("check_fouille");
  const checkBeton = document.getElementById("check_beton");
  const checkMatage = document.getElementById("check_matage");
  if (checkFouille) { checkFouille.checked = true; checkFouille.disabled = true; }
  if (checkBeton) { checkBeton.checked = true; checkBeton.disabled = true; }
  if (checkMatage) { checkMatage.checked = true; checkMatage.disabled = true; }

  document.querySelectorAll('input[name="statut_blindage"]').forEach(radio => radio.checked = false);

  if (window.refreshBlocs) window.refreshBlocs();
  calculer();
}

async function filtrerSupports() {
    const chantierSelect = document.getElementById("selectChantier");
    const supportSelect = document.getElementById("selectSupport");
    if (!chantierSelect || !supportSelect) return;

    const chantier = chantierSelect.value;
    resetSaisieAvantSupport();
    supportSelect.innerHTML = `<option value="">-- choisir support --</option>`;

    if (!chantier) return;

    let supportsFinisMap = {};
    try {
        const { data, error } = await supabaseClient
            .from('blindage')
            .select('support, etape_fouille, etape_beton, etape_matage')
            .eq('chantier', chantier);

        if (!error && data) {
            data.forEach(row => {
                const fouilleOk = String(row.etape_fouille).trim().toUpperCase() === "OUI";
                const betonOk = String(row.etape_beton).trim().toUpperCase() === "OUI";
                const matageOk = String(row.etape_matage).trim().toUpperCase() === "OUI";

                if (fouilleOk && betonOk && matageOk) {
                    supportsFinisMap[String(row.support).trim()] = true;
                }
            });
        }
    } catch (err) {
        console.warn("⚠️ Erreur lors de la vérification des supports terminés :", err);
    }

    const supportsDuChantier = baseSupports.filter(s => {
        if (s.chantier !== chantier) return false;
        const nomSupport = String(s.support).trim();
        if (supportsFinisMap[nomSupport]) return false;
        return true;
    });
    
    supportsDuChantier.sort((a, b) => String(a.support).localeCompare(String(b.support), 'fr', { numeric: true, sensitivity: 'base' }));

    supportsDuChantier.forEach(s => {
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

/* --- 5. SYNCHRONISATION MONTANTE (INTERFACE -> SUPABASE) --- */
document.addEventListener("DOMContentLoaded", function () {
    const champsACocher = ["check_hors_p1", "check_fouille", "check_beton", "check_matage", "blindageCheck", "carotte"];

    champsACocher.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("change", async function () {
                const selectSupport = document.getElementById("selectSupport");
                const chantierSelect = document.getElementById("selectChantier");
                
                if (!selectSupport || !selectSupport.value || !chantierSelect || !chantierSelect.value) return;

                const supportNom = selectSupport.value.trim();
                const nomChantier = chantierSelect.value.trim();
                
                let nomChampSupabase = "";
                if (id === "check_hors_p1") nomChampSupabase = "hors_p1";
                else if (id === "blindageCheck") nomChampSupabase = "blind";
                else if (id === "carotte") nomChampSupabase = "caro";
                else nomChampSupabase = id.replace("check_", "etape_");

                const valeurCochee = this.checked ? "OUI" : "NON";

                try {
                    const { data: existants, error: errSelect } = await supabaseClient
                        .from('blindage')
                        .select('support')
                        .eq('chantier', nomChantier)
                        .eq('support', supportNom);

                    if (errSelect) {
                        console.error("Erreur vérification :", errSelect.message);
                        return;
                    }

                    let error;
                    if (existants && existants.length > 0) {
                        const resUpdate = await supabaseClient
                            .from('blindage')
                            .update({ [nomChampSupabase]: valeurCochee })
                            .eq('chantier', nomChantier)
                            .eq('support', supportNom);
                        error = resUpdate.error;
                    } else {
                        const resInsert = await supabaseClient
                            .from('blindage')
                            .insert({
                                chantier: nomChantier,
                                support: supportNom,
                                [nomChampSupabase]: valeurCochee
                            });
                        error = resInsert.error;
                    }

                    if (error) {
                        console.error("Erreur Supabase :", error.message);
                    } else {
                        console.log(`Mise à jour OK : ${nomChampSupabase} = ${valeurCochee}`);
                    }
                } catch (err) {
                    console.error("Erreur réseau/Supabase :", err);
                }
            });
        }
    });
});


/**
 * Envoie les valeurs réelles de l'interface vers la table Supabase 'blindage' (avec gestion du cumul multi-BL)
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

    const radioStatutSelectionne = document.querySelector('input[name="statut_blindage"]:checked');
    const statutBlindageVal = radioStatutSelectionne ? radioStatutSelectionne.value : null;

    const terreReel = document.getElementById("nb_big_bag_terre")?.value;
    const mignonetteReel = document.getElementById("nb_big_bag_mignonette")?.value;

    const horsP1Val = document.getElementById("check_hors_p1")?.checked || false;
    const etapeFouilleVal = document.getElementById("check_fouille")?.checked || false;
    const etapeBetonVal = document.getElementById("check_beton")?.checked || false;
    const etapeMatageVal = document.getElementById("check_matage")?.checked || false;

    const saisieBl = document.getElementById("bl_beton")?.value.trim();
    const saisieTypeBeton = document.getElementById("type_beton")?.value.trim();
    const saisieSlump = document.getElementById("slump")?.value.trim();

    // Récupération des anciennes valeurs pour concaténation propre (multi-BL)
    const { data: ancienneData, error: errFetch } = await supabaseClient
      .from('blindage')
      .select('bl_beton, type_beton, slump')
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput)
      .maybeSingle();

    if (errFetch) console.warn("Impossible de récupérer l'historique pour concaténation :", errFetch.message);

    const fusionnerTexte = (ancien, nouveau) => {
      if (!nouveau) return ancien || null;
      const nouveauNettoye = nouveau.toUpperCase();
      if (!ancien) return nouveauNettoye;
      const elements = ancien.split(" / ").map(e => e.trim());
      if (!elements.includes(nouveauNettoye)) {
        return ancien + " / " + nouveauNettoye;
      }
      return ancien;
    };

    const blFinal = fusionnerTexte(ancienneData?.bl_beton, saisieBl);
    const typeBetonFinal = fusionnerTexte(ancienneData?.type_beton, saisieTypeBeton);
    const slumpFinal = fusionnerTexte(ancienneData?.slump, saisieSlump);

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
        terre: terreReel !== "" ? parseInt(terreReel, 10) : 0,         
        mignonette: mignonetteReel !== "" ? parseInt(mignonetteReel, 10) : 0,  
        statut_blindage: statutBlindageVal,
        bl_beton: blFinal,
        type_beton: typeBetonFinal,
        slump: slumpFinal,
        hors_p1: horsP1Val,                     
        etape_fouille: etapeFouilleVal,         
        etape_beton: etapeBetonVal,             
        etape_matage: etapeMatageVal,           
        effectue: 1,  
        date_exec: dateJour 
      })
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput);

    if (error) throw error;
    
    if (document.getElementById("bl_beton") && blFinal) document.getElementById("bl_beton").value = blFinal;
    if (document.getElementById("type_beton") && typeBetonFinal) document.getElementById("type_beton").value = typeBetonFinal;
    if (document.getElementById("slump") && slumpFinal) document.getElementById("slump").value = slumpFinal;

    console.log(`✅ Support ${numSupportInput} (${nomChantier}) synchronisé avec succès dans Supabase.`);
    return true;

} catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err);
    alert("⚠️ Erreur Supabase : " + (err.message || JSON.stringify(err)));
    return false;
  }
}
