<?php

declare(strict_types=1);

namespace Redis\SemanticCache;

use InvalidArgumentException;
use RuntimeException;

use function Codewithkyrian\Transformers\Pipelines\pipeline;

/**
 * Local text-embedding helper backed by codewithkyrian/transformers-php.
 *
 * Thin wrapper around the ONNX-exported sentence-transformers model
 * `Xenova/all-MiniLM-L6-v2`: a 384-dimensional encoder that runs
 * in-process on CPU through the bundled ONNX Runtime native library,
 * needs no API key, and produces vectors that are numerically very
 * close to the equivalent PyTorch model (close enough that paraphrase
 * distances differ only at the fourth decimal place — see the smoke
 * test in `_index.md`).
 *
 * Vectors are L2-normalised so a Redis Search index declared with
 * `DISTANCE_METRIC COSINE` returns scores that are directly comparable
 * across entries. The model is downloaded into the local Hugging Face
 * cache on the first call; every later call runs offline. The
 * `pipeline('feature-extraction', ...)` factory matches the precedent
 * set in `develop/clients/php/vecsearch.md`.
 */
final class LocalEmbedder
{
    public const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';

    /** @var callable */
    private $extractor;

    private function __construct(
        public readonly string $modelName,
        callable $extractor,
        public readonly int $dim,
    ) {
        $this->extractor = $extractor;
    }

    /**
     * Build the embedder.
     *
     * The pipeline load is synchronous in transformers-php but still
     * does I/O (model download on first run, ONNX session
     * initialisation on every run), so wrapping the constructor in a
     * static factory keeps the dimension probe in one place and makes
     * it explicit that creating an embedder is not free.
     */
    public static function create(string $modelName = self::DEFAULT_MODEL): self
    {
        $extractor = pipeline('feature-extraction', $modelName);

        // Probe the output shape once so we have an authoritative
        // dimension to compare against the index's expected vectorDim.
        // RedisSemanticCache also checks length on every put / lookup,
        // so a model swap that produces wrong-dim vectors fails at the
        // call site with a clear error instead of as a server-side
        // FT.SEARCH parse failure.
        $probe = $extractor('dimension probe', pooling: 'mean', normalize: true);
        $vector = self::firstRow($probe);
        $dim = count($vector);
        if ($dim < 1) {
            throw new RuntimeException(
                "embedder probe returned an empty vector for model {$modelName}"
            );
        }
        return new self($modelName, $extractor, $dim);
    }

    /**
     * Encode a single string. Returns a list<float> of length `dim`.
     *
     * @return list<float>
     */
    public function encodeOne(string $text): array
    {
        $out = ($this->extractor)($text, pooling: 'mean', normalize: true);
        $vec = self::firstRow($out);
        return $this->finaliseVector($vec);
    }

    /**
     * Encode several strings in one pipeline call. Returns an array
     * of list<float>; callers that need raw bytes use `toBytes()`.
     *
     * @param  list<string>      $texts
     * @return list<list<float>>
     */
    public function encodeMany(array $texts): array
    {
        if ($texts === []) {
            return [];
        }
        $out = ($this->extractor)($texts, pooling: 'mean', normalize: true);

        // The pipeline returns a 2-D nested array: rows × dims. If the
        // pipeline ever returns a different number of vectors than
        // inputs (a tokenizer truncation bug, a model swap quirk) the
        // alignment with `texts` would be silently wrong and the seed
        // step would write the wrong embedding next to each FAQ
        // entry — catastrophic for the demo and impossible to debug.
        if (!is_array($out) || !array_is_list($out)) {
            throw new RuntimeException(
                'feature-extraction pipeline returned an unexpected shape'
            );
        }
        if (count($out) !== count($texts)) {
            throw new RuntimeException(sprintf(
                'feature-extraction pipeline returned %d vectors for %d inputs',
                count($out),
                count($texts),
            ));
        }

        $result = [];
        foreach ($out as $row) {
            $result[] = $this->finaliseVector(self::asFloatList($row));
        }
        return $result;
    }

    /**
     * Pack a vector into the little-endian float32 bytes Redis Search
     * expects for a FLOAT32 vector field.
     *
     * Uses `pack('g*', ...)` exactly as the established PHP example
     * does (`develop/clients/php/vecsearch.md`). `g` is the
     * little-endian single-precision IEEE-754 float specifier, so the
     * byte layout matches the encoding used by the redis-py, Node.js,
     * Go, and Jedis ports.
     *
     * @param list<float> $vector
     */
    public static function toBytes(array $vector): string
    {
        return pack('g*', ...$vector);
    }

    /**
     * Drop the leading batch dimension. The feature-extraction
     * pipeline returns a 2-D nested array (`[1][dim]` for a single
     * string), mirroring the Python `sentence-transformers` shape.
     *
     * @param  mixed       $tensor
     * @return list<float>
     */
    private static function firstRow(mixed $tensor): array
    {
        if (!is_array($tensor) || $tensor === []) {
            throw new RuntimeException('embedder returned an empty tensor');
        }
        $first = $tensor[0];
        return self::asFloatList($first);
    }

    /**
     * @param  mixed       $row
     * @return list<float>
     */
    private static function asFloatList(mixed $row): array
    {
        if (!is_array($row)) {
            throw new RuntimeException('embedder row is not an array');
        }
        $out = [];
        foreach ($row as $value) {
            if (!is_int($value) && !is_float($value)) {
                throw new RuntimeException(
                    'embedder row contains a non-numeric value'
                );
            }
            $out[] = (float) $value;
        }
        return $out;
    }

    /**
     * Belt-and-braces L2 normalisation. The pipeline already
     * normalises when called with `normalize: true`, but a numerical
     * drift of 1e-6 in the squared magnitude is enough to introduce a
     * detectable bias in cosine-distance comparisons across language
     * implementations — and writing this here means the demo is
     * resilient to a future transformers-php release that changes the
     * default normalisation semantics.
     *
     * @param  list<float> $vector
     * @return list<float>
     */
    private function finaliseVector(array $vector): array
    {
        if (count($vector) !== $this->dim) {
            throw new InvalidArgumentException(sprintf(
                'embedder returned %d dims, expected %d',
                count($vector),
                $this->dim,
            ));
        }
        $sumSq = 0.0;
        foreach ($vector as $v) {
            $sumSq += $v * $v;
        }
        if ($sumSq <= 0.0) {
            return $vector;
        }
        $norm = sqrt($sumSq);
        // Don't divide if the vector is already a unit vector to
        // within float32 precision — avoids needless re-quantisation.
        if (abs($norm - 1.0) <= 1e-6) {
            return $vector;
        }
        $out = [];
        foreach ($vector as $v) {
            $out[] = $v / $norm;
        }
        return $out;
    }
}
