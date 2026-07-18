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

document.querySelector(".box")?.addEventListener("input", () => {
  if (typeof sauvegarderLocal === "function") sauvegarderLocal();
});
document.querySelector(".box")?.addEventListener("change", () => {
  if (typeof sauvegarderLocal === "function") sauvegarderLocal();
});


function ouvrirOnglet(page){

    document.getElementById("fbmPage").style.display = "none";
    document.getElementById("adminPage").style.display = "none";

    document.getElementById(page + "Page").style.display = "block";

    document.getElementById("tabFBM").classList.remove("active");
    document.getElementById("tabAdmin").classList.remove("active");

    document.getElementById("tab" + page.toUpperCase()).classList.add("active");
}

function verifierAdmin(){

    const email = localStorage.getItem("email");

    const admins = [
        "robert.lavignon@reseau.sncf.fr"
    ];

    if(admins.includes(email)){

        document.getElementById("tabAdmin").style.display = "block";

    } else {

        document.getElementById("tabAdmin").style.display = "none";
        document.getElementById("adminPage").style.display = "none";
        document.getElementById("fbmPage").style.display = "block";
    }
}

window.addEventListener("load", verifierAdmin);
