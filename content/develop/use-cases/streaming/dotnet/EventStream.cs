using StackExchange.Redis;

namespace StreamingDemo;

/// <summary>
/// One entry as it comes off the stream: a stream ID and a flat
/// field/value dictionary of strings.
/// </summary>
public sealed record StreamRecord(string Id, Dictionary<string, string> Fields);

/// <summary>
/// A single pending-entries-list (PEL) row, as returned by XPENDING.
/// </summary>
public sealed record PendingEntry(
    string Id,
    string Consumer,
    long IdleMs,
    int Deliveries);

/// <summary>
/// Result of an XAUTOCLAIM sweep: every claimed entry plus any IDs
/// whose stream payload had already been trimmed by MAXLEN ~.
/// </summary>
public sealed record AutoClaimResult(
    IReadOnlyList<StreamRecord> Claimed,
    IReadOnlyList<string> DeletedIds);

/// <summary>
/// Producer/consumer helper for a single Redis Stream with consumer
/// groups. Producers append events with XADD; consumers belong to
/// consumer groups and read with XREADGROUP. Each consumer gets its
/// own pending-entries list (PEL) of in-flight messages it has been
/// handed; once a consumer has processed an entry it acknowledges it
/// with XACK. Entries left unacknowledged past an idle threshold can
/// be swept to a healthy consumer with XAUTOCLAIM (or to a specific
/// one with XCLAIM).
/// </summary>
public sealed class EventStream
{
    private readonly IDatabase _db;
    private readonly string _streamKey;
    private readonly int _maxlenApprox;
    private readonly long _claimMinIdleMs;

    private long _producedTotal;
    private long _ackedTotal;
    private long _claimedTotal;

