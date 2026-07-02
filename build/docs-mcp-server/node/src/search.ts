import type { Page } from "./types.js";

// Self-contained BM25 lexical index. No external search dependency: at
// ~4,100 docs the whole index builds in-memory in well under a second, which
// is why v0 needs no datastore (see SPEC.md §6).

const K1 = 1.5;
const B = 0.75;

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
    const toks = new Set(tokenize(`${s.title ?? ""} ${s.text ?? ""}`));
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

/**
 * Heuristic version filter. Redis docs carry the version in the URL path
 * (e.g. /docs/latest/... or /docs/7.4/...). "latest"/unset does not filter.
 * NOTE: approximate pending confirmation of how versions appear in the feed
 * (SPEC.md §7 / open question).
 */
function matchesVersion(page: Page, version: string): boolean {
  if (!version || version.toLowerCase() === "latest") return true;
  return page.url.includes(`/${version}/`);
}

export interface SearchOptions {
  limit?: number;
  pageType?: string;
  version?: string;
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

export class DocsIndex {
  readonly pages: Page[];
  private byId = new Map<string, Page>();
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
      this.byId.set(p.id, p);
      if (p.url) this.byUrl.set(normalizeUrl(p.url), p);

      const tokens = tokenize(searchableText(p));
      if (tokens.length === 0) continue;
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({
        page: p,
        tf,
        len: tokens.length,
        titleTok: new Set(tokenize(p.title ?? "")),
        slugTok: new Set(tokenize(p.id ?? "")),
        summaryTok: new Set(tokenize(p.summary ?? "")),
      });
      totalLen += tokens.length;
    }
    this.N = this.docs.length;
    this.avgdl = this.N ? totalLen / this.N : 0;
  }

  get size(): number {
    return this.pages.length;
  }

  getById(id: string): Page | undefined {
    return this.byId.get(id);
  }

  getByUrl(url: string): Page | undefined {
    return this.byUrl.get(normalizeUrl(url));
  }

  /** Fallback lookup when a caller passes a path or partial URL. */
  findByUrlSuffix(url: string): Page | undefined {
    const target = normalizeUrl(url).replace(/^https?:\/\/[^/]+/, "");
    if (!target) return undefined;
    for (const p of this.pages) {
      if (normalizeUrl(p.url).endsWith(target)) return p;
    }
    return undefined;
  }

  search(query: string, opts: SearchOptions = {}): SearchHit[] {
    let qterms = [...new Set(tokenize(query))].filter((t) => !STOPWORDS.has(t));
    // If the query was *all* stopwords, fall back to using them rather than
    // returning nothing.
    if (qterms.length === 0) qterms = [...new Set(tokenize(query))];
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
      if (opts.version && !matchesVersion(d.page, opts.version)) continue;

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
