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
  content: string,
  maxTokens: number
): ChunkingResult {
  const chunks: Chunk[] = [];
  const oversizedSections: Section[] = [];
  const lines = content.split('\n');
  
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
      const splitChunks = splitOversizedSection(
        section,
        lines,
        maxTokens,
        structure
      );
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
 * to ensure consistency with single-chunk sections.
 */
function splitOversizedSection(
  section: Section,
  allLines: string[],
  maxTokens: number,
  structure: DocStructure
): Chunk[] {
  const chunks: Chunk[] = [];
  // Use section.content (filtered) instead of raw allLines to exclude metadata blocks
  const sectionLines = section.content.split('\n');
  
  // Find safe split points (paragraph boundaries, not inside code blocks)
  const splitPoints = findSplitPoints(sectionLines, section.startLine, structure);
  
  let currentChunkLines: string[] = [];
  let currentChunkStart = section.startLine;
  let currentTokens = 0;
  
  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];
    const lineTokens = countTokens(line);
    
    // Check if adding this line would exceed max tokens
    if (currentTokens + lineTokens > maxTokens && currentChunkLines.length > 0) {
      // Check if we're at a safe split point
      const absoluteLine = section.startLine + i;
      const canSplitHere = splitPoints.includes(absoluteLine) || 
                           splitPoints.includes(absoluteLine - 1);
      
      if (canSplitHere || currentTokens > maxTokens * 1.5) {
        // Emit current chunk
        chunks.push({
          content: currentChunkLines.join('\n'),
          headingPath: [...section.headingPath, `(part ${chunks.length + 1})`],
          startLine: currentChunkStart,
          endLine: section.startLine + i - 1,
          tokenCount: currentTokens,
        });
        
        currentChunkLines = [];
        currentChunkStart = section.startLine + i;
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
      startLine: currentChunkStart,
      endLine: section.endLine,
      tokenCount: currentTokens,
    });
  }
  
  return chunks;
}

/**
 * Find safe split points in a section (paragraph boundaries outside code blocks).
 */
function findSplitPoints(
  lines: string[],
  startLineOffset: number,
  structure: DocStructure
): number[] {
  const splitPoints: number[] = [];
  let inCodeBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const absoluteLine = startLineOffset + i;
    
    // Track code blocks
    if (line.match(/^```/)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (inCodeBlock) continue;
    
    // Empty lines are safe split points
    if (line.trim() === '') {
      splitPoints.push(absoluteLine);
    }
  }
  
  return splitPoints;
}

