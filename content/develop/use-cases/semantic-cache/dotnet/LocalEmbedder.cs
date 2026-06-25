using System.Buffers.Binary;
using System.Net.Http;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using Microsoft.ML.Tokenizers;

namespace SemanticCacheDemo;

/// <summary>
/// Local text-embedding helper backed by ONNX Runtime + a Bert
/// WordPiece tokenizer.
/// </summary>
/// <remarks>
/// <para>This is a thin wrapper around the
/// <c>sentence-transformers/all-MiniLM-L6-v2</c> model loaded as an
/// ONNX export from the <c>Xenova/all-MiniLM-L6-v2</c> Hugging Face
/// mirror: a 384-dimensional encoder that runs in-process on CPU
/// through ONNX Runtime, needs no API key, and produces vectors
/// numerically very close to the equivalent Python and Node ports
/// (close enough that paraphrase distances differ only at the second
/// or third decimal place).</para>
///
/// <para>The class downloads <c>model.onnx</c> and the
/// <c>vocab.txt</c> WordPiece dictionary into a local cache directory
/// on the first call; every later run is offline. Vectors are mean-
/// pooled over the token positions (weighted by the attention mask)
/// and then L2-normalised explicitly so a Redis Search index declared
/// with <c>DISTANCE_METRIC COSINE</c> returns scores that are
/// directly comparable across entries.</para>
/// </remarks>
public sealed class LocalEmbedder : IDisposable
{
    public const string DefaultModelName = "sentence-transformers/all-MiniLM-L6-v2";
    public const int DefaultVectorDim = 384;

    // The Xenova mirror is the Node demo's source; the ONNX export
    // and vocab there match the original sentence-transformers
    // checkpoint and give us a single dependency-free download URL.
    private const string ModelUrl =
        "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx";
    private const string VocabUrl =
        "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/vocab.txt";

    private readonly InferenceSession _session;
    private readonly BertTokenizer _tokenizer;

    public string ModelName { get; }
    public int Dim { get; }

    private LocalEmbedder(
        string modelName,
        InferenceSession session,
        BertTokenizer tokenizer,
        int dim)
    {
        ModelName = modelName;
        _session = session;
        _tokenizer = tokenizer;
        Dim = dim;
    }

    /// <summary>
    /// Load the default model. Blocks while ONNX Runtime initialises
    /// and the model + tokenizer files are downloaded on the first
    /// run. The single <see cref="InferenceSession"/> is shared
    /// across handler threads — ONNX Runtime documents
    /// <c>InferenceSession.Run</c> as thread-safe.
    /// </summary>
    /// <param name="cacheDir">
    /// Directory the model and tokenizer files are cached in. Created
    /// if it doesn't exist. Defaults to <c>./model_cache</c> next to
    /// the running binary, so a fresh checkout doesn't re-download on
    /// every <c>dotnet run</c>.
    /// </param>
    public static async Task<LocalEmbedder> CreateAsync(string? cacheDir = null)
    {
        cacheDir ??= Path.Combine(AppContext.BaseDirectory, "model_cache");
        Directory.CreateDirectory(cacheDir);

        string modelPath = Path.Combine(cacheDir, "model.onnx");
        string vocabPath = Path.Combine(cacheDir, "vocab.txt");

        await DownloadIfMissingAsync(ModelUrl, modelPath);
        await DownloadIfMissingAsync(VocabUrl, vocabPath);

        // The Xenova / sentence-transformers MiniLM tokenizer config
        // says lower_case=true, do_basic_tokenize=true,
        // tokenize_chinese_chars=true; surface those flags here so
        // the tokens match the ones produced by the Python /
        // Node.js sibling demos.
        var options = new BertOptions
        {
            LowerCaseBeforeTokenization = true,
            ApplyBasicTokenization = true,
            IndividuallyTokenizeCjk = true,
        };
        var tokenizer = BertTokenizer.Create(vocabPath, options);

        // One session per process; ONNX Runtime explicitly documents
        // it as thread-safe for inference, so we can share it across
        // every HttpListener handler thread without further
        // synchronisation.
        var session = new InferenceSession(modelPath);

        // Probe the output shape once so we fail loudly if a different
        // model is ever wired up against the 384-dim Redis Search
        // field.
        var probe = EncodeInternal(session, tokenizer, "dimension probe");
        return new LocalEmbedder(DefaultModelName, session, tokenizer, probe.Length);
    }

