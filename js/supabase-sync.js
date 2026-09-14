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

    // Récupération du statut blindage (boutons radio)
    const radioStatutSelectionne = document.querySelector('input[name="statut_blindage"]:checked');
    const statutBlindageVal = radioStatutSelectionne ? radioStatutSelectionne.value : null;

    // Récupération des quantités de Big-Bags (terre & mignonette)
    const terreReel = document.getElementById("nb_big_bag_terre")?.value;
    const mignonetteReel = document.getElementById("nb_big_bag_mignonette")?.value;

    // Récupération des états Hors P1 et des 3 étapes
    const horsP1Val = document.getElementById("check_hors_p1")?.checked || false;
    const etapeFouilleVal = document.getElementById("check_fouille")?.checked || false;
    const etapeBetonVal = document.getElementById("check_beton")?.checked || false;
    const etapeMatageVal = document.getElementById("check_matage")?.checked || false;

    // 🟢 Récupération des nouveaux champs saisis dans l'interface
    const saisieBl = document.getElementById("bl_beton")?.value.trim();
    const saisieTypeBeton = document.getElementById("type_beton")?.value.trim();
    const saisieSlump = document.getElementById("slump")?.value.trim();

    // 🟢 ÉTAPE INTERMÉDIAIRE : Récupérer les anciennes valeurs en base pour concaténer proprement
    const { data: ancienneData, error: errFetch } = await supabaseClient
      .from('blindage')
      .select('bl_beton, type_beton, slump')
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput)
      .maybeSingle();

    if (errFetch) console.warn("Impossible de récupérer l'historique pour concaténation :", errFetch.message);

    // Fonction utilitaire pour gérer l'ajout avec séparateur " / " sans dupliquer si c'est exactement la même valeur
    const fusionnerTexte = (ancien, nouveau) => {
      if (!nouveau) return ancien || null;
      const nouveauNettoye = nouveau.toUpperCase();
      if (!ancien) return nouveauNettoye;
      // Si la valeur exacte n'est pas déjà présente dans la chaîne, on l'ajoute
      const elements = ancien.split(" / ").map(e => e.trim());
      if (!elements.includes(nouveauNettoye)) {
        return ancien + " / " + nouveauNettoye;
      }
      return ancien;
    };

    const blFinal = fusionnerTexte(ancienneData?.bl_beton, saisieBl);
    const typeBetonFinal = fusionnerTexte(ancienneData?.type_beton, saisieTypeBeton);
    const slumpFinal = fusionnerTexte(ancienneData?.slump, saisieSlump);

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
        terre: terreReel !== "" ? parseInt(terreReel, 10) : 0,         
        mignonette: mignonetteReel !== "" ? parseInt(mignonetteReel, 10) : 0,  
        statut_blindage: statutBlindageVal,
        bl_beton: blFinal,
        type_beton: typeBetonFinal,
        slump: slumpFinal,
        hors_p1: horsP1Val,                     
        etape_fouille: etapeFouilleVal,         
        etape_beton: etapeBetonVal,             
        etape_matage: etapeMatageVal,           
        effectue: 1,  
        date_exec: dateJour 
      })
      .eq('chantier', nomChantier)
      .eq('support', numSupportInput);

    if (error) throw error;
    
    // Mettre à jour l'affichage local de l'input avec la valeur complète combinée
    if (document.getElementById("bl_beton") && blFinal) document.getElementById("bl_beton").value = blFinal;
    if (document.getElementById("type_beton") && typeBetonFinal) document.getElementById("type_beton").value = typeBetonFinal;
    if (document.getElementById("slump") && slumpFinal) document.getElementById("slump").value = slumpFinal;

    console.log(`✅ Support ${numSupportInput} (${nomChantier}) synchronisé avec succès dans Supabase.`);
    return true;

} catch (err) {
    console.error("❌ Erreur lors de la synchronisation Supabase :", err);
    alert("⚠️ Erreur Supabase : " + (err.message || JSON.stringify(err)));
    return false;
  }
}
