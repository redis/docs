<?php
/**
 * Local text-embedding helper backed by TransformersPHP.
 *
 * Thin wrapper around the ``Xenova/all-MiniLM-L6-v2`` ONNX model: a
 * 384-dimensional sentence encoder that runs on CPU through TransformersPHP
 * (which talks to the bundled ONNX Runtime via PHP's FFI extension).
 *
 * Vectors are L2-normalised on output so a Redis Search index declared
 * with ``DISTANCE_METRIC COSINE`` returns scores that are already
 * directly comparable across items.
 *
 * Requires the PHP ``ffi`` extension and the native libraries shipped
 * by ``codewithkyrian/transformers-libsloader`` (installed automatically
 * with ``composer install``).
 */

declare(strict_types=1);

namespace Redis\RecommendationEngine;

use function Codewithkyrian\Transformers\Pipelines\pipeline;

class Embedder
{
    public const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';
    public const DEFAULT_DIM = 384;

    public string $modelName;
    public int $dim;

    /** @var callable */
    private $pipeline;

    public function __construct(string $modelName = self::DEFAULT_MODEL)
    {
        $this->modelName = $modelName;
        // ``pipeline('embeddings', ...)`` is a feature-extraction pipeline
        // that loads the ONNX model and tokenizer the first time it's
        // called and caches them inside the pipeline object.
        $this->pipeline = pipeline('embeddings', $modelName);
        // Probe the model's output dimensionality so a different model
        // (e.g. a 768-dim BGE base) lines up with the Redis Search vector
        // field automatically — no separate constant to keep in sync.
        $probe = $this->encodeOne('hello');
        $this->dim = count($probe);
    }

    /**
     * Encode a single string. Returns a 1-D ``float[]`` (length = dim).
     */
    public function encodeOne(string $text): array
    {
        $fn = $this->pipeline;
        // TransformersPHP's ``pipeline()`` returns a nested array shaped
        // ``[ [v0, v1, ..., v_{dim-1}] ]`` even for one input. Drop the
        // outer dimension so callers see a flat vector. ``normalize:
        // true`` does not consistently apply to the unwrapped array in
        // every TransformersPHP build, so we L2-normalise here defensively
        // — the index uses cosine distance and the EWMA blend assumes
        // unit vectors.
        $result = $fn($text, normalize: true, pooling: 'mean');
        return self::l2Normalise(self::toFloatArray($result[0]));
    }

    /**
     * Encode many strings. Returns an array of ``float[]`` vectors in
     * the same order as the input.
     *
     * @param iterable<string> $texts
     * @return array<int, array<int, float>>
     */
    public function encodeMany(iterable $texts): array
    {
        // The pipeline accepts a list of strings and returns a list of
        // embeddings. We could batch in one call but pre-computing the
        // catalog runs once at build time, so simplicity beats batching.
        $out = [];
        foreach ($texts as $text) {
            $out[] = $this->encodeOne($text);
        }
        return $out;
    }

    /**
     * Pack a 1-D float array into the raw little-endian float32 bytes
     * Redis Search expects in a ``VECTOR`` field.
     *
     * @param array<int, float> $vector
     */
    public static function toBytes(array $vector): string
    {
        // ``g`` is the format code for little-endian float32 in pack();
        // the ``*`` repeats it for every value. Redis Search vector
        // encoding is little-endian float32 regardless of host byte order.
        return pack('g*', ...$vector);
    }

    /**
     * Unpack raw little-endian float32 bytes (as written by ``toBytes``
     * or returned by HGET on the ``embedding`` field) into a PHP array.
     *
     * @return array<int, float>
     */
    public static function fromBytes(string $bytes, int $expectedDim = self::DEFAULT_DIM): array
    {
        $expectedBytes = $expectedDim * 4;
        if (strlen($bytes) !== $expectedBytes) {
            throw new \RuntimeException(sprintf(
                'expected %d bytes for a %d-dim float32 vector, got %d',
                $expectedBytes,
                $expectedDim,
                strlen($bytes)
            ));
        }
        // ``unpack('g*', ...)`` returns a 1-indexed array; reset to
        // 0-indexed so callers can treat it like a regular vector.
        $unpacked = unpack('g*', $bytes);
        if ($unpacked === false) {
            throw new \RuntimeException('unpack failed on embedding bytes');
        }
        return array_values($unpacked);
    }

    /**
     * Rescale a vector to unit L2 norm. A zero vector is returned
     * unchanged (the only sensible behaviour — there's no direction).
     *
     * @param array<int, float> $vector
     * @return array<int, float>
     */
    public static function l2Normalise(array $vector): array
    {
        $sumSq = 0.0;
        foreach ($vector as $v) {
            $sumSq += $v * $v;
        }
        if ($sumSq <= 0.0) {
            return $vector;
        }
        $inv = 1.0 / sqrt($sumSq);
        $out = [];
        foreach ($vector as $v) {
            $out[] = $v * $inv;
        }
        return $out;
    }

    /**
     * Normalise a TransformersPHP pipeline output row to a plain
     * ``float[]``. The pipeline sometimes hands back Tensor-like objects
     * that are array-accessible; ``iterator_to_array`` works for both
     * arrays and Traversable wrappers and yields plain floats.
     *
     * @param mixed $row
     * @return array<int, float>
     */
    private static function toFloatArray(mixed $row): array
    {
        if (is_array($row)) {
            $out = [];
            foreach ($row as $v) {
                $out[] = (float) $v;
            }
            return $out;
        }
        if ($row instanceof \Traversable) {
            $out = [];
            foreach ($row as $v) {
                $out[] = (float) $v;
            }
            return $out;
        }
        throw new \RuntimeException('unexpected embedding row type: ' . get_debug_type($row));
    }
}
