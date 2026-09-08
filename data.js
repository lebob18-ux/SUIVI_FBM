// Configuration Supabase
const SUPABASE_URL = "https://thbqkeugjvsxbryfnzuo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2-Ij-nrTPeK6rB-kSD-QTg_b42zNakq";

// Initialisation du client Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Déclaration de la variable globale qu'utilisent tes autres scripts
let baseSupports = [];

// Fonction asynchrone pour charger les données depuis Supabase
async function chargerSupportsDepuisSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('blindage')
            .select('*');

        if (error) throw error;

        baseSupports = data;
        console.log(`${baseSupports.length} supports chargés depuis Supabase.`);

        // 🟢 C'est ici qu'on déclenche l'affichage des chantiers
        if (typeof initChantiers === 'function') {
            initChantiers();
        }

        if (typeof rafraichirInterface === 'function') {
            rafraichirInterface();
        }

    } catch (error) {
        console.error("Erreur lors du chargement :", error.message);
    }
}

// Lancement automatique au chargement du script
chargerSupportsDepuisSupabase();
