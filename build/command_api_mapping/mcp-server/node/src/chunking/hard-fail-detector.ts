/**
 * Hard-Fail Detector
 *
 * Detects blocking issues that would cause poor RAG retrieval:
 * - Code blocks split across chunks
 * - Tables split across chunks
 * - Orphaned syntax (explanation separated from code)
 * - Empty sections
 */

import { DocStructure, CodeBlock, Table, Section } from './markdown-parser.js';
import { Chunk } from './structure-chunker.js';
import { HardFail, HardFailType, PageType } from '../tools/schemas.js';
import { ScoringAdjustments } from './page-type-detector.js';

/**
 * Check if a range overlaps another range.
 */
function rangesOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Check if range A fully contains range B.
 */
function rangeContains(
  containerStart: number, containerEnd: number,
  itemStart: number, itemEnd: number
): boolean {
  return containerStart <= itemStart && containerEnd >= itemEnd;
}

/**
 * Detect all hard-fail conditions in the chunked document.
 */
export function detectHardFails(
  chunks: Chunk[],
  structure: DocStructure,
  pageType: PageType,
  adjustments: ScoringAdjustments
): HardFail[] {
  const hardFails: HardFail[] = [];

  // Check for split code blocks
  hardFails.push(...detectSplitCodeBlocks(chunks, structure.codeBlocks));

  // Check for split tables
  hardFails.push(...detectSplitTables(chunks, structure.tables));

  // Check for empty sections
  hardFails.push(...detectEmptySections(structure.sections));

  // Check for orphaned syntax (code without nearby explanation)
  // Skip for reference pages where code-heavy chunks are expected
  if (!adjustments.ignoreHighCodeRatio) {
    hardFails.push(...detectOrphanedSyntax(chunks, structure));
  }

  return hardFails;
}

/**
 * Detect code blocks that span multiple chunks.
 */
function detectSplitCodeBlocks(
  chunks: Chunk[],
  codeBlocks: CodeBlock[]
): HardFail[] {
  const hardFails: HardFail[] = [];
  
  for (const codeBlock of codeBlocks) {
    // Find chunks that overlap with this code block
    const overlappingChunks = chunks.filter(chunk =>
      rangesOverlap(
        chunk.startLine, chunk.endLine,
        codeBlock.startLine, codeBlock.endLine
      )
    );
    
    // Check if any chunk fully contains the code block
    const fullyContained = overlappingChunks.some(chunk =>
      rangeContains(
        chunk.startLine, chunk.endLine,
        codeBlock.startLine, codeBlock.endLine
      )
    );
    
    if (!fullyContained && overlappingChunks.length > 1) {
      hardFails.push({
        type: "SPLIT_CODE_BLOCK" as HardFailType,
        location: {
          line: codeBlock.startLine,
          heading: findNearestHeading(codeBlock.startLine, chunks),
        },
        description: `Code block (lines ${codeBlock.startLine}-${codeBlock.endLine}) ` +
          `split across ${overlappingChunks.length} chunks`,
      });
    }
  }
  
  return hardFails;
}

/**
 * Detect tables that span multiple chunks.
 */
function detectSplitTables(
  chunks: Chunk[],
  tables: Table[]
): HardFail[] {
  const hardFails: HardFail[] = [];
  
  for (const table of tables) {
    const overlappingChunks = chunks.filter(chunk =>
      rangesOverlap(
        chunk.startLine, chunk.endLine,
        table.startLine, table.endLine
      )
    );
    
    const fullyContained = overlappingChunks.some(chunk =>
      rangeContains(
        chunk.startLine, chunk.endLine,
        table.startLine, table.endLine
      )
    );
    
    if (!fullyContained && overlappingChunks.length > 1) {
      hardFails.push({
        type: "SPLIT_TABLE" as HardFailType,
        location: {
          line: table.startLine,
          heading: findNearestHeading(table.startLine, chunks),
        },
        description: `Table (lines ${table.startLine}-${table.endLine}, ` +
          `${table.rowCount} rows) split across ${overlappingChunks.length} chunks`,
      });
    }
  }
  
  return hardFails;
}

/**
 * Detect sections with no meaningful content.
 *
 * Skips "organizational headings" - sections that exist purely to group
 * child sections (e.g., "## Encrypt data in transit" followed immediately
 * by "### TLS"). These are structural navigation aids, not content gaps.
 */
function detectEmptySections(sections: Section[]): HardFail[] {
  const hardFails: HardFail[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Skip sections that only contained metadata (not a structural issue)
    if (section.hadOnlyMetadata) {
      continue;
    }

    // Check if anything meaningful remains after removing the heading line
    // Note: sections with headingLevel 0 (preamble/untitled) don't have a heading line
    const lines = section.content.split('\n');
    const hasHeadingLine = section.headingLevel > 0;
    const contentLines = (hasHeadingLine ? lines.slice(1) : lines)
      .filter(line => line.trim().length > 0);

    if (contentLines.length === 0) {
      // Check if this is an organizational heading (immediately followed by a child section)
      const nextSection = sections[i + 1];
      const isOrganizationalHeading = nextSection &&
        nextSection.headingLevel > section.headingLevel;

      if (isOrganizationalHeading) {
        // This is a structural grouping heading, not a content problem
        continue;
      }

      hardFails.push({
        type: "EMPTY_SECTION" as HardFailType,
        location: {
          line: section.startLine,
          heading: section.headingPath[section.headingPath.length - 1],
        },
        description: `Section "${section.headingPath.join(' > ')}" has no content`,
      });
    }
  }

  return hardFails;
}

/**
 * Detect code blocks that appear without nearby explanatory text.
 * (Heuristic: code block is >70% of chunk content)
 */
function detectOrphanedSyntax(
  chunks: Chunk[],
  structure: DocStructure
): HardFail[] {
  const hardFails: HardFail[] = [];
  
  for (const chunk of chunks) {
    // Find code blocks in this chunk
    const codeBlocksInChunk = structure.codeBlocks.filter(cb =>
      rangeContains(chunk.startLine, chunk.endLine, cb.startLine, cb.endLine)
    );
    
    if (codeBlocksInChunk.length === 0) continue;
    
    // Calculate code block line count vs total chunk lines
    const chunkLineCount = chunk.endLine - chunk.startLine + 1;
    const codeLineCount = codeBlocksInChunk.reduce(
      (sum, cb) => sum + (cb.endLine - cb.startLine + 1),
      0
    );
    
    const codeRatio = codeLineCount / chunkLineCount;
    
    if (codeRatio > 0.85 && chunkLineCount > 5) {
      hardFails.push({
        type: "ORPHANED_SYNTAX" as HardFailType,
        location: {
          line: chunk.startLine,
          heading: chunk.headingPath[chunk.headingPath.length - 1],
        },
        description: `Chunk is ${Math.round(codeRatio * 100)}% code with minimal explanation`,
      });
    }
  }
  
  return hardFails;
}

/**
 * Find the nearest heading for a given line number.
 */
function findNearestHeading(lineNum: number, chunks: Chunk[]): string | undefined {
  for (const chunk of chunks) {
    if (chunk.startLine <= lineNum && chunk.endLine >= lineNum) {
      return chunk.headingPath[chunk.headingPath.length - 1];
    }
  }
  return undefined;
}

