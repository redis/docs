import { z } from "zod";
import type { DocsIndex } from "../search.js";

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

/** Fetch one page, optionally filtered to sections with the given roles. */
export function getPage(index: DocsIndex, input: GetPageInput) {
  let page = input.id ? index.getById(input.id) : undefined;
  if (!page && input.url) {
    page = index.getByUrl(input.url) ?? index.findByUrlSuffix(input.url);
  }
  if (!page) {
    return { error: `Page not found for ${JSON.stringify(input.id ?? input.url)}` };
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
