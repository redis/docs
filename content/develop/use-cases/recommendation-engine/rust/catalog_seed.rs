//! The hand-written demo product catalog. `build_catalog` (see
//! `build_catalog.rs`) runs the embedding model over each product's
//! `name + description` and writes the result to `catalog.json`.
//!
//! The fields here are the ones the Redis Search index expects (see
//! `recommender.rs`): every field is either a TAG (exact-match filter),
//! NUMERIC (range filter), TEXT (full-text), or the vector that gets
//! written separately as a binary blob.

// Each binary uses a different subset of these helpers; allow the dead
// code rather than feature-gating it per binary.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

/// One row of the demo catalog. Serialised to JSON for `catalog.json`
/// with snake_case field names so the file format is shared across the
/// Python, Node.js, Go, and Rust ports.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub brand: String,
    pub price: f64,
    pub in_stock: bool,
    pub rating: f64,
    /// Populated by the catalog builder after running the model; carries
    /// the float32 bytes of the embedding vector base64-encoded so the
    /// JSON file stays compact and the loader can hand the raw bytes
    /// straight to HSET without re-converting them.
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub embedding_b64: String,
}

/// The on-disk shape of `catalog.json`. Matches the Python / Node /
/// Go ports byte-for-byte.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogFile {
    pub model: String,
    pub dim: usize,
    pub products: Vec<Product>,
}

/// Return the string we actually embed for each product:
/// `<name>. <description>`. Concatenating the two gives the model both
/// a short label and a longer descriptive context, which produces a
/// more discriminating vector than embedding the name alone.
pub fn embed_text_for(p: &Product) -> String {
    format!("{}. {}", p.name, p.description)
}

