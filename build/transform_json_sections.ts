#!/usr/bin/env npx tsx
/**
 * Transform JSON output files to include sectioned content for RAG systems.
 *
 * Reads index.json files from public/, splits content by headings,
 * and outputs a sections array with semantic roles.
 *
 * Usage: npx tsx build/transform_json_sections.ts [--dry-run] [--single <path>]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Role assignment based on common section title patterns
// Note: Order matters! More specific patterns must come before general ones.
// e.g., "version history" must match 'history' before "version" matches 'compatibility'
const ROLE_PATTERNS: [RegExp, string][] = [
  [/^(overview|introduction|about|description)/i, 'overview'],
  [/^(syntax|usage|command|signature)/i, 'syntax'],
  [/^(example|demo|sample|code example)/i, 'example'],
  [/^(option|parameter|argument|flag)/i, 'parameters'],
  [/^(return|response|output|result)/i, 'returns'],
  [/^(error|exception|troubleshoot)/i, 'errors'],
  [/^(performance|complexity|benchmark)/i, 'performance'],
  [/^(limit|constraint|restriction)/i, 'limits'],
  [/^(see also|related|learn more|reference)/i, 'related'],
  [/^(install|setup|getting started|quickstart)/i, 'setup'],
  [/^(configur|setting)/i, 'configuration'],
  [/^(security|auth|permission|acl)/i, 'security'],
  [/^(history|changelog|version history)/i, 'history'],
  [/^(compatib|support|version)/i, 'compatibility'],
];

interface Section {
  id: string;
  title: string;
  role: string;
  text: string;
}

interface CodeExample {
  id: string;
  language: string;
  code: string;
  section_id: string;
}

interface PageJsonInput {
  id: string;
  title: string;
  url: string;
  summary: string;
  content?: string;
  tags: string[];
  last_updated: string;
  children?: unknown[];
}

type PageType = 'content' | 'index';

interface PageJsonOutput {
  id: string;
  title: string;
  url: string;
  summary: string;
  page_type: PageType;
  content_hash?: string;
  tags: string[];
  last_updated: string;
  children?: unknown[];
  sections: Section[];
  examples: CodeExample[];
}

function assignRole(title: string, index: number): string {
  // Check patterns first
  for (const [pattern, role] of ROLE_PATTERNS) {
    if (pattern.test(title)) return role;
  }
  // First section is often overview
  if (index === 0) return 'overview';
  // Default to 'content'
  return 'content';
}

/**
 * Hugo's explicit heading anchor syntax, e.g. "## Change the socket path {#after-setup}".
 *
 * Deliberately strict. Plenty of headings end in a brace that is NOT an anchor --
 * Python signatures ending "connection_kwargs={}", dict defaults such as
 * "{'extra': 'ignore'}", and relref shortcodes -- and a loose trailing-brace match
 * would silently eat them. Requires "{#", then anchor-shaped characters only, then
 * "}" at end of the heading.
 */
