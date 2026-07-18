/* --- 1. FONCTIONS GLOBALES (Appelées par le HTML) --- */

function ouvrirOnglet(nom) {
    // Gestion visuelle des pages
    document.getElementById("fbmPage").style.display = nom === "fbm" ? "block" : "none";
    document.getElementById("adminPage").style.display = nom === "admin" ? "block" : "none";
    
    // Gestion des boutons actifs
    document.getElementById("tabFBM").classList.toggle("active", nom === "fbm");
    document.getElementById("tabAdmin").classList.toggle("active", nom === "admin");


// Lancement du récap approprié
if (nom === "admin") {
    setTimeout(() => {
        if (typeof genererRecap === "function") {
            genererRecap("recap-content-admin");
        }
    }, 100);
} else if (nom === "fbm") {
    // AJOUT : On force l'ouverture de la section FBM si elle est "collapsed"
    const sectionFbm = document.getElementById("sec-recap-fbm");
    if (sectionFbm && sectionFbm.parentElement.classList.contains("collapsed")) {
        // On simule un clic sur le titre pour ouvrir la section
        sectionFbm.parentElement.querySelector(".section-title")?.click();
    }
    
    setTimeout(() => {
        if (typeof genererRecap === "function") {
            genererRecap("recap-content-fbm");
        }
    }, 100);
}

function verifierAdmin() {
    const identite = JSON.parse(localStorage.getItem("fbm_identite_redacteur"));
    if (!identite) return;

    const admins = ["robert.lavignon@reseau.sncf.fr"];
    const tabAdmin = document.getElementById("tabAdmin");
    if (tabAdmin) {
        tabAdmin.style.display = admins.includes(identite.email) ? "block" : "none";
    }
}

function resetChamps() {
    document.getElementById("valF").value = "";
    document.getElementById("valP").value = "";
    document.getElementById("valSUP").value = "";
    if (typeof majAffichageSensP === "function") majAffichageSensP("APRES");
    
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

    if (typeof calculer === "function") calculer();
}

/* --- 2. INITIALISATION GÉNÉRALE (Exécuté au chargement du DOM) --- */

document.addEventListener("DOMContentLoaded", function () {
    const chkCarotte = document.getElementById("carotte");
    const chkBlindage = document.getElementById("blindageCheck");
    const blocCarotte = document.getElementById("bloc_saisie_carotte");
    const blocBlindage = document.getElementById("bloc_saisie_blindage");
    const blocTraverseNit = document.getElementById("bloc_traverse_nit");

    function refreshBlocs() {
        if (blocCarotte) blocCarotte.style.display = chkCarotte?.checked ? "flex" : "none";
        if (blocBlindage) blocBlindage.style.display = chkBlindage?.checked ? "flex" : "none";
        if (blocTraverseNit) blocTraverseNit.style.display = chkBlindage?.checked ? "flex" : "none";
    }

    if (chkCarotte) chkCarotte.addEventListener("change", refreshBlocs);
    if (chkBlindage) chkBlindage.addEventListener("change", refreshBlocs);
    
    window.refreshBlocs = refreshBlocs;
    refreshBlocs();

    document.addEventListener('focusin', function(e) {
        if (e.target.type === 'number') e.target.select();
    });

    document.querySelectorAll(".box").forEach(box => {
        box.addEventListener("input", () => {
            if (typeof sauvegarderLocal === "function") sauvegarderLocal();
        });
        box.addEventListener("change", () => {
            if (typeof sauvegarderLocal === "function") sauvegarderLocal();
        });
    });
});

/* --- 3. CHARGEMENT INITIAL --- */

window.addEventListener('load', function() {
    verifierAdmin();
    
    const selectChantier = document.getElementById("selectChantier");
    if (selectChantier && selectChantier.options.length > 1) {
        selectChantier.selectedIndex = 1;
        selectChantier.dispatchEvent(new Event('change'));
        
        if (typeof initChantiers === "function") {
            initChantiers();
        }
    }
});
