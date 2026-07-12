/* Calcul principal ====================================================================================================*/
function calculer() {
  /* ==========================================
     VARIABLES PRINCIPALES
     ========================================== */

  let SOL = (parseFloat(document.getElementById("SOL").value) || 0) / 100;
  let I_min_LTV = null;
  let I = parseFloat(document.getElementById("I").value) || 0;
  let AF = parseFloat(document.getElementById("AF").value) || 0;
  let HF = parseFloat(document.getElementById("H_Fouille").value) || 0;
  let B_Fouille = parseFloat(document.getElementById("B_Fouille").value) || 0;
  let verif = document.getElementById("verifVoie").checked;
  let distBlindage = parseFloat(document.getElementById("dist_blindage").value) || 0;
  let AR_input = document.getElementById("AR").value; 
  let selectE = document.getElementById("E_select");
  let inputE = document.getElementById("E");

let E = 0;

if (selectE.value === "manuel") {
  E = parseFloat(inputE.value) || 0;
} else {
  E = parseFloat(selectE.value) || 0;
}  
  let elA = document.getElementById("AF_ref");
  let elB = document.getElementById("B_ref");
  let elH = document.getElementById("H_ref");
  let tA = parseFloat(elA?.innerText || 0) || 0;
  let tB = parseFloat(elB?.innerText || 0) || 0;
  let tH = parseFloat(elH?.innerText || 0) || 0;
  let chkCarotte = document.getElementById("carotte");
  let displayVolCarotte = document.getElementById("display_vol_carotte");
// 1. Récupération de la valeur Encastrement (en mètres) et conversion en cm
  let encastrementM = parseFloat(document.getElementById("Enc").value) || 0;
  let encastrementCm = encastrementM *100;
  // 2. Report automatique dans H_carotte si H_carotte est vide ou à 0
  let hCarotteInput = document.getElementById("H_carotte");
  let PCarotteInput = document.getElementById("P_carotte");
  
hCarotteInput.value = parseFloat(encastrementCm).toFixed(0);
PCarotteInput.value = parseFloat((HF * 100)-encastrementCm ).toFixed(0);
  
  if (chkCarotte && displayVolCarotte) {
      displayVolCarotte.style.display = chkCarotte.checked ? "inline" : "none";
  }
 
  let verifCarotte = document.getElementById("carotte").checked;
  let verifBlindage = document.getElementById("blindageCheck").checked;

  /* ==========================================
     AFFICHAGE DES BLOCS
     ========================================== */

  document.getElementById("bloc_saisie_carotte").style.display =
      verifCarotte ? "flex" : "none";

  document.getElementById("bloc_saisie_blindage").style.display =
      verifBlindage ? "flex" : "none";

  document.getElementById("display_vol_carotte").style.display =
      verifCarotte ? "inline" : "none";

  document.getElementById("calculs_carotte_grid").style.display =
      verifCarotte ? "grid" : "none";


  /* ==========================================
     VOLUME THÉORIQUE
     ========================================== */

  let vPrevu = tA * tB * tH;

  document.getElementById("vol_prevu").innerText =
      vPrevu.toFixed(2) + " m³";

  /* ==========================================
     CONTRÔLE SAISIES
     ========================================== */

/* ==========================================
   VERIFICATION DONNEES LTV
   ========================================== */
let E_input = E;
let calculLTVPossible =
(   
    AR_input !== "" &&
    I > 0 &&
    AF > 0 &&
    HF > 0
);

  /* ==========================================
     VOLUME RÉEL
     ========================================== */

  let vModifie = AF * B_Fouille * HF;

  document.getElementById("vol_modifie").innerText =
      vModifie.toFixed(2) + " m³";

  /* ==========================================
     CAROTTE
     ========================================== */

  if (verifCarotte) {

      let ac = (parseFloat(document.getElementById("A_carotte").value) || 0) / 100;
      let bc = (parseFloat(document.getElementById("B_carotte").value) || 0) / 100;
      let hc = (parseFloat(document.getElementById("H_carotte").value) || 0) / 100;
      let e1 = (parseFloat(document.getElementById("E1_carotte").value) || 0) / 100;
      let e2 = (parseFloat(document.getElementById("E2_carotte").value) || 0) / 100;
      let vCarotte = ac * bc * hc;
      let betonNet = vModifie - vCarotte;

      document.getElementById("vol_carotte").innerText =
          betonNet.toFixed(2) + " m³";

let largeur_m = largeurEchantillon / 1000;
let profondeur_m = profondeurEchantillon / 1000;

/* e1 = écart Fouille <-> Carotte (ce que tu veux : (Afouille - Acarotte)/2) */
let S1 = (AF - ac) / 2;
let S2 = (B_Fouille - bc) / 2;

/* e2 = écart Carotte <-> Echantillon (profil) */
let S3 = (ac - profondeur_m) / 2;
let S4 = (bc - largeur_m) / 2;

document.getElementById("calc_S1").innerText =(S1*100).toFixed(1); /* e1 : Afouille - Acarotte */
document.getElementById("calc_S2").innerText =(S2*100).toFixed(1); /* e1 : Bfouille - Bcarotte */
document.getElementById("calc_S3").innerText =(S3*100).toFixed(1); /* e2 : Acarotte - profondeur échantillon */
document.getElementById("calc_S4").innerText =(S4*100).toFixed(1); /* e2 : Bcarotte - largeur échantillon */

  } else {

      document.getElementById("vol_carotte").innerText =
          "0.00 m³";
  }
/* ==========================================
   SI DONNEES LTV INCOMPLETES
   ON ARRETE ICI
   MAIS LES CALCULS CAROTTE
   ONT DEJA ETE EFFECTUES
   ========================================== */

if (!calculLTVPossible) {
    return;
}
  /* ==========================================
     À PARTIR D'ICI
     GARDE TON CODE ACTUEL
     (BF, D, BMAX, LTV, BLINDAGE,
      P1/P2, ALERTES, ETC...)
     ========================================== */


  if(document.getElementById("B_Fouille_display")) document.getElementById("B_Fouille_display").textContent = B_Fouille.toFixed(2);  
  let ara = parseFloat(document.getElementById("AR").value) || 0;
  let NIT_m = ((ara - 31) / 100) + HF + SOL; 
  if(document.getElementById("NIT")) document.getElementById("NIT").value = NIT_m.toFixed(2);
  
  let I_cm = I * 100;  
  if (E >= 100) E = E / 10; 
  let AF_cm = AF * 100;  
  
  let tA_cm = (tA > 0 ? tA : AF) * 100; 
  let delta_A = AF_cm - tA_cm; 
  let BF_calcul;

  /* Calcul BF selon extension */
  if (choixExtensionA === "champ") {
    BF_calcul = (I_cm + (E / 2)) - (tA_cm / 2) + 79;
  } else if (choixExtensionA === "voie") {
    BF_calcul = (I_cm + (E / 2)) - (tA_cm / 2) - delta_A + 79;
  } else {
    BF_calcul = (I_cm + (E / 2)) - (AF_cm / 2) + 79;
  }
  
  if (isNaN(BF_calcul)) {
    BF_calcul = (I_cm + (E / 2)) - (AF_cm / 2) + 79;
  }
  
  let T_BF_cm = BF_calcul - 79 - parseFloat(document.getElementById("LT").value || 0);  
  let D = BF_calcul / 100;  
  
  let P1_profondeur_dispo = (2/3) * (D - 2.5) - ((ara - 31) / 100); 
  let deg = D - 0.79; 
  
  let BMax; 
  if (D <= 2.80) { BMax = D - 0.8; }  
  else if (D <= 3.7) { BMax = 2.0; }  
  else if (D <= 4.7) { BMax = D - 1.7; }  
  else { BMax = 3.0; }
  
  let DMin = 2.4;  
  if (verif) { DMin -= 0.1; BMax += 0.2; } 
  let HF_seuil = verif ? 2.2 + 0.2 : 2.2;  

  if(document.getElementById("BMax_display")) document.getElementById("BMax_display").innerHTML = "<span style='color:green;'>BMax=" + BMax.toFixed(2) + "m</span>";  
  if(document.getElementById("DMin_display")) document.getElementById("DMin_display").innerHTML = "<span style='color:green;'>DMin=" + DMin.toFixed(2) + "m</span>";  
  if(document.getElementById("Hmax_display")) document.getElementById("Hmax_display").innerHTML = "<span style='color:green;'>Hmax=" + HF_seuil.toFixed(2) + "m</span>";
  if(document.getElementById("BF_calcul_display")) document.getElementById("BF_calcul_display").innerHTML = "<span style='color:blue;'>" + D.toFixed(2) + "</span>";  
  
  let B = B_Fouille;  
  let BLINDAGE = "";  
  let showLTV = false;  
  let raisonAlerte = "";
  let Imini_Max_Alerte = 0;

  let D_simul = D;
  let BMax_simul = (D_simul <= 2.80) ? (D_simul - 0.8) : (D_simul <= 3.7 ? 2.0 : (D_simul <= 4.7 ? (D_simul - 1.7) : 3.0));
  if (verif) BMax_simul += 0.2;
  let I_simul_Dmini = I + (DMin - D);
  let I_simul = 0;

  if (B > BMax_simul) {
    let maxIter = 2000;
    let iter = 0;
    while (BMax_simul < B && iter < maxIter) {
      D_simul += 0.01;
      BMax_simul = (D_simul <= 2.80) ? (D_simul - 0.8) : (D_simul <= 3.7 ? 2.0 : (D_simul <= 4.7 ? (D_simul - 1.7) : 3.0));
      if (verif) BMax_simul += 0.2;
      iter++;
    }
    I_simul = I + (D_simul - D);
  }

  /* Analyse alertes */
  if (deg < 1.5 && ara < 81) {
    let imini_deg = I + (1.5 - deg);
    showLTV = true;
    if (imini_deg > Imini_Max_Alerte) { Imini_Max_Alerte = imini_deg; raisonAlerte = "🚨 GABARIT Dégarnisseuse"; }
  }
  if (D < DMin) {
    showLTV = true;
    if (I_simul_Dmini > Imini_Max_Alerte) { Imini_Max_Alerte = I_simul_Dmini; raisonAlerte = "🚨 3a BLINDAGE D < DMin"; }
  }
  if (B > BMax && B <= 3.0) {
    showLTV = true;
    if (I_simul > Imini_Max_Alerte) { Imini_Max_Alerte = I_simul; raisonAlerte = "🚨 3b BLINDAGE B < BMax"; }
  }
  if (HF > HF_seuil) {
    showLTV = true; 
    raisonAlerte = "🚨 4 BLINDAGE Fond fouille H > " + HF_seuil.toFixed(2) + "m";
  }
  if (B > 3.0) {
    showLTV = true; 
    raisonAlerte = "🚨 3b BLINDAGE B > 3M (Interdit)";
  }

  let T_BF_m = T_BF_cm / 100; 
  if (document.getElementById("TBF_display")) document.getElementById("TBF_display").innerHTML = T_BF_m.toFixed(2);
  
  if (showLTV && NIT_m > T_BF_m) {  
    if(document.getElementById("ltv")) document.getElementById("ltv").innerHTML = D > 3.0 ? "🚨 LTV 72H après Fouille" : "🚨 LTV 72H après comblement Béton";
    let diff = NIT_m - T_BF_m;
    I_min_LTV = I + diff + 0.001;
  } else {
    if(document.getElementById("ltv")) document.getElementById("ltv").innerHTML = "";
  }

  /* Affichage résultats */
  let texteExtensionVisualisation = "";
  if (choixExtensionA === "champ") {
    texteExtensionVisualisation = "<span style='color:#6d28d9; font-weight:bold;'>ℹ️ Extension : Côté CHAMP uniquement</span><br>";
  } else if (choixExtensionA === "voie") {
    texteExtensionVisualisation = "<span style='color:#1d4ed8; font-weight:bold;'>ℹ️ Extension : Côté VOIE uniquement</span><br>";
  } else {
    if (AF !== tA && tA > 0) {
      texteExtensionVisualisation = "<span style='color:#4b5563; font-weight:bold;'>ℹ️ Extension : Les 2 côtés (Centré)</span><br>";
    }
  }

  if (showLTV) {
    BLINDAGE = texteExtensionVisualisation + "<span style='color:red; font-weight:bold;'>" + raisonAlerte + "</span>";
    if (Imini_Max_Alerte > 0 && B <= 3.0 && HF <= HF_seuil) {
      BLINDAGE += "<br><span style='color:red; font-weight:bold;'>👉 Imini requis pour enlever blindage = " + Imini_Max_Alerte.toFixed(2) + " m</span>";
    }
    if (I_min_LTV !== null && I_min_LTV > I && B <= 3.0 && HF <= HF_seuil) {
      BLINDAGE += "<br><span style='color:#FF6B6B; font-weight:bold;'>👉 I mini pour éviter LTV = " + I_min_LTV.toFixed(2) + " m</span>";
    }
  } else {
    let Imini_D = I + (DMin - D);
    let Imini_B = I + (B - BMax);
    let Imini_limite = Math.max(Imini_D, Imini_B);
    
    BLINDAGE = texteExtensionVisualisation + "<span style='color:green; font-weight:bold;'>✅ PAS DE BLINDAGE</span>";
    BLINDAGE += "<br><span style='color:purple; font-weight:bold;'>I mini avant Blindage = " + Imini_limite.toFixed(2) + " m</span>";
  }

  if(document.getElementById("tbf")) document.getElementById("tbf").innerHTML = BLINDAGE;
  
  if (document.getElementById("I_LTV")) {
    document.getElementById("I_LTV").innerHTML = (I_min_LTV !== null) ? "👉 I mini sans LTV = " + I_min_LTV.toFixed(2) + " m" : "";
  }
  
  if (verifBlindage) {
    let alerteBlindageHTML = "";
    if (distBlindage > 0) {
      let lt_m = (parseFloat(document.getElementById("LT").value) || 0) / 100; 
      let e_m = E / 100; 
      let a_m = AF;      
      let nouvImplBlindage = distBlindage + lt_m + (a_m / 2) - (e_m / 2);
      let limiteImplantationDangers = (I_min_LTV !== null) ? I_min_LTV : (I + (DMin - D));
      if (nouvImplBlindage < limiteImplantationDangers) {
        alerteBlindageHTML = "<span style='color:#dc3545;'>🚨 LTV Blindage : Position insuffisante !</span><br>" +
                             "<span style='color:#dc3545;'>👉 Nouv. Implantation selon blindage = " + nouvImplBlindage.toFixed(2) + " m</span>";
      } else {
        alerteBlindageHTML = "<span style='color:green;'>✅ Position blindage conforme (Pas de LTV)</span><br>" +
                             "<span style='color:green;'>👉 Nouv. Implantation selon blindage = " + nouvImplBlindage.toFixed(2) + " m</span>";
      }
    }
    if(document.getElementById("alerte_blindage_bloc")) document.getElementById("alerte_blindage_bloc").innerHTML = alerteBlindageHTML;
  }

  let p1p2_div = document.getElementById("info_p1p2_bloc");
  if (!p1p2_div) {
    const container = document.querySelector(".schema-container");
    if (container) {
      container.insertAdjacentHTML('afterend', '<div id="info_p1p2_bloc" style="text-align: center; font-size: 0.85em; font-weight: bold; margin-top: 8px; margin-bottom: 5px; color: #333;"></div>');
      p1p2_div = document.getElementById("info_p1p2_bloc");
    }
  }
  
  if (p1p2_div) {
    let p2_calc = ((T_BF_cm / 100) - ((ara - 31) / 100) + SOL).toFixed(2);
    let p1_calc = P1_profondeur_dispo.toFixed(2);
    p1p2_div.innerHTML = "📏 SOL jusqu'à P2 = <span style='color: #2563eb;'>" + p2_calc + " m</span> | P1 = <span style='color: #2563eb;'>" + p1_calc + " m</span>";
  }

  /* Ouvre/ferme automatiquement le bloc Alertes selon présence d'une alerte blindage/LTV */
  if (typeof evaluerAlertes === "function") evaluerAlertes();
}

