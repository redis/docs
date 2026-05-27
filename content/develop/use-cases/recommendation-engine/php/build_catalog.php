<?php
/**
 * Build the demo product catalog: define products, embed them, write JSON.
 *
 * Run this script once before starting the demo server (or any time you
 * want to regenerate the catalog or swap the embedding model):
 *
 *     php build_catalog.php
 *
 * It does three things:
 *
 * 1. Defines a small product catalog inline so you can read and modify it.
 * 2. Runs the ``Xenova/all-MiniLM-L6-v2`` ONNX model from ``Embedder.php``
 *    over the ``name + description`` text of each product to produce a
 *    384-dimensional vector.
 * 3. Writes the result to ``catalog.json`` next to this script.
 *
 * The demo server reads ``catalog.json`` at startup so it can seed Redis
 * quickly without re-running the embedding model on every boot. Embeddings
 * are stored as base64-encoded float32 bytes so the file stays compact
 * and loads without any extra parsing on the demo's side.
 *
 * In production the equivalent of this script lives in an offline
 * pipeline: embed once on item-catalog updates, write into Redis with
 * ``HSET``, and let the serving tier query without ever loading a model.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/Embedder.php';

use Redis\RecommendationEngine\Embedder;

/**
 * Small hand-written catalog. The fields here are the ones the Redis
 * Search index expects (see Recommender.php): every field is either a
 * TAG (exact-match filter), NUMERIC (range filter), TEXT (full-text),
 * or the vector that gets written separately as a binary blob.
 *
 * Shared verbatim across the Python / Node.js / Go / PHP ports so the
 * demo behaves identically regardless of the language driving it.
 */
