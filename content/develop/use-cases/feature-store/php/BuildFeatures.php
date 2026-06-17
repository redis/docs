<?php
/**
 * Synthesize a small batch of users with realistic-looking features
 * and bulk-load them into Redis with a 24-hour key-level TTL.
 *
 * Stands in for the nightly Spark / Feast materialization job in a
 * real deployment. In production the equivalent of this script lives
 * in an offline pipeline that reads from the offline store and
 * writes the serving-time hashes into Redis via `HSET` + `EXPIRE`.
 */

declare(strict_types=1);

class BuildFeatures
{
    private const COUNTRY_CHOICES = [
        'US', 'GB', 'DE', 'FR', 'IN', 'BR', 'JP', 'AU', 'CA', 'NL',
    ];
    private const RISK_SEGMENTS = ['low', 'medium', 'high'];
    private const RISK_WEIGHTS = [70, 25, 5];
    private const CHARGEBACK_BUCKETS = [0, 1, 2, 3];
    private const CHARGEBACK_WEIGHTS = [85, 10, 4, 1];

    /**
     * Generate `$count` synthetic user feature rows. The shape mirrors
     * a small fraud-scoring feature set.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function synthesizeUsers(int $count, int $seed = 42): array
    {
        mt_srand($seed);
        $users = [];
        for ($i = 1; $i <= $count; $i++) {
            $uid = sprintf('u%04d', $i);
            $users[$uid] = [
                'country_iso'     => self::COUNTRY_CHOICES[mt_rand(0, count(self::COUNTRY_CHOICES) - 1)],
                'risk_segment'    => self::weightedStr(self::RISK_SEGMENTS, self::RISK_WEIGHTS),
                'account_age_days' => mt_rand(7, 2400),
                'tx_count_7d'      => mt_rand(0, 80),
                'avg_amount_30d'   => round(5.0 + mt_rand() / mt_getrandmax() * 345.0, 2),
                'chargeback_count_180d' => self::weightedInt(self::CHARGEBACK_BUCKETS, self::CHARGEBACK_WEIGHTS),
            ];
        }
        return $users;
    }

    private static function weightedStr(array $items, array $weights): string
    {
        $total = array_sum($weights);
        $r = mt_rand(0, $total - 1);
        foreach ($items as $i => $item) {
            $r -= $weights[$i];
            if ($r < 0) return $item;
        }
        return $items[count($items) - 1];
    }

    private static function weightedInt(array $items, array $weights): int
    {
        $total = array_sum($weights);
        $r = mt_rand(0, $total - 1);
        foreach ($items as $i => $item) {
            $r -= $weights[$i];
            if ($r < 0) return $item;
        }
        return $items[count($items) - 1];
    }
}
