/* ============================================================
   IDENTITÉ RÉDACTEUR & GESTION DES ACCÈS SUPABASE (table app_bob)
   ============================================================ */

const CLE_IDENTITE = "fbm_identite_redacteur";

function chargerIdentite() {
  try {
    const brut = localStorage.getItem(CLE_IDENTITE);
    return brut ? JSON.parse(brut) : null;
  } catch (e) {
    return null;
  }
}

function appliquerIdentite(identite) {
  const champNom = document.getElementById("nomRedacteur");
  const champEmail = document.getElementById("emailRedacteur");
  
  if (champNom && identite.nom) {
    const prenomNom = `${identite.prenom || ""} ${identite.nom}`.trim();
    champNom.value = prenomNom.toUpperCase();
  }
  if (champEmail && identite.email) {
    champEmail.value = identite.email;
  }
}

/**
 * Interroge Supabase pour vérifier l'accès FBM et le statut Admin
 */
async function verifierAccesSupabase(email) {
  if (!email) return { acces: false, admin: false };
  try {
    const { data, error } = await supabaseClient
      .from('app_bob')
      .select('fbm, admin')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    
    if (!data || data.fbm !== true) {
      return { acces: false, admin: false };
    }

    return { acces: true, admin: data.admin === true };
  } catch (err) {
    console.error("Erreur vérification accès Supabase :", err.message);
    return { acces: false, admin: false };
  }
}

function gererAffichageAdmin(estAdmin) {
  const tabAdmin = document.getElementById("tabAdmin");
  if (tabAdmin) {
    tabAdmin.style.display = estAdmin ? "inline-block" : "none";
  }
}

/**
 * 📨 Envoie une demande d'accès (crée la ligne dans Supabase si absente)
 */
async function envoyerDemandeAcces() {
  const prenom = document.getElementById("req-prenom").value.trim();
  const nom = document.getElementById("req-nom").value.trim().toUpperCase();
  const email = document.getElementById("req-email").value.trim().toLowerCase();

  if (!prenom || !nom || !email) {
    alert("⚠️ Veuillez remplir tous les champs.");
    return;
  }

  try {
    // Vérifie si l'utilisateur existe déjà
    const { data, error } = await supabaseClient
      .from('app_bob')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Insertion d'une nouvelle demande (fbm à false par défaut)
      const { error: insertErr } = await supabaseClient
        .from('app_bob')
        .insert([{ email: email, prenom: prenom, nom: nom, fbm: false, admin: false }]);
      
      if (insertErr) throw insertErr;
    }

    // Sauvegarde locale de l'email pour le suivi en attente
    localStorage.setItem(CLE_IDENTITE, JSON.stringify({ prenom, nom, email }));

    // Bascule l'affichage sur l'écran d'attente
    document.getElementById("form-demande").style.display = "none";
    document.getElementById("attente-validation").style.display = "block";
    document.getElementById("auth-message").textContent = "Demande enregistrée avec succès.";

  } catch (err) {
    console.error("Erreur lors de la demande d'accès :", err);
    alert("❌ Une erreur est survenue lors de l'envoi de la demande.");
  }
}

/**
 * 🔄 Vérifie si l'administrateur a validé l'accès entre-temps
 */
async function verifierAccesDemandé() {
  const identite = chargerIdentite();
  if (!identite || !identite.email) return;

  const resultat = await verifierAccesSupabase(identite.email);
  if (resultat.acces) {
    document.getElementById("auth-overlay").style.display = "none";
    gererAffichageAdmin(resultat.admin);
    window.location.reload();
  } else {
    alert("⏳ Votre accès n'a pas encore été validé par l'administrateur.");
  }
}

async function initIdentite() {
  const identite = chargerIdentite();
  const overlay = document.getElementById("auth-overlay");

  if (identite && identite.email) {
    const resultat = await verifierAccesSupabase(identite.email);

    if (resultat.acces) {
      overlay.style.display = "none";
      appliquerIdentite(identite);
      gererAffichageAdmin(resultat.admin);
    } else {
      // Déjà demandé mais pas encore validé
      overlay.style.display = "flex";
      document.getElementById("form-demande").style.display = "none";
      document.getElementById("attente-validation").style.display = "block";
      document.getElementById("auth-message").textContent = `Bonjour ${identite.prenom || ""}, votre compte est en attente.`;
    }
  } else {
    // 1er lancement : Affichage de la modale de demande
    overlay.style.display = "flex";
    document.getElementById("form-demande").style.display = "block";
    document.getElementById("attente-validation").style.display = "none";
  }
}

window.addEventListener("load", initIdentite);
