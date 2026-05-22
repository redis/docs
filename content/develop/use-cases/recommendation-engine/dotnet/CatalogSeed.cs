// The hand-written demo product catalog. ``BuildCatalog`` (see
// BuildCatalog.cs) runs the embedding model over each product's
// ``Name. Description`` and writes the result to ``catalog.json``.
//
// The fields here are the ones the Redis Search index expects (see
// Recommender.cs): every field is either a TAG (exact-match filter),
// NUMERIC (range filter), TEXT (full-text), or the vector that gets
// written separately as a binary blob.

namespace RecommendationDemo;

/// <summary>
/// One row of the demo catalog. Serialised to JSON for
/// <c>catalog.json</c> with snake_case property names so the file
/// format is shared across the Python, Node.js, Go, and .NET ports.
/// </summary>
public sealed class Product
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Brand { get; set; } = "";
    public double Price { get; set; }
    public bool InStock { get; set; }
    public double Rating { get; set; }
    /// <summary>
    /// Populated by <see cref="BuildCatalog"/> after running the
    /// model; carries the float32 bytes of the embedding vector
    /// base64-encoded so the JSON file stays compact and the loader
    /// can hand the raw bytes straight to HSET without re-converting.
    /// </summary>
    public string? EmbeddingB64 { get; set; }

    /// <summary>
    /// The string actually fed to the encoder for each product.
    /// Concatenating <c>Name</c> and <c>Description</c> gives the
    /// model both a short label and a longer descriptive context,
    /// which produces a more discriminating vector than the name
    /// alone.
    /// </summary>
    public string EmbedText() => Name + ". " + Description;
}

