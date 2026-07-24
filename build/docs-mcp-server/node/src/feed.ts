import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import type { Page } from "./types.js";

/** Load raw feed bytes from a local path or http(s) URL, gunzipping if .gz. */
async function loadFeedRaw(source: string): Promise<string> {
  let buf: Buffer;
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to fetch feed ${source}: ${res.status} ${res.statusText}`);
    }
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = await readFile(source);
  }
  if (source.toLowerCase().endsWith(".gz")) {
    buf = gunzipSync(buf);
  }
  return buf.toString("utf-8");
}

/** Parse NDJSON text into pages, skipping blank/invalid lines and non-doc objects. */
export function parseNdjson(text: string): Page[] {
  const pages: Page[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      // Match the same guard generate_ndjson.py uses: must have id + title + url.
      if (obj && typeof obj.id === "string" && typeof obj.url === "string" && typeof obj.title === "string") {
        pages.push(obj as Page);
      }
    } catch {
      // Not our format — skip.
    }
  }
  return pages;
}

export async function loadFeed(source: string): Promise<Page[]> {
  return parseNdjson(await loadFeedRaw(source));
}
