/* --- 1. FONCTIONS GLOBALES --- */
function ouvrirOnglet(nom) {
    document.getElementById("fbmPage").style.display = nom === "fbm" ? "block" : "none";
    document.getElementById("adminPage").style.display = nom === "admin" ? "block" : "none";
    document.getElementById("tabFBM").classList.toggle("active", nom === "fbm");
    document.getElementById("tabAdmin").classList.toggle("active", nom === "admin");

if (nom === "admin") {
        // Force l'affichage de la page admin avant d'injecter les données
        const pageAdmin = document.getElementById("adminPage");
        if (pageAdmin) pageAdmin.style.display = "block";
        
        setTimeout(() => { 
            if (typeof genererRecap === "function") {
                genererRecap("recap-content-admin"); 
            }
        }, 100);
    } else if (nom === "fbm") {
        const sectionFbm = document.getElementById("sec-recap-fbm");
        if (sectionFbm && sectionFbm.parentElement.classList.contains("collapsed")) {
            sectionFbm.parentElement.querySelector(".section-title")?.click();
        }
        setTimeout(() => { if (typeof genererRecap === "function") genererRecap("recap-content-fbm"); }, 100);
    }
}

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
    function refreshBlocs() {
        if (document.getElementById("bloc_saisie_carotte")) document.getElementById("bloc_saisie_carotte").style.display = chkCarotte?.checked ? "flex" : "none";
        if (document.getElementById("bloc_saisie_blindage")) document.getElementById("bloc_saisie_blindage").style.display = chkBlindage?.checked ? "flex" : "none";
    }
    if (chkCarotte) chkCarotte.addEventListener("change", refreshBlocs);
    if (chkBlindage) chkBlindage.addEventListener("change", refreshBlocs);
});

/* --- 3. CHARGEMENT INITIAL --- */
window.addEventListener('load', function() {
    verifierAdmin();
    const selectChantier = document.getElementById("selectChantier");
    if (selectChantier && selectChantier.options.length > 1) {
        selectChantier.selectedIndex = 1;
        selectChantier.dispatchEvent(new Event('change'));
        if (typeof initChantiers === "function") initChantiers();
    }
});
// FIN DU FICHIER - NE RIEN SUPPRIMER APRES CETTE LIGNE
