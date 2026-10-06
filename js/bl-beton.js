/* ============================================================
   GESTION BONS DE LIVRAISON BÉTON (BL-BÉTON)
   - 1 enregistrement = BL + Type béton + Slump
   - Plusieurs BL par support
   - Sauvegarde localStorage par chantier/support
   - Scanner QR code
   - Compatible avec l'ancien format de données
   ============================================================ */

let blsActuels = [];

/*
Structure actuelle :
[
  {
    bl: "BL-001",
    type: "C35/45",
    slump: 18
  },
  {
    bl: "BL-002",
    type: "C30/37",
    slump: 12
  }
]
*/

/* ============================================================
   CLÉ LOCALSTORAGE
   ============================================================ */

function cleAutosaveBL() {
  const chantier = document.getElementById("selectChantier")?.value || "";
  const support  = document.getElementById("selectSupport")?.value || "";

  if (!chantier || !support) return null;

  return "fbm_bls_" + chantier + "_" + support;
}


/* ============================================================
   CHARGER LES BL DU SUPPORT COURANT
   ============================================================ */

function chargerBLs() {
  const cle = cleAutosaveBL();

  try {
    const brut = cle ? localStorage.getItem(cle) : null;
    const donnees = brut ? JSON.parse(brut) : [];

    if (!Array.isArray(donnees)) {
      blsActuels = [];
    } else {

      /*
       * Migration des anciennes données.
       *
       * Ancien format :
       * {
       *   bl: "BL-001",
       *   slumps: [18, 20]
       * }
       *
       * On transforme chaque slump en ligne indépendante.
       */
      blsActuels = [];

      donnees.forEach(item => {

        /* Ancien format */
        if (item && Array.isArray(item.slumps)) {

          const blAncien = item.bl || "";
          const typeAncien = item.type || "";

          item.slumps.forEach(slump => {
            if (slump !== null && slump !== undefined && slump !== "") {
              blsActuels.push({
                bl: blAncien,
                type: typeAncien,
                slump: parseFloat(slump)
              });
            }
          });

          /*
           * Si ancien BL sans slump,
           * on le conserve quand même.
           */
          if (item.slumps.length === 0 && blAncien) {
            blsActuels.push({
              bl: blAncien,
              type: typeAncien,
              slump: null
            });
          }

        }

        /* Nouveau format */
        else if (item && typeof item === "object") {

          blsActuels.push({
            bl: item.bl || "",
            type: item.type || "",
            slump:
              item.slump !== undefined &&
              item.slump !== null &&
              item.slump !== ""
                ? parseFloat(item.slump)
                : null
          });

        }

        /* Très ancien format : simple texte BL */
        else if (typeof item === "string") {

          blsActuels.push({
            bl: item,
            type: "",
            slump: null
          });

        }

      });
    }

  } catch (e) {

    console.error("Erreur chargement BL :", e);
    blsActuels = [];

  }

  afficherBLs();
}


/* ============================================================
   SAUVEGARDER
   ============================================================ */

function sauvegarderBLs() {
  const cle = cleAutosaveBL();

  if (!cle) return;

  try {

    localStorage.setItem(
      cle,
      JSON.stringify(blsActuels)
    );

  } catch (e) {

    console.error("Erreur sauvegarde BL :", e);

  }
}


/* ============================================================
   AJOUTER UN ENREGISTREMENT
   BL + TYPE BÉTON + SLUMP
   ============================================================ */

