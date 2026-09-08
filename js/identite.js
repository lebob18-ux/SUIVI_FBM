/* ============================================================
   IDENTITÉ RÉDACTEUR (prénom, nom + email) — popup au 1er lancement,
   sauvegardée durablement, vérification d'accès sur Supabase
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
 * 🟢 Interroge Supabase pour vérifier si l'email a l'accès dans 'app_bob'
 */
async function verifierAccesSupabase(email) {
  if (!email) return false;
  try {
    const { data, error } = await supabaseClient
      .from('app_bob')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return !!data; // Retourne true si l'email existe dans la table, false sinon
  } catch (err) {
    console.error("Erreur vérification accès Supabase :", err.message);
    return false;
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

  // Vérification de l'accès sur Supabase avant d'enregistrer
  const aAcces = await verifierAccesSupabase(email);
  if (!aAcces) {
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
  document.getElementById("divIdentiteModal").style.display = "none";
  
  // Rechargement propre pour appliquer les droits
  window.location.reload();
}

async function initIdentite() {
  const identite = chargerIdentite();

  if (identite && identite.email) {
    // Vérification de sécurité à chaque lancement
    const aAcces = await verifierAccesSupabase(identite.email);

    if (aAcces) {
      appliquerIdentite(identite);
    } else {
      // Si l'accès a été révoqué entre-temps
      localStorage.removeItem(CLE_IDENTITE);
      alert("⚠️ Vos droits d'accès ont changé ou ont été révoqués.");
      document.getElementById("divIdentiteModal").style.display = "flex";
    }
  } else {
    // Premier lancement : affichage de la modale
    document.getElementById("divIdentiteModal").style.display = "flex";
  }
}

window.addEventListener("load", initIdentite);
