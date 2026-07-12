/* Initialisation */
window.onload = () => {initChantiers();  calculer();};
let choixExtensionA = "centre";
let modalOuvert = false;
let largeurEchantillon = 0;

/* Gestion changement A */
function gererChangementA() {
  let AFval = parseFloat(document.getElementById("AF").value) || 0;

  if (AFval > 0) {
    document.getElementById("modal_saisie_A").value = document.getElementById("AF").value;
    document.getElementById("divExtensionModal").style.display = "flex";
    
    setTimeout(() => {
      document.getElementById("modal_saisie_A").focus();
      document.getElementById("modal_saisie_A").select();
    }, 150);
  } else {
    alert("⚠️ Veuillez d'abord renseigner une valeur A (via un support).");
  }
}

/* Navigation clavier */
function passerAEchantillon(event) {
  if (event.key === "Enter") {
    event.preventDefault(); 
    document.getElementById("divEchantillonModal").style.display = "flex";
  }
}

function validerEchantillonPopup(valeur, largeur, nomProfile) {
  let selectE = document.getElementById("E_select");
  let inputE = document.getElementById("E");
  
  // Enregistre la largeur dans la variable globale (convertie en nombre)
  largeurEchantillon = parseFloat(largeur) || 0;
  
  // Stocke également la largeur de manière invisible sur l'élément HTML si besoin
  selectE.setAttribute('data-largeur', largeurEchantillon);

  // Supprime l'ancienne option temporaire si elle existe
  let ancienneOption = selectE.querySelector('.temp-option');
  if (ancienneOption) ancienneOption.remove();


document.getElementById("display_nom").innerText = nomProfile;
document.getElementById("display_larg").innerText = largeur;
document.getElementById("display_prof").innerText = (valeur === "manuel") ? (document.getElementById("E").value || "?") : valeur;
  if (valeur !== "manuel") {
    let opt = document.createElement("option");
    opt.value = valeur;
    opt.text = nomProfile;
    opt.classList.add("temp-option");
    selectE.appendChild(opt);
    selectE.value = valeur; 
  } else {
    selectE.value = "manuel";
  } 
  document.getElementById("divEchantillonModal").style.display = "none";  
largeurEchantillon = parseFloat(largeur) || 0;
profondeurEchantillon = parseFloat(valeur === "manuel" ? 0 : valeur) || 0;

// mode manuel
if (valeur === "manuel") {
  selectE.value = "manuel";
  inputE.style.display = "block";
  inputE.value = "";
  inputE.focus();
}
// mode liste
else {
  inputE.style.display = "none";
  selectE.value = valeur;
}

calculer();
syncEchantillon();



}
function syncEchantillon() {
  let selectE = document.getElementById("E_select");
  let inputE = document.getElementById("E");

  if (selectE.value === "manuel") {
    // mode terrain → on garde input
  } else {
    inputE.value = "";
  }
}

function validerToutPopup(type) {
  let nouvelleValeur = parseFloat(document.getElementById("modal_saisie_A").value);
  
  if (isNaN(nouvelleValeur) || nouvelleValeur <= 0) {
    alert("⚠️ Saisie invalide : Veuillez entrer une valeur numérique supérieure à 0.");
    return;
  }
  
  choixExtensionA = type;
  document.getElementById("AF").value = nouvelleValeur;
  document.getElementById("divExtensionModal").style.display = "none";
  calculer();
}

function validerChoixExt(type) {
  choixExtensionA = type;
  document.getElementById("divExtensionModal").style.display = "none";
  modalOuvert = false;
  calculer();
}

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
  
/* Partage WhatsApp */
function shareWhatsApp(){
  let numSupportInput = document.getElementById("selectSupport").value.trim();

  if (numSupportInput === "") {
    alert("⚠️ Saisie obligatoire :\nVous devez inscrire un N° Support avant de pouvoir exporter les résultats.");
    document.getElementById("selectSupport").focus();
    return;
  }

  let textePartage = "Résultat calcul blindage - Support N°: " + numSupportInput;
  let zone = document.querySelector(".box");

  html2canvas(zone).then(canvas => {
    canvas.toBlob(function(blob){
      let file = new File([blob], "calcul.png", {type: "image/png"});
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: "Calcul BF",
          text: textePartage
        });
      } else {
        alert("Partage non supporté sur ce téléphone");
      }
    });
  });
} 

