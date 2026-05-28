<?php

declare(strict_types=1);

namespace Redis\SemanticCache;

/**
 * A cache lookup that returned a cached response.
 *
 * `distance` is the cosine distance `FT.SEARCH` reported for the
 * nearest cached prompt (0 = identical, 2 = opposite). It is always
 * at or below the threshold the lookup was run with.
 */
final readonly class CacheHit
{
    public function __construct(
        public string $id,
        public string $prompt,
        public string $response,
        public string $tenant,
        public string $locale,
        public string $modelVersion,
        public float $distance,
        public int $ttlSeconds,
        public int $hitCount,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'prompt' => $this->prompt,
            'response' => $this->response,
            'tenant' => $this->tenant,
            'locale' => $this->locale,
            'model_version' => $this->modelVersion,
            'distance' => round($this->distance, 4),
            'ttl_seconds' => $this->ttlSeconds,
            'hit_count' => $this->hitCount,
        ];
    }
}
