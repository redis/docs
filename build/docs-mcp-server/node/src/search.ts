import type { Page } from "./types.js";
import { stem as stemPorter } from "./stem.js";
import { stem as stemPaice } from "./stem-paice.js";

// Stemmer is switchable for the eval bake-off (STEMMER=paice|porter). Porter is
// the default/shipped analyzer.
const stem = (process.env.STEMMER ?? "porter").toLowerCase() === "paice" ? stemPaice : stemPorter;

// Self-contained BM25 lexical index. No external search dependency: at
// ~4,100 docs the whole index builds in-memory in well under a second, which
// is why v0 needs no datastore (see SPEC.md §6).

const K1 = 1.5;
const B = 0.75;

// Page-type weighting applied to the final score. Demote clearly-secondary
// reference material (release-notes / REST-API / other references) that was
// observed outranking primary docs. Multipliers, not filters.
//
// Deliberately balanced, NOT command-optimised: an earlier config boosted
// /commands/* (x1.5) and demoted all of /operate/ (x0.7), which lifted command
// queries but ranked command pages above the canonical concept page when both
// competed (persistence -> bgrewriteaof) and buried legitimate /operate/
// concept pages. The eval showed that cost concept recall@5 ~16pts for ~13pts
// of command gain, so we chose the balanced weighting (SPEC §10). Lifting
// command ranking further should come from better signal (vectors), not a
// bigger thumb on the scale.
function pageWeight(url: string): number {
  const u = url.toLowerCase();
  if (u.includes("/release-notes") || u.includes("/rest-api/") || u.includes("/references/")) {
    return 0.5;
  }
  return 1;
}

// Field boosts (added on top of the body BM25 score, weighted by term idf).
// A query term appearing in the title/slug/summary is a strong signal that the
// page is *about* that term — this lifts canonical command pages (whose summary
// is a one-line definition) above long pages that merely mention the terms.
const W_SUMMARY = 6; // canonical one-line definition — strongest signal
const W_TITLE = 4;
const W_SLUG = 2; // lowest: slug word-collisions (set-up-redis, key-specs) mislead

// Common words carry no topical signal and their title/slug/summary collisions
// distort ranking (e.g. "set"/"key"). Dropped from the query only.
const STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "in", "on", "for", "with", "and", "or", "is",
  "are", "how", "do", "i", "my", "me", "can", "what", "when", "which", "you",
  "your", "it", "this", "that", "from", "by", "as", "at", "be", "using", "use",
]);

/** Split on non-alphanumerics so "JSON.SET" -> ["json","set"], "XADD" -> ["xadd"]. */
function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** Tokenize + stem. Used for everything indexed and for query terms, so word
 * forms conflate. Stopwords are filtered on RAW tokens before this (see search). */
function analyze(text: string): string[] {
  return tokenize(text).map(stem);
}

function normalizeUrl(u: string): string {
  return u.trim().toLowerCase().replace(/\/+$/, "");
}

/** Everything worth matching against for a page: slug, title, summary, section text. */
function searchableText(p: Page): string {
  const parts: string[] = [p.id ?? "", p.title ?? "", p.summary ?? ""];
  for (const s of p.sections ?? []) {
    parts.push(s.title ?? "", s.text ?? "");
  }
  return parts.join(" ");
}

/** Section ids whose title/text contain any query term (capped for token budget). */
function matchingSections(p: Page, qterms: Set<string>): string[] {
  const out: string[] = [];
  for (const s of p.sections ?? []) {
    const toks = new Set(analyze(`${s.title ?? ""} ${s.text ?? ""}`));
    for (const t of qterms) {
      if (toks.has(t)) {
        out.push(s.id);
        break;
      }
    }
    if (out.length >= 5) break;
  }
  return out;
}

export interface SearchOptions {
  limit?: number;
  pageType?: string;
}

export interface SearchHit {
  id: string;
  title: string;
  url: string;
  summary: string;
  page_type: string;
  score: number;
  matching_section_ids: string[];
}

/** A ranking backend for search_docs. DocsIndex (lexical) is sync; the hosted
 * HybridSearcher is async — the tool awaits either. */
export interface Searcher {
  search(query: string, opts?: SearchOptions): SearchHit[] | Promise<SearchHit[]>;
}

export class DocsIndex {
  readonly pages: Page[];
  // The feed's `id` is the last URL path segment (e.g. "config", "acl") and is
  // NOT unique — ~200 ids map to several pages. So id -> list, and callers must
  // disambiguate by url. `url` IS unique, so byUrl stays 1:1.
  private byId = new Map<string, Page[]>();
  private byUrl = new Map<string, Page>();
  private docs: Array<{
    page: Page;
    tf: Map<string, number>;
    len: number;
    titleTok: Set<string>;
    slugTok: Set<string>;
    summaryTok: Set<string>;
  }> = [];
  private df = new Map<string, number>();
  private avgdl = 0;
  private N = 0;

