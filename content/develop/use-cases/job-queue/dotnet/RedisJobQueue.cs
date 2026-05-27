using System.Security.Cryptography;
using System.Text.Json;
using StackExchange.Redis;

namespace JobQueueDemo;

/// <summary>
/// A job that has been atomically moved into the processing list.
/// </summary>
public record ClaimedJob(
    string Id,
    IDictionary<string, object> Payload,
    int Attempts,
    string ClaimToken);

/// <summary>
/// Reliable FIFO job queue with visibility-timeout reclaim.
/// </summary>
public class RedisJobQueue
{
    // Mark a job complete and remove it from the processing list. Only deletes
    // from the processing list if the worker still owns the claim token; this
    // prevents a worker that was reclaimed (because it went over the visibility
    // timeout) from later marking a job complete that another worker has
    // already picked up.
    private const string CompleteScript = """
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
redis.call('HSET', meta_key,
  'status', ARGV[3],
  'completed_at_ms', ARGV[4],
  'result', ARGV[5])
redis.call('EXPIRE', meta_key, ARGV[6])
redis.call('LPUSH', KEYS[3], ARGV[1])
redis.call('LTRIM', KEYS[3], 0, ARGV[7] - 1)
return 1
""";

    // Record a failure. If the job still has retries left it goes back to the
    // pending list; otherwise it lands in the failed list with its metadata
    // expiring on the same schedule as completed jobs. Only acts if the
    // caller still owns the claim token — a reclaimed job can't be failed
    // by the original claimant.
    private const string FailScript = """
local meta_key = KEYS[1] .. ARGV[1]
local current_token = redis.call('HGET', meta_key, 'claim_token')
if current_token ~= ARGV[2] then
  return 0
end
redis.call('LREM', KEYS[2], 1, ARGV[1])
if ARGV[7] == '1' then
  redis.call('HSET', meta_key,
    'status', 'pending',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '',
    'claimed_at_ms', 0)
  redis.call('LPUSH', KEYS[3], ARGV[1])
  return 1
else
  redis.call('HSET', meta_key,
    'status', 'failed',
    'last_error', ARGV[3],
    'last_error_at_ms', ARGV[4],
    'claim_token', '')
  redis.call('LPUSH', KEYS[4], ARGV[1])
  redis.call('LTRIM', KEYS[4], 0, ARGV[6] - 1)
  redis.call('EXPIRE', meta_key, ARGV[5])
  return 2
end
""";

    // Reclaim jobs whose claim has gone stale. Walks the processing list and
    // moves any job past the visibility timeout back to the pending list.
    // A job is past the timeout if either:
    //   - claimed_at_ms is set and (now - claimed_at_ms) > visibility_ms, OR
    //   - claimed_at_ms is missing (worker crashed between BRPOPLPUSH and the
    //     metadata write) and (now - enqueued_at_ms) > 2 * visibility_ms.
    // Runs in one round trip so a concurrent worker can't claim a
    // half-reclaimed job.
    private const string ReclaimScript = """
local now_ms = tonumber(ARGV[1])
local visibility_ms = tonumber(ARGV[2])
local processing = redis.call('LRANGE', KEYS[2], 0, -1)
local reclaimed = {}
for _, job_id in ipairs(processing) do
  local meta_key = KEYS[3] .. job_id
  local claimed_at = tonumber(redis.call('HGET', meta_key, 'claimed_at_ms') or '0')
  local enqueued_at = tonumber(redis.call('HGET', meta_key, 'enqueued_at_ms') or '0')
  local stale = false
  if claimed_at > 0 and (now_ms - claimed_at) > visibility_ms then
    stale = true
  elseif claimed_at == 0 and enqueued_at > 0 and (now_ms - enqueued_at) > (visibility_ms * 2) then
    stale = true
  end
  if stale then
    redis.call('LREM', KEYS[2], 1, job_id)
    redis.call('LPUSH', KEYS[1], job_id)
    redis.call('HSET', meta_key,
      'status', 'pending',
      'reclaimed_at_ms', now_ms,
      'claim_token', '',
      'claimed_at_ms', 0)
    table.insert(reclaimed, job_id)
  end
end
return reclaimed
""";

    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private readonly string _queueName;
    private readonly long _visibilityMs;
    private readonly int _completedTtl;
    private readonly int _completedHistory;
    private readonly int _maxAttempts;

