namespace SemanticCacheDemo;

/// <summary>
/// Result of a cache lookup. Either a <see cref="CacheHit"/> or a
/// <see cref="CacheMiss"/>; pattern-matched in the demo server to
/// branch between the hit and miss paths. Mirrors the
/// <c>CacheHit | CacheMiss</c> union the Python and Node ports
/// return.
/// </summary>
public abstract record LookupResult;
