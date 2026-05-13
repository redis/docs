using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;
using StackExchange.Redis;

namespace PubSubDemo;

/// <summary>
/// Message shape delivered to every <see cref="Subscription"/> callback.
/// Pattern subscriptions carry the original pattern in <see cref="Pattern"/>;
/// exact-match subscriptions leave it null.
/// </summary>
public sealed class ReceivedMessage
{
    [JsonPropertyName("channel")]
    public string Channel { get; }

    [JsonPropertyName("pattern")]
    public string? Pattern { get; }

    [JsonPropertyName("payload")]
    public object? Payload { get; }

    [JsonPropertyName("received_at_ms")]
    public long ReceivedAtMs { get; }

    public ReceivedMessage(string channel, string? pattern, object? payload, long receivedAtMs)
    {
        Channel = channel;
        Pattern = pattern;
        Payload = payload;
        ReceivedAtMs = receivedAtMs;
    }
}

/// <summary>
/// A named in-process subscriber bound to one or more channels or patterns.
///
/// StackExchange.Redis multiplexes every subscription in the process onto a
/// single underlying subscribe connection, so unlike redis-py / node-redis
/// each <see cref="Subscription"/> does NOT own its own socket. Subscriptions
/// are still independent at the application level: closing one only detaches
/// its own handler, the shared subscribe connection survives.
/// </summary>
public sealed class Subscription
{
    private readonly ISubscriber _subscriber;
    private readonly RedisChannel[] _bindings;
    private readonly Action<RedisChannel, RedisValue> _handler;
    private readonly int _bufferSize;
    private readonly LinkedList<ReceivedMessage> _buffer = new();
    private readonly object _lock = new();
    private long _received;
    private bool _closed;

    [JsonPropertyName("name")]
    public string Name { get; }

    [JsonPropertyName("targets")]
    public IReadOnlyList<string> Targets { get; }

    [JsonPropertyName("is_pattern")]
    public bool IsPattern { get; }

    [JsonPropertyName("received_total")]
    public long ReceivedTotal
    {
        get { lock (_lock) return _received; }
    }

    [JsonPropertyName("alive")]
    public bool Alive => !_closed;

    internal Subscription(
        string name,
        IEnumerable<string> targets,
        bool isPattern,
        ISubscriber subscriber,
        int bufferSize)
    {
        var targetList = targets?.ToList() ?? new List<string>();
        if (targetList.Count == 0)
        {
            throw new ArgumentException("Subscription requires at least one channel or pattern", nameof(targets));
        }
        Name = name;
        Targets = targetList;
        IsPattern = isPattern;
        _subscriber = subscriber;
        _bufferSize = bufferSize;

        _bindings = new RedisChannel[targetList.Count];
        for (var i = 0; i < targetList.Count; i++)
        {
            _bindings[i] = isPattern
                ? RedisChannel.Pattern(targetList[i])
                : RedisChannel.Literal(targetList[i]);
        }

        // The handler is stored as a field so the same delegate instance is
        // used to subscribe and unsubscribe — StackExchange.Redis matches by
        // delegate identity when detaching.
        _handler = OnMessage;
        foreach (var binding in _bindings)
        {
            _subscriber.Subscribe(binding, _handler);
        }
    }

    private void OnMessage(RedisChannel actualChannel, RedisValue value)
    {
        // For pattern subscriptions, `actualChannel` is the matched channel,
        // not the pattern. We capture the registered pattern (Targets[0] when
        // there's one binding, or `null` when multiple patterns could match
        // — we report the first that matches by glob).
        string? pattern = null;
        if (IsPattern)
        {
            var name = (string)actualChannel!;
            pattern = MatchPattern(name) ?? Targets[0];
        }

        var data = (string?)value;
        object? payload;
        try
        {
            payload = data is null ? null : JsonSerializer.Deserialize<JsonElement>(data);
        }
        catch (JsonException)
        {
            payload = data;
        }

        var message = new ReceivedMessage(
            channel: (string?)actualChannel ?? string.Empty,
            pattern: pattern,
            payload: payload,
            receivedAtMs: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        );

        lock (_lock)
        {
            _buffer.AddFirst(message);
            if (_buffer.Count > _bufferSize)
            {
                _buffer.RemoveLast();
            }
            _received += 1;
        }
    }

    private string? MatchPattern(string channelName)
    {
        // Cheap glob check so multi-pattern subscriptions can carry the
        // right pattern through to the buffer. Supports '*', '?' and
        // '[set]' the way Redis does (good enough for the demo UI).
        foreach (var target in Targets)
        {
            if (Glob.Match(target, channelName)) return target;
        }
        return null;
    }