    private readonly string _pendingKey;
    private readonly string _processingKey;
    private readonly string _completedKey;
    private readonly string _failedKey;
    private readonly string _metaPrefix;
    private readonly string _eventsChannel;

    private readonly object _statsLock = new();
    private long _enqueued;
    private long _completed;
    private long _failed;
    private long _reclaimed;

    public RedisJobQueue(
        IConnectionMultiplexer redis,
        string queueName = "jobs",
        long visibilityMs = 5000,
        int completedTtl = 300,
        int completedHistory = 50,
        int maxAttempts = 3)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _db = redis.GetDatabase();
        _queueName = queueName;
        _visibilityMs = visibilityMs;
        _completedTtl = completedTtl;
        _completedHistory = completedHistory;
        _maxAttempts = maxAttempts;

        _pendingKey = $"queue:{queueName}:pending";
        _processingKey = $"queue:{queueName}:processing";
        _completedKey = $"queue:{queueName}:completed";
        _failedKey = $"queue:{queueName}:failed";
        _metaPrefix = $"queue:{queueName}:job:";
        _eventsChannel = $"queue:{queueName}:events";
    }

    public long VisibilityMs => _visibilityMs;

    private string MetaKey(string jobId) => $"{_metaPrefix}{jobId}";

    private static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    private static string RandomTokenHex(int bytes = 8)
    {
        var buffer = new byte[bytes];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToHexString(buffer).ToLowerInvariant();
    }

    /// <summary>
    /// Push a new job onto the pending list and return its ID.
    /// </summary>
    public string Enqueue(IDictionary<string, object> payload)
    {
        var jobId = RandomTokenHex(8);
        var nowMs = NowMs();
        var metaKey = MetaKey(jobId);

        var hashEntries = new[]
        {
            new HashEntry("id", jobId),
            new HashEntry("payload", JsonSerializer.Serialize(payload)),
            new HashEntry("status", "pending"),
            new HashEntry("attempts", 0),
            new HashEntry("enqueued_at_ms", nowMs),
            new HashEntry("claim_token", ""),
        };

        var batch = _db.CreateBatch();
        var hashTask = batch.HashSetAsync(metaKey, hashEntries);
        var pushTask = batch.ListLeftPushAsync(_pendingKey, jobId);
        batch.Execute();
        Task.WaitAll(hashTask, pushTask);

        lock (_statsLock)
        {
            _enqueued++;
        }
        return jobId;
    }

    /// <summary>
    /// Try to atomically claim a pending job. Returns null if nothing arrives
    /// before <paramref name="timeoutMs"/>.
    /// </summary>
    /// <remarks>
    /// StackExchange.Redis does not expose a blocking BRPOPLPUSH because
    /// blocking commands monopolise the multiplexer's single command pipeline.
    /// Instead we call the non-blocking ListRightPopLeftPush and, on a miss,
    /// sleep for the timeout and retry once. In production, replace this with
    /// async polling using HashGetAllAsync / ScriptEvaluateAsync.
    /// </remarks>
    public ClaimedJob? Claim(int timeoutMs = 1000)
    {
        var deadline = Environment.TickCount64 + Math.Max(0, timeoutMs);
        // Poll with a short fixed interval — keeps demo latency low without
        // burning the multiplexer with tight-loop calls.
        const int pollIntervalMs = 50;

        RedisValue popped;
        while (true)
        {
            popped = _db.ListRightPopLeftPush(_pendingKey, _processingKey);
            if (!popped.IsNull)
            {
                break;
            }
            var remaining = deadline - Environment.TickCount64;
            if (remaining <= 0)
            {
                return null;
            }
            Thread.Sleep((int)Math.Min(pollIntervalMs, remaining));
        }

        var jobId = (string)popped!;
        var token = RandomTokenHex(8);
        var nowMs = NowMs();
        var metaKey = MetaKey(jobId);

        var batch = _db.CreateBatch();
        var hashSetTask = batch.HashSetAsync(metaKey, new[]
        {
            new HashEntry("status", "processing"),
            new HashEntry("claimed_at_ms", nowMs),
            new HashEntry("claim_token", token),
        });
        var incrTask = batch.HashIncrementAsync(metaKey, "attempts", 1);
        var hgetallTask = batch.HashGetAllAsync(metaKey);
        batch.Execute();
        Task.WaitAll(hashSetTask, incrTask, hgetallTask);

        var meta = ToDictionary(hgetallTask.Result);
        var payload = ParseJsonObject(meta.GetValueOrDefault("payload", "{}"));
        var attempts = int.TryParse(meta.GetValueOrDefault("attempts", "1"), out var a) ? a : 1;
        return new ClaimedJob(jobId, payload, attempts, token);
    }

    /// <summary>
    /// Mark a job complete. Only succeeds if the worker still owns the claim.
    /// </summary>
    public bool Complete(ClaimedJob job, IDictionary<string, object> result)
    {
        var keys = new RedisKey[] { _metaPrefix, _processingKey, _completedKey };
        var args = new RedisValue[]
        {
            job.Id,
            job.ClaimToken,
            "completed",
            NowMs(),
            JsonSerializer.Serialize(result),
            _completedTtl,
            _completedHistory,
        };

        var raw = _db.ScriptEvaluate(CompleteScript, keys, args);
        var ok = !raw.IsNull && (long)raw == 1;
        if (!ok)
        {
            return false;
        }

        _db.Publish(
            RedisChannel.Literal(_eventsChannel),
            JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["id"] = job.Id,
                ["status"] = "completed",
            }));

        lock (_statsLock)
        {
            _completed++;
        }
        return true;
    }

    /// <summary>
    /// Record a failure. Retries up to <c>maxAttempts</c>, then gives up.
    /// </summary>
    public bool Fail(ClaimedJob job, string error)
    {
        var retry = job.Attempts < _maxAttempts;
        var keys = new RedisKey[]
        {
            _metaPrefix,
            _processingKey,
            _pendingKey,
            _failedKey,
        };
        var args = new RedisValue[]
        {
            job.Id,
            job.ClaimToken,
            error,
            NowMs(),
            _completedTtl,
            _completedHistory,
            retry ? "1" : "0",
        };

        var raw = _db.ScriptEvaluate(FailScript, keys, args);
        if (raw.IsNull || (long)raw == 0)
        {
            return false;
        }

        _db.Publish(
            RedisChannel.Literal(_eventsChannel),
            JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["id"] = job.Id,
                ["status"] = retry ? "retry" : "failed",
            }));

        if (!retry)
        {
            lock (_statsLock)
            {
                _failed++;
            }
        }
        return true;
    }

    /// <summary>
    /// Move processing-list jobs past the visibility timeout back to pending.
    /// </summary>
    public IReadOnlyList<string> ReclaimStuck()
    {
        var keys = new RedisKey[] { _pendingKey, _processingKey, _metaPrefix };
        var args = new RedisValue[] { NowMs(), _visibilityMs };

        var raw = _db.ScriptEvaluate(ReclaimScript, keys, args);
        if (raw.IsNull)
        {
            return Array.Empty<string>();
        }

        var reclaimedArray = (RedisResult[])raw!;
        var ids = reclaimedArray.Select(r => (string)r!).ToList();
        if (ids.Count > 0)
        {
            lock (_statsLock)
            {
                _reclaimed += ids.Count;
            }
        }
        return ids;
    }

    /// <summary>
    /// Return the current metadata hash for <paramref name="jobId"/>, decoded.
    /// </summary>
    public IDictionary<string, object>? GetJob(string jobId)
    {
        var entries = _db.HashGetAll(MetaKey(jobId));
        if (entries.Length == 0)
        {
            return null;
        }

        var result = new Dictionary<string, object>();
        foreach (var entry in entries)
        {
            var name = (string)entry.Name!;
            var value = (string)entry.Value!;
            if (name == "payload")
            {
                result[name] = ParseJsonObject(value);
            }
            else if (name == "result")
            {
                // Result may be JSON; try to parse, otherwise keep raw string.
                try
                {
                    result[name] = ParseJsonObject(value);
                }
                catch (JsonException)
                {
                    result[name] = value;
                }
            }
            else
            {
                result[name] = value;
            }
        }
        return result;
    }

    public IReadOnlyList<string> ListPending()
    {
        var raw = _db.ListRange(_pendingKey, 0, -1);
        // Python returns the list reversed so the oldest pending job is first.
        return raw.Reverse().Select(v => (string)v!).ToList();
    }

    public IReadOnlyList<string> ListProcessing()
    {
        var raw = _db.ListRange(_processingKey, 0, -1);
        return raw.Select(v => (string)v!).ToList();
    }

    public IReadOnlyList<string> ListCompleted()
    {
        var raw = _db.ListRange(_completedKey, 0, -1);
        return raw.Select(v => (string)v!).ToList();
    }

    public IReadOnlyList<string> ListFailed()
    {
        var raw = _db.ListRange(_failedKey, 0, -1);
        return raw.Select(v => (string)v!).ToList();
    }

    /// <summary>
    /// Return counters plus the current queue depth.
    /// </summary>
    public IDictionary<string, object> Stats()
    {
        var batch = _db.CreateBatch();
        var pendingTask = batch.ListLengthAsync(_pendingKey);
        var processingTask = batch.ListLengthAsync(_processingKey);
        var completedTask = batch.ListLengthAsync(_completedKey);
        var failedTask = batch.ListLengthAsync(_failedKey);
        batch.Execute();
        Task.WaitAll(pendingTask, processingTask, completedTask, failedTask);

        lock (_statsLock)
        {
            return new Dictionary<string, object>
            {
                ["enqueued_total"] = _enqueued,
                ["completed_total"] = _completed,
                ["failed_total"] = _failed,
                ["reclaimed_total"] = _reclaimed,
                ["pending_depth"] = pendingTask.Result,
                ["processing_depth"] = processingTask.Result,
                ["completed_depth"] = completedTask.Result,
                ["failed_depth"] = failedTask.Result,
                ["visibility_ms"] = _visibilityMs,
            };
        }
    }

    public void ResetStats()
    {
        lock (_statsLock)
        {
            _enqueued = 0;
            _completed = 0;
            _failed = 0;
            _reclaimed = 0;
        }
    }

    /// <summary>
    /// Delete every queue list and every job metadata hash.
    /// </summary>
    public void Purge()
    {
        // Delete the four queue lists.
        _db.KeyDelete(new RedisKey[]
        {
            _pendingKey,
            _processingKey,
            _completedKey,
            _failedKey,
        });

        // SCAN every metadata hash via the connected server.
        var endpoints = _redis.GetEndPoints();
        foreach (var endpoint in endpoints)
        {
            var server = _redis.GetServer(endpoint);
            if (!server.IsConnected || server.IsReplica)
            {
                continue;
            }
            foreach (var key in server.Keys(pattern: $"{_metaPrefix}*"))
            {
                _db.KeyDelete(key);
            }
        }

        ResetStats();
    }

    private static Dictionary<string, string> ToDictionary(HashEntry[] entries)
    {
        var result = new Dictionary<string, string>(entries.Length);
        foreach (var entry in entries)
        {
            result[(string)entry.Name!] = (string)entry.Value!;
        }
        return result;
    }

    private static IDictionary<string, object> ParseJsonObject(string raw)
    {
        if (string.IsNullOrEmpty(raw))
        {
            return new Dictionary<string, object>();
        }
        try
        {
            using var doc = JsonDocument.Parse(raw);
            return JsonElementToObject(doc.RootElement) as IDictionary<string, object>
                   ?? new Dictionary<string, object>();
        }
        catch (JsonException)
        {
            return new Dictionary<string, object>();
        }
    }

    private static object? JsonElementToObject(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object>();
                foreach (var prop in element.EnumerateObject())
                {
                    dict[prop.Name] = JsonElementToObject(prop.Value)!;
                }
                return dict;
            case JsonValueKind.Array:
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(JsonElementToObject(item));
                }
                return list;
            case JsonValueKind.String:
                return element.GetString() ?? string.Empty;
            case JsonValueKind.Number:
                if (element.TryGetInt64(out var l))
                {
                    return l;
                }
                return element.GetDouble();
            case JsonValueKind.True:
                return true;
            case JsonValueKind.False:
                return false;
            case JsonValueKind.Null:
            default:
                return null;
        }
    }
}
