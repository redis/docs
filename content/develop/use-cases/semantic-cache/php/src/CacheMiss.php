<?php

declare(strict_types=1);

namespace Redis\SemanticCache;

/**
 * A cache lookup that did not return a usable response.
 *
 * `nearestDistance` is the cosine distance to the closest cached
 * prompt that *did* match the metadata filters. It is `null` if the
 * cache had no entry in scope at all, which is what the demo UI
 * shows as "no candidate" vs. "candidate too far".
 */
final readonly class CacheMiss
{
    public function __construct(
        public ?float $nearestDistance,
        public ?string $nearestId,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'nearest_distance' => $this->nearestDistance === null
                ? null
                : round($this->nearestDistance, 4),
            'nearest_id' => $this->nearestId,
        ];
    }
}
