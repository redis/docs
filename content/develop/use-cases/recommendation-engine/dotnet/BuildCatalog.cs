// Build the demo product catalog: define products, embed them, write JSON.
//
// Run this once before starting the demo server (or any time you want
// to regenerate the catalog or swap the embedding model):
//
//     dotnet run --project . -- build-catalog
//
// It does three things:
//
//   1. Reads the inline catalog defined in CatalogSeed.cs.
//   2. Runs the SmartComponents.LocalEmbeddings model over each
//      product's ``Name. Description`` text to produce a
//      384-dimensional vector.
//   3. Writes the result to ``catalog.json`` next to the binary.
//
// The demo server reads ``catalog.json`` at startup so it can seed
// Redis quickly without re-running the embedding model on every boot.
// Embeddings are stored as base64-encoded ``float32`` bytes so the file
// stays compact and loads without any extra parsing on the demo's side.
//
// In production the equivalent of this lives in an offline pipeline:
// embed once on item-catalogue updates, write into Redis with HSET, and
// let the serving tier query without ever loading a model.

using System.Text.Json;
using System.Text.Json.Serialization;

namespace RecommendationDemo;

/// <summary>On-disk catalogue, shared across all language ports.</summary>
public sealed class CatalogFile
{
    [JsonPropertyName("model")] public string Model { get; set; } = "";
    [JsonPropertyName("dim")] public int Dim { get; set; }
    [JsonPropertyName("products")] public List<CatalogProduct> Products { get; set; } = new();
}

/// <summary>
/// JSON-bound shape that matches the cross-port wire format
/// (snake_case fields, base64-encoded vector). Distinct from the inline
/// <see cref="Product"/> seed type so the seed file can stay terse.
/// </summary>
public sealed class CatalogProduct
{
    [JsonPropertyName("id")] public string Id { get; set; } = "";
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("description")] public string Description { get; set; } = "";
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("brand")] public string Brand { get; set; } = "";
    [JsonPropertyName("price")] public double Price { get; set; }
    [JsonPropertyName("in_stock")] public bool InStock { get; set; }
    [JsonPropertyName("rating")] public double Rating { get; set; }
    [JsonPropertyName("embedding_b64")] public string EmbeddingB64 { get; set; } = "";
}

public static class BuildCatalog
{
    /// <summary>JSON options shared between the builder and the loader.</summary>
    public static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        // Default System.Text.Json otherwise camel-cases / escapes
        // forward slashes; the catalogue file is read by the Python /
        // Node.js / Go demos too, so we keep the format vanilla.
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public static int Run(string[] args)
    {
        var outPath = "catalog.json";
        for (var i = 0; i < args.Length; i++)
        {
            if (args[i] == "--out" && i + 1 < args.Length) outPath = args[++i];
        }

        using var embedder = new Embedder();
        Console.WriteLine($"Embedding {CatalogSeed.All.Length} products with {embedder.ModelName}...");

        var texts = CatalogSeed.All.Select(p => p.EmbedText()).ToList();
        var vectors = embedder.EncodeMany(texts);
        Console.WriteLine($"Embeddings: shape=[{vectors.Length}, {embedder.Dim}], dtype=float32");

        var file = new CatalogFile
        {
            Model = embedder.ModelName,
            Dim = embedder.Dim,
            Products = CatalogSeed.All.Select((p, i) => new CatalogProduct
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                Brand = p.Brand,
                Price = p.Price,
                InStock = p.InStock,
                Rating = p.Rating,
                // Pack the float32 vector as base64 so the JSON file
                // stays compact and the loader can hand the raw bytes
                // straight to HSET without re-converting them.
                EmbeddingB64 = Convert.ToBase64String(Embedder.FloatsToBytes(vectors[i])),
            }).ToList(),
        };

        var fullPath = Path.GetFullPath(outPath);
        File.WriteAllText(fullPath, JsonSerializer.Serialize(file, JsonOpts));
        Console.WriteLine($"Wrote {file.Products.Count} products -> {fullPath}");
        return 0;
    }

    /// <summary>Read a previously-built catalog file from disk.</summary>
    public static CatalogFile Load(string path)
    {
        var json = File.ReadAllText(path);
        var file = JsonSerializer.Deserialize<CatalogFile>(json, JsonOpts)
            ?? throw new InvalidDataException($"catalog file at {path} parsed as null");
        return file;
    }
}
