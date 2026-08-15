// Enregistrement du Service Worker pour rendre l'outil FBM installable et hors-ligne
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log("Service Worker FBM enregistré !"))
      .catch((err) => console.log("Erreur Service Worker FBM :", err));
  });
}