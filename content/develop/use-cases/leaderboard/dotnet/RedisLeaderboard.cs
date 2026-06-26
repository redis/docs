using StackExchange.Redis;

namespace LeaderboardDemo;

public record LeaderboardEntry(
    int Rank,
    string UserId,
    double Score,
    IReadOnlyDictionary<string, string> Metadata,
    IReadOnlyList<string> TrimmedUserIds);

public class RedisLeaderboard
{
    private readonly IDatabase _db;
    private readonly string _key;
    private int _maxEntries;

    public RedisLeaderboard(IDatabase? db = null, string key = "leaderboard:demo", int maxEntries = 100)
    {
        _db = db ?? ConnectionMultiplexer.Connect("localhost:6379").GetDatabase();
        _key = string.IsNullOrWhiteSpace(key) ? "leaderboard:demo" : key;
        _maxEntries = NormalizePositiveInt(maxEntries, nameof(maxEntries));
    }

    public string Key => _key;

    public int MaxEntries => _maxEntries;

    public LeaderboardEntry UpsertUser(
        string userId,
        double score,
        IReadOnlyDictionary<string, string>? metadata = null)
    {
        var payload = CoerceMetadata(metadata);
        var batch = _db.CreateBatch();
        var scoreTask = batch.SortedSetAddAsync(_key, userId, score);
        Task metadataTask = Task.CompletedTask;
        if (payload.Count > 0)
        {
            metadataTask = batch.HashSetAsync(
                MetadataKey(userId),
                payload.Select(pair => new HashEntry(pair.Key, pair.Value)).ToArray());
        }

        batch.Execute();
        Task.WaitAll(scoreTask, metadataTask);

        var trimmedUserIds = TrimToMaxEntries();
        var entry = GetUserEntry(userId);
        return entry is null
            ? new LeaderboardEntry(0, userId, score, payload, trimmedUserIds)
            : entry with { TrimmedUserIds = trimmedUserIds };
    }

    public LeaderboardEntry IncrementScore(
        string userId,
        double amount,
        IReadOnlyDictionary<string, string>? metadata = null)
    {
        var payload = CoerceMetadata(metadata);
        var batch = _db.CreateBatch();
        var scoreTask = batch.SortedSetIncrementAsync(_key, userId, amount);
        Task metadataTask = Task.CompletedTask;
        if (payload.Count > 0)
        {
            metadataTask = batch.HashSetAsync(
                MetadataKey(userId),
                payload.Select(pair => new HashEntry(pair.Key, pair.Value)).ToArray());
        }

        batch.Execute();
        Task.WaitAll(scoreTask, metadataTask);

        var trimmedUserIds = TrimToMaxEntries();
        var entry = GetUserEntry(userId);
        return entry is null
            ? new LeaderboardEntry(0, userId, scoreTask.Result, payload, trimmedUserIds)
            : entry with { TrimmedUserIds = trimmedUserIds };
    }

    public IReadOnlyList<string> SetMaxEntries(int maxEntries)
    {
        _maxEntries = NormalizePositiveInt(maxEntries, nameof(maxEntries));
        return TrimToMaxEntries();
    }

    public IReadOnlyList<LeaderboardEntry> GetTop(int count)
    {
        var normalizedCount = NormalizePositiveInt(count, nameof(count));
        var entries = _db.SortedSetRangeByRankWithScores(
            _key,
            0,
            normalizedCount - 1,
            Order.Descending);
        return HydrateEntries(entries, 1);
    }

    public IReadOnlyList<LeaderboardEntry> GetAroundRank(int rank, int count)
    {
        var normalizedRank = NormalizePositiveInt(rank, nameof(rank));
        var normalizedCount = NormalizePositiveInt(count, nameof(count));
        var totalEntries = (int)GetSize();

        if (totalEntries == 0)
        {
            return [];
        }

        if (totalEntries <= normalizedCount)
        {
            return ListAll();
        }

        var halfWindow = normalizedCount / 2;
        var start = Math.Max(0, normalizedRank - 1 - halfWindow);
        var maxStart = totalEntries - normalizedCount;
        if (start > maxStart)
        {
            start = maxStart;
        }

        var end = start + normalizedCount - 1;
        var entries = _db.SortedSetRangeByRankWithScores(
            _key,
            start,
            end,
            Order.Descending);
        return HydrateEntries(entries, start + 1);
    }

