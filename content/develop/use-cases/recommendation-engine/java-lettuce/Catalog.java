import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Helpers for the {@code catalog.json} wire format shared across the
 * Python, Node, Go and Java ports.
 *
 * <pre>
 * {
 *   "model": "...",
 *   "dim": 384,
 *   "products": [
 *     { "id": "p001", "name": "...", "description": "...",
 *       "category": "outerwear", "brand": "northpeak",
 *       "price": 289.0, "in_stock": true, "rating": 4.7,
 *       "embedding_b64": "&lt;base64 float32 LE&gt;" }
 *   ]
 * }
 * </pre>
 */
public final class Catalog {

    private Catalog() {}

    /** What's in catalog.json once it's parsed. */
    public static final class Loaded {
        public final String model;
        public final int dim;
        public final List<Recommender.Product> products;
        public Loaded(String model, int dim, List<Recommender.Product> products) {
            this.model = model;
            this.dim = dim;
            this.products = products;
        }
    }

    /**
     * Read and parse the catalog JSON. Embeddings come in as
     * base64-encoded float32 LE bytes; we hand the raw bytes straight
     * through to {@link Recommender.Product#embedding} so the ingest
     * path doesn't have to re-encode them.
     */
    public static Loaded load(Path path) throws IOException {
        String text = Files.readString(path);
        JsonObject root = JsonParser.parseString(text).getAsJsonObject();
        String model = root.has("model") ? root.get("model").getAsString() : LocalEmbedder.DEFAULT_MODEL;
        int dim = root.has("dim") ? root.get("dim").getAsInt() : Recommender.VECTOR_DIM_DEFAULT;
        JsonArray arr = root.getAsJsonArray("products");
        List<Recommender.Product> products = new ArrayList<>(arr.size());
        for (JsonElement el : arr) {
            JsonObject obj = el.getAsJsonObject();
            Recommender.Product p = new Recommender.Product();
            p.id = obj.get("id").getAsString();
            p.name = obj.get("name").getAsString();
            p.description = obj.get("description").getAsString();
            p.category = obj.get("category").getAsString();
            p.brand = obj.get("brand").getAsString();
            p.price = obj.get("price").getAsDouble();
            p.inStock = obj.get("in_stock").getAsBoolean();
            p.rating = obj.get("rating").getAsDouble();
            String b64 = obj.get("embedding_b64").getAsString();
            p.embedding = Base64.getDecoder().decode(b64);
            products.add(p);
        }
        return new Loaded(model, dim, products);
    }

    /**
     * Write a catalog file in the shared wire format. ``vectors`` and
     * ``seeds`` must be parallel; ``vectors[i]`` is the float32 array
     * for ``seeds.get(i)``.
     */
    public static void write(Path path, String model, int dim,
                              List<CatalogSeed.Seed> seeds, float[][] vectors) throws IOException {
        JsonArray products = new JsonArray();
        for (int i = 0; i < seeds.size(); i++) {
            CatalogSeed.Seed s = seeds.get(i);
            JsonObject obj = new JsonObject();
            obj.addProperty("id", s.id);
            obj.addProperty("name", s.name);
            obj.addProperty("description", s.description);
            obj.addProperty("category", s.category);
            obj.addProperty("brand", s.brand);
            obj.addProperty("price", s.price);
            obj.addProperty("in_stock", s.inStock);
            obj.addProperty("rating", s.rating);
            obj.addProperty("embedding_b64",
                    Base64.getEncoder().encodeToString(Recommender.floatsToBytes(vectors[i])));
            products.add(obj);
        }
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("model", model);
        root.put("dim", dim);
        root.put("products", products);
        Gson gson = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
        Files.writeString(path, gson.toJson(root));
    }
}
