// Canonical URL normalization, shared across the lexical index, chunker, vector
// store, and hybrid fusion. It MUST be the single definition: the hybrid path
// matches pages across modules by normalized url (chunk.ts indexes by it,
// vector-store.ts returns it, hybrid.ts fuses on it, search.ts looks up by it),
// so any divergence would silently break cross-module findability.
export function normalizeUrl(u: string): string {
  return u.trim().toLowerCase().replace(/\/+$/, "");
}
