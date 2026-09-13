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

/* --- 2. INITIALISATION --- */
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

/* --- 4. GESTION SUPPORTS & ECHANTILLONS --- */

async function chargerSupport() {
    const selectSupport = document.getElementById("selectSupport");
    const supportNom = selectSupport.value;
    const chantierSelect = document.getElementById("selectChantier");
    const nomChantier = chantierSelect ? chantierSelect.value : "";

    const dataBase = baseSupports.find(s => s.support === supportNom);
    if (!dataBase) return;

    let dataSupabase = {};
    try {
        const { data, error } = await supabaseClient
            .from('blindage')
            .select('hors_p1, etape_fouille, etape_beton, etape_matage, blind, carotte, statut')
            .eq('chantier', nomChantier)
            .eq('support', supportNom)
            .maybeSingle();
        
        if (!error && data) {
            dataSupabase = data;
        }
    } catch (err) {
        console.warn("Impossible de récupérer les états spécifiques depuis Supabase, utilisation des valeurs par défaut.");
    }

    const valOuVide = (val) => (val !== undefined && val !== null && val !== "") ? val : "";

    const parseBooleenStricte = (val) => {
        if (val === true || val === 1 || val === "1" || val === "true") return true;
        return false;
    };

    // Analyse du champ texte 'blind' de Supabase (ex: "OUI", "true", "1", etc.)
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
    
    // --- RESTAURATION DES CASES À COCHER DEPUIS SUPABASE ---

    // 1. Blindage (colonne texte 'blind')
    const chkBlindage = document.getElementById("blindageCheck");
    if (chkBlindage) {
        const valBlind = dataSupabase.blind !== undefined && dataSupabase.blind !== null ? dataSupabase.blind : dataBase.BLIND;
        chkBlindage.checked = estVraiTexte(valBlind);
    }

    // 2. Carotte
    const chkCarotte = document.getElementById("carotte");
    if (chkCarotte) {
        chkCarotte.checked = (dataSupabase.carotte !== undefined && dataSupabase.carotte !== null) ? parseBooleenStricte(dataSupabase.carotte) : (dataBase.CARO === "OUI");
    }

    document.getElementById("display_type").innerText = dataBase.TYPE ? "🧊 " + dataBase.TYPE : "";

    // 3. Hors P1 (colonne booléenne 'hors_p1')
    const chkHorsP1 = document.getElementById("check_hors_p1");
    if (chkHorsP1) {
        const valHorsP1 = dataSupabase.hors_p1 !== undefined && dataSupabase.hors_p1 !== null ? dataSupabase.hors_p1 : dataBase.hors_p1;
        chkHorsP1.checked = parseBooleenStricte(valHorsP1);
    }

    // 4. Étapes (fouille, béton, matage)
    const checkFouille = document.getElementById("check_fouille");
    const checkBeton = document.getElementById("check_beton");
    const checkMatage = document.getElementById("check_matage");

    if (checkFouille) checkFouille.checked = dataSupabase.etape_fouille !== undefined ? parseBooleenStricte(dataSupabase.etape_fouille) : true;
    if (checkBeton) checkBeton.checked = dataSupabase.etape_beton !== undefined ? parseBooleenStricte(dataSupabase.etape_beton) : true;
    if (checkMatage) checkMatage.checked = dataSupabase.etape_matage !== undefined ? parseBooleenStricte(dataSupabase.etape_matage) : true;

    // 5. Statut
    const statutActif = dataSupabase.statut || dataBase.statut_blindage;
    const radiosStatut = document.querySelectorAll('input[name="statut_blindage"]');
    radiosStatut.forEach(radio => {
        radio.checked = (statutActif && radio.value === statutActif);
    });

    // Forçage de l'actualisation dynamique de l'interface (affichage des blocs et règles d'activation)
    if (typeof refreshBlocs === "function") refreshBlocs();
    
    // Déclenchement des événements pour propager les états aux écouteurs d'événements
    if (chkBlindage) chkBlindage.dispatchEvent(new Event('change'));
    if (chkHorsP1) chkHorsP1.dispatchEvent(new Event('change'));

    if (typeof restaurerLocal === "function") restaurerLocal();
    if (typeof rechargerBLsSupport === "function") rechargerBLsSupport();
    calculer();
}

const aliasEchantillon = {
"HE180A":"HEA180","HEA180":"HEA180","HE200A":"HEA200","HEA200":"HEA200",
"HE220A":"HEA220","HEA220":"HEA220","HE240A":"HEA240","HEA240":"HEA240",
"HE300A":"HEA300","HEA300":"HEA300","HE320A":"HEA320","HEA320":"HEA320",
"HE220B":"HEB220","HEB220":"HEB220","HE240B":"HEB240","HEB240":"HEA240",
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

function gérerVisibilitéP() {
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

function filtrerSupports() {
    const chantier = document.getElementById("selectChantier").value;
    const supportSelect = document.getElementById("selectSupport");

    resetSaisieAvantSupport();
    supportSelect.innerHTML = `<option value="">-- choisir support --</option>`;

    const filtres = baseSupports.filter(s => {
        if (s.chantier !== chantier) return false;
        const valEff = s.EFFECTUE !== undefined ? s.EFFECTUE : (s.effectue !== undefined ? s.effectue : "");
        return valEff !== 1 && String(valEff).trim() !== "1";
    });
    
    filtres.sort((a, b) => String(a.support).localeCompare(String(b.support), 'fr', { numeric: true, sensitivity: 'base' }));

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

/* --- 5. SYNCHRONISATION DESCENDANTE (INTERFACE -> SUPABASE) --- */
document.addEventListener("DOMContentLoaded", function () {
    const champsACocher = ["check_hors_p1", "check_fouille", "check_beton", "check_matage", "blindageCheck"];

    champsACocher.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("change", async function () {
                const selectSupport = document.getElementById("selectSupport");
                const chantierSelect = document.getElementById("selectChantier");
                
                if (!selectSupport || !selectSupport.value || !chantierSelect || !chantierSelect.value) return;

                const supportNom = selectSupport.value;
                const nomChantier = chantierSelect.value;
                
                let nomChampSupabase = "";
                if (id === "check_hors_p1") nomChampSupabase = "hors_p1";
                else if (id === "blindageCheck") nomChampSupabase = "blind"; // Colonne 'blind' en texte
                else nomChampSupabase = id.replace("check_", "etape_");

                // Texte ("OUI"/"NON") pour blind, booléen (true/false) pour les autres
                let valeurCochee;
                if (id === "blindageCheck") {
                    valeurCochee = this.checked ? "OUI" : "NON";
                } else {
                    valeurCochee = this.checked ? true : false;
                }

                try {
                    const { data: existants, error: errSelect } = await supabaseClient
                        .from('blindage')
                        .select('support')
                        .eq('chantier', nomChantier)
                        .eq('support', supportNom);

                    if (errSelect) {
                        console.error("Erreur lors de la vérification :", errSelect.message);
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
                        console.error("Erreur lors de la mise à jour Supabase :", error.message);
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
