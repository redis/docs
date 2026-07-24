// Document schema as published in docs.ndjson / per-page index.json.
// See content/ai-agent-resources.md for the authoritative field reference.

export interface Section {
  id: string;
  title: string;
  /** Semantic role: overview | syntax | parameters | returns | example | ... */
  role?: string;
  text: string;
}

export interface Example {
  id: string;
  language: string;
  code: string;
  section_id: string;
}

export interface Child {
  title?: string;
  url?: string;
}

export interface Page {
  id: string;
  title: string;
  url: string;
  summary?: string;
  /** "content" (has prose) or "index" (navigation only) */
  page_type?: string;
  content_hash?: string;
  sections?: Section[];
  examples?: Example[];
  children?: Child[];
}
