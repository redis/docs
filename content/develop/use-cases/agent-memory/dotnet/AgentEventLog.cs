using System.Globalization;
using StackExchange.Redis;

namespace AgentMemoryDemo;

/// <summary>
/// Append-only event log for an agent thread, backed by a Redis
/// Stream.
/// </summary>
/// <remarks>
/// <para>Each thread gets a stream at <c>agent:events:{threadId}</c>.
/// Every action the agent takes (a user turn arriving, a memory being
/// recalled, a memory being written, a tool being called) is one
/// <c>XADD</c> to that stream. Replay with <c>XREVRANGE</c> for the
/// most recent N events; bound retention with <c>XTRIM MAXLEN ~</c>
/// so the log stays cheap regardless of how long the thread has been
/// running.</para>
///
/// <para>The stream is independent of the session hash and the
/// long-term memory store: it answers the "what just happened"
/// question without competing with either of those for indexing or
/// memory budget. Consumer groups (not used in this demo) would let
/// downstream workers — summarisers, consolidators, audit pipelines —
/// replay the log without losing position.</para>
/// </remarks>
public sealed class AgentEventLog
{
    /// <summary>
    /// Approximate cap on stream length. <c>MAXLEN ~</c> lets Redis
    /// trim in whole-node units instead of exactly-N units, which is
    /// much cheaper at the cost of overshooting the bound by up to a
    /// node's worth.
    /// </summary>
    public const int DefaultMaxLen = 1000;

    private readonly IDatabase _db;
    public string KeyPrefix { get; }
    public int MaxLen { get; }

    public AgentEventLog(
        IDatabase db,
        string keyPrefix = "agent:events:",
        int maxLen = DefaultMaxLen)
    {
        _db = db;
        KeyPrefix = keyPrefix;
        MaxLen = maxLen;
    }

    public string StreamKey(string threadId) => KeyPrefix + threadId;

    /// <summary>
    /// Append one event and return its stream id.
    /// </summary>
    /// <remarks>
    /// <c>MAXLEN ~ N</c> keeps the stream bounded with near-zero
    /// overhead; an exact bound (<c>MAXLEN N</c> without the tilde)
    /// forces a scan and is rarely worth the cost.
    /// </remarks>
    public string Record(string threadId, string action, string detail = "")
    {
        var fields = new NameValueEntry[]
        {
            new("action", action),
            new("detail", detail),
            new("ts", UnixSeconds().ToString("F6", CultureInfo.InvariantCulture)),
        };
        // StreamAdd's `useApproximateMaxLength: true` issues
        // `MAXLEN ~ N` rather than the exact form.
        RedisValue id = _db.StreamAdd(
            StreamKey(threadId),
            fields,
            messageId: null,
            maxLength: MaxLen,
            useApproximateMaxLength: true);
        return (string)id!;
    }

    /// <summary>Return the most recent events, newest first.</summary>
    public List<AgentEvent> Recent(string threadId, int count = 20)
    {
        var entries = _db.StreamRange(
            StreamKey(threadId), "+", "-", count: count, messageOrder: Order.Descending);
        var out_ = new List<AgentEvent>(entries.Length);
        foreach (var entry in entries)
        {
            var fields = entry.Values.ToDictionary(v => (string)v.Name!, v => (string)v.Value!);
            out_.Add(new AgentEvent(
                EventId: (string)entry.Id!,
                ThreadId: threadId,
                Action: fields.GetValueOrDefault("action") ?? "",
                Detail: fields.GetValueOrDefault("detail") ?? "",
                Ts: ParseDouble(fields.GetValueOrDefault("ts"), 0)));
        }
        return out_;
    }

    /// <summary>Current stream length.</summary>
    public long Length(string threadId) => _db.StreamLength(StreamKey(threadId));

    /// <summary>Drop the entire stream for a thread.</summary>
    public bool Clear(string threadId) => _db.KeyDelete(StreamKey(threadId));

    private static double UnixSeconds()
        => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;

    private static double ParseDouble(string? value, double fallback)
        => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var d)
            ? d : fallback;
}
