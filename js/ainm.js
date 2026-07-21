/* ============================================================
   LOGO AINM — conversion SVG -> PNG pour intégration PDF
   ============================================================ */
function logoAINMversPNG(largeurPx, hauteurPx) {
  return new Promise((resolve) => {
    fetch("assets/ainm.svg")
      .then((r) => {
        if (!r.ok) throw new Error("ainm.svg introuvable");
        return r.text();
      })
      .then((svgData) => {
        const svg64 = btoa(unescape(encodeURIComponent(svgData)));
        const image64 = "data:image/svg+xml;base64," + svg64;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = largeurPx;
          canvas.height = hauteurPx;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, largeurPx, hauteurPx);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve(null);
        img.src = image64;
      })
      .catch(() => resolve(null));
  });
}
