let streamScanner = null;
let scanInterval = null;

// 1. Lancer le scan (ouvre la modale existante #divScanModal)
function scannerQRCode() {
    fermerToutesSidebars();
    const modal = document.getElementById('divScanModal');
    const video = document.getElementById('scanVideo');
    if (!modal || !video) return;

    modal.style.display = 'flex';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            streamScanner = stream;
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            demarrerBoucleScan();
        })
        .catch(err => {
            console.error("Erreur caméra :", err);
            alert("Impossible d'accéder à la caméra pour scanner le QR-code.");
            arreterScan();
        });
}

// 2. Boucle de lecture de l'image de la caméra
function demarrerBoucleScan() {
    const video = document.getElementById('scanVideo');
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');

    scanInterval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            
            // Utilisation de la bibliothèque jsQR déjà chargée dans ton projet
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                traitementDonneesQR(code.data);
                arreterScan();
            }
        }
    }, 300);
}

// 3. Arrêter la caméra proprement
function arreterScan() {
    if (scanInterval) clearInterval(scanInterval);
    if (streamScanner) {
        streamScanner.getTracks().forEach(track => track.stop());
        streamScanner = null;
    }
    const modal = document.getElementById('divScanModal');
    if (modal) modal.style.display = 'none';
}

// 4. Traiter le contenu du QR-code scanné
function traitementDonneesQR(donnees) {
    console.log("QR-Code détecté :", donnees);
    
    let chantierCible = null;
    let supportCible = null;

    // Option A : Le QR-code contient une URL complète (ex: https://.../?chantier=XYZ&support=123)
    try {
        const url = new URL(donnees);
        chantierCible = url.searchParams.get('chantier');
        supportCible = url.searchParams.get('support');
    } catch (e) {
        // Option B : Format texte simple ou personnalisé (ex: CHANTIER_A;SUPPORT_12)
        // Tu pourras adapter selon comment tu génères tes QR-codes
        const parts = donnees.split(';');
        if (parts.length >= 2) {
            chantierCible = parts[0].trim();
            supportCible = parts[1].trim();
        }
    }

    if (chantierCible && supportCible) {
        appliquerChantierEtSupport(chantierCible, supportCible);
    } else {
        alert("QR-code lu mais format non reconnu : " + donnees);
    }
}

// 5. Appliquer la sélection dans l'application (et sauvegarder si fermé/rouvert)
function appliquerChantierEtSupport(chantier, support) {
    const selectChantier = document.getElementById('selectChantier');
    if (selectChantier) {
        selectChantier.value = chantier;
        selectChantier.dispatchEvent(new Event('change'));
    }

    // Petit délai pour laisser le temps aux supports du chantier de se charger
    setTimeout(() => {
        const selectSupport = document.getElementById('selectSupport');
        if (selectSupport) {
            selectSupport.value = support;
            selectSupport.dispatchEvent(new Event('change'));
        }
        alert(`✅ Chantier : ${chantier} | Support : ${support} chargés avec succès !`);
    }, 300);
}
