import { z } from "zod";
import type { DocsIndex } from "../search.js";
import type { Page } from "../types.js";

export const GetPageInput = z
  .object({
    id: z.string().optional(),
    url: z.string().optional(),
    roles: z.array(z.string()).optional(),
  })
  .refine((v) => Boolean(v.id || v.url), {
    message: "Provide either 'id' or 'url'.",
  });
export type GetPageInput = z.infer<typeof GetPageInput>;

/**
 * The distinct pages (deduped by unique url) that the supplied handles resolve
 * to. `url` is authoritative when it matches an exact page; otherwise it is
 * treated as a path-boundary suffix. `id` is the last URL segment and is not
 * unique, so it may contribute several pages. Collecting across all handles
 * (rather than short-circuiting) means an ambiguous url still lets `id` help,
 * and it surfaces the case where url and id point at *different* pages.
 */
function collectCandidates(index: DocsIndex, input: GetPageInput): Page[] {
  const byUrl = new Map<string, Page>();
  const add = (p: Page | undefined) => {
    if (p) byUrl.set(p.url, p);
  };

  if (input.url) {
    const exact = index.getByUrl(input.url);
    if (exact) add(exact);
    else index.matchByUrlSuffix(input.url).forEach(add);
  }
  if (input.id) {
    index.getPagesById(input.id).forEach(add);
  }
  return [...byUrl.values()];
}

function describeHandles(input: GetPageInput): string {
  const parts: string[] = [];
  if (input.url) parts.push(`url '${input.url}'`);
  if (input.id) parts.push(`id '${input.id}'`);
  return parts.join(" and ");
}

/** Fetch one page, optionally filtered to sections with the given roles. */
export function getPage(index: DocsIndex, input: GetPageInput) {
  const candidates = collectCandidates(index, input);

  if (candidates.length === 0) {
    return { error: `Page not found for ${describeHandles(input)}.` };
  }
  if (candidates.length > 1) {
    // Ambiguous (a non-unique id / boundary suffix) or conflicting (url and id
    // point at different pages) — either way, make the caller pick a url.
    return {
      error: `Ambiguous lookup: ${describeHandles(input)} matched ${candidates.length} pages. Call get_page again with a single, exact url.`,
      candidates: candidates.map((p) => ({ title: p.title, url: p.url })),
    };
  }

  const page = candidates[0];
  let sections = page.sections ?? [];
  if (input.roles && input.roles.length) {
    const want = new Set(input.roles.map((r) => r.toLowerCase()));
    sections = sections.filter((s) => want.has((s.role ?? "").toLowerCase()));
  }

  return {
    id: page.id,
    title: page.title,
    url: page.url,
    summary: page.summary ?? "",
    page_type: page.page_type ?? "content",
    content_hash: page.content_hash,
    sections,
  };
}
