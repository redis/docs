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

  // A boundary-suffix url (only reached when there was no exact match) plus id.
  if (input.url) index.matchByUrlSuffix(input.url).forEach(add);
  if (input.id) index.getPagesById(input.id).forEach(add);
  return [...byUrl.values()];
}

function describeHandles(input: GetPageInput): string {
  const parts: string[] = [];
  if (input.url) parts.push(`url '${input.url}'`);
  if (input.id) parts.push(`id '${input.id}'`);
  return parts.join(" and ");
}

function ambiguous(input: GetPageInput, candidates: Page[]) {
  return {
    error: `Ambiguous lookup: ${describeHandles(input)} matched ${candidates.length} pages. Call get_page again with a single, exact url.`,
    candidates: candidates.map((p) => ({ title: p.title, url: p.url })),
  };
}

function render(page: Page, input: GetPageInput) {
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

/** Fetch one page, optionally filtered to sections with the given roles. */
export function getPage(index: DocsIndex, input: GetPageInput) {
  // An exact url is unique and authoritative. Return it directly rather than
  // diluting it with a (possibly non-unique) id supplied alongside it — UNLESS
  // the id points somewhere else entirely, which is a genuine conflict worth
  // surfacing. A search hit's id is that page's own id, so the common
  // exact-url + its-own-id case resolves cleanly.
  if (input.url) {
    const exact = index.getByUrl(input.url);
    if (exact) {
      if (input.id) {
        const idPages = index.getPagesById(input.id);
        if (idPages.length > 0 && !idPages.some((p) => p.url === exact.url)) {
          const byUrl = new Map<string, Page>();
          [exact, ...idPages].forEach((p) => byUrl.set(p.url, p));
          return ambiguous(input, [...byUrl.values()]);
        }
      }
      return render(exact, input);
    }
  }

  // Otherwise converge across the remaining handles (boundary-suffix url + id)
  // and resolve only when they point at exactly one page.
  const candidates = collectCandidates(index, input);
  if (candidates.length === 0) {
    return { error: `Page not found for ${describeHandles(input)}.` };
  }
  if (candidates.length > 1) {
    return ambiguous(input, candidates);
  }
  return render(candidates[0], input);
}