const CATALOG = [
    // --- Outerwear --------------------------------------------------
    ['id' => 'p001', 'name' => 'Alpine down parka',
     'description' => 'Heavyweight 800-fill goose down parka with storm hood, snow skirt, and four cargo pockets. Rated for sub-zero alpine touring.',
     'category' => 'outerwear', 'brand' => 'northpeak',
     'price' => 289.00, 'in_stock' => true, 'rating' => 4.7],
    ['id' => 'p002', 'name' => 'Featherline puffer jacket',
     'description' => 'Packable synthetic-fill puffer jacket. Water-repellent shell, baffle construction, stuffs into its own pocket.',
     'category' => 'outerwear', 'brand' => 'northpeak',
     'price' => 119.00, 'in_stock' => true, 'rating' => 4.4],
    ['id' => 'p003', 'name' => 'Cascade rain shell',
     'description' => 'Three-layer waterproof breathable rain jacket with taped seams, helmet-compatible hood, and pit zips.',
     'category' => 'outerwear', 'brand' => 'stormgear',
     'price' => 179.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p004', 'name' => 'Hearthside wool overcoat',
     'description' => 'Tailored 70% wool overcoat in charcoal, single-breasted with notch lapels. Mid-thigh length for commuting.',
     'category' => 'outerwear', 'brand' => 'atelier',
     'price' => 245.00, 'in_stock' => false, 'rating' => 4.2],
    ['id' => 'p005', 'name' => 'Trailhead softshell',
     'description' => 'Stretch softshell jacket with brushed-back fleece lining for cool-weather hiking and trail running.',
     'category' => 'outerwear', 'brand' => 'stormgear',
     'price' => 99.00, 'in_stock' => true, 'rating' => 4.3],
    ['id' => 'p006', 'name' => 'Drifter denim trucker',
     'description' => 'Classic denim trucker jacket in indigo selvedge with copper rivets and pearl snaps.',
     'category' => 'outerwear', 'brand' => 'drifter',
     'price' => 89.00, 'in_stock' => true, 'rating' => 4.1],
    ['id' => 'p007', 'name' => 'Featherline vest',
     'description' => 'Lightweight sleeveless puffer vest for layering. Same baffle build as the jacket without the sleeves.',
     'category' => 'outerwear', 'brand' => 'northpeak',
     'price' => 79.00, 'in_stock' => true, 'rating' => 4.0],

    // --- Footwear ---------------------------------------------------
    ['id' => 'p010', 'name' => 'Summit hiking boot',
     'description' => 'Mid-cut waterproof hiking boot with Vibram outsole, gusseted tongue, and full-grain leather upper.',
     'category' => 'footwear', 'brand' => 'summit',
     'price' => 189.00, 'in_stock' => true, 'rating' => 4.6],
    ['id' => 'p011', 'name' => 'Switchback trail runner',
     'description' => 'Lightweight trail running shoe with rock plate, aggressive lug pattern, and quick-dry mesh upper.',
     'category' => 'footwear', 'brand' => 'summit',
     'price' => 139.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p012', 'name' => 'Plaza city sneaker',
     'description' => 'Minimalist leather sneaker on a cup sole. Unlined for warm-weather everyday wear.',
     'category' => 'footwear', 'brand' => 'atelier',
     'price' => 119.00, 'in_stock' => true, 'rating' => 4.2],
    ['id' => 'p013', 'name' => 'Riverbed sandal',
     'description' => 'Quick-dry sport sandal with cushioned EVA midsole and adjustable webbing straps for water hiking.',
     'category' => 'footwear', 'brand' => 'summit',
     'price' => 65.00, 'in_stock' => true, 'rating' => 4.3],
    ['id' => 'p014', 'name' => 'Drifter chukka',
     'description' => 'Suede chukka boot on a crepe sole. Two-eyelet lacing, unstructured toe, soft for daily wear.',
     'category' => 'footwear', 'brand' => 'drifter',
     'price' => 145.00, 'in_stock' => false, 'rating' => 4.4],
    ['id' => 'p015', 'name' => 'Glacier insulated snow boot',
     'description' => 'Knee-high insulated winter boot with removable felt liner and ice-grip outsole. Rated to -30 C.',
     'category' => 'footwear', 'brand' => 'northpeak',
     'price' => 199.00, 'in_stock' => true, 'rating' => 4.6],

    // --- Tops -------------------------------------------------------
    ['id' => 'p020', 'name' => 'Heritage flannel shirt',
     'description' => 'Brushed cotton flannel shirt in red plaid. Curved hem, two chest pockets, soft on the skin.',
     'category' => 'tops', 'brand' => 'drifter',
     'price' => 59.00, 'in_stock' => true, 'rating' => 4.4],
    ['id' => 'p021', 'name' => 'Merino base layer crew',
     'description' => '200 gsm merino wool long-sleeve base layer. Flat-lock seams, naturally odour-resistant.',
     'category' => 'tops', 'brand' => 'summit',
     'price' => 79.00, 'in_stock' => true, 'rating' => 4.7],
    ['id' => 'p022', 'name' => 'Studio cashmere sweater',
     'description' => 'Two-ply cashmere crewneck sweater in oatmeal. Ribbed hem and cuffs, slim through the body.',
     'category' => 'tops', 'brand' => 'atelier',
     'price' => 215.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p023', 'name' => 'Daybreak organic tee',
     'description' => 'Heavy-weight 240 gsm organic cotton t-shirt with reinforced collar and side seams.',
     'category' => 'tops', 'brand' => 'drifter',
     'price' => 32.00, 'in_stock' => true, 'rating' => 4.0],
    ['id' => 'p024', 'name' => 'Trailhead grid fleece',
     'description' => 'Grid-pattern fleece pullover with chest pocket and thumb loops. Layers under a shell.',
     'category' => 'tops', 'brand' => 'stormgear',
     'price' => 85.00, 'in_stock' => true, 'rating' => 4.4],
    ['id' => 'p025', 'name' => 'Switchback technical tee',
     'description' => 'Recycled-polyester running tee with mesh side panels and a reflective logo for low-light visibility.',
     'category' => 'tops', 'brand' => 'summit',
     'price' => 45.00, 'in_stock' => true, 'rating' => 4.1],
    ['id' => 'p026', 'name' => 'Heritage wool henley',
     'description' => 'Mid-weight merino henley with a three-button placket. Mid-grey marl, ribbed cuffs.',
     'category' => 'tops', 'brand' => 'drifter',
     'price' => 75.00, 'in_stock' => false, 'rating' => 4.3],

    // --- Bottoms ----------------------------------------------------
    ['id' => 'p030', 'name' => 'Workhorse straight jean',
     'description' => '14 oz selvedge denim in a straight cut. Rigid out of the box, breaks in with wear.',
     'category' => 'bottoms', 'brand' => 'drifter',
     'price' => 135.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p031', 'name' => 'Cascade hiking pant',
     'description' => 'Stretch nylon hiking pant with articulated knees, water-repellent finish, and zipped thigh pocket.',
     'category' => 'bottoms', 'brand' => 'stormgear',
     'price' => 95.00, 'in_stock' => true, 'rating' => 4.4],
    ['id' => 'p032', 'name' => 'Studio merino trouser',
     'description' => 'Tailored wool-blend trouser with a slight stretch. Hidden side adjusters, no-break hem.',
     'category' => 'bottoms', 'brand' => 'atelier',
     'price' => 175.00, 'in_stock' => true, 'rating' => 4.2],
    ['id' => 'p033', 'name' => 'Trailhead jogger',
     'description' => 'Mid-weight French terry jogger with elastic cuffs and zipped side pockets.',
     'category' => 'bottoms', 'brand' => 'stormgear',
     'price' => 69.00, 'in_stock' => true, 'rating' => 4.1],
    ['id' => 'p034', 'name' => 'Switchback running short',
     'description' => 'Five-inch running short with built-in liner, two side pockets, and a zipped back pocket.',
     'category' => 'bottoms', 'brand' => 'summit',
     'price' => 49.00, 'in_stock' => true, 'rating' => 4.3],

    // --- Accessories ------------------------------------------------
    ['id' => 'p040', 'name' => 'Summit merino beanie',
     'description' => 'Double-layer merino beanie. Fold-up cuff, naturally odour-resistant, packs flat.',
     'category' => 'accessories', 'brand' => 'summit',
     'price' => 29.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p041', 'name' => 'Cascade waterproof cap',
     'description' => 'Waterproof breathable cap with a stiff brim and rear cinch. Pairs with the Cascade rain shell.',
     'category' => 'accessories', 'brand' => 'stormgear',
     'price' => 35.00, 'in_stock' => true, 'rating' => 4.2],
    ['id' => 'p042', 'name' => 'Hearthside cashmere scarf',
     'description' => 'Long two-ply cashmere scarf in herringbone weave. Generous drape, fringed ends.',
     'category' => 'accessories', 'brand' => 'atelier',
     'price' => 145.00, 'in_stock' => true, 'rating' => 4.6],
    ['id' => 'p043', 'name' => 'Workhorse leather belt',
     'description' => 'Full-grain bridle leather belt with a solid brass single-prong buckle. Sized in half-inches.',
     'category' => 'accessories', 'brand' => 'drifter',
     'price' => 89.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p044', 'name' => 'Glacier insulated mitten',
     'description' => 'Goretex shell over Primaloft insulation with a leather palm and removable wool liner.',
     'category' => 'accessories', 'brand' => 'northpeak',
     'price' => 95.00, 'in_stock' => true, 'rating' => 4.4],
    ['id' => 'p045', 'name' => 'Trailhead trucker cap',
     'description' => 'Five-panel mesh-back trucker cap with a curved brim and embroidered patch.',
     'category' => 'accessories', 'brand' => 'stormgear',
     'price' => 28.00, 'in_stock' => false, 'rating' => 4.0],

    // --- Bags -------------------------------------------------------
    ['id' => 'p050', 'name' => 'Summit alpine pack 35',
     'description' => '35-litre alpine climbing pack with rope strap, removable hipbelt, and dual ice-tool loops.',
     'category' => 'bags', 'brand' => 'summit',
     'price' => 169.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p051', 'name' => 'Cascade daypack 22',
     'description' => '22-litre daypack with a hydration sleeve, padded laptop pocket, and ventilated mesh back panel.',
     'category' => 'bags', 'brand' => 'stormgear',
     'price' => 89.00, 'in_stock' => true, 'rating' => 4.3],
    ['id' => 'p052', 'name' => 'Studio leather briefcase',
     'description' => 'Full-grain leather briefcase with a padded 15-inch laptop sleeve, two main compartments, and brass hardware.',
     'category' => 'bags', 'brand' => 'atelier',
     'price' => 295.00, 'in_stock' => true, 'rating' => 4.6],
    ['id' => 'p053', 'name' => 'Workhorse canvas tote',
     'description' => '20 oz waxed canvas tote with leather handles and brass rivets. Develops a patina with use.',
     'category' => 'bags', 'brand' => 'drifter',
     'price' => 75.00, 'in_stock' => true, 'rating' => 4.2],
    ['id' => 'p054', 'name' => 'Glacier expedition duffel',
     'description' => '90-litre haul duffel in burly TPU-coated fabric with lockable zippers and removable backpack straps.',
     'category' => 'bags', 'brand' => 'northpeak',
     'price' => 159.00, 'in_stock' => true, 'rating' => 4.5],
    ['id' => 'p055', 'name' => 'Switchback running vest',
     'description' => '10-litre running vest with soft flask pockets in the chest and a stretch back pocket for shells.',
     'category' => 'bags', 'brand' => 'summit',
     'price' => 129.00, 'in_stock' => true, 'rating' => 4.4],
];