/* Sens P (amont/aval de SUP) : la valeur saisie/affichée reste toujours absolue,
   le sens est géré séparément dans un champ caché */
function normaliserValeurAbsolue(id) {
  const input = document.getElementById(id);
  if (!input || input.value === "") return;
  const valeur = parseFloat(input.value);
  if (!isNaN(valeur) && valeur < 0) input.value = Math.abs(valeur);
}

function majAffichageSensP(sens) {
  const btn = document.getElementById("btnSensP");
  const texte = document.getElementById("sensP_texte");
  const hidden = document.getElementById("sensP");
  if (!btn) return;
  if (hidden) hidden.value = sens;
  if (sens === "AVANT") {
    btn.innerText = "←";
    if (texte) texte.innerText = "P mesuré en amont (avant) de SUP";
  } else {
    btn.innerText = "→";
    if (texte) texte.innerText = "P mesuré en aval (après) de SUP";
  }
}

function toggleSensP() {
  const hidden = document.getElementById("sensP");
  const sensActuel = hidden ? hidden.value : "APRES";
  majAffichageSensP(sensActuel === "APRES" ? "AVANT" : "APRES");
  calculer();
}

/* Toggle signe SOL */
function toggleSignSOL(){
  let input = document.getElementById("SOL");
  let val = parseFloat(input.value) || 0;
  input.value = -val;
  calculer();
}