    public EventStream(
        IDatabase db,
        string streamKey = "demo:events:orders",
        int maxlenApprox = 10_000,
        long claimMinIdleMs = 15_000)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _streamKey = streamKey;
        _maxlenApprox = maxlenApprox;
        _claimMinIdleMs = claimMinIdleMs;
    }

    public string StreamKey => _streamKey;
    public int MaxlenApprox => _maxlenApprox;
    public long ClaimMinIdleMs => _claimMinIdleMs;

    // ------------------------------------------------------------------
    // Producer
    // ------------------------------------------------------------------

    /// <summary>Append a single event. Returns the stream ID Redis assigned.</summary>
    public string Produce(string eventType, IDictionary<string, string?> payload)
    {
        return ProduceBatch(new[] { (eventType, payload) })[0];
    }

    /// <summary>
    /// Pipeline several XADD calls in one round trip.
    /// Each entry carries an approximate MAXLEN cap. The "~" flavour
    /// lets Redis trim at a macro-node boundary, which is much cheaper
    /// than exact trimming and is the right call for a retention
    /// guardrail rather than a hard size limit.
    /// </summary>
    public string[] ProduceBatch(IEnumerable<(string EventType, IDictionary<string, string?> Payload)> events)
    {
        var eventList = events.ToList();
        if (eventList.Count == 0)
        {
            return Array.Empty<string>();
        }

        var batch = _db.CreateBatch();
        var addTasks = new Task<RedisValue>[eventList.Count];
        for (var i = 0; i < eventList.Count; i++)
        {
            var (eventType, payload) = eventList[i];
            var pairs = EncodeFields(eventType, payload);
            addTasks[i] = batch.StreamAddAsync(
                _streamKey,
                pairs,
                messageId: null,
                maxLength: _maxlenApprox,
                useApproximateMaxLength: true);
        }
        batch.Execute();
        Task.WaitAll(addTasks);

        var ids = new string[addTasks.Length];
        for (var i = 0; i < addTasks.Length; i++)
        {
            ids[i] = (string)addTasks[i].Result!;
        }
        Interlocked.Add(ref _producedTotal, ids.Length);
        return ids;
    }

    private static NameValueEntry[] EncodeFields(string eventType, IDictionary<string, string?> payload)
    {
        var entries = new List<NameValueEntry>(payload.Count + 2)
        {
            new("type", eventType),
            new("ts_ms", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()),
        };
        foreach (var kv in payload)
        {
            entries.Add(new NameValueEntry(kv.Key, kv.Value ?? ""));
        }
        return entries.ToArray();
    }

    // ------------------------------------------------------------------
    // Consumer groups
    // ------------------------------------------------------------------

    /// <summary>
    /// Create the consumer group if it doesn't exist.
    /// "$" means "deliver only events appended after this point";
    /// pass "0-0" to replay the entire stream into a fresh group.
    /// </summary>
    public void EnsureGroup(string group, string startId = "$")
    {
        try
        {
            _db.StreamCreateConsumerGroup(
                _streamKey,
                group,
                position: startId,
                createStream: true);
        }
        catch (RedisServerException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.Ordinal))
        {
            // Group already exists — nothing to do.
        }
    }

    public bool DeleteGroup(string group)
    {
        try
        {
            return _db.StreamDeleteConsumerGroup(_streamKey, group);
        }
        catch (RedisServerException)
        {
            return false;
        }
    }

    /// <summary>
    /// Read new entries for this consumer via XREADGROUP.
    /// The ">" ID means "deliver entries this consumer group has not
    /// delivered to anyone yet" — that is the at-least-once path.
    /// Replaying an explicit ID instead would re-deliver an entry that
    /// is already in this consumer's pending list (see
    /// <see cref="ConsumeOwnPel"/> for that recovery path).
    /// Note: StackExchange.Redis' XREADGROUP wrapper is non-blocking,
    /// so a real consumer loop polls on a short interval.
    /// </summary>
    public List<StreamRecord> Consume(string group, string consumer, int count = 10)
    {
        var entries = _db.StreamReadGroup(
            _streamKey,
            group,
            consumer,
            position: ">",
            count: count);
        return ToRecords(entries);
    }

    /// <summary>
    /// Re-deliver entries already in this consumer's PEL.
    /// Reading with an explicit ID ("0" here) instead of ">" replays the
    /// entries already assigned to this consumer name without advancing
    /// the group's last-delivered-id. This is the canonical recovery
    /// path after a crash on the same consumer name, and is also how a
    /// consumer picks up entries that another consumer (or XAUTOCLAIM)
    /// handed to it.
    /// </summary>
    public List<StreamRecord> ConsumeOwnPel(string group, string consumer, int count = 10)
    {
        var entries = _db.StreamReadGroup(
            _streamKey,
            group,
            consumer,
            position: "0",
            count: count);
        return ToRecords(entries);
    }

    public long Ack(string group, IEnumerable<string> ids)
    {
        var idArray = ids.Select(id => (RedisValue)id).ToArray();
        if (idArray.Length == 0)
        {
            return 0;
        }
        var n = _db.StreamAcknowledge(_streamKey, group, idArray);
        Interlocked.Add(ref _ackedTotal, n);
        return n;
    }

    /// <summary>
    /// Sweep idle pending entries to <paramref name="consumer"/>.
    /// A single XAUTOCLAIM call scans up to <paramref name="pageCount"/>
    /// PEL entries starting at <paramref name="startId"/> and returns a
    /// continuation cursor. For a full sweep of the PEL, loop until the
    /// cursor returns to "0-0" (or hit <paramref name="maxPages"/> as a
    /// safety net so a very large PEL can't monopolise the call).
    ///
    /// <see cref="AutoClaimResult.DeletedIds"/> are PEL entries whose
    /// stream payload had already been trimmed by the time this sweep
    /// ran (typically because MAXLEN ~ retention outran a slow consumer).
    /// XAUTOCLAIM removes those dangling slots from the PEL itself — the
    /// caller does <b>not</b> need to XACK them — but they cannot be
    /// retried, so log and route them to a dead-letter store for
    /// observability.
    /// </summary>
    public AutoClaimResult Autoclaim(
        string group,
        string consumer,
        int pageCount = 100,
        string startId = "0-0",
        int maxPages = 10)
    {
        var claimedAll = new List<StreamRecord>();
        var deletedAll = new List<string>();
        var cursor = startId;
        for (var i = 0; i < maxPages; i++)
        {
            var result = _db.StreamAutoClaim(
                _streamKey,
                group,
                consumer,
                minIdleTimeInMs: _claimMinIdleMs,
                startAtId: cursor,
                count: pageCount);
            if (result.IsNull)
            {
                break;
            }
            foreach (var entry in result.ClaimedEntries)
            {
                claimedAll.Add(EntryToRecord(entry));
            }
            if (result.DeletedIds != null)
            {
                foreach (var id in result.DeletedIds)
                {
                    deletedAll.Add((string)id!);
                }
            }
            var nextId = (string)result.NextStartId!;
            if (nextId == "0-0")
            {
                break;
            }
            cursor = nextId;
        }
        Interlocked.Add(ref _claimedTotal, claimedAll.Count);
        return new AutoClaimResult(claimedAll, deletedAll);
    }

    /// <summary>
    /// Drop a consumer from a group.
    /// XGROUP DELCONSUMER destroys this consumer's PEL entries — any
    /// entry it still owned is no longer tracked anywhere in the group,
    /// and XAUTOCLAIM will never find it again. Always
    /// <see cref="HandoverPending"/> (or XCLAIM it manually) to a
    /// healthy consumer first; this method is the raw destructive call
    /// and is exposed only for explicit cleanup.
    /// </summary>
    public long DeleteConsumer(string group, string consumer)
    {
        try
        {
            return _db.StreamDeleteConsumer(_streamKey, group, consumer);
        }
        catch (RedisServerException)
        {
            return 0;
        }
    }

    /// <summary>
    /// Move every PEL entry owned by <paramref name="fromConsumer"/> to
    /// <paramref name="toConsumer"/>.
    /// Enumerates the source consumer's PEL with XPENDING ... CONSUMER
    /// and reassigns each ID with XCLAIM at zero idle time so the move
    /// is unconditional. (XAUTOCLAIM does not filter by source consumer,
    /// so it cannot be used for a per-consumer handover.) Call this
    /// before <see cref="DeleteConsumer"/> whenever the source still has
    /// pending entries — otherwise XGROUP DELCONSUMER would silently
    /// destroy them and they could never be recovered.
    /// </summary>
    public int HandoverPending(
        string group,
        string fromConsumer,
        string toConsumer,
        int batch = 100)
    {
        var totalClaimed = 0;
        while (true)
        {
            // Errors from XPENDING / XCLAIM propagate up to the caller.
            // Swallowing them here and returning a partial count would
            // let the caller think the handover succeeded; the caller's
            // next step is XGROUP DELCONSUMER, which would destroy
            // whatever entries were left in the source's PEL.
            var rows = _db.StreamPendingMessages(
                _streamKey,
                group,
                batch,
                consumerName: fromConsumer);
            if (rows.Length == 0)
            {
                break;
            }
            var ids = rows.Select(r => r.MessageId).ToArray();
            var claimed = _db.StreamClaim(
                _streamKey,
                group,
                toConsumer,
                minIdleTimeInMs: 0,
                messageIds: ids);
            totalClaimed += claimed.Length;
            if (rows.Length < batch)
            {
                break;
            }
        }
        Interlocked.Add(ref _claimedTotal, totalClaimed);
        return totalClaimed;
    }

    // ------------------------------------------------------------------
    // Replay, length, trim
    // ------------------------------------------------------------------

    /// <summary>
    /// Range read with XRANGE for replay or audit.
    /// Read-only: ranges do not update any group cursor and do not ack
    /// anything. Useful for bootstrapping a new projection, for
    /// building an audit view, or for debugging what actually went
    /// through the stream.
    /// </summary>
    public List<StreamRecord> Replay(string startId = "-", string endId = "+", int count = 100)
    {
        var entries = _db.StreamRange(
            _streamKey,
            minId: startId,
            maxId: endId,
            count: count);
        return entries.Select(EntryToRecord).ToList();
    }

    /// <summary>
    /// Newest N entries via XREVRANGE — handy for a tail-style view.
    /// </summary>
    public List<StreamRecord> Tail(int count = 10)
    {
        var entries = _db.StreamRange(
            _streamKey,
            minId: "-",
            maxId: "+",
            count: count,
            messageOrder: Order.Descending);
        return entries.Select(EntryToRecord).ToList();
    }

    public long Length()
    {
        try
        {
            return _db.StreamLength(_streamKey);
        }
        catch (RedisServerException)
        {
            return 0;
        }
    }

    public long TrimMaxlen(int maxlen)
    {
        return _db.StreamTrim(_streamKey, maxlen, useApproximateMaxLength: true);
    }

    public long TrimMinid(string minid)
    {
        // StreamTrim only exposes the MAXLEN variant; reach for the raw
        // command for MINID.
        var raw = _db.Execute("XTRIM", _streamKey, "MINID", "~", minid);
        return (long)raw;
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    public Dictionary<string, object?> InfoStream()
    {
        try
        {
            var info = _db.StreamInfo(_streamKey);
            return new Dictionary<string, object?>
            {
                ["length"] = info.Length,
                ["last_generated_id"] = (string?)info.LastGeneratedId,
                ["first_entry_id"] = info.FirstEntry.IsNull ? null : (string?)info.FirstEntry.Id,
                ["last_entry_id"] = info.LastEntry.IsNull ? null : (string?)info.LastEntry.Id,
            };
        }
        catch (RedisServerException)
        {
            return new Dictionary<string, object?>
            {
                ["length"] = 0L,
                ["last_generated_id"] = null,
                ["first_entry_id"] = null,
                ["last_entry_id"] = null,
            };
        }
    }

    public List<Dictionary<string, object?>> InfoGroups()
    {
        try
        {
            var groups = _db.StreamGroupInfo(_streamKey);
            return groups.Select(g => new Dictionary<string, object?>
            {
                ["name"] = (string)g.Name!,
                ["consumers"] = (long)g.ConsumerCount,
                ["pending"] = (long)g.PendingMessageCount,
                ["last_delivered_id"] = (string?)g.LastDeliveredId,
                ["lag"] = g.Lag,
            }).ToList();
        }
        catch (RedisServerException)
        {
            return new List<Dictionary<string, object?>>();
        }
    }

    public List<Dictionary<string, object?>> InfoConsumers(string group)
    {
        try
        {
            var consumers = _db.StreamConsumerInfo(_streamKey, group);
            return consumers.Select(c => new Dictionary<string, object?>
            {
                ["name"] = (string)c.Name!,
                ["pending"] = (long)c.PendingMessageCount,
                ["idle_ms"] = c.IdleTimeInMilliseconds,
            }).ToList();
        }
        catch (RedisServerException)
        {
            return new List<Dictionary<string, object?>>();
        }
    }

    /// <summary>Per-entry PEL view (id, consumer, idle, deliveries).</summary>
    public List<PendingEntry> PendingDetail(string group, int count = 20)
    {
        try
        {
            var rows = _db.StreamPendingMessages(_streamKey, group, count, consumerName: RedisValue.Null);
            return rows.Select(r => new PendingEntry(
                (string)r.MessageId!,
                (string)r.ConsumerName!,
                r.IdleTimeInMilliseconds,
                r.DeliveryCount)).ToList();
        }
        catch (RedisServerException)
        {
            return new List<PendingEntry>();
        }
    }

    public Dictionary<string, long> Stats()
    {
        return new Dictionary<string, long>
        {
            ["produced_total"] = Interlocked.Read(ref _producedTotal),
            ["acked_total"] = Interlocked.Read(ref _ackedTotal),
            ["claimed_total"] = Interlocked.Read(ref _claimedTotal),
        };
    }

    public void ResetStats()
    {
        Interlocked.Exchange(ref _producedTotal, 0);
        Interlocked.Exchange(ref _ackedTotal, 0);
        Interlocked.Exchange(ref _claimedTotal, 0);
    }

    // ------------------------------------------------------------------
    // Demo housekeeping
    // ------------------------------------------------------------------

    /// <summary>Drop the stream key entirely. Used by the demo's reset path.</summary>
    public void DeleteStream()
    {
        _db.KeyDelete(_streamKey);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static List<StreamRecord> ToRecords(StreamEntry[] entries)
    {
        var list = new List<StreamRecord>(entries.Length);
        foreach (var entry in entries)
        {
            list.Add(EntryToRecord(entry));
        }
        return list;
    }

    private static StreamRecord EntryToRecord(StreamEntry entry)
    {
        var fields = new Dictionary<string, string>(entry.Values.Length, StringComparer.Ordinal);
        foreach (var value in entry.Values)
        {
            fields[(string)value.Name!] = (string?)value.Value ?? "";
        }
        return new StreamRecord((string)entry.Id!, fields);
    }
}
