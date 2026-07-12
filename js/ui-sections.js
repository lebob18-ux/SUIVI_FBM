/* ==========================================
   BLOCS PLIABLES (sections avec titre cliquable)
   ========================================== */
function toggleSection(contentId) {
  const content = document.getElementById(contentId);
  if (!content) return;
  const section = content.closest(".section");
  if (section) section.classList.toggle("collapsed");
}