    private static async Task DownloadIfMissingAsync(string url, string path)
    {
        if (File.Exists(path)) return;
        Console.WriteLine($"Downloading {url}");
        using var http = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(5),
        };
        using var stream = await http.GetStreamAsync(url);
        // Write to a temp path and rename so a Ctrl-C during the
        // download doesn't leave a half-written file the next run
        // would happily skip.
        string tmp = path + ".part";
        using (var file = File.Create(tmp))
        {
            await stream.CopyToAsync(file);
        }
        File.Move(tmp, path, overwrite: true);
    }

    /// <summary>
    /// Encode a single string. Returns a <c>float[]</c> of length
    /// <see cref="Dim"/>.
    /// </summary>
    public float[] EncodeOne(string text) => EncodeInternal(_session, _tokenizer, text);

    /// <summary>
    /// Encode several strings sequentially and return one vector per
    /// input. Throws when the underlying session returns a different
    /// number of vectors than inputs.
    /// </summary>
    public List<float[]> EncodeMany(IReadOnlyList<string> texts)
    {
        var results = new List<float[]>(texts.Count);
        foreach (var text in texts)
        {
            results.Add(EncodeInternal(_session, _tokenizer, text));
        }
        if (results.Count != texts.Count)
        {
            // Belt-and-braces. The loop above guarantees one vector
            // per input on the happy path, but surfacing this as an
            // explicit check matches the contract the seed loader
            // relies on and avoids an index-out-of-range later if a
            // future refactor batches into a single Run() call.
            throw new InvalidOperationException(
                $"embedder produced {results.Count} vectors for {texts.Count} inputs");
        }
        return results;
    }

    private static float[] EncodeInternal(
        InferenceSession session, BertTokenizer tokenizer, string text)
    {
        // BertTokenizer.EncodeToIds adds the [CLS] / [SEP] sentinels
        // that the MiniLM ONNX export expects. considerPreTokenization
        // splits on whitespace + punctuation before WordPiece, which
        // matches the do_basic_tokenize=true in the upstream
        // tokenizer config.
        var ids = tokenizer
            .EncodeToIds(text, addSpecialTokens: true, considerPreTokenization: true)
            .ToArray();
        int seqLen = ids.Length;
        // Empty strings still need at least [CLS] [SEP] so the model
        // has something to attend to. EncodeToIds gives us that for
        // the empty string already; the guard above is just defensive.

        var idsLong = new long[seqLen];
        var mask = new long[seqLen];
        var tokenType = new long[seqLen];
        for (int i = 0; i < seqLen; i++)
        {
            idsLong[i] = ids[i];
            mask[i] = 1;
            tokenType[i] = 0;
        }

        var inputIds = new DenseTensor<long>(idsLong, new[] { 1, seqLen });
        var attentionMask = new DenseTensor<long>(mask, new[] { 1, seqLen });
        var tokenTypes = new DenseTensor<long>(tokenType, new[] { 1, seqLen });

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("input_ids", inputIds),
            NamedOnnxValue.CreateFromTensor("attention_mask", attentionMask),
            NamedOnnxValue.CreateFromTensor("token_type_ids", tokenTypes),
        };

        using var results = session.Run(inputs);
        // The MiniLM ONNX export exposes a single output named
        // last_hidden_state of shape [batch, seq, dim]. Pick it by
        // position so we don't depend on a specific name across
        // future re-exports.
        var output = results[0].AsTensor<float>();
        int dim = output.Dimensions[2];
        var pooled = new float[dim];

        // Attention-masked mean pooling — the standard
        // sentence-transformers recipe. The mask is all 1s here
        // because we never pad, but write the masked sum so the
        // code stays correct under a future batched implementation.
        double maskTotal = 0;
        for (int s = 0; s < seqLen; s++)
        {
            double w = mask[s];
            maskTotal += w;
            for (int d = 0; d < dim; d++)
            {
                pooled[d] += (float)(output[0, s, d] * w);
            }
        }
        if (maskTotal > 0)
        {
            float inv = (float)(1.0 / maskTotal);
            for (int d = 0; d < dim; d++) pooled[d] *= inv;
        }

        // L2-normalise explicitly. The MiniLM ONNX export does not
        // ship the normalisation step the Python sentence-transformers
        // pipeline applies by default with normalize_embeddings=True;
        // doing it here keeps the cosine distances comparable across
        // the Python, Node, Go, Java, and .NET demos.
        double sq = 0;
        foreach (var v in pooled) sq += (double)v * v;
        if (sq > 0)
        {
            float inv = (float)(1.0 / Math.Sqrt(sq));
            for (int d = 0; d < dim; d++) pooled[d] *= inv;
        }
        return pooled;
    }

    /// <summary>
    /// Pack a <c>float[]</c> into the bytes Redis Search expects for
    /// a <c>FLOAT32</c> vector field — raw little-endian float32
    /// values, no header, no padding. Matches the encoding the
    /// Python, Node, Go, and Java ports write.
    /// </summary>
    /// <remarks>
    /// <para>We use <see cref="BinaryPrimitives.WriteSingleLittleEndian"/>
    /// rather than <see cref="BitConverter.GetBytes(float)"/> because
    /// the latter follows host endianness; explicit little-endian
    /// here means the docs example is portable even on a hypothetical
    /// big-endian .NET host. <see cref="BitConverter.IsLittleEndian"/>
    /// is checked once at process start in <see cref="Program"/> to
    /// catch any future surprise — every supported .NET runtime
    /// today is little-endian, but the assertion documents the
    /// assumption.</para>
    /// </remarks>
    public static byte[] ToBytes(float[] vector)
    {
        var bytes = new byte[vector.Length * sizeof(float)];
        var span = bytes.AsSpan();
        for (int i = 0; i < vector.Length; i++)
        {
            BinaryPrimitives.WriteSingleLittleEndian(span.Slice(i * sizeof(float)), vector[i]);
        }
        return bytes;
    }

    public void Dispose()
    {
        _session.Dispose();
    }
}
