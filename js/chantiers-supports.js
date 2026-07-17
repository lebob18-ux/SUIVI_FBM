function chargerSupport() {
    const selectSupport = document.getElementById("selectSupport");
    const data = baseSupports.find(s => s.support === selectSupport.value);

    if (!data) return;

    // Fonction utilitaire pour afficher 0 au lieu de vide
    const valOuVide = (val) => (val !== undefined && val !== null && val !== "") ? val : "";

    // 1. Remplissage des champs de saisie (inputs)
    document.getElementById("valF").value = valOuVide(data.F);
    document.getElementById("valSUP").value = valOuVide(data.SUP);
    document.getElementById("I").value = valOuVide(data.I);
    document.getElementById("AF").value = valOuVide(data.AF);
    document.getElementById("B_Fouille").value = valOuVide(data.B);
    document.getElementById("H_Fouille").value = valOuVide(data.H);
    document.getElementById("AR").value = valOuVide(data.AR);
    document.getElementById("Enc").value = valOuVide(data.Enc);

    // 2. Remplissage des références (spans grisés)
    document.getElementById("F_ref").innerText = valOuVide(data.F);
    document.getElementById("SUP_ref").innerText = valOuVide(data.SUP);
    document.getElementById("I_ref").innerText = valOuVide(data.I);
    document.getElementById("AF_ref").innerText = valOuVide(data.AF);
    document.getElementById("B_ref").innerText = valOuVide(data.B);
    document.getElementById("H_ref").innerText = valOuVide(data.H);
    document.getElementById("AR_ref").innerText = valOuVide(data.AR);
    document.getElementById("Enc_ref").innerText = valOuVide(data.Enc);
    document.getElementById("ECH_ref").innerText = valOuVide(data.ECH);

    // 3. Gestion de P (Valeur absolue pour l'affichage)
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

    // 4. Échantillonnage et cases à cocher
    if (typeof appliquerEchantillon === "function") {
        appliquerEchantillon(data.ECH);
    }
    
    document.getElementById("blindageCheck").checked = (data.BLIND === "OUI");
    document.getElementById("carotte").checked = (data.CARO === "OUI");
    document.getElementById("display_type").innerText = data.TYPE ? "🧊 " + data.TYPE : "";

    
}
    // 5. Mise à jour finale
    if (typeof refreshBlocs === "function") refreshBlocs();
    if (typeof restaurerLocal === "function") restaurerLocal();
    calculer();




/* Correspondance ECH (base support) <-> profils du popup Echantillon */
const profilsEchantillon = {
  "200":    { valeur: "200",     largeur: "200", nom: "HE200"   },
  "220":    { valeur: "220",     largeur: "220", nom: "HE220"   },
  "240":    { valeur: "240",     largeur: "240", nom: "HE240"   },
  "260":    { valeur: "260",     largeur: "260", nom: "HE260"   },
  "280":    { valeur: "280",     largeur: "280", nom: "HE280"   },
  "300":    { valeur: "300",     largeur: "300", nom: "HE300"   },
  "320":    { valeur: "320",     largeur: "300", nom: "HE320"   },
  "JHE280": { valeur: "280",     largeur: "710", nom: "JHE280"  },
  "JHE320": { valeur: "320",     largeur: "610", nom: "JHE320"  },
  "Epingle":{ valeur: "Epingle", largeur: "0",   nom: "Epingle" }
};

function appliquerEchantillon(ech) {
  if (ech === undefined || ech === null || ech === "") return;

  const cle = String(ech).trim();
  const profil = profilsEchantillon[cle];

  if (profil) {
    // Profil reconnu (ex: 240 -> HE240) : on réutilise la logique du popup
    validerEchantillonPopup(profil.valeur, profil.largeur, profil.nom);
  } else {
    // Valeur non reconnue -> on la place en saisie manuelle
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

  const chantiersUniques = [...new Set(baseSupports.map(s => s.chantier))];

  chantiersUniques.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

function resetSaisieAvantSupport() {

  // Champs numériques remplis par un support
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

  // Echantillon
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

    // On garde uniquement ceux où EFFECTUE est explicitement 0 ou absent/null


const filtres = baseSupports.filter(s => 
    s.chantier === chantier && Number(s.EFFECTUE) !== 1
);


    
    filtres.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.support;
        opt.textContent = s.support;
        supportSelect.appendChild(opt);
    });
}


/* Gestion saisie échantillon */
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
/* ==========================================
   GESTION AFFICHAGE CAROTTE / BLINDAGE
   ========================================== */
