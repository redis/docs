/**
 * Page Type Detector
 * 
 * Detects the type of documentation page based on content heuristics.
 * Used to adjust RAG quality scoring expectations.
 */

import { DocStructure } from './markdown-parser.js';
import { Chunk } from './structure-chunker.js';
import { PageType } from '../tools/schemas.js';

export interface PageTypeSignals {
  linkDensity: number;        // Links per 100 tokens
  avgSectionTokens: number;   // Average tokens per section
  codeBlockRatio: number;     // Code blocks / total sections
  hasSequentialHeadings: boolean;  // "Step 1", "Step 2", etc.
  hasApiPatterns: boolean;    // Command names, method signatures
  proseRatio: number;         // Prose paragraphs vs other content
  listRatio: number;          // List items vs total lines
  hasIndexSignals: boolean;   // File path or title suggests index
}

/**
 * Detect page type from content analysis.
 */
export function detectPageType(
  content: string,
  structure: DocStructure,
  chunks: Chunk[],
  filePath?: string
): PageType {
  const signals = computeSignals(content, structure, chunks, filePath);

  // Index page: small sections, few code blocks, high list ratio OR filename indicates index
  // Relaxed link density requirement and added list-based detection
  const isLikelyIndex = (
    signals.avgSectionTokens < 100 &&
    signals.codeBlockRatio < 0.3 &&
    (signals.linkDensity > 0.5 || signals.listRatio > 0.2 || signals.hasIndexSignals)
  );

  if (isLikelyIndex && signals.proseRatio < 0.3) {
    return "index";
  }

  // Tutorial: sequential headings, moderate code, larger sections
  if (signals.hasSequentialHeadings) {
    return "tutorial";
  }

  // Reference: high code ratio, API patterns
  if (signals.codeBlockRatio > 0.5 || signals.hasApiPatterns) {
    return "reference";
  }

  // Concept: prose-heavy, fewer code blocks
  if (signals.proseRatio > 0.5 && signals.codeBlockRatio < 0.3) {
    return "concept";
  }

  // Default to concept if unclear
  return "concept";
}

/**
 * Compute detection signals from content.
 */
function computeSignals(
  content: string,
  structure: DocStructure,
  chunks: Chunk[],
  filePath?: string
): PageTypeSignals {
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

  // Count links (markdown links and bare URLs)
  const linkPattern = /\[([^\]]+)\]\([^)]+\)|https?:\/\/\S+/g;
  const linkCount = (content.match(linkPattern) || []).length;
  const linkDensity = totalTokens > 0 ? (linkCount / totalTokens) * 100 : 0;

  // Average section size
  const avgSectionTokens = chunks.length > 0
    ? totalTokens / chunks.length
    : 0;

  // Code block ratio
  const sectionsWithCode = chunks.filter(c =>
    c.content.includes('```') || c.content.includes('    ')
  ).length;
  const codeBlockRatio = chunks.length > 0
    ? sectionsWithCode / chunks.length
    : 0;

  // Sequential headings (Step 1, Step 2, Part 1, etc.)
  const sequentialPattern = /^#+\s*(Step|Part|Phase|Stage)\s*\d+/im;
  const hasSequentialHeadings = sequentialPattern.test(content);

  // API patterns (command names in backticks, method signatures)
  const apiPatterns = [
    /`[A-Z][A-Z_]+`/,           // COMMAND_NAME in backticks
    /`\w+\.\w+\(`/,             // method.call( pattern
    /^#{2,}\s*`\w+`/m,          // ## `command` heading
    /Syntax|Parameters|Returns|Arguments/i,  // API doc sections
  ];
  const hasApiPatterns = apiPatterns.some(p => p.test(content));

  // Prose ratio (paragraphs of text vs lists/code/tables)
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const proseLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 40 &&
           !trimmed.startsWith('#') &&
           !trimmed.startsWith('-') &&
           !trimmed.startsWith('*') &&
           !trimmed.startsWith('|') &&
           !trimmed.startsWith('```') &&
           !trimmed.startsWith('    ');
  }).length;
  const proseRatio = nonEmptyLines.length > 0 ? proseLines / nonEmptyLines.length : 0;

  // List ratio (list items vs total content lines)
  const listLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
  }).length;
  const listRatio = nonEmptyLines.length > 0 ? listLines / nonEmptyLines.length : 0;

  // Index signals from content patterns (NOT file path - all pages end in index.html.md)
  // Look for "table of contents" style pages with many subpage links
  const hasIndexSignals = (
    // Title suggests a hub/overview page
    structure.headings.some(h => h.level === 1 && /overview|introduction|about this/i.test(h.text)) ||
    // Many relative links to child pages (e.g., "./subscriptions/", "./databases/")
    (content.match(/\]\(\.\/[^)]+\/?\)/g) || []).length >= 3
  );

  return {
    linkDensity,
    avgSectionTokens,
    codeBlockRatio,
    hasSequentialHeadings,
    hasApiPatterns,
    proseRatio,
    listRatio,
    hasIndexSignals,
  };
}

/**
 * Get scoring adjustments for a page type.
 */
export interface ScoringAdjustments {
  tinyChunkThreshold: number;     // Below this is "tiny" (multiplier of maxTokens)
  ignoreTinyChunks: boolean;      // Don't penalize tiny chunks
  ignoreHighCodeRatio: boolean;   // Don't flag orphaned syntax
  expectedAvgTokens: number;      // Expected average chunk size
}

export function getScoringAdjustments(pageType: PageType): ScoringAdjustments {
  switch (pageType) {
    case "index":
      return {
        tinyChunkThreshold: 0.05,  // Very lenient
        ignoreTinyChunks: true,
        ignoreHighCodeRatio: false,
        expectedAvgTokens: 50,
      };
    case "tutorial":
      return {
        tinyChunkThreshold: 0.15,
        ignoreTinyChunks: false,
        ignoreHighCodeRatio: false,
        expectedAvgTokens: 300,
      };
    case "reference":
      return {
        tinyChunkThreshold: 0.10,
        ignoreTinyChunks: false,
        ignoreHighCodeRatio: true,  // Code-heavy is expected
        expectedAvgTokens: 200,
      };
    case "concept":
    case "auto":
    default:
      return {
        tinyChunkThreshold: 0.15,
        ignoreTinyChunks: false,
        ignoreHighCodeRatio: false,
        expectedAvgTokens: 250,
      };
  }
}

