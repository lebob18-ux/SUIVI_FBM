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