const EXPLICIT_ANCHOR = /\s*\{#([A-Za-z0-9][A-Za-z0-9_.:-]*)\}\s*$/;

/**
 * Split a heading into its display title and its id.
 *
 * Hugo takes the explicit anchor as the rendered heading's id verbatim and does not
 * show it, so the title must have it removed and the id must not be slugified --
 * slugifying would produce a different string from the anchor on the page and break
 * url#section-id deep links.
 */
function parseHeading(raw: string): { title: string; id: string } {
  const match = raw.match(EXPLICIT_ANCHOR);
  if (match) {
    return { title: raw.replace(EXPLICIT_ANCHOR, '').trim(), id: match[1] };
  }
  return { title: raw, id: slugify(raw) };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Section IDs to filter out (metadata noise, not useful for RAG)
const FILTERED_SECTION_IDS = new Set([
  'code-examples-legend',
]);

/**
 * Make a section id unique within its page.
 *
 * The id is the join key for examples[].section_id and the target of
 * url#section-id deep links, so collisions are not cosmetic: examples from two
 * sections merge under one id, examples[].id itself stops being unique, and a
 * consumer keying sections by id silently drops one of them. Headings that
 * differ only in punctuation collide readily, because slugify() discards it --
 * "The special `$` ID" and "The special `+` ID" both reduce to the-special-id.
 *
 * Disambiguated with Hugo's own -1, -2 suffix convention.
 */
function makeUniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let n = 1;
  while (used.has(`${base}-${n}`)) n++;
  const id = `${base}-${n}`;
  used.add(id);
  return id;
}

/**
 * Extract fenced code blocks from text.
 * Returns the code blocks and the text with code blocks removed.
 */
function extractCodeBlocks(text: string, sectionId: string): {
  examples: CodeExample[];
  textWithoutCode: string;
} {
  const examples: CodeExample[] = [];
  let exampleIndex = 0;

  // Match fenced code blocks: ```language\ncode\n```
  // Use [^\n]* instead of \w* to handle languages with special chars (e.g., c++, redis-cli)
  const codeBlockPattern = /```([^\n]*)\n([\s\S]*?)```/g;

  let textWithoutCode = text.replace(codeBlockPattern, (match, lang, code) => {
    const language = lang || 'plaintext';
    const trimmedCode = code.trim();

    // An empty code block yields no example, so a placeholder here would be
    // unresolvable: the consumer sees [code example] with nothing in examples[]
    // to substitute back in. Drop it instead.
    if (!trimmedCode) {
      return '';
    }

    examples.push({
      id: `${sectionId}-ex${exampleIndex++}`,
      language,
      code: trimmedCode,
      section_id: sectionId,
    });

    // Replace code block with placeholder to preserve structure
    return '[code example]';
  });

  return { examples, textWithoutCode };
}

function splitContentIntoSections(content: string): { sections: Section[]; examples: CodeExample[] } {
  const rawSections: Section[] = [];
  const allExamples: CodeExample[] = [];
  // Tracks ids already handed out on this page, so they stay unique
  const usedIds = new Set<string>();

  // First, find all code block ranges to avoid matching headings inside them
  const codeBlockRanges: { start: number; end: number }[] = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  let codeMatch;
  while ((codeMatch = codeBlockPattern.exec(content)) !== null) {
    codeBlockRanges.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
    });
  }

  // Helper to check if a position is inside a code block
  const isInsideCodeBlock = (pos: number): boolean => {
    return codeBlockRanges.some(range => pos >= range.start && pos < range.end);
  };

  // Match ## headings (level 2) - these are main sections
  // Also capture ### for subsections if needed
  const headingPattern = /^(#{2,3})\s+(.+)$/gm;

  const matches: { level: number; title: string; index: number }[] = [];
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
    // Skip headings that are inside code blocks (e.g., Python ## comments)
    if (isInsideCodeBlock(match.index)) {
      continue;
    }
    matches.push({
      level: match[1].length,
      title: match[2].trim(),
      index: match.index,
    });
  }

  // If no headings, return content as single section
  if (matches.length === 0) {
    const text = content.trim();
    if (text) {
      const contentId = makeUniqueId('content', usedIds);
      const { examples, textWithoutCode } = extractCodeBlocks(text, contentId);
      allExamples.push(...examples);
      rawSections.push({
        id: contentId,
        title: 'Content',
        role: 'content',
        text: textWithoutCode,
      });
    }
    return { sections: rawSections, examples: allExamples };
  }

  // Extract text before first heading as intro/overview
  const introText = content.slice(0, matches[0].index).trim();
  if (introText) {
    const overviewId = makeUniqueId('overview', usedIds);
    const { examples, textWithoutCode } = extractCodeBlocks(introText, overviewId);
    allExamples.push(...examples);
    rawSections.push({
      id: overviewId,
      title: 'Overview',
      role: 'overview',
      text: textWithoutCode,
    });
  }

  // Extract each section's content
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : content.length;

    // Get content after heading until next heading
    const newlinePos = content.indexOf('\n', current.index);
    // If no newline after heading (heading is last line), use end of content
    const headingEnd = newlinePos === -1 ? content.length : newlinePos + 1;
    const sectionText = content.slice(headingEnd, nextIndex).trim();

    const { title, id: baseId } = parseHeading(current.title);
    const id = makeUniqueId(baseId, usedIds);
    const role = assignRole(title, rawSections.length);

    // Extract code blocks from section text
    const { examples, textWithoutCode } = extractCodeBlocks(sectionText, id);
    allExamples.push(...examples);

    rawSections.push({
      id,
      title,
      role,
      text: textWithoutCode,
    });
  }

  // Filter out unwanted sections (like "Code Examples Legend")
  const sections = rawSections.filter(s => !FILTERED_SECTION_IDS.has(s.id));

  // Also filter out examples from filtered sections to avoid orphaned references
  const examples = allExamples.filter(e => !FILTERED_SECTION_IDS.has(e.section_id));

  return { sections, examples };
}

