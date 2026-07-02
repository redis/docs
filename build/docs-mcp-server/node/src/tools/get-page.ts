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

/** An ambiguous id/url lookup: report all candidates so the caller can retry. */
function ambiguous(kind: "id" | "url", value: string, matches: Page[]) {
  return {
    error: `Ambiguous ${kind} '${value}' matches ${matches.length} pages. Call get_page again with a full, exact url.`,
    candidates: matches.map((p) => ({ title: p.title, url: p.url })),
  };
}

/** Fetch one page, optionally filtered to sections with the given roles. */
export function getPage(index: DocsIndex, input: GetPageInput) {
  // Prefer url: a full url is unique. A partial/suffix url can match several
  // pages, so disambiguate rather than silently taking the first.
  let page: Page | undefined;
  if (input.url) {
    page = index.getByUrl(input.url);
    if (!page) {
      const matches = index.matchByUrlSuffix(input.url);
      if (matches.length === 1) {
        page = matches[0];
      } else if (matches.length > 1) {
        return ambiguous("url", input.url, matches);
      }
    }
  }

  // id is the last URL path segment and can match several pages, so resolve by
  // id only when unambiguous.
  if (!page && input.id) {
    const matches = index.getPagesById(input.id);
    if (matches.length === 1) {
      page = matches[0];
    } else if (matches.length > 1) {
      return ambiguous("id", input.id, matches);
    }
  }

  if (!page) {
    return { error: `Page not found for ${JSON.stringify(input.url ?? input.id)}` };
  }

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
