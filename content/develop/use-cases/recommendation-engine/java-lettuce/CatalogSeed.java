import java.util.ArrayList;
import java.util.List;

/**
 * The hand-written demo product catalog. {@link BuildCatalog} runs the
 * embedding model over each product's {@code name + description} text
 * and writes the result to {@code catalog.json}.
 *
 * <p>The fields here are the ones the Redis Search index expects (see
 * {@link Recommender}): every field is either a TAG (exact-match
 * filter), NUMERIC (range filter), TEXT (full-text), or the vector
 * that gets written separately as a binary blob.</p>
 */
public final class CatalogSeed {

    private CatalogSeed() {}

    /** One row of the demo catalog. */
    public static final class Seed {
        public final String id;
        public final String name;
        public final String description;
        public final String category;
        public final String brand;
        public final double price;
        public final boolean inStock;
        public final double rating;

        Seed(String id, String name, String description, String category,
             String brand, double price, boolean inStock, double rating) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.category = category;
            this.brand = brand;
            this.price = price;
            this.inStock = inStock;
            this.rating = rating;
        }
    }

    /** Build the string that gets embedded for each product. */
    public static String embedTextFor(Seed seed) {
        return seed.name + ". " + seed.description;
    }

    public static List<Seed> all() {
        List<Seed> out = new ArrayList<>();
        // --- Outerwear ---------------------------------------------
        out.add(new Seed("p001", "Alpine down parka",
                "Heavyweight 800-fill goose down parka with storm hood, snow skirt, and four cargo pockets. Rated for sub-zero alpine touring.",
                "outerwear", "northpeak", 289.00, true, 4.7));
        out.add(new Seed("p002", "Featherline puffer jacket",
                "Packable synthetic-fill puffer jacket. Water-repellent shell, baffle construction, stuffs into its own pocket.",
                "outerwear", "northpeak", 119.00, true, 4.4));
        out.add(new Seed("p003", "Cascade rain shell",
                "Three-layer waterproof breathable rain jacket with taped seams, helmet-compatible hood, and pit zips.",
                "outerwear", "stormgear", 179.00, true, 4.5));
        out.add(new Seed("p004", "Hearthside wool overcoat",
                "Tailored 70% wool overcoat in charcoal, single-breasted with notch lapels. Mid-thigh length for commuting.",
                "outerwear", "atelier", 245.00, false, 4.2));
        out.add(new Seed("p005", "Trailhead softshell",
                "Stretch softshell jacket with brushed-back fleece lining for cool-weather hiking and trail running.",
                "outerwear", "stormgear", 99.00, true, 4.3));
        out.add(new Seed("p006", "Drifter denim trucker",
                "Classic denim trucker jacket in indigo selvedge with copper rivets and pearl snaps.",
                "outerwear", "drifter", 89.00, true, 4.1));
        out.add(new Seed("p007", "Featherline vest",
                "Lightweight sleeveless puffer vest for layering. Same baffle build as the jacket without the sleeves.",
                "outerwear", "northpeak", 79.00, true, 4.0));

        // --- Footwear ----------------------------------------------
        out.add(new Seed("p010", "Summit hiking boot",
                "Mid-cut waterproof hiking boot with Vibram outsole, gusseted tongue, and full-grain leather upper.",
                "footwear", "summit", 189.00, true, 4.6));
        out.add(new Seed("p011", "Switchback trail runner",
                "Lightweight trail running shoe with rock plate, aggressive lug pattern, and quick-dry mesh upper.",
                "footwear", "summit", 139.00, true, 4.5));
        out.add(new Seed("p012", "Plaza city sneaker",
                "Minimalist leather sneaker on a cup sole. Unlined for warm-weather everyday wear.",
                "footwear", "atelier", 119.00, true, 4.2));
        out.add(new Seed("p013", "Riverbed sandal",
                "Quick-dry sport sandal with cushioned EVA midsole and adjustable webbing straps for water hiking.",
                "footwear", "summit", 65.00, true, 4.3));
        out.add(new Seed("p014", "Drifter chukka",
                "Suede chukka boot on a crepe sole. Two-eyelet lacing, unstructured toe, soft for daily wear.",
                "footwear", "drifter", 145.00, false, 4.4));
        out.add(new Seed("p015", "Glacier insulated snow boot",
                "Knee-high insulated winter boot with removable felt liner and ice-grip outsole. Rated to -30 C.",
                "footwear", "northpeak", 199.00, true, 4.6));

        // --- Tops --------------------------------------------------
        out.add(new Seed("p020", "Heritage flannel shirt",
                "Brushed cotton flannel shirt in red plaid. Curved hem, two chest pockets, soft on the skin.",
                "tops", "drifter", 59.00, true, 4.4));
        out.add(new Seed("p021", "Merino base layer crew",
                "200 gsm merino wool long-sleeve base layer. Flat-lock seams, naturally odour-resistant.",
                "tops", "summit", 79.00, true, 4.7));
        out.add(new Seed("p022", "Studio cashmere sweater",
                "Two-ply cashmere crewneck sweater in oatmeal. Ribbed hem and cuffs, slim through the body.",
                "tops", "atelier", 215.00, true, 4.5));
        out.add(new Seed("p023", "Daybreak organic tee",
                "Heavy-weight 240 gsm organic cotton t-shirt with reinforced collar and side seams.",
                "tops", "drifter", 32.00, true, 4.0));
        out.add(new Seed("p024", "Trailhead grid fleece",
                "Grid-pattern fleece pullover with chest pocket and thumb loops. Layers under a shell.",
                "tops", "stormgear", 85.00, true, 4.4));
        out.add(new Seed("p025", "Switchback technical tee",
                "Recycled-polyester running tee with mesh side panels and a reflective logo for low-light visibility.",
                "tops", "summit", 45.00, true, 4.1));
        out.add(new Seed("p026", "Heritage wool henley",
                "Mid-weight merino henley with a three-button placket. Mid-grey marl, ribbed cuffs.",
                "tops", "drifter", 75.00, false, 4.3));

        // --- Bottoms -----------------------------------------------
        out.add(new Seed("p030", "Workhorse straight jean",
                "14 oz selvedge denim in a straight cut. Rigid out of the box, breaks in with wear.",
                "bottoms", "drifter", 135.00, true, 4.5));
        out.add(new Seed("p031", "Cascade hiking pant",
                "Stretch nylon hiking pant with articulated knees, water-repellent finish, and zipped thigh pocket.",
                "bottoms", "stormgear", 95.00, true, 4.4));
        out.add(new Seed("p032", "Studio merino trouser",
                "Tailored wool-blend trouser with a slight stretch. Hidden side adjusters, no-break hem.",
                "bottoms", "atelier", 175.00, true, 4.2));
        out.add(new Seed("p033", "Trailhead jogger",
                "Mid-weight French terry jogger with elastic cuffs and zipped side pockets.",
                "bottoms", "stormgear", 69.00, true, 4.1));
        out.add(new Seed("p034", "Switchback running short",
                "Five-inch running short with built-in liner, two side pockets, and a zipped back pocket.",
                "bottoms", "summit", 49.00, true, 4.3));

        // --- Accessories -------------------------------------------
        out.add(new Seed("p040", "Summit merino beanie",
                "Double-layer merino beanie. Fold-up cuff, naturally odour-resistant, packs flat.",
                "accessories", "summit", 29.00, true, 4.5));
        out.add(new Seed("p041", "Cascade waterproof cap",
                "Waterproof breathable cap with a stiff brim and rear cinch. Pairs with the Cascade rain shell.",
                "accessories", "stormgear", 35.00, true, 4.2));
        out.add(new Seed("p042", "Hearthside cashmere scarf",
                "Long two-ply cashmere scarf in herringbone weave. Generous drape, fringed ends.",
                "accessories", "atelier", 145.00, true, 4.6));
        out.add(new Seed("p043", "Workhorse leather belt",
                "Full-grain bridle leather belt with a solid brass single-prong buckle. Sized in half-inches.",
                "accessories", "drifter", 89.00, true, 4.5));
        out.add(new Seed("p044", "Glacier insulated mitten",
                "Goretex shell over Primaloft insulation with a leather palm and removable wool liner.",
                "accessories", "northpeak", 95.00, true, 4.4));
        out.add(new Seed("p045", "Trailhead trucker cap",
                "Five-panel mesh-back trucker cap with a curved brim and embroidered patch.",
                "accessories", "stormgear", 28.00, false, 4.0));

        // --- Bags --------------------------------------------------
        out.add(new Seed("p050", "Summit alpine pack 35",
                "35-litre alpine climbing pack with rope strap, removable hipbelt, and dual ice-tool loops.",
                "bags", "summit", 169.00, true, 4.5));
        out.add(new Seed("p051", "Cascade daypack 22",
                "22-litre daypack with a hydration sleeve, padded laptop pocket, and ventilated mesh back panel.",
                "bags", "stormgear", 89.00, true, 4.3));
        out.add(new Seed("p052", "Studio leather briefcase",
                "Full-grain leather briefcase with a padded 15-inch laptop sleeve, two main compartments, and brass hardware.",
                "bags", "atelier", 295.00, true, 4.6));
        out.add(new Seed("p053", "Workhorse canvas tote",
                "20 oz waxed canvas tote with leather handles and brass rivets. Develops a patina with use.",
                "bags", "drifter", 75.00, true, 4.2));
        out.add(new Seed("p054", "Glacier expedition duffel",
                "90-litre haul duffel in burly TPU-coated fabric with lockable zippers and removable backpack straps.",
                "bags", "northpeak", 159.00, true, 4.5));
        out.add(new Seed("p055", "Switchback running vest",
                "10-litre running vest with soft flask pockets in the chest and a stretch back pocket for shells.",
                "bags", "summit", 129.00, true, 4.4));
        return out;
    }
}
