// Hybrid searcher (hosted mode). Fuses the existing app-side BM25 lexical ranker
// (DocsIndex) with Redis vector KNN using weighted reciprocal-rank fusion,
// favouring the vector signal ~3x. This is the recipe the DOC-6809 measure-first
// work settled on (SPEC §6/§10): section-level bge-small embeddings + weighted
// RRF. Query embedding happens in-process via fastembed-js (embed.ts). Lexical
// and fusion stay here in the app because native FT.HYBRID can't express the
// weighted recipe and its raw BM25 is much weaker than this ranker (Step 3).
import type { DocsIndex, SearchHit, SearchOptions } from "./search.js";
import type { VectorStore } from "./vector-store.js";
import { embedQuery } from "./embed.js";
import { normalizeUrl } from "./url.js";

const RRF_K = 60;
const DEFAULT_VECTOR_WEIGHT = 3;
const LEXICAL_POOL = 50; // lexical candidates fused
const VECTOR_POOL = 200; // vector chunks fetched (deduped to <=50 pages)

/** Weighted reciprocal-rank fusion. Returns url -> fused score. */
function weightedRrf(
  lists: Array<{ urls: string[]; weight: number }>,
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const { urls, weight } of lists) {
    urls.forEach((url, rank) => {
      scores.set(url, (scores.get(url) ?? 0) + weight / (RRF_K + rank + 1));
    });
  }
  return scores;
}

export class HybridSearcher {
  constructor(
    private readonly index: DocsIndex,
    private readonly store: VectorStore,
    private readonly vectorWeight = DEFAULT_VECTOR_WEIGHT,
  ) {}

  async search(query: string, opts: SearchOptions = {}): Promise<SearchHit[]> {
    const limit = opts.limit ?? 10;

    // Lexical side (already page-type filtered) is computed first and always
    // usable. The vector side (query embedding + Redis KNN) can fail transiently
    // — if it does, degrade to lexical-only rather than failing the whole tool
    // call, since hybrid is meant to be an enhancement over a working lexical base.
    const lexHits = this.index.search(query, { limit: LEXICAL_POOL, pageType: opts.pageType });
    let vecUrls: string[];
    try {
      const qvec = await embedQuery(query);
      vecUrls = await this.store.knn(qvec, VECTOR_POOL, LEXICAL_POOL);
    } catch (e) {
      console.error(
        `[redis-docs-mcp] vector search failed, returning lexical-only: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      return lexHits.slice(0, limit);
    }

    const lexByUrl = new Map(lexHits.map((h) => [normalizeUrl(h.url), h]));
    const lexUrls = lexHits.map((h) => normalizeUrl(h.url));

    const fused = weightedRrf([
      { urls: vecUrls, weight: this.vectorWeight },
      { urls: lexUrls, weight: 1 },
    ]);

    const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]);

    const out: SearchHit[] = [];
    for (const [url, score] of ranked) {
      // Page-type filter: lexical hits are pre-filtered; a vector-only url must
      // be checked against the page's type here.
      const lex = lexByUrl.get(url);
      let hit: SearchHit | undefined;
      if (lex) {
        hit = { ...lex, score: Number(score.toFixed(4)) };
      } else {
        hit = this.index.hitForUrl(url, query, score);
      }
      if (!hit) continue;
      if (opts.pageType && hit.page_type !== opts.pageType) continue;
      out.push(hit);
      if (out.length >= limit) break;
    }
    return out;
  }
}