/* Export PDF stylé */
/* ============================================================
   PAD DE SIGNATURE (souris + tactile)
   ============================================================ */
let sigCtx = null;
let sigDessin = false;
let sigVide = true;

function initSignature() {
  const canvas = document.getElementById("signatureCanvas");
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;

  function redimensionner() {
    const dessinPrecedent = (!sigVide && canvas.width > 0) ? canvas.toDataURL("image/png") : null;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width * ratio);
    canvas.height = Math.max(1, rect.height * ratio);
    sigCtx = canvas.getContext("2d");
    sigCtx.scale(ratio, ratio);
    sigCtx.lineWidth = 2.2;
    sigCtx.lineCap = "round";
    sigCtx.lineJoin = "round";
    sigCtx.strokeStyle = "#1f2937";
    if (dessinPrecedent) {
      const img = new Image();
      img.onload = () => sigCtx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = dessinPrecedent;
    }
  }
  redimensionner();
  window.addEventListener("resize", redimensionner);

  function position(e) {
    const rect = canvas.getBoundingClientRect();
    const point = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }
  function debut(e) {
    e.preventDefault();
    sigDessin = true;
    const p = position(e);
    sigCtx.beginPath();
    sigCtx.moveTo(p.x, p.y);
  }
  function trace(e) {
    if (!sigDessin) return;
    e.preventDefault();
    const p = position(e);
    sigCtx.lineTo(p.x, p.y);
    sigCtx.stroke();
    sigVide = false;
  }
  function fin() { sigDessin = false; }

  canvas.addEventListener("mousedown", debut);
  canvas.addEventListener("mousemove", trace);
  window.addEventListener("mouseup", fin);
  canvas.addEventListener("touchstart", debut, { passive: false });
  canvas.addEventListener("touchmove", trace, { passive: false });
  canvas.addEventListener("touchend", fin);
  canvas.addEventListener("touchcancel", fin);
}

function effacerSignature() {
  const canvas = document.getElementById("signatureCanvas");
  if (!canvas || !sigCtx) return;
  sigCtx.clearRect(0, 0, canvas.width, canvas.height);
  sigVide = true;
}

initSignature();
majAffichageSensP("APRES");