/// Build the 37-item demo catalog used to seed Redis.
pub fn catalog_seed() -> Vec<Product> {
    let raw: &[(&str, &str, &str, &str, &str, f64, bool, f64)] = &[
        // --- Outerwear ----------------------------------------------------
        ("p001", "Alpine down parka",
         "Heavyweight 800-fill goose down parka with storm hood, snow skirt, and four cargo pockets. Rated for sub-zero alpine touring.",
         "outerwear", "northpeak", 289.00, true, 4.7),
        ("p002", "Featherline puffer jacket",
         "Packable synthetic-fill puffer jacket. Water-repellent shell, baffle construction, stuffs into its own pocket.",
         "outerwear", "northpeak", 119.00, true, 4.4),
        ("p003", "Cascade rain shell",
         "Three-layer waterproof breathable rain jacket with taped seams, helmet-compatible hood, and pit zips.",
         "outerwear", "stormgear", 179.00, true, 4.5),
        ("p004", "Hearthside wool overcoat",
         "Tailored 70% wool overcoat in charcoal, single-breasted with notch lapels. Mid-thigh length for commuting.",
         "outerwear", "atelier", 245.00, false, 4.2),
        ("p005", "Trailhead softshell",
         "Stretch softshell jacket with brushed-back fleece lining for cool-weather hiking and trail running.",
         "outerwear", "stormgear", 99.00, true, 4.3),
        ("p006", "Drifter denim trucker",
         "Classic denim trucker jacket in indigo selvedge with copper rivets and pearl snaps.",
         "outerwear", "drifter", 89.00, true, 4.1),
        ("p007", "Featherline vest",
         "Lightweight sleeveless puffer vest for layering. Same baffle build as the jacket without the sleeves.",
         "outerwear", "northpeak", 79.00, true, 4.0),

        // --- Footwear -----------------------------------------------------
        ("p010", "Summit hiking boot",
         "Mid-cut waterproof hiking boot with Vibram outsole, gusseted tongue, and full-grain leather upper.",
         "footwear", "summit", 189.00, true, 4.6),
        ("p011", "Switchback trail runner",
         "Lightweight trail running shoe with rock plate, aggressive lug pattern, and quick-dry mesh upper.",
         "footwear", "summit", 139.00, true, 4.5),
        ("p012", "Plaza city sneaker",
         "Minimalist leather sneaker on a cup sole. Unlined for warm-weather everyday wear.",
         "footwear", "atelier", 119.00, true, 4.2),
        ("p013", "Riverbed sandal",
         "Quick-dry sport sandal with cushioned EVA midsole and adjustable webbing straps for water hiking.",
         "footwear", "summit", 65.00, true, 4.3),
        ("p014", "Drifter chukka",
         "Suede chukka boot on a crepe sole. Two-eyelet lacing, unstructured toe, soft for daily wear.",
         "footwear", "drifter", 145.00, false, 4.4),
        ("p015", "Glacier insulated snow boot",
         "Knee-high insulated winter boot with removable felt liner and ice-grip outsole. Rated to -30 C.",
         "footwear", "northpeak", 199.00, true, 4.6),

        // --- Tops ---------------------------------------------------------
        ("p020", "Heritage flannel shirt",
         "Brushed cotton flannel shirt in red plaid. Curved hem, two chest pockets, soft on the skin.",
         "tops", "drifter", 59.00, true, 4.4),
        ("p021", "Merino base layer crew",
         "200 gsm merino wool long-sleeve base layer. Flat-lock seams, naturally odour-resistant.",
         "tops", "summit", 79.00, true, 4.7),
        ("p022", "Studio cashmere sweater",
         "Two-ply cashmere crewneck sweater in oatmeal. Ribbed hem and cuffs, slim through the body.",
         "tops", "atelier", 215.00, true, 4.5),
        ("p023", "Daybreak organic tee",
         "Heavy-weight 240 gsm organic cotton t-shirt with reinforced collar and side seams.",
         "tops", "drifter", 32.00, true, 4.0),
        ("p024", "Trailhead grid fleece",
         "Grid-pattern fleece pullover with chest pocket and thumb loops. Layers under a shell.",
         "tops", "stormgear", 85.00, true, 4.4),
        ("p025", "Switchback technical tee",
         "Recycled-polyester running tee with mesh side panels and a reflective logo for low-light visibility.",
         "tops", "summit", 45.00, true, 4.1),
        ("p026", "Heritage wool henley",
         "Mid-weight merino henley with a three-button placket. Mid-grey marl, ribbed cuffs.",
         "tops", "drifter", 75.00, false, 4.3),

        // --- Bottoms ------------------------------------------------------
        ("p030", "Workhorse straight jean",
         "14 oz selvedge denim in a straight cut. Rigid out of the box, breaks in with wear.",
         "bottoms", "drifter", 135.00, true, 4.5),
        ("p031", "Cascade hiking pant",
         "Stretch nylon hiking pant with articulated knees, water-repellent finish, and zipped thigh pocket.",
         "bottoms", "stormgear", 95.00, true, 4.4),
        ("p032", "Studio merino trouser",
         "Tailored wool-blend trouser with a slight stretch. Hidden side adjusters, no-break hem.",
         "bottoms", "atelier", 175.00, true, 4.2),
        ("p033", "Trailhead jogger",
         "Mid-weight French terry jogger with elastic cuffs and zipped side pockets.",
         "bottoms", "stormgear", 69.00, true, 4.1),
        ("p034", "Switchback running short",
         "Five-inch running short with built-in liner, two side pockets, and a zipped back pocket.",
         "bottoms", "summit", 49.00, true, 4.3),

        // --- Accessories --------------------------------------------------
        ("p040", "Summit merino beanie",
         "Double-layer merino beanie. Fold-up cuff, naturally odour-resistant, packs flat.",
         "accessories", "summit", 29.00, true, 4.5),
        ("p041", "Cascade waterproof cap",
         "Waterproof breathable cap with a stiff brim and rear cinch. Pairs with the Cascade rain shell.",
         "accessories", "stormgear", 35.00, true, 4.2),
        ("p042", "Hearthside cashmere scarf",
         "Long two-ply cashmere scarf in herringbone weave. Generous drape, fringed ends.",
         "accessories", "atelier", 145.00, true, 4.6),
        ("p043", "Workhorse leather belt",
         "Full-grain bridle leather belt with a solid brass single-prong buckle. Sized in half-inches.",
         "accessories", "drifter", 89.00, true, 4.5),
        ("p044", "Glacier insulated mitten",
         "Goretex shell over Primaloft insulation with a leather palm and removable wool liner.",
         "accessories", "northpeak", 95.00, true, 4.4),
        ("p045", "Trailhead trucker cap",
         "Five-panel mesh-back trucker cap with a curved brim and embroidered patch.",
         "accessories", "stormgear", 28.00, false, 4.0),

        // --- Bags ---------------------------------------------------------
        ("p050", "Summit alpine pack 35",
         "35-litre alpine climbing pack with rope strap, removable hipbelt, and dual ice-tool loops.",
         "bags", "summit", 169.00, true, 4.5),
        ("p051", "Cascade daypack 22",
         "22-litre daypack with a hydration sleeve, padded laptop pocket, and ventilated mesh back panel.",
         "bags", "stormgear", 89.00, true, 4.3),
        ("p052", "Studio leather briefcase",
         "Full-grain leather briefcase with a padded 15-inch laptop sleeve, two main compartments, and brass hardware.",
         "bags", "atelier", 295.00, true, 4.6),
        ("p053", "Workhorse canvas tote",
         "20 oz waxed canvas tote with leather handles and brass rivets. Develops a patina with use.",
         "bags", "drifter", 75.00, true, 4.2),
        ("p054", "Glacier expedition duffel",
         "90-litre haul duffel in burly TPU-coated fabric with lockable zippers and removable backpack straps.",
         "bags", "northpeak", 159.00, true, 4.5),
        ("p055", "Switchback running vest",
         "10-litre running vest with soft flask pockets in the chest and a stretch back pocket for shells.",
         "bags", "summit", 129.00, true, 4.4),
    ];

    raw.iter()
        .map(|(id, name, desc, cat, brand, price, in_stock, rating)| Product {
            id: id.to_string(),
            name: name.to_string(),
            description: desc.to_string(),
            category: cat.to_string(),
            brand: brand.to_string(),
            price: *price,
            in_stock: *in_stock,
            rating: *rating,
            embedding_b64: String::new(),
        })
        .collect()
}
