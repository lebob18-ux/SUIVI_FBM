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
 * 🟢 Interroge Supabase pour vérifier l'accès FBM et le statut Admin
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
    
    // Si aucune ligne trouvée ou si l'accès 'fbm' n'est pas actif
    if (!data || data.fbm !== true) {
      return { acces: false, admin: false };
    }

    // Retourne l'accès validé et l'état admin (vrai ou faux)
    return { acces: true, admin: data.admin === true };
  } catch (err) {
    console.error("Erreur vérification accès Supabase :", err.message);
    return { acces: false, admin: false };
  }
}

/**
 * Gère l'affichage de l'onglet Admin selon les droits
 */
function gererAffichageAdmin(estAdmin) {
  const tabAdmin = document.getElementById("tabAdmin");
  if (tabAdmin) {
    tabAdmin.style.display = estAdmin ? "inline-block" : "none";
  }
}

async function validerIdentitePopup() {
  const prenom = document.getElementById("identitePrenomInput").value.trim();
  const nom = document.getElementById("identiteNomInput").value.trim().toUpperCase();
  const email = document.getElementById("identiteEmailInput").value.trim().toLowerCase();

  if (nom === "" || email === "") {
    alert("⚠️ Le nom et l'email sont obligatoires.");
    return;
  }

  // 1. Vérification de l'accès sur Supabase
  const resultat = await verifierAccesSupabase(email);
  if (!resultat.acces) {
    alert("❌ Accès refusé : Cet email n'est pas autorisé sur cette application.");
    return;
  }

  const identite = { prenom: prenom, nom: nom, email: email };
  try {
    localStorage.setItem(CLE_IDENTITE, JSON.stringify(identite));
  } catch (e) {
    console.error("Erreur sauvegarde identité :", e);
  }

  appliquerIdentite(identite);
  gererAffichageAdmin(resultat.admin);
  
  document.getElementById("divIdentiteModal").style.display = "none";
  window.location.reload();
}

async function initIdentite() {
  const identite = chargerIdentite();

  if (identite && identite.email) {
    // Vérification de sécurité à chaque lancement
    const resultat = await verifierAccesSupabase(identite.email);

    if (resultat.acces) {
      appliquerIdentite(identite);
      gererAffichageAdmin(resultat.admin);
    } else {
      localStorage.removeItem(CLE_IDENTITE);
      alert("⚠️ Vos droits d'accès ont changé ou ont été révoqués.");
      document.getElementById("divIdentiteModal").style.display = "flex";
    }
  } else {
    // 1er lancement : Affichage de la modale
    document.getElementById("divIdentiteModal").style.display = "flex";
  }
}

window.addEventListener("load", initIdentite);
