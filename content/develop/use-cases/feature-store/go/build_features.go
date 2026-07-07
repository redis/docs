package featurestore

import (
	"context"
	"flag"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// Country choices and risk segments used by the synthetic batch
// generator. These are not the point of the demo — in production the
// equivalent code reads from the offline store (Snowflake, BigQuery,
// Iceberg) and writes the resulting hashes into Redis.
var (
	countryChoices       = []string{"US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL"}
	riskSegments         = []string{"low", "medium", "high"}
	riskWeights          = []int{70, 25, 5}
	chargebackBuckets    = []int{0, 1, 2, 3}
	chargebackWeights    = []int{85, 10, 4, 1}
)

// SynthesizeUsers generates count synthetic user feature rows.
//
// The shape mirrors a small fraud-scoring feature set: country and
// risk segment as TAG-like categorical features, plus a few numeric
// aggregates over recent windows.
func SynthesizeUsers(count int, seed int64) map[string]FeatureMap {
	rng := rand.New(rand.NewSource(seed))
	users := make(map[string]FeatureMap, count)
	for i := 1; i <= count; i++ {
		uid := fmt.Sprintf("u%04d", i)
		users[uid] = FeatureMap{
			"country_iso":           countryChoices[rng.Intn(len(countryChoices))],
			"risk_segment":          weightedChoiceString(rng, riskSegments, riskWeights),
			"account_age_days":      rng.Intn(2400-7+1) + 7,
			"tx_count_7d":           rng.Intn(81),
			"avg_amount_30d":        roundTo2(rng.Float64()*345.0 + 5.0),
			"chargeback_count_180d": weightedChoiceInt(rng, chargebackBuckets, chargebackWeights),
		}
	}
	return users
}

// BuildFeaturesCLI is the entry point for cmd/build_features/main.go.
// It parses CLI flags, opens a Redis client, and bulk-loads the
// synthetic batch into Redis with a configurable key-level TTL.
func BuildFeaturesCLI(args []string) error {
	fs := flag.NewFlagSet("build_features", flag.ExitOnError)
	redisAddr := fs.String("redis-addr", "localhost:6379", "Redis host:port")
	count := fs.Int("count", 200, "Number of synthetic users to materialize")
	ttlSeconds := fs.Int("ttl-seconds", int(24*time.Hour/time.Second), "Key-level TTL in seconds (default 24h)")
	keyPrefix := fs.String("key-prefix", "fs:user:", "Hash key prefix for each user")
	seed := fs.Int64("seed", 42, "PRNG seed")
	if err := fs.Parse(args); err != nil {
		return err
	}

	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: *redisAddr})
	defer rdb.Close()

	store := NewFeatureStore(rdb, *keyPrefix,
		time.Duration(*ttlSeconds)*time.Second, 0)

	rows := SynthesizeUsers(*count, *seed)
	loaded, err := store.BulkLoad(ctx, rows, store.BatchTTL)
	if err != nil {
		return err
	}
	fmt.Fprintf(os.Stdout,
		"Materialized %d users at %s* with a %ds key-level TTL.\n",
		loaded, *keyPrefix, *ttlSeconds)
	return nil
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

func weightedChoiceString(rng *rand.Rand, items []string, weights []int) string {
	total := 0
	for _, w := range weights {
		total += w
	}
	r := rng.Intn(total)
	for i, w := range weights {
		r -= w
		if r < 0 {
			return items[i]
		}
	}
	return items[len(items)-1]
}

func weightedChoiceInt(rng *rand.Rand, items []int, weights []int) int {
	total := 0
	for _, w := range weights {
		total += w
	}
	r := rng.Intn(total)
	for i, w := range weights {
		r -= w
		if r < 0 {
			return items[i]
		}
	}
	return items[len(items)-1]
}

func roundTo2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100.0
}
