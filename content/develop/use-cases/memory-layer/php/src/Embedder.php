<?php
// Local text-embedding helper backed by TransformersPHP.
//
// This is a thin wrapper around the ONNX-exported sentence-transformers
// model `Xenova/all-MiniLM-L6-v2`: a 384-dimensional encoder that runs
// in-process on CPU through ONNX Runtime via FFI, needs no API key,
// and produces vectors that are numerically very close to the
// equivalent PyTorch model (close enough that paraphrase distances
// only drift at the second or third decimal place, so the distance
// bands quoted in the Python walkthrough carry over with one band
// shift documented below).
//
// Vectors are L2-normalized in *our* code, not by the library:
// TransformersPHP 0.6 accepts a `normalize: true` keyword on the
// `feature-extraction` / `embeddings` pipeline but silently ignores
// it (the call doesn't error, it just returns un-normalized vectors).
// The normalization in `_normalize()` below is what makes the cosine
// distance comparable across entries, regardless of how the library
// evolves. Redis Search is declared with `DISTANCE_METRIC COSINE`
// against these L2-normalized vectors.

declare(strict_types=1);

namespace Redis\AgentMemory;

use function Codewithkyrian\Transformers\Pipelines\pipeline;

class Embedder
{
    public const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';

    public readonly string $modelName;
    public readonly int $dim;

    /** @var callable */
    private $extractor;

    public function __construct(string $modelName = self::DEFAULT_MODEL)
    {
        $this->modelName = $modelName;
        $this->extractor = pipeline('embeddings', $modelName);
        // Probe the output shape once so callers can compare against
        // the index's expected vector dimension before doing any
        // inserts. LongTermMemory also checks length on every
        // remember / recall, so a model swap that produces wrong-dim
        // vectors fails at the call site with a clear error.
        $probe = $this->encodeOne('dimension probe');
        $this->dim = count($probe);
    }

    /**
     * Encode a single string. Returns an array of `dim` floats,
     * L2-normalized so the dot product equals the cosine similarity.
     *
     * @return list<float>
     */
    public function encodeOne(string $text): array
    {
        return $this->encodeMany([$text])[0];
    }

    /**
     * Encode several strings in one pipeline call. Returns an array
     * of L2-normalized float vectors, one per input.
     *
     * @param  list<string> $texts
     * @return list<list<float>>
     */
    public function encodeMany(array $texts): array
    {
        // TransformersPHP's `feature-extraction` / `embeddings`
        // pipeline returns shape [batch, dim] when called with
        // `pooling: 'mean'`. Without the pooling argument we'd get
        // [batch, n_tokens, dim] back and would have to pool
        // ourselves; we always pool to keep one code path.
        $raw = ($this->extractor)($texts, pooling: 'mean');

        // Some library versions hand back a single nested array when
        // the input is also a single string; normalize to [batch, dim].
        if (!empty($raw) && !is_array($raw[0])) {
            $raw = [$raw];
        }

        $out = [];
        foreach ($raw as $row) {
            $out[] = self::_normalize($row);
        }
        return $out;
    }

    /**
     * Pack a float vector into the little-endian float32 byte string
     * Redis Search expects as a vector PARAM value.
     */
    public static function toBytes(array $vector): string
    {
        // `pack('g*', ...)` writes a packed array of little-endian
        // floats — the same byte layout `float32` ONNX outputs use
        // on every platform we care about (x86_64 / arm64, both LE).
        return pack('g*', ...$vector);
    }

    /**
     * @param  list<float> $vector
     * @return list<float>
     */
    private static function _normalize(array $vector): array
    {
        $sum = 0.0;
        foreach ($vector as $v) {
            $sum += $v * $v;
        }
        if ($sum <= 0.0) {
            return $vector;
        }
        $inv = 1.0 / sqrt($sum);
        foreach ($vector as $i => $v) {
            $vector[$i] = $v * $inv;
        }
        return $vector;
    }
}
