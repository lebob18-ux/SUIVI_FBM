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

/* Convertit le SVG du logo (fichier externe assets/logo.svg) en image PNG (pour intégration dans le PDF) */
