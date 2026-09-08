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
            .from('blindage') // <--- C'est ici qu'on met le nom de ta table !
            .select('*');

        if (error) throw error;

        // On assigne les données reçues à baseSupports
        baseSupports = data;
        console.log(`${baseSupports.length} supports chargés depuis Supabase.`);

        // Si ton application possède une fonction globale pour rafraîchir l'affichage, tu peux l'appeler ici
        if (typeof rafraichirInterface === 'function') {
            rafraichirInterface();
        }

    } catch (error) {
        console.error("Erreur lors du chargement des supports depuis Supabase :", error.message);
    }
}

// Lancement automatique au chargement du script
chargerSupportsDepuisSupabase();
