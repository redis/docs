using StackExchange.Redis;

namespace FeatureStoreDemo;

/// <summary>
/// Synthesize a small batch of users with realistic-looking features
/// and bulk-load them into Redis with a 24-hour key-level TTL.
/// </summary>
/// <remarks>
/// Stands in for the nightly Spark / Feast materialization job in a
/// real deployment. In production the equivalent of this script lives
/// in an offline pipeline that reads from the offline store and
/// writes the serving-time hashes into Redis via <c>HSET</c> +
/// <c>EXPIRE</c>.
/// </remarks>
public static class BuildFeatures
{
    private static readonly string[] CountryChoices = {
        "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
    };
    private static readonly string[] RiskSegments = { "low", "medium", "high" };
    private static readonly int[] RiskWeights = { 70, 25, 5 };
    private static readonly int[] ChargebackBuckets = { 0, 1, 2, 3 };
    private static readonly int[] ChargebackWeights = { 85, 10, 4, 1 };

    /// <summary>
    /// Generate <paramref name="count"/> synthetic user feature rows.
    /// </summary>
    public static Dictionary<string, IReadOnlyDictionary<string, object>> SynthesizeUsers(
        int count, int seed)
    {
        var rng = new Random(seed);
        var users = new Dictionary<string, IReadOnlyDictionary<string, object>>(count);
        for (int i = 1; i <= count; i++)
        {
            var uid = $"u{i:D4}";
            users[uid] = new Dictionary<string, object>
            {
                ["country_iso"] = CountryChoices[rng.Next(CountryChoices.Length)],
                ["risk_segment"] = WeightedChoice(rng, RiskSegments, RiskWeights),
                ["account_age_days"] = 7 + rng.Next(2394),
                ["tx_count_7d"] = rng.Next(81),
                ["avg_amount_30d"] = Math.Round(5.0 + rng.NextDouble() * 345.0, 2),
                ["chargeback_count_180d"] = WeightedChoiceInt(rng, ChargebackBuckets, ChargebackWeights),
            };
        }
        return users;
    }

    /// <summary>
    /// CLI entry point. Run with:
    /// <c>dotnet run --project . -- --mode build-features --count 500</c>
    /// </summary>
    public static async Task<int> RunCliAsync(string[] args)
    {
        var redisUri = "localhost:6379";
        var count = 200;
        var ttlSeconds = 24L * 60L * 60L;
        var keyPrefix = "fs:user:";
        var seed = 42;

        for (int i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--redis-uri" when i + 1 < args.Length:
                    redisUri = args[++i]; break;
                case "--count" when i + 1 < args.Length:
                    count = int.Parse(args[++i]); break;
                case "--ttl-seconds" when i + 1 < args.Length:
                    ttlSeconds = long.Parse(args[++i]); break;
                case "--key-prefix" when i + 1 < args.Length:
                    keyPrefix = args[++i]; break;
                case "--seed" when i + 1 < args.Length:
                    seed = int.Parse(args[++i]); break;
                case "-h":
                case "--help":
                    Console.WriteLine(
                        "Usage: dotnet run -- --mode build-features [--redis-uri URI] " +
                        "[--count N] [--ttl-seconds S] [--key-prefix PREFIX] [--seed N]");
                    return 0;
            }
        }

        var mux = await ConnectionMultiplexer.ConnectAsync(redisUri);
        try
        {
            var store = new FeatureStore(mux, keyPrefix, ttlSeconds,
                FeatureStore.DefaultStreamingTtlSeconds);
            var rows = SynthesizeUsers(count, seed);
            var loaded = await store.BulkLoadAsync(rows, ttlSeconds);
            Console.WriteLine(
                $"Materialized {loaded} users at {keyPrefix}* with a {ttlSeconds}s key-level TTL.");
        }
        finally
        {
            await mux.CloseAsync();
        }
        return 0;
    }

    private static string WeightedChoice(Random rng, string[] items, int[] weights)
    {
        int total = 0;
        foreach (var w in weights) total += w;
        int r = rng.Next(total);
        for (int i = 0; i < items.Length; i++)
        {
            r -= weights[i];
            if (r < 0) return items[i];
        }
        return items[^1];
    }

    private static int WeightedChoiceInt(Random rng, int[] items, int[] weights)
    {
        int total = 0;
        foreach (var w in weights) total += w;
        int r = rng.Next(total);
        for (int i = 0; i < items.Length; i++)
        {
            r -= weights[i];
            if (r < 0) return items[i];
        }
        return items[^1];
    }
}
