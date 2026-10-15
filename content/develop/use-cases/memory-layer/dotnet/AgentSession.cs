using System.Globalization;
using System.Text.Json;
using StackExchange.Redis;

namespace AgentMemoryDemo;

/// <summary>
/// Working-memory store for an agent session, backed by a Redis Hash.
/// </summary>
/// <remarks>
/// <para>Each session is one Hash document at
/// <c>agent:session:{threadId}</c>. The hash holds the running
/// scratchpad, the current goal, a rolling window of recent turns
/// (serialised as a JSON list to fit in one field), and a few audit
/// fields. One <c>HGETALL</c> returns the whole session in a single
/// round trip on every step of the agent loop.</para>
///
/// <para>Every write refreshes the key's TTL with <c>EXPIRE</c>, so
/// idle sessions fall off without a separate cleanup job and active
/// sessions stay alive as long as the agent keeps touching them. A
/// separate <see cref="LongTermMemory"/> is what survives beyond a
/// session's TTL.</para>
///
/// <para>The turn window is bounded to <see cref="MaxTurns"/> in
/// application code; the hash itself doesn't grow, so the working set
/// per thread stays constant regardless of how long the agent has
/// been running.</para>
/// </remarks>
public sealed class AgentSession
{
    // How many recent turns to keep inline on the session hash. Older
    // turns flow through the event log (AgentEventLog) and the
    // long-term memory store (LongTermMemory).
    public const int DefaultMaxTurns = 20;

    private readonly IDatabase _db;
    public string KeyPrefix { get; }
    public long DefaultTtlSeconds { get; }
    public int MaxTurns { get; }

    public AgentSession(
        IDatabase db,
        string keyPrefix = "agent:session:",
        long defaultTtlSeconds = 3600,
        int maxTurns = DefaultMaxTurns)
    {
        _db = db;
        KeyPrefix = keyPrefix;
        DefaultTtlSeconds = defaultTtlSeconds;
        MaxTurns = maxTurns;
    }

    public string SessionKey(string threadId) => KeyPrefix + threadId;

    public string NewThreadId() => Guid.NewGuid().ToString("N").Substring(0, 12);

    /// <summary>
    /// Create a fresh working memory for a thread. Overwrites any
    /// existing session at the same key. The agent normally calls
    /// this once per thread at the first turn and relies on
    /// <see cref="Load"/> / <see cref="AppendTurn"/> for subsequent
    /// steps.
    /// </summary>
    public SessionState Start(
        string threadId,
        string user = "default",
        string agentName = "default",
        string goal = "",
        long? ttlSeconds = null)
    {
        long ttl = ttlSeconds ?? DefaultTtlSeconds;
        double now = UnixSeconds();
        var state = new SessionState(
            ThreadId: threadId,
            User: user,
            Agent: agentName,
            Goal: goal,
            Scratchpad: "",
            TurnCount: 0,
            CreatedTs: now,
            LastActiveTs: now,
            RecentTurns: Array.Empty<SessionTurn>(),
            TtlSeconds: ttl);
        Write(state, ttl);
        return state;
    }

    /// <summary>
    /// Return the session state, or <c>null</c> if it has expired.
    /// </summary>
    public SessionState? Load(string threadId)
    {
        string key = SessionKey(threadId);
        var raw = _db.HashGetAll(key);
        if (raw is null || raw.Length == 0) return null;
        var fields = raw.ToDictionary(e => (string)e.Name!, e => (string)e.Value!);
        TimeSpan? ttl = _db.KeyTimeToLive(key);
        long ttlSeconds = ttl is { TotalSeconds: > 0 } v ? (long)v.TotalSeconds : 0L;
        string turnsBlob = fields.GetValueOrDefault("recent_turns") ?? "[]";
        var turns = TryDeserializeTurns(turnsBlob);
        return new SessionState(
            ThreadId: threadId,
            User: fields.GetValueOrDefault("user") ?? "default",
            Agent: fields.GetValueOrDefault("agent") ?? "default",
            Goal: fields.GetValueOrDefault("goal") ?? "",
            Scratchpad: fields.GetValueOrDefault("scratchpad") ?? "",
            TurnCount: ParseLong(fields.GetValueOrDefault("turn_count"), 0),
            CreatedTs: ParseDouble(fields.GetValueOrDefault("created_ts"), 0),
            LastActiveTs: ParseDouble(fields.GetValueOrDefault("last_active_ts"), 0),
            RecentTurns: turns,
            TtlSeconds: ttlSeconds);
    }

    /// <summary>
    /// Append a turn, bound the rolling window, refresh the TTL.
    /// </summary>
    /// <remarks>
    /// <para><paramref name="user"/> and <paramref name="agentName"/>
    /// are only consulted when the session does not yet exist — they
    /// seed the auto-created session so the working-memory hash
    /// matches the user the caller is operating against. On an
    /// existing session they're ignored; the original <c>Start</c>
    /// values stand.</para>
    ///
    /// <para>Read-modify-write here is last-writer-wins on the turn
    /// list if two concurrent turns reach the same thread; the demo
    /// never triggers that race in practice (one browser, one turn at
    /// a time) but a multi-worker agent that shares a thread id would
    /// wrap this in <c>WATCH</c> / <c>MULTI</c> / <c>EXEC</c> or a
    /// Lua script that does the append atomically server-side.</para>
    /// </remarks>
    public SessionState AppendTurn(
        string threadId,
        string role,
        string content,
        string? user = null,
        string? agentName = null,
        long? ttlSeconds = null)
    {
        var state = Load(threadId)
            ?? Start(
                threadId,
                user: user ?? "default",
                agentName: agentName ?? "default",
                ttlSeconds: ttlSeconds);

        var newTurns = state.RecentTurns.ToList();
        newTurns.Add(new SessionTurn(Role: role, Content: content, Ts: UnixSeconds()));
        if (newTurns.Count > MaxTurns)
        {
            newTurns = newTurns.GetRange(newTurns.Count - MaxTurns, MaxTurns);
        }

        long ttl = ttlSeconds ?? DefaultTtlSeconds;
        var next = state with
        {
            TurnCount = state.TurnCount + 1,
            LastActiveTs = UnixSeconds(),
            RecentTurns = newTurns,
            TtlSeconds = ttl,
        };
        Write(next, ttl);
        return next;
    }