  constructor(pages: Page[]) {
    this.pages = pages;
    let totalLen = 0;
    for (const p of pages) {
      const bucket = this.byId.get(p.id);
      if (bucket) bucket.push(p);
      else this.byId.set(p.id, [p]);
      if (p.url) this.byUrl.set(normalizeUrl(p.url), p);

      const tokens = analyze(searchableText(p));
      if (tokens.length === 0) continue;
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({
        page: p,
        tf,
        len: tokens.length,
        titleTok: new Set(analyze(p.title ?? "")),
        slugTok: new Set(analyze(p.id ?? "")),
        summaryTok: new Set(analyze(p.summary ?? "")),
      });
      totalLen += tokens.length;
    }
    this.N = this.docs.length;
    this.avgdl = this.N ? totalLen / this.N : 0;
  }

  get size(): number {
    return this.pages.length;
  }

  /** All pages sharing this id (usually one, but the feed's id is not unique). */
  getPagesById(id: string): Page[] {
    return this.byId.get(id) ?? [];
  }

  getByUrl(url: string): Page | undefined {
    return this.byUrl.get(normalizeUrl(url));
  }

  /**
   * Fallback lookup when a caller passes a path or partial URL. Returns EVERY
   * page whose url ends with the given suffix **at a path-segment boundary**,
   * so "get" matches ".../commands/get" but NOT ".../config-get" or
   * ".../arget". A suffix can still match several pages (e.g. "/install/" or a
   * bare last segment shared by many pages), so the caller must disambiguate.
   */
  matchByUrlSuffix(url: string): Page[] {
    const target = normalizeUrl(url).replace(/^https?:\/\/[^/]+/, "");
    if (!target) return [];
    // Anchor the leading edge to a "/" so we match whole path segments. The
    // trailing edge is already anchored: normalizeUrl strips the trailing slash
    // and we compare against the end of the string.
    const anchored = target.startsWith("/") ? target : `/${target}`;
    return this.pages.filter((p) => normalizeUrl(p.url).endsWith(anchored));
  }

  /**
   * Build a SearchHit for a page by url, for hybrid fusion — a page surfaced by
   * vector KNN may not appear in the lexical results, so it has no hit yet. The
   * caller supplies the fused score; matching sections are computed from the
   * query with the same analyzer as search().
   */
  hitForUrl(url: string, query: string, score: number): SearchHit | undefined {
    const p = this.getByUrl(url);
    if (!p) return undefined;
    const raw = [...new Set(tokenize(query))].filter((t) => !STOPWORDS.has(t));
    const base = raw.length ? raw : [...new Set(tokenize(query))];
    const qset = new Set(base.map(stem));
    return {
      id: p.id,
      title: p.title,
      url: p.url,
      summary: p.summary ?? "",
      page_type: p.page_type ?? "content",
      score: Number(score.toFixed(4)),
      matching_section_ids: matchingSections(p, qset),
    };
  }

  search(query: string, opts: SearchOptions = {}): SearchHit[] {
    // Filter stopwords on RAW tokens (before stemming), then stem + dedupe.
    const raw = [...new Set(tokenize(query))];
    let kept = raw.filter((t) => !STOPWORDS.has(t));
    if (kept.length === 0) kept = raw; // query was all stopwords
    const qterms = [...new Set(kept.map(stem))];
    if (qterms.length === 0) return [];

    const idf = new Map<string, number>();
    for (const t of qterms) {
      const df = this.df.get(t) ?? 0;
      idf.set(t, Math.log(1 + (this.N - df + 0.5) / (df + 0.5)));
    }

    const qset = new Set(qterms);
    const hits: SearchHit[] = [];
    for (const d of this.docs) {
      if (opts.pageType && (d.page.page_type ?? "content") !== opts.pageType) continue;

      let score = 0;
      for (const t of qterms) {
        const termIdf = idf.get(t) ?? 0;
        const tf = d.tf.get(t);
        if (tf) {
          const denom = tf + K1 * (1 - B + B * (d.len / (this.avgdl || 1)));
          score += termIdf * ((tf * (K1 + 1)) / denom);
        }
        // Field boosts: reward the term appearing in high-signal fields.
        if (d.slugTok.has(t)) score += termIdf * W_SLUG;
        if (d.titleTok.has(t)) score += termIdf * W_TITLE;
        if (d.summaryTok.has(t)) score += termIdf * W_SUMMARY;
      }
      if (score > 0) {
        score *= pageWeight(d.page.url);
        hits.push({
          id: d.page.id,
          title: d.page.title,
          url: d.page.url,
          summary: d.page.summary ?? "",
          page_type: d.page.page_type ?? "content",
          score: Number(score.toFixed(4)),
          matching_section_ids: matchingSections(d.page, qset),
        });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, opts.limit ?? 10);
  }
}
