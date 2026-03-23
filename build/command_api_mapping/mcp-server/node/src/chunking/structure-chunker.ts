/**
 * Structure-First Chunker
 * 
 * Chunks Markdown content by structural boundaries (headings),
 * with fallback splitting for oversized sections.
 */

import { DocStructure, Section } from './markdown-parser.js';
import { countTokens } from './token-counter.js';

export interface Chunk {
  content: string;
  headingPath: string[];
  startLine: number;
  endLine: number;
  tokenCount: number;
}

export interface ChunkingResult {
  chunks: Chunk[];
  oversizedSections: Section[];  // Sections that needed splitting
}

/**
 * Chunk document by structure (headings), splitting oversized sections.
 */
export function chunkByStructure(
  structure: DocStructure,
  maxTokens: number
): ChunkingResult {
  const chunks: Chunk[] = [];
  const oversizedSections: Section[] = [];

  for (const section of structure.sections) {
    const sectionContent = section.content;
    const tokenCount = countTokens(sectionContent);
    
    if (tokenCount <= maxTokens) {
      // Section fits in one chunk
      chunks.push({
        content: sectionContent,
        headingPath: section.headingPath,
        startLine: section.startLine,
        endLine: section.endLine,
        tokenCount,
      });
    } else {
      // Section too large - need to split
      oversizedSections.push(section);
      const splitChunks = splitOversizedSection(section, maxTokens);
      chunks.push(...splitChunks);
    }
  }
  
  return { chunks, oversizedSections };
}

/**
 * Split an oversized section into smaller chunks.
 * Strategy: split at paragraph boundaries, keeping code blocks intact.
 *
 * Note: Uses section.content (already filtered to exclude metadata blocks)
 * to ensure consistency with single-chunk sections. Uses lineNumberMap to
 * translate filtered line indices back to original file line numbers.
 */
function splitOversizedSection(
  section: Section,
  maxTokens: number
): Chunk[] {
  const chunks: Chunk[] = [];
  // Use section.content (filtered) instead of raw allLines to exclude metadata blocks
  const sectionLines = section.content.split('\n');

  // Use lineNumberMap if available, otherwise fall back to sequential numbering
  // lineNumberMap maps filtered line index -> original file line number
  const lineNumberMap = section.lineNumberMap ||
    sectionLines.map((_, i) => section.startLine + i);

  // Helper to get original line number from filtered index
  const getOriginalLine = (filteredIndex: number): number => {
    return lineNumberMap[filteredIndex] ?? (section.startLine + filteredIndex);
  };

  // Find safe split points (paragraph boundaries, not inside code blocks)
  // Pass lineNumberMap so split points use original line numbers
  const splitPoints = findSplitPoints(sectionLines, lineNumberMap);

  let currentChunkLines: string[] = [];
  let currentChunkStartIndex = 0;
  let currentTokens = 0;

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];
    const lineTokens = countTokens(line);

    // Check if adding this line would exceed max tokens
    if (currentTokens + lineTokens > maxTokens && currentChunkLines.length > 0) {
      // Check if we're at a safe split point (using original line numbers)
      const originalLine = getOriginalLine(i);
      const canSplitHere = splitPoints.includes(originalLine) ||
                           splitPoints.includes(originalLine - 1);

      if (canSplitHere || currentTokens > maxTokens * 1.5) {
        // Emit current chunk with correct original line numbers
        chunks.push({
          content: currentChunkLines.join('\n'),
          headingPath: [...section.headingPath, `(part ${chunks.length + 1})`],
          startLine: getOriginalLine(currentChunkStartIndex),
          endLine: getOriginalLine(i - 1),
          tokenCount: currentTokens,
        });

        currentChunkLines = [];
        currentChunkStartIndex = i;
        currentTokens = 0;
      }
    }

    currentChunkLines.push(line);
    currentTokens += lineTokens;
  }

  // Emit final chunk
  if (currentChunkLines.length > 0) {
    chunks.push({
      content: currentChunkLines.join('\n'),
      headingPath: [...section.headingPath, `(part ${chunks.length + 1})`],
      startLine: getOriginalLine(currentChunkStartIndex),
      endLine: section.endLine,  // Use section's original end line
      tokenCount: currentTokens,
    });
  }

  return chunks;
}

/**
 * Find safe split points in a section (paragraph boundaries outside code blocks).
 * Uses lineNumberMap to translate filtered line indices to original file line numbers.
 */
function findSplitPoints(
  lines: string[],
  lineNumberMap: number[]
): number[] {
  const splitPoints: number[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Use lineNumberMap to get original line number
    const originalLine = lineNumberMap[i] ?? i;

    // Track code blocks
    if (line.match(/^```/)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    // Empty lines are safe split points (using original line numbers)
    if (line.trim() === '') {
      splitPoints.push(originalLine);
    }
  }

  return splitPoints;
}

