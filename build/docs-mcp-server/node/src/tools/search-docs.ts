import { z } from "zod";
import type { DocsIndex } from "../search.js";

export const SearchDocsInput = z.object({
  query: z.string().min(1, "query is required"),
  page_type: z.enum(["content", "index"]).optional(),
  limit: z.number().int().positive().max(50).optional(),
});
export type SearchDocsInput = z.infer<typeof SearchDocsInput>;

/** Rank pages by relevance. Returns refs + summaries only — never full text. */
export function searchDocs(index: DocsIndex, input: SearchDocsInput) {
  const results = index.search(input.query, {
    limit: input.limit ?? 10,
    pageType: input.page_type,
  });
  return { query: input.query, count: results.length, results };
}