function ajouterBL() {

  const blInput    = document.getElementById("bl_beton");
  const typeInput  = document.getElementById("bl-input");
  const slumpInput = document.getElementById("slump-input");

  const blVal = (blInput?.value || "")
    .trim()
    .toUpperCase();

  const typeVal = (typeInput?.value || "")
    .trim()
    .toUpperCase();

  const slumpTexte = slumpInput?.value ?? "";

  const slumpVal =
    slumpTexte !== ""
      ? parseFloat(slumpTexte)
      : null;


  /* Vérification BL */

  if (!blVal) {
    alert("⚠️ Saisis ou scanne un numéro BL.");
    blInput?.focus();
    return;
  }


  /* Vérification Type béton */

  if (!typeVal) {
    alert("⚠️ Saisis le type de béton.");
    typeInput?.focus();
    return;
  }


  /* Vérification Slump */

  if (
    slumpVal === null ||
    isNaN(slumpVal)
  ) {
    alert("⚠️ Saisis une valeur de SLUMP.");
    slumpInput?.focus();
    return;
  }


  /*
   * Chaque clic crée une nouvelle ligne.
   *
   * Même si le BL existe déjà,
   * on ne fusionne PAS les slumps.
   */

  blsActuels.push({
    bl: blVal,
    type: typeVal,
    slump: slumpVal
  });


  sauvegarderBLs();
  afficherBLs();


  /* Nettoyage des champs */

  if (blInput) {
    blInput.value = "";
  }

  if (typeInput) {
    typeInput.value = "";
  }

  if (slumpInput) {
    slumpInput.value = "";
  }


  /* Retour sur le BL */

  if (blInput) {
    blInput.focus();
  }
}


/* ============================================================
   SUPPRIMER UN ENREGISTREMENT COMPLET
   ============================================================ */

function supprimerBL(index) {

  if (
    !blsActuels[index]
  ) {
    return;
  }

  const item = blsActuels[index];

  const texte = [
    item.bl || "BL sans numéro",
    item.type || "Type non renseigné",
    item.slump !== null && item.slump !== undefined
      ? item.slump + " cm"
      : "Slump non renseigné"
  ].join(" — ");


  if (
    !confirm(
      "Supprimer cet enregistrement béton ?\n\n" +
      texte
    )
  ) {
    return;
  }


  blsActuels.splice(index, 1);

  sauvegarderBLs();
  afficherBLs();
}


/* ============================================================
   AFFICHER LA LISTE
   ============================================================ */

function afficherBLs() {

  const liste = document.getElementById("bl-liste");

  if (!liste) return;


  if (blsActuels.length === 0) {

    liste.innerHTML =
      "<p style='" +
      "color:#999;" +
      "font-size:0.8em;" +
      "text-align:center;" +
      "margin:6px 0;" +
      "'>" +
      "Aucun BL enregistré" +
      "</p>";

    return;
  }


  liste.innerHTML = blsActuels.map((item, i) => {

    const bl = item.bl || "--";
    const type = item.type || "--";

    const slump =
      item.slump !== null &&
      item.slump !== undefined &&
      item.slump !== "" &&
      !isNaN(item.slump)
        ? item.slump + " cm"
        : "--";


    return `
      <div style="
        background:#f9fafb;
        border:1px solid #e5e7eb;
        border-radius:8px;
        padding:7px 8px;
        margin-bottom:5px;
      ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:6px;
        ">

          <div style="
            display:flex;
            align-items:center;
            gap:5px;
            min-width:0;
            flex:1;
          ">

            <span style="
              font-weight:bold;
              color:#333;
              font-size:0.82em;
              white-space:nowrap;
            ">
              🧾 ${echapperHTML(bl)}
            </span>

            <span style="
              color:#7C2270;
              background:#f0e4ee;
              font-weight:bold;
              padding:2px 6px;
              border-radius:8px;
              font-size:0.72em;
              overflow:hidden;
              text-overflow:ellipsis;
              white-space:nowrap;
            ">
              ${echapperHTML(type)}
            </span>

            <span style="
              color:#0369a1;
              background:#e0f2fe;
              font-weight:bold;
              padding:2px 6px;
              border-radius:8px;
              font-size:0.72em;
              white-space:nowrap;
            ">
              ${slump}
            </span>

          </div>

          <button
            type="button"
            onclick="supprimerBL(${i})"
            style="
              background:#fee2e2;
              color:#dc2626;
              padding:2px 7px;
              font-size:0.72em;
              margin:0;
              border-radius:4px;
              flex-shrink:0;
            "
            title="Supprimer cet enregistrement"
          >
            ✕
          </button>

        </div>

      </div>
    `;

  }).join("");
}


/* ============================================================
   PROTECTION HTML
   ============================================================ */