/**
 * Compute a deterministic hash from summary, section texts, and example code.
 * This allows consumers to verify the hash themselves.
 */
function computeContentHash(
  summary: string,
  sections: Section[],
  examples: CodeExample[]
): string {
  // Concatenate: summary + all section texts + all example code
  const parts: string[] = [summary || ''];

  for (const section of sections) {
    parts.push(section.text);
  }

  for (const example of examples) {
    parts.push(example.code);
  }

  // Join with newlines for consistent hashing
  const content = parts.join('\n');
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

type TransformResult = 'transformed' | 'skipped' | 'error';

function transformJsonFile(filePath: string, dryRun: boolean): TransformResult {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data: PageJsonInput & { page_type?: PageType } = JSON.parse(fileContent);

    // This script consumes `content` and does not write it back, so it is not
    // safe to run twice over the same output: a second pass finds no content and
    // would rewrite every content page as an empty index page. A file that has a
    // page_type but no content has already been transformed, so leave it alone.
    if (data.content === undefined && data.page_type !== undefined) {
      return 'skipped';
    }

    // Remove content field from output
    const { content: rawContent, ...rest } = data;

    let newData: PageJsonOutput;

    if (rawContent && rawContent.trim()) {
      // Content page: has prose content to process
      const { sections, examples } = splitContentIntoSections(rawContent);
      const content_hash = computeContentHash(data.summary, sections, examples);

      newData = {
        ...rest,
        page_type: 'content',
        content_hash,
        sections,
        examples,
      };
    } else {
      // Index page: no content, just navigation/children
      newData = {
        ...rest,
        page_type: 'index',
        sections: [],
        examples: [],
      };
    }

    if (dryRun) {
      console.log(`Would transform: ${filePath}`);
      console.log(`  Type: ${newData.page_type}`);
      if (newData.content_hash) {
        console.log(`  Hash: ${newData.content_hash.slice(0, 16)}...`);
      }
      console.log(`  Sections: ${newData.sections.length}, Examples: ${newData.examples.length}`);
      newData.sections.slice(0, 3).forEach(s =>
        console.log(`    - ${s.id} (${s.role}): ${s.text.length} chars`)
      );
      if (newData.sections.length > 3) console.log(`    ... and ${newData.sections.length - 3} more`);
      if (newData.examples.length > 0) {
        console.log(`  Code examples:`);
        newData.examples.slice(0, 3).forEach(e =>
          console.log(`    - ${e.id} (${e.language}): ${e.code.length} chars`)
        );
        if (newData.examples.length > 3) console.log(`    ... and ${newData.examples.length - 3} more`);
      }
    } else {
      writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n');
    }

    return 'transformed';
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return 'error';
  }
}

function* walkJsonFiles(dir: string): Generator<string> {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      yield* walkJsonFiles(fullPath);
    } else if (entry === 'index.json') {
      yield fullPath;
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleIndex = args.indexOf('--single');
  const singlePath = singleIndex >= 0 ? args[singleIndex + 1] : null;

  const publicDir = join(process.cwd(), 'public');

  let processed = 0;
  let transformed = 0;
  let skipped = 0;

  if (singlePath) {
    // Process single file
    const fullPath = singlePath.startsWith('/') ? singlePath : join(process.cwd(), singlePath);
    console.log(`Processing single file: ${fullPath}`);
    const result = transformJsonFile(fullPath, dryRun);
    if (result === 'transformed') transformed++;
    if (result === 'skipped') skipped++;
    processed++;
  } else {
    // Process all JSON files
    console.log(`Scanning ${publicDir} for index.json files...`);

    for (const filePath of walkJsonFiles(publicDir)) {
      processed++;
      const result = transformJsonFile(filePath, dryRun);
      if (result === 'transformed') transformed++;
      if (result === 'skipped') skipped++;

      // Progress indicator
      if (processed % 500 === 0) {
        console.log(`  Processed ${processed} files...`);
      }
    }
  }

  console.log(`\nDone! Processed ${processed} files, transformed ${transformed}.`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} already-transformed files. Re-run 'hugo' first if you meant to rebuild them.`);
  }
  if (dryRun) {
    console.log('(Dry run - no files were modified)');
  }
}

main();

