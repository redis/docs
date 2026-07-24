// Section-level chunking for the vector index. Faithful port of the Python
// vector-eval build_chunks() (mode "section"), so Node-embedded corpus vectors
// correspond 1:1 with the offline experiment's chunks:
//   - one "anchor" chunk per page: "<title>. <summary>"
//   - up to MAX_SECTIONS section chunks: "<title> — <section title>. <body>"
//   - body truncated to LEAD_CHARS; sections with <20 chars of body skipped
//   - owner of every chunk is the page's normalized url
// Section-level chunking is what fixed the concept-query gap (DOC-6809 SPEC §10).
import type { Page } from "./types.js";

const LEAD_CHARS = 1200;
const MAX_SECTIONS = 8;

export interface Chunk {
  text: string;
  owner: string; // normalized page url
}

function normalizeUrl(u: string): string {
  return u.trim().toLowerCase().replace(/\/+$/, "");
}

export function buildChunks(pages: Page[]): Chunk[] {
  const chunks: Chunk[] = [];
  for (const p of pages) {
    const owner = normalizeUrl(p.url);
    const title = p.title ?? "";
    const summary = p.summary ?? "";
    const sections = p.sections ?? [];

    const anchor = [title, summary].filter(Boolean).join(". ").trim();
    if (anchor) chunks.push({ text: anchor, owner });

    let n = 0;
    for (const s of sections) {
      const body = (s.text ?? "").trim();
      if (body.length < 20) continue;
      const st = (s.title ?? "").trim();
      chunks.push({
        text: `${title} — ${st}. ${body.slice(0, LEAD_CHARS)}`.trim(),
        owner,
      });
      if (++n >= MAX_SECTIONS) break;
    }
    if (!anchor && n === 0) chunks.push({ text: title || owner, owner });
  }
  return chunks;
}