/* Convertit le SVG du logo en image PNG (pour intégration dans le PDF) */
function logoSVGversPNG(largeurPx, hauteurPx) {
  return new Promise((resolve) => {
    try {
      const svgEl = document.getElementById("logoSNCF");
      if (!svgEl) { resolve(null); return; }
      const svgData = new XMLSerializer().serializeToString(svgEl);
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
    } catch (e) {
      resolve(null);
    }
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
    const typeSupport = clean(txt("display_type")).replace(/^Type\s*:\s*/i, "");
    const dateStr = new Date().toLocaleString("fr-FR");

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
    const logoDataUrl = await logoSVGversPNG(216, 153);
    const logoRatio = 153 / 216;

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

    function enteteComplete() {
      bandeauDegrade(0, 24);
      if (logoDataUrl) {
        const logoH = 15;
        const logoW = logoH / logoRatio;
        doc.addImage(logoDataUrl, "PNG", marge, 4.5, logoW, logoH);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14.5);
      doc.text("FICHE DE CONTROLE FOUILLE / BLINDAGE", pageW / 2, 9.5, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("SNCF Reseau  -  Outil FBM", pageW / 2, 15, { align: "center" });
      doc.setFontSize(8.3);
      doc.setFont("helvetica", "bold");
      doc.text("Chantier : " + (nomChantier || "-"), marge, 21);
      doc.text("Support : " + numSupportInput, pageW - marge, 21, { align: "right" });
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
    y = 30;
    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Genere le " + dateStr + (typeSupport ? "   -   Type : " + typeSupport : ""), marge, y);
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
      y += 6.2 + 2;
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

    const rowsFouille = [
      ["Implantation (I)", val("I") ? val("I") + " m" : "-", txt("I_ref")],
      ["Echantillon", echValeur || "-", txt("ECH_ref")],
      ["Arasement (AR)", val("AR") ? val("AR") + " m" : "-", txt("AR_ref")],
      ["Encastrement (Enc)", val("Enc") ? val("Enc") + " m" : "-", txt("Enc_ref")],
      ["Cote A", val("AF") ? val("AF") + " m" : "-", txt("AF_ref")],
      ["Cote B", val("B_Fouille") ? val("B_Fouille") + " m" : "-", txt("B_ref")],
      ["Cote H", val("H_Fouille") ? val("H_Fouille") + " m" : "-", txt("H_ref")],
      ["F", val("valF") || "-", txt("F_ref")],
      ["P (" + ((val("sensP") === "AVANT") ? "amont" : "aval") + " de SUP)", val("valP") || "-", txt("P_ref")],
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
    titreSection("CONFIGURATION", [90, 90, 90]);
    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      body: [
        ["Voies annoncees / interceptees (TES.D)", verifVoie ? "OUI" : "NON"],
        ["Carottage", verifCarotte ? "OUI" : "NON"],
        ["Blindage", verifBlindage ? "OUI" : "NON"],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } },
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
    titreSection("VOLUMES", violet);
    const rowsVolumes = [["Volume theorique", txt("vol_prevu") || "-"], ["Volume reel", txt("vol_modifie") || "-"]];
    if (g("display_vol_carotte") && g("display_vol_carotte").style.display !== "none") {
      rowsVolumes.push(["Beton net (hors carotte)", txt("vol_carotte") || "-"]);
    }
    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      body: rowsVolumes,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 1: { fontStyle: 'bold', halign: 'right', textColor: [0, 100, 180] } },
    });
    y = doc.lastAutoTable.finalY + 5;

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
    const seuils = [
      ["BMax", clean(txt("BMax_display"))],
      ["DMin", clean(txt("DMin_display"))],
      ["Hmax", clean(txt("Hmax_display"))],
    ];
    doc.autoTable({
      startY: y,
      margin: { left: marge, right: marge, bottom: footerReserve },
      head: [["Seuil", "Valeur"]],
      body: seuils,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2, halign: 'center' },
      headStyles: { fillColor: [90, 90, 90], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { fontStyle: 'bold', textColor: [22, 130, 60] } },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ---------- Zone de signature ----------
    const nomRedacteur = val("nomRedacteur");
    const canvasSignature = g("signatureCanvas");
    const signatureRenseignee = canvasSignature && !sigVide;

    assurerPlace(signatureRenseignee ? 30 : 16);
    doc.setDrawColor(180, 180, 180);
    doc.setFontSize(7.8);
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "bold");
    doc.text("Rédigé par : " + (nomRedacteur || "-"), marge, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text("Signature :", marge, y + 3);
    if (signatureRenseignee) {
      const sigData = canvasSignature.toDataURL("image/png");
      const sigW = 55;
      const sigH = sigW * (canvasSignature.height / canvasSignature.width);
      doc.setDrawColor(210, 210, 210);
      doc.rect(marge + 24, y - 5, sigW, Math.min(sigH, 24));
      doc.addImage(sigData, "PNG", marge + 24, y - 5, sigW, Math.min(sigH, 24));
      y += Math.min(sigH, 24) + 2;
    } else {
      doc.line(marge + 24, y + 3, marge + 90, y + 3);
      y += 6;
    }

    // ---------- Pied de page sur toutes les pages ----------
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

function chargerChantier1() {

  const index = document.getElementById("selectChantier").value;

  if (index === "" || !baseChantiers[index]) return;

  const data = baseChantiers[index];

  console.log("Chargement chantier :", data); // 🔥 debug important

  const supportInput = document.getElementById("selectSupport");

  if (supportInput) {
    supportInput.value = data.support ?? "";
  }

  document.getElementById("I").value = data.I ?? 0;
  document.getElementById("AF").value = data.AF ?? 0;
  document.getElementById("B_Fouille").value = data.B ?? 0;
  document.getElementById("H_Fouille").value = data.H ?? 0;
  document.getElementById("AR").value = data.AR ?? 0;
  document.getElementById("Enc").value = data.Enc ?? 0;

  calculer();
}
function chargerChantier() {
  const index = document.getElementById("selectChantier").value;
  if (index === "" || !baseChantiers[index]) return;

  const data = baseChantiers[index];
  const selectSupport = document.getElementById("selectSupport");

  // 1. Mise à jour de la liste des supports disponibles pour ce chantier
  // On suppose que chaque chantier a une propriété 'supports' qui est un tableau
  selectSupport.innerHTML = '<option value="">Choisir un support...</option>';
  
  if (data.supports && Array.isArray(data.supports)) {
    data.supports.forEach(supportNom => {
      const option = document.createElement("option");
      option.value = supportNom;
      option.text = supportNom;
      selectSupport.appendChild(option);
    });
  }

  // 2. Sélectionner le premier support par défaut si vous le souhaitez
  if (selectSupport.options.length > 1) {
    selectSupport.selectedIndex = 1;
    chargerSupport(); // Appeler la fonction qui remplit les inputs
  } else {
    resetChamps(); // Si aucun support, on vide tout
  }
}
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

    // 5. Mise à jour finale
    if (typeof refreshBlocs === "function") refreshBlocs();
    calculer();
}





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
    // Récupérer la valeur saisie (en nombre)



    const valP = parseFloat(data.P) || 0;
    const valeurAbsolueP = Math.abs(valP).toString();
    
    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");

    if (valeurAbsolueP >= 0) {
        blocS.style.display = "block";
        blocN.style.display = "none";
    } else {
        blocS.style.display = "none";
        blocN.style.display = "block";
    }
}

function chargerSupport1() {
    const selectSupport = document.getElementById("selectSupport");
    const data = baseSupports.find(s => s.support === selectSupport.value);

    if (!data) return;

    // 1. Remplissage des champs simples
    document.getElementById("valF").value = data.F || "";
    document.getElementById("valSUP").value = data.SUP || "";
    document.getElementById("I").value = data.I || "";
    document.getElementById("AF").value = data.AF || "";
    document.getElementById("B_Fouille").value = data.B || "";
    document.getElementById("H_Fouille").value = data.H || "";
    document.getElementById("AR").value = data.AR || "";
    document.getElementById("Enc").value = data.Enc || "";

    // 2. Remplissage des références (Textes verts)
    // On remplit TOUS les spans de référence pour être sûr que la donnée est présente
    document.getElementById("F_ref").innerText = data.F || "";
    document.getElementById("SUP_ref").innerText = data.SUP || "";
    document.getElementById("P_ref_N").innerText = data.P || ""; // Réf Négatif
    document.getElementById("P_ref_S").innerText = data.P || ""; // Réf Positif
    document.getElementById("I_ref").innerText = data.I || "";
    document.getElementById("AF_ref").innerText = data.AF || "";
    document.getElementById("B_ref").innerText = data.B || "";
    document.getElementById("H_ref").innerText = data.H || "";
    document.getElementById("AR_ref").innerText = data.AR || "";
    document.getElementById("Enc_ref").innerText = data.Enc || "";

// --- LOGIQUE P ABSOLUE ---
    // On convertit la valeur en nombre et on prend sa valeur absolue
    const valP = parseFloat(data.P) || 0;
    const valeurAbsolueP = Math.abs(valP).toString();
    
    // On remplit les références avec la valeur absolue
    document.getElementById("P_ref_N").innerText = valeurAbsolueP;
    document.getElementById("P_ref_S").innerText = valeurAbsolueP;

    // On affiche le bon bloc et on remplit l'input avec la valeur absolue
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

    // 4. Lancer les calculs finaux et mises à jour
    if (window.refreshBlocs) window.refreshBlocs();
    calculer();
}

function chargerSupport2() {
    const selectSupport = document.getElementById("selectSupport");
    const data = baseSupports.find(s => s.support === selectSupport.value);

    if (!data) return;

    // 1. Remplissage des champs de saisie standards
    document.getElementById("valF").value = data.F || "";
    document.getElementById("valSUP").value = data.SUP || "";
    document.getElementById("I").value = data.I || "";
    document.getElementById("AF").value = data.AF || "";
    document.getElementById("B_Fouille").value = data.B || "";
    document.getElementById("H_Fouille").value = data.H || "";
    document.getElementById("AR").value = data.AR || "";
    document.getElementById("Enc").value = data.Enc || "";

    // 2. Remplissage des références (Textes grisés)
    document.getElementById("F_ref").innerText = data.F || "";
    document.getElementById("SUP_ref").innerText = data.SUP || "";
    document.getElementById("I_ref").innerText = data.I || "";
    document.getElementById("AF_ref").innerText = data.AF || "";
    document.getElementById("B_ref").innerText = data.B || "";
    document.getElementById("H_ref").innerText = data.H || "";
    document.getElementById("AR_ref").innerText = data.AR || "";
    document.getElementById("Enc_ref").innerText = data.Enc || "";

    // 3. Gestion intelligente de P (Valeur absolue pour l'affichage)
    const valP = parseFloat(data.P) || 0;
    const valeurAbsolueP = Math.abs(valP);

    // Mettre à jour les deux spans de référence (même si un est caché)
    document.getElementById("P_ref_N").innerText = valeurAbsolueP;
    document.getElementById("P_ref_S").innerText = valeurAbsolueP;

    // Gérer l'affichage conditionnel des blocs P
    const blocN = document.getElementById("bloc-N");
    const blocS = document.getElementById("bloc-S");

    if (valP >= 0) {
        // P positif : on affiche le bloc S
        document.getElementById("valP_S").value = valeurAbsolueP;
        document.getElementById("valP_N").value = ""; // On vide l'autre par sécurité
        blocS.style.display = "block";
        blocN.style.display = "none";
    } else {
        // P négatif : on affiche le bloc N
        document.getElementById("valP_N").value = valeurAbsolueP;
        document.getElementById("valP_S").value = ""; // On vide l'autre par sécurité
        blocN.style.display = "block";
        blocS.style.display = "none";
    }

    // 4. Gestion de l'échantillonnage et des cases à cocher
    if (typeof appliquerEchantillon === "function") {
        appliquerEchantillon(data.ECH);
    }
    
    // Mise à jour des cases à cocher blindage/carotte
    document.getElementById("blindageCheck").checked = (data.BLIND === "OUI");
    document.getElementById("carotte").checked = (data.CARO === "OUI");

    // 5. Rafraîchissement final
    if (window.refreshBlocs) window.refreshBlocs();
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

  const filtres = baseSupports.filter(s => s.chantier === chantier);

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
document.addEventListener("DOMContentLoaded", function () {

    const chkCarotte = document.getElementById("carotte");
    const chkBlindage = document.getElementById("blindageCheck");

    const blocCarotte = document.getElementById("bloc_saisie_carotte");
    const blocBlindage = document.getElementById("bloc_saisie_blindage");
    const blocTraverseNit = document.getElementById("bloc_traverse_nit"); // Nouveau

function resetChamps() {
document.getElementById("valF").value = "";
  document.getElementById("valP").value = "";
  document.getElementById("valSUP").value = "";
  majAffichageSensP("APRES");
  
  document.getElementById("F_ref").innerText = "";
  document.getElementById("P_ref").innerText = "";
  document.getElementById("SUP_ref").innerText = "";
  document.getElementById("selectSupport").value = "";
  document.getElementById("I").value = "";
  document.getElementById("AF").value = "";
  document.getElementById("B_Fouille").value = "";
  document.getElementById("H_Fouille").value = "";
  document.getElementById("AR").value = "";
  document.getElementById("Enc").value = "";

  calculer();
}
    function refreshBlocs() {

        if (chkCarotte.checked) {
            blocCarotte.style.display = "flex";

        } else {
            blocCarotte.style.display = "none";
			
        }

        if (chkBlindage.checked) {
            blocBlindage.style.display = "flex";
			blocTraverseNit.style.display = "flex"; // Affiche si blindage coché
        } else {
            blocBlindage.style.display = "none";
			blocTraverseNit.style.display = "none"; // Masque sinon
        }
    }

    chkCarotte.addEventListener("change", refreshBlocs);
    chkBlindage.addEventListener("change", refreshBlocs);

    window.refreshBlocs = refreshBlocs;

    refreshBlocs();
});
document.addEventListener('focusin', function(e) {

    if (e.target.type === 'number') {
        e.target.select();
    }

});
// Au chargement complet de la page
window.addEventListener('load', function() {
    const selectChantier = document.getElementById("selectChantier");

    // 1. On vérifie s'il y a bien un chantier à sélectionner (index 1)
    if (selectChantier && selectChantier.options.length > 1) {
        
        // 2. On change la sélection
        selectChantier.selectedIndex = 1;
        
        // 3. ON SIMULE L'ÉVÉNEMENT "change"
        // C'est cette ligne qui déclenche la logique liée à la sélection
        const event = new Event('change');
        selectChantier.dispatchEvent(event);
        
        // 4. Au cas où l'événement n'est pas capté, on appelle la fonction manuellement
        chargerChantier();
    }
});

