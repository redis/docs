// Local text-embedding helper backed by SmartComponents.LocalEmbeddings.
//
// This is a thin wrapper around the package's built-in "default" model
// (a quantised ``sentence-transformers/bge-small-en-v1.5`` variant
// shipped as ONNX): a 384-dimensional encoder that runs in-process via
// Microsoft.ML.OnnxRuntime, needs no API key, downloads no extra files
// on first use, and has a small footprint.
//
// Vectors are L2-normalised on output so a Redis Search index declared
// with ``DISTANCE_METRIC COSINE`` returns scores that are directly
// comparable across items. SmartComponents itself does not normalise,
// so we do it here for parity with the Python / Node.js / Go ports.

using System.Numerics.Tensors;
using SmartComponents.LocalEmbeddings;

namespace RecommendationDemo;

/// <summary>
/// Loads a local sentence-encoder once and reuses it for every call.
/// The instance is thread-safe via an internal lock — the underlying
/// ONNX session isn't safe to call concurrently.
/// </summary>
public sealed class Embedder : IDisposable
{
    // Hugging Face hub ID of the model that ships with the
    // SmartComponents.LocalEmbeddings package. Carried alongside the
    // vectors so the demo UI and ``catalog.json`` can record which
    // model produced the embedding — important when swapping models.
    public const string DefaultModelName = "default (bge-micro-v2)";

    private readonly LocalEmbedder _inner;
    private readonly object _lock = new();
    private bool _disposed;

    public string ModelName { get; }
    public int Dim => _inner.Dimensions;

    public Embedder(string? modelName = null)
    {
        // The SmartComponents constructor takes the on-disk model name
        // ("default" ships with the package). The friendly model name
        // is kept separately because the package doesn't expose it.
        _inner = new LocalEmbedder();
        ModelName = modelName ?? DefaultModelName;
    }

    /// <summary>Encode a single string. Returned vector is unit-normalised.</summary>
    public float[] EncodeOne(string text)
    {
        // Borrow the underlying float buffer once, normalise into a
        // fresh array so callers can mutate or pin it without
        // disturbing the pooled buffer the encoder hands back.
        lock (_lock)
        {
            ThrowIfDisposed();
            var v = _inner.Embed(text);
            return Normalise(v.Values.ToArray());
        }
    }

    /// <summary>Encode a batch. Returned vectors are unit-normalised.</summary>
    public float[][] EncodeMany(IReadOnlyList<string> texts)
    {
        lock (_lock)
        {
            ThrowIfDisposed();
            var results = new float[texts.Count][];
            // EmbedRange streams results in input order; the tuple's
            // first element is the original text, which we discard.
            var i = 0;
            foreach (var (_, vec) in _inner.EmbedRange(texts))
            {
                results[i++] = Normalise(vec.Values.ToArray());
            }
            return results;
        }
    }

    /// <summary>
    /// Pack a float32 vector as the little-endian byte blob Redis
    /// Search expects for a FLOAT32 vector field. Exposed so callers
    /// (catalog builder, recommender) can share one encoding without
    /// re-implementing it.
    /// </summary>
    public static byte[] FloatsToBytes(ReadOnlySpan<float> vec)
    {
        var bytes = new byte[vec.Length * sizeof(float)];
        // BitConverter on little-endian platforms (x86/ARM, every
        // platform that runs .NET in practice) is a no-op memcpy; on
        // hypothetical big-endian hosts we'd need to swap bytes.
        for (var i = 0; i < vec.Length; i++)
        {
            System.Buffers.Binary.BinaryPrimitives.WriteSingleLittleEndian(
                bytes.AsSpan(i * sizeof(float)), vec[i]);
        }
        return bytes;
    }

    /// <summary>
    /// Decode a little-endian float32 blob produced by
    /// <see cref="FloatsToBytes"/>. Throws when the byte length is not
    /// a multiple of four — a corrupted or wrong-dim field would
    /// otherwise produce a vector whose first KNN call would fail
    /// with a less helpful error.
    /// </summary>
    public static float[] BytesToFloats(ReadOnlySpan<byte> buf)
    {
        if (buf.Length % sizeof(float) != 0)
        {
            throw new ArgumentException(
                $"expected float32 buffer (multiple of 4 bytes), got {buf.Length}",
                nameof(buf));
        }
        var n = buf.Length / sizeof(float);
        var floats = new float[n];
        for (var i = 0; i < n; i++)
        {
            floats[i] = System.Buffers.Binary.BinaryPrimitives.ReadSingleLittleEndian(
                buf.Slice(i * sizeof(float), sizeof(float)));
        }
        return floats;
    }

    /// <summary>
    /// Scale a vector so its Euclidean norm is 1, in place. A zero
    /// vector is returned unchanged.
    /// </summary>
    internal static float[] Normalise(float[] v)
    {
        // TensorPrimitives is the .NET 8 SIMD-accelerated math API;
        // for a 384-element float vector this is a single AVX2 pass.
        var norm = TensorPrimitives.Norm(v);
        if (norm == 0f) return v;
        var inv = 1f / norm;
        for (var i = 0; i < v.Length; i++) v[i] *= inv;
        return v;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _inner.Dispose();
    }

    private void ThrowIfDisposed()
    {
        if (_disposed) throw new ObjectDisposedException(nameof(Embedder));
    }
}
