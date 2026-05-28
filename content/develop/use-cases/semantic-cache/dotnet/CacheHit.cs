namespace SemanticCacheDemo;

/// <summary>
/// A cache lookup that returned a cached response.
/// </summary>
/// <remarks>
/// <para><see cref="Distance"/> is the cosine distance
/// <c>FT.SEARCH</c> reported for the nearest cached prompt (0 =
/// identical, 2 = opposite). It is always at or below the threshold
/// the lookup was run with.</para>
/// </remarks>
public sealed record CacheHit(
    string Id,
    string Prompt,
    string Response,
    string Tenant,
    string Locale,
    string ModelVersion,
    double Distance,
    long TtlSeconds,
    long HitCount
) : LookupResult;