function embedTextFor(array $product): string
{
    // Concatenating ``name`` and ``description`` gives the model both a
    // short label and a longer descriptive context, which produces a more
    // discriminating vector than embedding the name alone.
    return $product['name'] . '. ' . $product['description'];
}

$embedder = new Embedder();
fprintf(STDERR, "Embedding %d products with %s...\n", count(CATALOG), $embedder->modelName);

$out = [
    'model' => $embedder->modelName,
    'dim' => $embedder->dim,
    'products' => [],
];

foreach (CATALOG as $i => $product) {
    $vec = $embedder->encodeOne(embedTextFor($product));
    $out['products'][] = array_merge(
        $product,
        [
            // Pack the float32 vector as base64 so the JSON file stays
            // compact and the loader can hand the raw bytes straight to
            // HSET without re-converting them.
            'embedding_b64' => base64_encode(Embedder::toBytes($vec)),
        ]
    );
    if (($i + 1) % 5 === 0 || $i === count(CATALOG) - 1) {
        fprintf(STDERR, "  embedded %d/%d\n", $i + 1, count(CATALOG));
    }
}

$outPath = __DIR__ . '/catalog.json';
file_put_contents(
    $outPath,
    json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);
fprintf(STDERR, "Wrote %d products -> %s\n", count($out['products']), $outPath);
