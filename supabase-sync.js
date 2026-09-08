/**
 * Envoie les valeurs modifiées de l'interface vers la table Supabase 'blindage'
 */
async function synchroniserSupportActuel() {
  const numSupportInput = document.getElementById("selectSupport")?.value.trim();
  const chantierSelect = document.getElementById("selectChantier");
  const nomChantier = (chantierSelect && chantierSelect.selectedIndex >= 0 && chantierSelect.options[chantierSelect.selectedIndex])
    ? chantierSelect.options[chantierSelect.selectedIndex].text
    : "";

  if (!numSupportInput) {
    console.warn("Synchronisation ignorée : aucun support sélectionné.");
    return false;
  }

  try {
    // Extraction propre des champs modifiés de l'interface
    const volReelTexte = document.getElementById("vol_modifie") ? document.getElementById("vol_modifie").innerText : "0";
    const volReelNum = parseFloat(volReelTexte.replace("m³", "").trim()) || 0;
    
    const arSaisie = document.getElementById("AR") ? document.getElementById("AR").value : null;
    const encSaisie = document.getElementById("Enc") ? document.getElementById("Enc").value : null;
    const bFouille = document.getElementById("B_Fouille") ? document.getElementById("B_Fouille").value : null;
    const hFouille = document.getElementById("H_Fouille") ? document.getElementById("H_Fouille").value : null;

    // Requête de mise à jour Supabase
    const { error } = await supabaseClient
      .from('blindage')
      .update({
        vol_reel: volReelNum,
        ar: arSaisie ? parseFloat(arSaisie) : null,
        enc: encSaisie ? parseFloat(encSaisie) : null,
        b: bFouille ? parseFloat(bFouille) : null,
        h: hFouille ? parseFloat(hFouille) : null,
        effectue: 1 // Marque automatiquement comme fait
      })
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput);

    if (error) throw error;
    
    console.log(`✅ Support ${numSupportInput} (${nomChantier}) mis à jour dans Supabase.`);
    return true;

  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err.message);
    alert("⚠️ Avertissement : Le support n'a pas pu être mis à jour dans la base de données, mais le PDF va se générer.");
    return false;
  }
}
