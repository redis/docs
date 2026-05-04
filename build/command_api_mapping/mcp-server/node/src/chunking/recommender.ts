/**
 * Recommendation Generator
 *
 * Generates actionable recommendations based on detected issues.
 */

import { DocStructure, Section } from './markdown-parser.js';
import { Chunk } from './structure-chunker.js';
import { HardFail, PageType, RagIssue } from '../tools/schemas.js';
import { ScoringAdjustments } from './page-type-detector.js';

/**
 * Generate actionable recommendations based on analysis results.
 */
export function generateRecommendations(
  hardFails: HardFail[],
  issues: RagIssue[],
  chunks: Chunk[],
  structure: DocStructure,
  maxTokens: number,
  pageType: PageType,
  adjustments: ScoringAdjustments
): string[] {
  const recommendations: string[] = [];
  
  // Recommendations from hard-fails
  for (const fail of hardFails) {
    switch (fail.type) {
      case "SPLIT_CODE_BLOCK":
        recommendations.push(
          `Move code block at line ${fail.location.line} to its own section, ` +
          `or reduce preceding content to keep the block intact`
        );
        break;
      case "SPLIT_TABLE":
        recommendations.push(
          `Table at line ${fail.location.line} is too large for the section. ` +
          `Consider splitting into multiple smaller tables or moving to dedicated section`
        );
        break;
      case "ORPHANED_SYNTAX":
        recommendations.push(
          `Add explanatory text before/after code at line ${fail.location.line}. ` +
          `Code-only chunks provide poor retrieval context`
        );
        break;
      case "EMPTY_SECTION":
        recommendations.push(
          `Section "${fail.location.heading}" has no content. ` +
          `Add content or remove the heading`
        );
        break;
    }
  }
  
  // Recommendations from issues (filtered by page type)
  for (const issue of issues) {
    if (issue.type === "OVERSIZED_SECTION" && issue.location) {
      recommendations.push(
        `Split section "${issue.location.heading}" at H3 boundaries ` +
        `or add subheadings to break up content`
      );
    }
    // Skip tiny chunk recommendations for index pages
    if (issue.type === "TINY_CHUNK" && issue.location && !adjustments.ignoreTinyChunks) {
      recommendations.push(
        `Consider merging small section "${issue.location.heading}" ` +
        `with adjacent content for better retrieval context`
      );
    }
  }

  // General recommendations based on structure (adjusted for page type)
  const tokenCounts = chunks.map(c => c.tokenCount);
  const tinyThreshold = maxTokens * adjustments.tinyChunkThreshold;
  const tinyCount = tokenCounts.filter(t => t < tinyThreshold).length;
  const largeCount = tokenCounts.filter(t => t > maxTokens * 1.5).length;

  // Skip tiny chunk consolidation recommendation for index pages
  if (tinyCount > chunks.length * 0.3 && !adjustments.ignoreTinyChunks) {
    recommendations.push(
      `${tinyCount} of ${chunks.length} chunks are very small (<${Math.round(tinyThreshold)} tokens). ` +
      `Consider consolidating related sections`
    );
  }
  
  if (largeCount > 0) {
    recommendations.push(
      `${largeCount} section(s) exceed ${Math.round(maxTokens * 1.5)} tokens. ` +
      `Add subheadings (H3/H4) to create natural split points`
    );
  }
  
  // Check for missing top-level structure
  const h1Count = structure.headings.filter(h => h.level === 1).length;
  const h2Count = structure.headings.filter(h => h.level === 2).length;
  
  if (h1Count === 0 && h2Count === 0) {
    recommendations.push(
      `Document lacks heading structure. Add H1/H2 headings to improve chunking`
    );
  }
  
  // Deduplicate and limit recommendations
  const unique = [...new Set(recommendations)];
  return unique.slice(0, 10); // Max 10 recommendations
}

/**
 * Generate issues (warnings/info) based on chunk analysis.
 */
export function generateIssues(
  chunks: Chunk[],
  structure: DocStructure,
  oversizedSections: Section[],
  maxTokens: number,
  pageType: PageType,
  adjustments: ScoringAdjustments
): RagIssue[] {
  const issues: RagIssue[] = [];

  // Oversized sections that needed splitting
  for (const section of oversizedSections) {
    issues.push({
      severity: "warning",
      type: "OVERSIZED_SECTION",
      location: {
        line: section.startLine,
        heading: section.headingPath[section.headingPath.length - 1],
      },
      description: `Section needed to be split because it exceeded ${maxTokens} tokens`,
    });
  }

  // Tiny chunks (skip for index pages where small sections are expected)
  if (!adjustments.ignoreTinyChunks) {
    const tinyThreshold = maxTokens * adjustments.tinyChunkThreshold;
    for (const chunk of chunks) {
      if (chunk.tokenCount < tinyThreshold && chunk.tokenCount > 0) {
        issues.push({
          severity: "info",
          type: "TINY_CHUNK",
          location: {
            line: chunk.startLine,
            heading: chunk.headingPath[chunk.headingPath.length - 1],
          },
          description: `Section has only ${chunk.tokenCount} tokens, may lack retrieval context`,
        });
      }
    }
  }

  // Very large chunks (even after splitting)
  for (const chunk of chunks) {
    if (chunk.tokenCount > maxTokens * 1.8) {
      issues.push({
        severity: "warning",
        type: "VERY_LARGE_CHUNK",
        location: {
          line: chunk.startLine,
          heading: chunk.headingPath[chunk.headingPath.length - 1],
        },
        description: `Chunk has ${chunk.tokenCount} tokens (${Math.round(chunk.tokenCount / maxTokens * 100)}% of target max)`,
      });
    }
  }

  return issues;
}