    public int? GetRank(string userId)
    {
        var rank = _db.SortedSetRank(_key, userId, Order.Descending);
        return rank is null ? null : (int)rank + 1;
    }

    public IReadOnlyDictionary<string, string> GetUserMetadata(string userId)
    {
        var entries = _db.HashGetAll(MetadataKey(userId));
        return entries.ToDictionary(entry => (string)entry.Name!, entry => (string)entry.Value!);
    }

    public LeaderboardEntry? GetUserEntry(string userId)
    {
        var batch = _db.CreateBatch();
        var scoreTask = batch.SortedSetScoreAsync(_key, userId);
        var rankTask = batch.SortedSetRankAsync(_key, userId, Order.Descending);
        var metadataTask = batch.HashGetAllAsync(MetadataKey(userId));
        batch.Execute();
        Task.WaitAll(scoreTask, rankTask, metadataTask);

        if (scoreTask.Result is null || rankTask.Result is null)
        {
            return null;
        }

        return new LeaderboardEntry(
            Rank: (int)rankTask.Result + 1,
            UserId: userId,
            Score: scoreTask.Result.Value,
            Metadata: metadataTask.Result.ToDictionary(entry => (string)entry.Name!, entry => (string)entry.Value!),
            TrimmedUserIds: []);
    }

    public IReadOnlyList<LeaderboardEntry> ListAll()
    {
        var entries = _db.SortedSetRangeByRankWithScores(_key, 0, -1, Order.Descending);
        return HydrateEntries(entries, 1);
    }

    public long GetSize() => _db.SortedSetLength(_key);

    public bool DeleteUser(string userId)
    {
        var batch = _db.CreateBatch();
        var removeTask = batch.SortedSetRemoveAsync(_key, userId);
        var deleteMetadataTask = batch.KeyDeleteAsync(MetadataKey(userId));
        batch.Execute();
        Task.WaitAll(removeTask, deleteMetadataTask);
        return removeTask.Result;
    }

    public void Clear()
    {
        var userIds = _db.SortedSetRangeByRank(_key);
        var keys = new List<RedisKey> { _key };
        keys.AddRange(userIds.Select(userId => (RedisKey)MetadataKey(userId!)));
        _db.KeyDelete(keys.ToArray());
    }

    private string MetadataKey(string userId) => $"{_key}:user:{userId}";

    private static Dictionary<string, string> CoerceMetadata(IReadOnlyDictionary<string, string>? metadata) =>
        metadata is null ? [] : new Dictionary<string, string>(metadata);

    private IReadOnlyList<string> TrimToMaxEntries()
    {
        var overflow = GetSize() - _maxEntries;
        if (overflow <= 0)
        {
            return [];
        }

        var trimmedUserIds = _db.SortedSetRangeByRank(_key, 0, overflow - 1)
            .Select(value => (string)value!)
            .ToList();
        if (trimmedUserIds.Count == 0)
        {
            return [];
        }

        _db.SortedSetRemoveRangeByRank(_key, 0, overflow - 1);
        _db.KeyDelete(trimmedUserIds.Select(userId => (RedisKey)MetadataKey(userId)).ToArray());
        return trimmedUserIds;
    }

    private IReadOnlyList<LeaderboardEntry> HydrateEntries(SortedSetEntry[] entries, int startRank)
    {
        if (entries.Length == 0)
        {
            return [];
        }

        var batch = _db.CreateBatch();
        var metadataTasks = new List<Task<HashEntry[]>>();
        foreach (var entry in entries)
        {
            metadataTasks.Add(batch.HashGetAllAsync(MetadataKey(entry.Element!)));
        }

        batch.Execute();
        Task.WaitAll(metadataTasks.ToArray());

        return entries.Select((entry, index) => new LeaderboardEntry(
            Rank: startRank + index,
            UserId: entry.Element!,
            Score: entry.Score,
            Metadata: metadataTasks[index].Result.ToDictionary(
                hashEntry => (string)hashEntry.Name!,
                hashEntry => (string)hashEntry.Value!),
            TrimmedUserIds: [])).ToList();
    }

    private static int NormalizePositiveInt(int value, string fieldName) =>
        value < 1
            ? throw new ArgumentOutOfRangeException(fieldName, $"{fieldName} must be at least 1")
            : value;
}