/// <summary>The 37-item demo catalog used to seed Redis.</summary>
public static class CatalogSeed
{
    public static readonly Product[] All = new[]
    {
        // --- Outerwear ----------------------------------------------------
        new Product { Id = "p001", Name = "Alpine down parka",
            Description = "Heavyweight 800-fill goose down parka with storm hood, snow skirt, and four cargo pockets. Rated for sub-zero alpine touring.",
            Category = "outerwear", Brand = "northpeak",
            Price = 289.00, InStock = true, Rating = 4.7 },
        new Product { Id = "p002", Name = "Featherline puffer jacket",
            Description = "Packable synthetic-fill puffer jacket. Water-repellent shell, baffle construction, stuffs into its own pocket.",
            Category = "outerwear", Brand = "northpeak",
            Price = 119.00, InStock = true, Rating = 4.4 },
        new Product { Id = "p003", Name = "Cascade rain shell",
            Description = "Three-layer waterproof breathable rain jacket with taped seams, helmet-compatible hood, and pit zips.",
            Category = "outerwear", Brand = "stormgear",
            Price = 179.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p004", Name = "Hearthside wool overcoat",
            Description = "Tailored 70% wool overcoat in charcoal, single-breasted with notch lapels. Mid-thigh length for commuting.",
            Category = "outerwear", Brand = "atelier",
            Price = 245.00, InStock = false, Rating = 4.2 },
        new Product { Id = "p005", Name = "Trailhead softshell",
            Description = "Stretch softshell jacket with brushed-back fleece lining for cool-weather hiking and trail running.",
            Category = "outerwear", Brand = "stormgear",
            Price = 99.00, InStock = true, Rating = 4.3 },
        new Product { Id = "p006", Name = "Drifter denim trucker",
            Description = "Classic denim trucker jacket in indigo selvedge with copper rivets and pearl snaps.",
            Category = "outerwear", Brand = "drifter",
            Price = 89.00, InStock = true, Rating = 4.1 },
        new Product { Id = "p007", Name = "Featherline vest",
            Description = "Lightweight sleeveless puffer vest for layering. Same baffle build as the jacket without the sleeves.",
            Category = "outerwear", Brand = "northpeak",
            Price = 79.00, InStock = true, Rating = 4.0 },

        // --- Footwear -----------------------------------------------------
        new Product { Id = "p010", Name = "Summit hiking boot",
            Description = "Mid-cut waterproof hiking boot with Vibram outsole, gusseted tongue, and full-grain leather upper.",
            Category = "footwear", Brand = "summit",
            Price = 189.00, InStock = true, Rating = 4.6 },
        new Product { Id = "p011", Name = "Switchback trail runner",
            Description = "Lightweight trail running shoe with rock plate, aggressive lug pattern, and quick-dry mesh upper.",
            Category = "footwear", Brand = "summit",
            Price = 139.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p012", Name = "Plaza city sneaker",
            Description = "Minimalist leather sneaker on a cup sole. Unlined for warm-weather everyday wear.",
            Category = "footwear", Brand = "atelier",
            Price = 119.00, InStock = true, Rating = 4.2 },
        new Product { Id = "p013", Name = "Riverbed sandal",
            Description = "Quick-dry sport sandal with cushioned EVA midsole and adjustable webbing straps for water hiking.",
            Category = "footwear", Brand = "summit",
            Price = 65.00, InStock = true, Rating = 4.3 },
        new Product { Id = "p014", Name = "Drifter chukka",
            Description = "Suede chukka boot on a crepe sole. Two-eyelet lacing, unstructured toe, soft for daily wear.",
            Category = "footwear", Brand = "drifter",
            Price = 145.00, InStock = false, Rating = 4.4 },
        new Product { Id = "p015", Name = "Glacier insulated snow boot",
            Description = "Knee-high insulated winter boot with removable felt liner and ice-grip outsole. Rated to -30 C.",
            Category = "footwear", Brand = "northpeak",
            Price = 199.00, InStock = true, Rating = 4.6 },

        // --- Tops ---------------------------------------------------------
        new Product { Id = "p020", Name = "Heritage flannel shirt",
            Description = "Brushed cotton flannel shirt in red plaid. Curved hem, two chest pockets, soft on the skin.",
            Category = "tops", Brand = "drifter",
            Price = 59.00, InStock = true, Rating = 4.4 },
        new Product { Id = "p021", Name = "Merino base layer crew",
            Description = "200 gsm merino wool long-sleeve base layer. Flat-lock seams, naturally odour-resistant.",
            Category = "tops", Brand = "summit",
            Price = 79.00, InStock = true, Rating = 4.7 },
        new Product { Id = "p022", Name = "Studio cashmere sweater",
            Description = "Two-ply cashmere crewneck sweater in oatmeal. Ribbed hem and cuffs, slim through the body.",
            Category = "tops", Brand = "atelier",
            Price = 215.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p023", Name = "Daybreak organic tee",
            Description = "Heavy-weight 240 gsm organic cotton t-shirt with reinforced collar and side seams.",
            Category = "tops", Brand = "drifter",
            Price = 32.00, InStock = true, Rating = 4.0 },
        new Product { Id = "p024", Name = "Trailhead grid fleece",
            Description = "Grid-pattern fleece pullover with chest pocket and thumb loops. Layers under a shell.",
            Category = "tops", Brand = "stormgear",
            Price = 85.00, InStock = true, Rating = 4.4 },
        new Product { Id = "p025", Name = "Switchback technical tee",
            Description = "Recycled-polyester running tee with mesh side panels and a reflective logo for low-light visibility.",
            Category = "tops", Brand = "summit",
            Price = 45.00, InStock = true, Rating = 4.1 },
        new Product { Id = "p026", Name = "Heritage wool henley",
            Description = "Mid-weight merino henley with a three-button placket. Mid-grey marl, ribbed cuffs.",
            Category = "tops", Brand = "drifter",
            Price = 75.00, InStock = false, Rating = 4.3 },

        // --- Bottoms ------------------------------------------------------
        new Product { Id = "p030", Name = "Workhorse straight jean",
            Description = "14 oz selvedge denim in a straight cut. Rigid out of the box, breaks in with wear.",
            Category = "bottoms", Brand = "drifter",
            Price = 135.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p031", Name = "Cascade hiking pant",
            Description = "Stretch nylon hiking pant with articulated knees, water-repellent finish, and zipped thigh pocket.",
            Category = "bottoms", Brand = "stormgear",
            Price = 95.00, InStock = true, Rating = 4.4 },
        new Product { Id = "p032", Name = "Studio merino trouser",
            Description = "Tailored wool-blend trouser with a slight stretch. Hidden side adjusters, no-break hem.",
            Category = "bottoms", Brand = "atelier",
            Price = 175.00, InStock = true, Rating = 4.2 },
        new Product { Id = "p033", Name = "Trailhead jogger",
            Description = "Mid-weight French terry jogger with elastic cuffs and zipped side pockets.",
            Category = "bottoms", Brand = "stormgear",
            Price = 69.00, InStock = true, Rating = 4.1 },
        new Product { Id = "p034", Name = "Switchback running short",
            Description = "Five-inch running short with built-in liner, two side pockets, and a zipped back pocket.",
            Category = "bottoms", Brand = "summit",
            Price = 49.00, InStock = true, Rating = 4.3 },

        // --- Accessories --------------------------------------------------
        new Product { Id = "p040", Name = "Summit merino beanie",
            Description = "Double-layer merino beanie. Fold-up cuff, naturally odour-resistant, packs flat.",
            Category = "accessories", Brand = "summit",
            Price = 29.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p041", Name = "Cascade waterproof cap",
            Description = "Waterproof breathable cap with a stiff brim and rear cinch. Pairs with the Cascade rain shell.",
            Category = "accessories", Brand = "stormgear",
            Price = 35.00, InStock = true, Rating = 4.2 },
        new Product { Id = "p042", Name = "Hearthside cashmere scarf",
            Description = "Long two-ply cashmere scarf in herringbone weave. Generous drape, fringed ends.",
            Category = "accessories", Brand = "atelier",
            Price = 145.00, InStock = true, Rating = 4.6 },
        new Product { Id = "p043", Name = "Workhorse leather belt",
            Description = "Full-grain bridle leather belt with a solid brass single-prong buckle. Sized in half-inches.",
            Category = "accessories", Brand = "drifter",
            Price = 89.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p044", Name = "Glacier insulated mitten",
            Description = "Goretex shell over Primaloft insulation with a leather palm and removable wool liner.",
            Category = "accessories", Brand = "northpeak",
            Price = 95.00, InStock = true, Rating = 4.4 },
        new Product { Id = "p045", Name = "Trailhead trucker cap",
            Description = "Five-panel mesh-back trucker cap with a curved brim and embroidered patch.",
            Category = "accessories", Brand = "stormgear",
            Price = 28.00, InStock = false, Rating = 4.0 },

        // --- Bags ---------------------------------------------------------
        new Product { Id = "p050", Name = "Summit alpine pack 35",
            Description = "35-litre alpine climbing pack with rope strap, removable hipbelt, and dual ice-tool loops.",
            Category = "bags", Brand = "summit",
            Price = 169.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p051", Name = "Cascade daypack 22",
            Description = "22-litre daypack with a hydration sleeve, padded laptop pocket, and ventilated mesh back panel.",
            Category = "bags", Brand = "stormgear",
            Price = 89.00, InStock = true, Rating = 4.3 },
        new Product { Id = "p052", Name = "Studio leather briefcase",
            Description = "Full-grain leather briefcase with a padded 15-inch laptop sleeve, two main compartments, and brass hardware.",
            Category = "bags", Brand = "atelier",
            Price = 295.00, InStock = true, Rating = 4.6 },
        new Product { Id = "p053", Name = "Workhorse canvas tote",
            Description = "20 oz waxed canvas tote with leather handles and brass rivets. Develops a patina with use.",
            Category = "bags", Brand = "drifter",
            Price = 75.00, InStock = true, Rating = 4.2 },
        new Product { Id = "p054", Name = "Glacier expedition duffel",
            Description = "90-litre haul duffel in burly TPU-coated fabric with lockable zippers and removable backpack straps.",
            Category = "bags", Brand = "northpeak",
            Price = 159.00, InStock = true, Rating = 4.5 },
        new Product { Id = "p055", Name = "Switchback running vest",
            Description = "10-litre running vest with soft flask pockets in the chest and a stretch back pocket for shells.",
            Category = "bags", Brand = "summit",
            Price = 129.00, InStock = true, Rating = 4.4 },
    };
}
