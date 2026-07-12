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

