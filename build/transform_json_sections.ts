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
const ROLE_PATTERNS: [RegExp, string][] = [
  [/^(overview|introduction|about|description)$/i, 'overview'],
  [/^(syntax|usage|command|signature)$/i, 'syntax'],
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
  [/^(compatib|support|version)/i, 'compatibility'],
  [/^(history|changelog|version history)/i, 'history'],
];

interface Section {
  id: string;
  title: string;
  role: string;
  text: string;
}

interface PageJsonInput {
  id: string;
  title: string;
  url: string;
  summary: string;
  content: string;
  tags: string[];
  last_updated: string;
  children?: unknown[];
}

interface PageJsonOutput {
  id: string;
  title: string;
  url: string;
  summary: string;
  content_hash: string;
  tags: string[];
  last_updated: string;
  children?: unknown[];
  sections: Section[];
}

function assignRole(title: string, index: number, total: number): string {
  // Check patterns first
  for (const [pattern, role] of ROLE_PATTERNS) {
    if (pattern.test(title)) return role;
  }
  // First section is often overview
  if (index === 0) return 'overview';
  // Default to 'content'
  return 'content';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitContentIntoSections(content: string): Section[] {
  const sections: Section[] = [];

  // Match ## headings (level 2) - these are main sections
  // Also capture ### for subsections if needed
  const headingPattern = /^(#{2,3})\s+(.+)$/gm;

  const matches: { level: number; title: string; index: number }[] = [];
  let match;

  while ((match = headingPattern.exec(content)) !== null) {
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
      sections.push({
        id: 'content',
        title: 'Content',
        role: 'content',
        text,
      });
    }
    return sections;
  }

  // Extract text before first heading as intro/overview
  const introText = content.slice(0, matches[0].index).trim();
  if (introText) {
    sections.push({
      id: 'overview',
      title: 'Overview',
      role: 'overview',
      text: introText,
    });
  }

  // Extract each section's content
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : content.length;

    // Get content after heading until next heading
    const headingEnd = content.indexOf('\n', current.index) + 1;
    const sectionText = content.slice(headingEnd, nextIndex).trim();

    const id = slugify(current.title);
    const role = assignRole(current.title, sections.length, matches.length);

    sections.push({
      id,
      title: current.title,
      role,
      text: sectionText,
    });
  }

  return sections;
}

function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function transformJsonFile(filePath: string, dryRun: boolean): boolean {
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const data: PageJsonInput = JSON.parse(fileContent);

    // Skip if no content field
    if (!data.content) {
      return false;
    }

    // Compute hash before removing content
    const content_hash = computeHash(data.content);

    // Split content into sections
    const sections = splitContentIntoSections(data.content);

    // Create new structure: replace content with content_hash, add sections
    const { content: _removed, ...rest } = data;
    const newData: PageJsonOutput = {
      ...rest,
      content_hash,
      sections,
    };

    if (dryRun) {
      console.log(`Would transform: ${filePath}`);
      console.log(`  Hash: ${content_hash.slice(0, 16)}...`);
      console.log(`  Sections: ${sections.length}`);
      sections.slice(0, 3).forEach(s =>
        console.log(`    - ${s.id} (${s.role}): ${s.text.length} chars`)
      );
      if (sections.length > 3) console.log(`    ... and ${sections.length - 3} more`);
    } else {
      writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n');
    }

    return true;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return false;
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

  if (singlePath) {
    // Process single file
    const fullPath = singlePath.startsWith('/') ? singlePath : join(process.cwd(), singlePath);
    console.log(`Processing single file: ${fullPath}`);
    if (transformJsonFile(fullPath, dryRun)) {
      transformed++;
    }
    processed++;
  } else {
    // Process all JSON files
    console.log(`Scanning ${publicDir} for index.json files...`);

    for (const filePath of walkJsonFiles(publicDir)) {
      processed++;
      if (transformJsonFile(filePath, dryRun)) {
        transformed++;
      }

      // Progress indicator
      if (processed % 500 === 0) {
        console.log(`  Processed ${processed} files...`);
      }
    }
  }

  console.log(`\nDone! Processed ${processed} files, transformed ${transformed}.`);
  if (dryRun) {
    console.log('(Dry run - no files were modified)');
  }
}

main();