    public IReadOnlyList<ReceivedMessage> Messages(int? limit = null)
    {
        lock (_lock)
        {
            if (limit is null || limit >= _buffer.Count)
            {
                return _buffer.ToArray();
            }
            return _buffer.Take(limit.Value).ToArray();
        }
    }

    public void ResetReceived()
    {
        lock (_lock)
        {
            _buffer.Clear();
            _received = 0;
        }
    }

    public bool IsAlive() => !_closed;

    public void Close()
    {
        if (_closed) return;
        _closed = true;
        foreach (var binding in _bindings)
        {
            try
            {
                _subscriber.Unsubscribe(binding, _handler);
            }
            catch
            {
                // Best effort during teardown.
            }
        }
    }
}

/// <summary>
/// Publish/subscribe helper with publisher counters and subscriber registry.
///
/// One <see cref="ConnectionMultiplexer"/> is shared across the whole hub.
/// PUBLISH and the PUBSUB introspection commands go through the regular
/// command pipeline; SUBSCRIBE / PSUBSCRIBE share a single dedicated
/// subscribe connection managed transparently by the multiplexer.
/// </summary>
public sealed class RedisPubSubHub
{
    private readonly ConnectionMultiplexer _multiplexer;
    private readonly IDatabase _db;
    private readonly ISubscriber _subscriber;
    private readonly int _bufferSize;

    private readonly ConcurrentDictionary<string, Subscription> _subscriptions = new();
    private long _publishedTotal;
    private long _deliveredTotal;
    private readonly ConcurrentDictionary<string, long> _channelPublished = new();

    public RedisPubSubHub(ConnectionMultiplexer multiplexer, int bufferSize = 50)
    {
        _multiplexer = multiplexer ?? throw new ArgumentNullException(nameof(multiplexer));
        _db = multiplexer.GetDatabase();
        _subscriber = multiplexer.GetSubscriber();
        _bufferSize = bufferSize;
    }

    /// <summary>
    /// Publish <paramref name="message"/> to <paramref name="channel"/> and
    /// return Redis' delivered count. The message is JSON-encoded so callers
    /// can pass dicts, lists, or scalars without converting on every call.
    /// </summary>
    public long Publish(string channel, object? message)
    {
        var payload = JsonSerializer.Serialize(message);
        var delivered = _subscriber.Publish(RedisChannel.Literal(channel), payload);
        Interlocked.Increment(ref _publishedTotal);
        Interlocked.Add(ref _deliveredTotal, delivered);
        _channelPublished.AddOrUpdate(channel, 1, (_, current) => current + 1);
        return delivered;
    }

    /// <summary>Register a named exact-match subscription on one or more channels.</summary>
    public Subscription Subscribe(string name, IEnumerable<string> channels) =>
        Register(name, channels, isPattern: false);

    /// <summary>Register a named pattern subscription on one or more glob patterns.</summary>
    public Subscription PSubscribe(string name, IEnumerable<string> patterns) =>
        Register(name, patterns, isPattern: true);

    private Subscription Register(string name, IEnumerable<string> targets, bool isPattern)
    {
        var sub = new Subscription(name, targets, isPattern, _subscriber, _bufferSize);
        if (!_subscriptions.TryAdd(name, sub))
        {
            sub.Close();
            throw new ArgumentException($"subscription named '{name}' already exists", nameof(name));
        }
        return sub;
    }

    /// <summary>Close and remove the named subscription. Returns true if it existed.</summary>
    public bool Unsubscribe(string name)
    {
        if (!_subscriptions.TryRemove(name, out var sub))
        {
            return false;
        }
        sub.Close();
        return true;
    }

    public IReadOnlyList<Subscription> Subscriptions() => _subscriptions.Values.ToArray();

    public Subscription? GetSubscription(string name) =>
        _subscriptions.TryGetValue(name, out var sub) ? sub : null;

    /// <summary>List server-side channels with at least one subscriber (PUBSUB CHANNELS).</summary>
    /// <remarks>
    /// StackExchange.Redis maintains an internal <c>__Booksleeve_MasterChanged</c>
    /// subscription on its shared subscribe connection so it can react to
    /// replica/master changes; we hide it here so the UI only shows user channels.
    /// </remarks>
    public string[] ActiveChannels(string pattern = "*")
    {
        var endpoints = _multiplexer.GetEndPoints();
        if (endpoints.Length == 0) return Array.Empty<string>();
        var server = _multiplexer.GetServer(endpoints[0]);
        var channels = server.SubscriptionChannels(RedisChannel.Pattern(pattern));
        return channels
            .Select(c => (string)c!)
            .Where(c => c is not null && !c.StartsWith("__Booksleeve"))
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToArray();
    }

