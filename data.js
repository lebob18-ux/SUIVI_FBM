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

        // 🟢 Mapping complet : on traduit les colonnes de Supabase vers les clés de ton appli
        baseSupports = data.map(row => ({
            id: row.id,
            chantier: row.chantier,
            support: row.support,
            I: row.i,
            AF: row.af,
            B: row.b,
            H: row.h,
            AR: row.arasement,
            Enc: row.encaissement,
            ECH: row.echantillon,
            BLIND: row.blind,
            CARO: row.caro,
            TYPE: row.type,
            F: row.f,
            P: row.p,
            SUP: row.sup,
            EFFECTUE: row.effectue,
            m3_prevu: row.vol_theorique,
            m3_reel: row.vol_reel,
            EE: row.ee,
            date: row.date_exec,
            CPT: row.n_rj
        }));

        console.log(`${baseSupports.length} supports chargés et mappés depuis Supabase.`);

        // On lance l'initialisation des chantiers
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