function echapperHTML(valeur) {

  return String(valeur ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   INITIALISER LE DATALIST TYPE BÉTON
   ============================================================ */

function initBLDatalist() {

  const dl = document.getElementById("bl-datalist");

  if (
    !dl ||
    typeof LISTE_BL === "undefined" ||
    !Array.isArray(LISTE_BL)
  ) {
    return;
  }


  dl.innerHTML = LISTE_BL
    .map(type => `<option value="${echapperHTML(type)}">`)
    .join("");
}


/* ============================================================
   SCANNER QR CODE
   ============================================================ */

let _scanInterval = null;
let _scanStream = null;


async function scannerQR() {

  const modal = document.getElementById("divScanModal");
  const video = document.getElementById("scanVideo");


  if (!modal || !video) {

    alert("⚠️ Scanner non disponible.");
    return;

  }


  try {

    _scanStream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        }
      });


    video.srcObject = _scanStream;

    await video.play();

    modal.style.display = "flex";

    _demarrerDetection(video);

  } catch (err) {

    alert(
      "⚠️ Impossible d'accéder à la caméra : " +
      err.message
    );

  }
}


/* ============================================================
   DÉTECTION QR / CODE-BARRES
   ============================================================ */

function _demarrerDetection(video) {

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");


  _scanInterval = setInterval(async () => {

    if (
      video.readyState !==
      video.HAVE_ENOUGH_DATA
    ) {
      return;
    }


    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    let resultat = null;


    /* ---- BarcodeDetector natif ---- */

    if ("BarcodeDetector" in window) {

      try {

        const detector =
          new BarcodeDetector({
            formats: [
              "qr_code",
              "code_128",
              "code_39",
              "ean_13",
              "ean_8",
              "data_matrix"
            ]
          });


        const codes =
          await detector.detect(canvas);


        if (codes.length > 0) {
          resultat =
            codes[0].rawValue;
        }

      } catch (e) {}

    }


    /* ---- Fallback jsQR ---- */

    if (
      !resultat &&
      typeof jsQR !== "undefined"
    ) {

      try {

        const imageData =
          ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );


        const code = jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          {
            inversionAttempts: "dontInvert"
          }
        );


        if (code) {
          resultat = code.data;
        }

      } catch (e) {}

    }


    /* ---- Résultat ---- */

    if (resultat) {

      arreterScan();


      const blInput =
        document.getElementById("bl_beton");

      if (blInput) {

        blInput.value =
          String(resultat)
            .trim()
            .toUpperCase();

        blInput.focus();

      }

    }

  }, 300);

}


/* ============================================================
   ARRÊTER LE SCAN
   ============================================================ */

function arreterScan() {

  clearInterval(_scanInterval);

  _scanInterval = null;


  if (_scanStream) {

    _scanStream
      .getTracks()
      .forEach(t => t.stop());

    _scanStream = null;

  }


  const modal =
    document.getElementById("divScanModal");

  if (modal) {
    modal.style.display = "none";
  }


  const video =
    document.getElementById("scanVideo");

  if (video) {
    video.srcObject = null;
  }
}


/* ============================================================
   APPELÉE DEPUIS chargerSupport()
   ============================================================ */

function rechargerBLsSupport() {

  chargerBLs();

}


/* ============================================================
   INITIALISATION
   ============================================================ */

window.addEventListener("load", () => {

  initBLDatalist();


  const blInput =
    document.getElementById("bl_beton");

  const typeInput =
    document.getElementById("bl-input");

  const slumpInput =
    document.getElementById("slump-input");


  /*
   * Entrée sur le BL
   */
  if (blInput) {

    blInput.addEventListener(
      "keydown",
      e => {

        if (e.key === "Enter") {

          e.preventDefault();

          /*
           * Si BL saisi :
           * on passe au type béton.
           */
          if (typeInput) {
            typeInput.focus();
          }

        }

      }
    );

  }


  /*
   * Entrée sur le type béton
   */
  if (typeInput) {

    typeInput.addEventListener(
      "keydown",
      e => {

        if (e.key === "Enter") {

          e.preventDefault();

          /*
           * On passe au slump.
           */
          if (slumpInput) {
            slumpInput.focus();
          }

        }

      }
    );

  }


  /*
   * Entrée sur le slump
   */
  if (slumpInput) {

    slumpInput.addEventListener(
      "keydown",
      e => {

        if (e.key === "Enter") {

          e.preventDefault();

          ajouterBL();

        }

      }
    );

  }


  /*
   * Chargement initial.
   */
  chargerBLs();

});