    /// <summary>
    /// Count subscribers per channel (PUBSUB NUMSUB). Reports only exact-match
    /// subscriptions — pattern subscribers are counted separately via
    /// <see cref="PatternSubscriberCount"/>.
    /// </summary>
    public Dictionary<string, long> ChannelSubscriberCounts(IEnumerable<string> channels)
    {
        var channelArray = channels?.ToArray() ?? Array.Empty<string>();
        var result = new Dictionary<string, long>();
        if (channelArray.Length == 0) return result;

        var args = new object[channelArray.Length + 1];
        args[0] = "NUMSUB";
        for (var i = 0; i < channelArray.Length; i++)
        {
            args[i + 1] = channelArray[i];
        }

        var raw = _db.Execute("PUBSUB", args);
        // PUBSUB NUMSUB returns a flat array: [ch1, count1, ch2, count2, ...]
        if (raw.Resp2Type == ResultType.Array)
        {
            var entries = (RedisResult[])raw!;
            for (var i = 0; i + 1 < entries.Length; i += 2)
            {
                var ch = (string?)entries[i] ?? "";
                var n = (long)entries[i + 1];
                result[ch] = n;
            }
        }
        // Make sure every requested channel appears, defaulting to 0.
        foreach (var ch in channelArray)
        {
            if (!result.ContainsKey(ch)) result[ch] = 0;
        }
        return result;
    }

    /// <summary>Total active pattern subscriptions across all clients (PUBSUB NUMPAT).</summary>
    public long PatternSubscriberCount()
    {
        var raw = _db.Execute("PUBSUB", "NUMPAT");
        return (long)raw;
    }

    /// <summary>Combined publish and subscribe counters plus the current registry size.</summary>
    public Dictionary<string, object> Stats()
    {
        var subs = _subscriptions.Values.ToArray();
        var channelPublished = _channelPublished
            .ToDictionary(kv => kv.Key, kv => kv.Value);
        var receivedTotal = subs.Sum(s => s.ReceivedTotal);

        return new Dictionary<string, object>
        {
            ["published_total"] = Interlocked.Read(ref _publishedTotal),
            ["delivered_total"] = Interlocked.Read(ref _deliveredTotal),
            ["received_total"] = receivedTotal,
            ["active_subscriptions"] = (long)subs.Length,
            ["channel_published"] = channelPublished,
            ["pattern_subscriptions"] = PatternSubscriberCount(),
        };
    }

    public void ResetStats()
    {
        Interlocked.Exchange(ref _publishedTotal, 0);
        Interlocked.Exchange(ref _deliveredTotal, 0);
        _channelPublished.Clear();
        foreach (var sub in _subscriptions.Values)
        {
            sub.ResetReceived();
        }
    }

    /// <summary>Close every active subscription. Safe to call more than once.</summary>
    public void Shutdown()
    {
        var subs = _subscriptions.Values.ToArray();
        _subscriptions.Clear();
        foreach (var sub in subs)
        {
            sub.Close();
        }
    }
}

// Minimal Redis-style glob matcher (* ? and [set]). Used only so a multi-
// pattern subscription can report which of its registered patterns matched
// a published channel; the actual matching is performed by Redis.
internal static class Glob
{
    public static bool Match(string pattern, string input)
    {
        return MatchAt(pattern, 0, input, 0);
    }

    private static bool MatchAt(string p, int pi, string s, int si)
    {
        while (pi < p.Length)
        {
            var c = p[pi];
            if (c == '*')
            {
                while (pi + 1 < p.Length && p[pi + 1] == '*') pi++;
                if (pi == p.Length - 1) return true;
                for (var k = si; k <= s.Length; k++)
                {
                    if (MatchAt(p, pi + 1, s, k)) return true;
                }
                return false;
            }
            if (si >= s.Length) return false;
            if (c == '?')
            {
                pi++; si++; continue;
            }
            if (c == '[')
            {
                var close = p.IndexOf(']', pi + 1);
                if (close < 0) return false;
                var set = p.Substring(pi + 1, close - pi - 1);
                if (!set.Contains(s[si])) return false;
                pi = close + 1; si++; continue;
            }
            if (c != s[si]) return false;
            pi++; si++;
        }
        return si == s.Length;
    }
}
