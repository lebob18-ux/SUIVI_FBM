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

    // Éléments des 3 étapes
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
            // Ni blindage ni hors P1 : on force les 3 en true et on désactive
            if (checkFouille) { checkFouille.checked = true; checkFouille.disabled = true; }
            if (checkBeton) { checkBeton.checked = true; checkBeton.disabled = true; }
            if (checkMatage) { checkMatage.checked = true; checkMatage.disabled = true; }
        } else {
            // Si blindage ou hors P1 est actif : on redonne la main pour récupérer les valeurs
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

    // Appel initial au chargement
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

// Sélection automatique au focus sur tous les inputs numériques
document.addEventListener("focusin", function(e) {
  if (e.target.tagName === "INPUT" && e.target.type === "number" && !e.target.readOnly) {
    setTimeout(() => e.target.select(), 30);
  }
});
// FIN DU FICHIER - NE RIEN SUPPRIMER APRES CETTE LIGNE
