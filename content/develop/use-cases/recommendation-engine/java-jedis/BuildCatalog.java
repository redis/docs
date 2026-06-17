import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Build the demo product catalog: define products, embed them, write
 * JSON.
 *
 * <p>Run this once before starting the demo server (or any time you
 * want to regenerate the catalog or swap the embedding model):</p>
 *
 * <pre>
 *     java -cp ... BuildCatalog
 * </pre>
 *
 * <p>It does three things:</p>
 *
 * <ol>
 *   <li>Defines a small product catalog inline (see
 *       {@link CatalogSeed}) so you can read and modify it.</li>
 *   <li>Runs the DJL + ONNX Runtime embedding pipeline from
 *       {@link LocalEmbedder} over the {@code name + description} text
 *       of each product to produce a 384-dimensional vector.</li>
 *   <li>Writes the result to {@code catalog.json} next to the source
 *       files.</li>
 * </ol>
 *
 * <p>The demo server reads {@code catalog.json} at startup so it can
 * seed Redis quickly without re-running the embedding model on every
 * boot. Embeddings are stored as base64-encoded {@code float32} bytes
 * so the file stays compact and loads without any extra parsing on the
 * demo's side.</p>
 */
public class BuildCatalog {

    public static void main(String[] args) throws Exception {
        Path out = Paths.get("catalog.json");
        for (int i = 0; i < args.length; i++) {
            if ("--out".equals(args[i]) && i + 1 < args.length) {
                out = Paths.get(args[++i]);
            }
        }

        List<CatalogSeed.Seed> seeds = CatalogSeed.all();
        List<String> texts = new ArrayList<>(seeds.size());
        for (CatalogSeed.Seed s : seeds) {
            texts.add(CatalogSeed.embedTextFor(s));
        }

        System.out.println("Loading embedding model (first run downloads ~80 MB)...");
        try (LocalEmbedder embedder = new LocalEmbedder()) {
            System.out.printf("Embedding %d products with %s...%n",
                    texts.size(), embedder.getModelName());
            float[][] vectors = embedder.encodeMany(texts);
            int dim = vectors[0].length;
            System.out.printf("Embeddings: shape=[%d, %d], dtype=float32%n", vectors.length, dim);
            Catalog.write(out, embedder.getModelName(), dim, seeds, vectors);
            System.out.printf("Wrote %d products -> %s%n", seeds.size(), out.toAbsolutePath());
        }
    }
}
