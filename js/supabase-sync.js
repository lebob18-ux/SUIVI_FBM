/**
 * Envoie les valeurs réelles de l'interface vers la table Supabase 'blindage'
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
    // 1. Récupération et formatage des volumes
    const volReelTexte = document.getElementById("vol_modifie") ? document.getElementById("vol_modifie").innerText : "0";
    const volReelNum = parseFloat(volReelTexte.replace("m³", "").trim()) || 0;

    // 2. Gestion spécifique de l'échantillon (saisie libre ou select)
    let echValeur = null;
    const selEch = document.getElementById("E_select");
    if (selEch && selEch.style.display !== "none") {
      const opt = selEch.options[selEch.selectedIndex];
      echValeur = opt ? opt.text : selEch.value;
    } else {
      const inputE = document.getElementById("E");
      echValeur = inputE ? inputE.value : null;
    }

    // 3. Gestion dynamique du paramètre P (Amont / Aval)
    const blocNVisible = document.getElementById("bloc-N") && document.getElementById("bloc-N").style.display !== "none";
    const pSaisi = blocNVisible ? document.getElementById("valP_N")?.value : document.getElementById("valP_S")?.value;

    // 4. Date actuelle au format YYYY-MM-DD
    const dateJour = new Date().toISOString().slice(0, 10);

    // 5. Récupération sécurisée de tous les champs "réels" de l'interface
    const iReel = document.getElementById("I")?.value;
    const arReel = document.getElementById("AR")?.value;
    const encReel = document.getElementById("Enc")?.value;
    const aReel = document.getElementById("AF")?.value;
    const bReel = document.getElementById("B_Fouille")?.value;
    const hReel = document.getElementById("H_Fouille")?.value;
    const fReel = document.getElementById("valF")?.value;
    const supReel = document.getElementById("valSUP")?.value;

    // 6. Requête de mise à jour vers Supabase
    const { error } = await supabaseClient
      .from('blindage')
      .update({
        i_reel: iReel ? parseFloat(iReel) : null,
        ech_reel: echValeur ? String(echValeur).trim() : null,
        ar_reel: arReel ? parseFloat(arReel) : null,
        enc_reel: encReel ? parseFloat(encReel) : null,
        a_reel: aReel ? parseFloat(aReel) : null,
        b_reel: bReel ? parseFloat(bReel) : null,
        h_reel: hReel ? parseFloat(hReel) : null,
        f_reel: fReel ? parseFloat(fReel) : null,
        p_reel: pSaisi ? parseFloat(pSaisi) : null,
        sup_reel: supReel ? parseFloat(supReel) : null,
        m3_reel: volReelNum,
        effectue: 1, // Marqué comme effectué lors de la génération/synchro
        date_exec: dateJour // Date de réalisation
      })
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput);

    if (error) throw error;
    
    console.log(`✅ Support ${numSupportInput} (${nomChantier}) synchronisé avec succès dans Supabase.`);
    return true;

  } catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err.message);
    alert("⚠️ Avertissement : Les données réelles n'ont pas pu être enregistrées dans Supabase, mais le PDF va quand même se générer.");
    return false;
  }
}
