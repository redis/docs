namespace SemanticCacheDemo;

/// <summary>
/// A cache lookup that did not return a usable response.
/// </summary>
/// <remarks>
/// <para><see cref="NearestDistance"/> is the cosine distance to the
/// closest cached prompt that <em>did</em> match the metadata
/// filters. Both fields are <c>null</c> when the cache had no entry
/// in scope at all, which is what the demo UI shows as "no
/// candidate" vs. "candidate too far".</para>
/// </remarks>
public sealed record CacheMiss(
    double? NearestDistance,
    string? NearestId
) : LookupResult;
