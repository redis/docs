namespace AgentMemoryDemo;

/// <summary>One turn inside the rolling session window.</summary>
public sealed record SessionTurn(string Role, string Content, double Ts);

/// <summary>The full per-thread working-memory state.</summary>
public sealed record SessionState(
    string ThreadId,
    string User,
    string Agent,
    string Goal,
    string Scratchpad,
    long TurnCount,
    double CreatedTs,
    double LastActiveTs,
    IReadOnlyList<SessionTurn> RecentTurns,
    long TtlSeconds);

/// <summary>A single long-term memory document.</summary>
/// <remarks>
/// <para><see cref="Distance"/> is populated only when the record
/// comes back from a KNN query; <see cref="TtlSeconds"/> is
/// <c>null</c> for memories with no TTL (e.g. <c>kind=semantic</c>
/// under the default tier map).</para>
/// </remarks>
public sealed record MemoryRecord(
    string Id,
    string User,
    string Namespace,
    string Kind,
    string SourceThread,
    string Text,
    double CreatedTs,
    long HitCount,
    double? Distance = null,
    long? TtlSeconds = null);

/// <summary>Outcome of a <c>LongTermMemory.Remember</c> call.</summary>
/// <remarks>
/// <para><see cref="Deduped"/> is <c>true</c> when the write skipped
/// because a similar memory already existed; <see cref="Id"/> is then
/// the existing memory's id. <see cref="ExistingDistance"/> is the
/// cosine distance to that nearest memory regardless of which branch
/// was taken — useful for tracing.</para>
/// </remarks>
public sealed record WriteResult(string Id, bool Deduped, double? ExistingDistance);

/// <summary>One entry from the per-thread event Stream.</summary>
public sealed record AgentEvent(
    string EventId,
    string ThreadId,
    string Action,
    string Detail,
    double Ts);

/// <summary>Subset of <c>FT.INFO</c> useful for the demo UI.</summary>
public sealed record IndexSnapshot(long NumDocs, long IndexingFailures);