    /// <summary>
    /// Update the agent's running scratchpad and refresh the TTL.
    /// Returns <c>null</c> when the session does not exist.
    /// </summary>
    public SessionState? SetScratchpad(string threadId, string text, long? ttlSeconds = null)
    {
        var state = Load(threadId);
        if (state is null) return null;
        long ttl = ttlSeconds ?? DefaultTtlSeconds;
        var next = state with
        {
            Scratchpad = text,
            LastActiveTs = UnixSeconds(),
            TtlSeconds = ttl,
        };
        Write(next, ttl);
        return next;
    }

    /// <summary>
    /// Update the goal field without touching turns or the scratchpad.
    /// Creates the session if it doesn't exist yet — setting a goal
    /// on a fresh thread is a sensible first step in the agent loop,
    /// so this method covers both the "rename the goal mid-session"
    /// and the "start a thread with this goal" cases.
    /// </summary>
    public SessionState SetGoal(
        string threadId,
        string text,
        string? user = null,
        string? agentName = null,
        long? ttlSeconds = null)
    {
        var state = Load(threadId);
        if (state is null)
        {
            return Start(
                threadId,
                user: user ?? "default",
                agentName: agentName ?? "default",
                goal: text,
                ttlSeconds: ttlSeconds);
        }
        long ttl = ttlSeconds ?? DefaultTtlSeconds;
        var next = state with
        {
            Goal = text,
            LastActiveTs = UnixSeconds(),
            TtlSeconds = ttl,
        };
        Write(next, ttl);
        return next;
    }

    /// <summary>Drop the session immediately. Returns <c>true</c> if it existed.</summary>
    public bool Delete(string threadId) => _db.KeyDelete(SessionKey(threadId));

    /// <summary>Return active thread ids (for the demo's thread switcher).</summary>
    public List<string> ListThreads(int limit = 100)
    {
        var out_ = new List<string>();
        // SCAN via the server-set option; this stays incremental even
        // on a database with many session keys.
        var server = _db.Multiplexer.GetServer(_db.Multiplexer.GetEndPoints().First());
        foreach (var key in server.Keys(database: _db.Database, pattern: KeyPrefix + "*", pageSize: 200))
        {
            string raw = (string)key!;
            out_.Add(raw.StartsWith(KeyPrefix) ? raw.Substring(KeyPrefix.Length) : raw);
            if (out_.Count >= limit) break;
        }
        return out_;
    }

    private void Write(SessionState state, long ttl)
    {
        string key = SessionKey(state.ThreadId);
        var entries = new HashEntry[]
        {
            new("thread_id", state.ThreadId),
            new("user", state.User),
            new("agent", state.Agent),
            new("goal", state.Goal),
            new("scratchpad", state.Scratchpad),
            new("turn_count", state.TurnCount.ToString(CultureInfo.InvariantCulture)),
            new("created_ts", state.CreatedTs.ToString("F6", CultureInfo.InvariantCulture)),
            new("last_active_ts", state.LastActiveTs.ToString("F6", CultureInfo.InvariantCulture)),
            new("recent_turns", JsonSerializer.Serialize(state.RecentTurns.Select(t => new
            {
                role = t.Role,
                content = t.Content,
                ts = t.Ts,
            }))),
        };

        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. A connection drop between the two writes would
        // otherwise leave the session without a TTL. We check the
        // return value of Execute() — there's no WATCH on this
        // transaction so a false here means the server rejected the
        // batch (out of memory, OOM script kill, etc.); surface it
        // rather than letting the in-memory state drift from Redis.
        var tx = _db.CreateTransaction();
        _ = tx.HashSetAsync(key, entries);
        _ = tx.KeyExpireAsync(key, TimeSpan.FromSeconds(ttl));
        if (!tx.Execute())
        {
            throw new RedisServerException("session write MULTI/EXEC was discarded");
        }
    }

    private static IReadOnlyList<SessionTurn> TryDeserializeTurns(string blob)
    {
        try
        {
            using var doc = JsonDocument.Parse(blob);
            var result = new List<SessionTurn>(doc.RootElement.GetArrayLength());
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                string role = el.TryGetProperty("role", out var r) ? r.GetString() ?? "" : "";
                string content = el.TryGetProperty("content", out var c) ? c.GetString() ?? "" : "";
                double ts = el.TryGetProperty("ts", out var t) && t.TryGetDouble(out var d) ? d : 0.0;
                result.Add(new SessionTurn(role, content, ts));
            }
            return result;
        }
        catch (JsonException)
        {
            return Array.Empty<SessionTurn>();
        }
    }

    private static double UnixSeconds()
        => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;

    private static double ParseDouble(string? value, double fallback)
        => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var d) ? d : fallback;

    private static long ParseLong(string? value, long fallback)
        => long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var l) ? l : fallback;
}
