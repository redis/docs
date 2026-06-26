/**
 * RAG Quality Scorer
 * 
 * Computes scores for different quality dimensions:
 * - Structural Integrity (25 pts): preserves headings, lists, code blocks, tables
 * - Self-Containment (15 pts): chunks understandable in isolation
 * - Efficiency (10 pts): balanced number and size of chunks
 * - Ordering Risk (5 pts): important info not buried in long sections
 */

import { DocStructure, Section } from './markdown-parser.js';
import { Chunk } from './structure-chunker.js';
import { HardFail, CategoryScores, RagQualityLabel } from '../tools/schemas.js';
import { computeStdDev } from './token-counter.js';

/**
 * Compute all category scores.
 */
export function computeScores(
  chunks: Chunk[],
  structure: DocStructure,
  hardFails: HardFail[],
  maxTokens: number
): CategoryScores {
  return {
    structural_integrity: computeStructuralIntegrity(hardFails),
    self_containment: computeSelfContainment(chunks),
    efficiency: computeEfficiency(chunks, maxTokens),
    ordering_risk: computeOrderingRisk(structure, maxTokens),
  };
}

/**
 * Compute overall score from category scores.
 */
export function computeOverallScore(scores: CategoryScores): number {
  return (
    scores.structural_integrity +
    scores.self_containment +
    scores.efficiency +
    scores.ordering_risk
  );
}

/**
 * Determine quality label based on score and hard-fails.
 */
export function computeLabel(
  overallScore: number,
  hardFails: HardFail[]
): RagQualityLabel {
  // Any hard-fail means RED
  if (hardFails.length > 0) {
    return "RED";
  }
  
  // Score-based thresholds
  if (overallScore >= 45) return "GREEN";
  if (overallScore >= 30) return "YELLOW";
  return "RED";
}

/**
 * Structural Integrity (25 pts)
 * Deduct points for hard-fail conditions.
 */
function computeStructuralIntegrity(hardFails: HardFail[]): number {
  const MAX_SCORE = 25;
  const DEDUCTION_PER_FAIL = 8;
  
  const deduction = Math.min(
    hardFails.length * DEDUCTION_PER_FAIL,
    MAX_SCORE
  );
  
  return MAX_SCORE - deduction;
}

/**
 * Self-Containment (15 pts)
 * Check if chunks start with context (heading or intro text).
 */
function computeSelfContainment(chunks: Chunk[]): number {
  const MAX_SCORE = 15;
  
  if (chunks.length === 0) return MAX_SCORE;
  
  let goodChunks = 0;
  
  for (const chunk of chunks) {
    const lines = chunk.content.split('\n');
    const firstNonEmptyLine = lines.find(l => l.trim().length > 0) || '';
    
    // Good: starts with heading
    if (firstNonEmptyLine.match(/^#{1,6}\s/)) {
      goodChunks++;
      continue;
    }
    
    // Good: has meaningful heading path
    if (chunk.headingPath.length > 0 && 
        !chunk.headingPath[chunk.headingPath.length - 1].startsWith('(part')) {
      goodChunks++;
      continue;
    }
    
    // Acceptable: starts with a complete sentence
    if (firstNonEmptyLine.match(/^[A-Z].*[.!?]$/)) {
      goodChunks += 0.5;
    }
  }
  
  const ratio = goodChunks / chunks.length;
  return Math.round(ratio * MAX_SCORE);
}

/**
 * Efficiency (10 pts)
 * Ideal: chunks close to target size with low variance.
 */
function computeEfficiency(chunks: Chunk[], maxTokens: number): number {
  const MAX_SCORE = 10;
  
  if (chunks.length === 0) return MAX_SCORE;
  
  const tokenCounts = chunks.map(c => c.tokenCount);
  const avgTokens = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
  const stdDev = computeStdDev(tokenCounts);
  
  let score = MAX_SCORE;
  
  // Deduct for chunks that are too small (< 20% of target)
  const tinyChunks = tokenCounts.filter(t => t < maxTokens * 0.2).length;
  score -= Math.min(tinyChunks * 1.5, 4);
  
  // Deduct for chunks that are too large (> 150% of target)
  const largeChunks = tokenCounts.filter(t => t > maxTokens * 1.5).length;
  score -= Math.min(largeChunks * 2, 4);
  
  // Deduct for high coefficient of variation (chunks very inconsistent in size)
  const cvRatio = stdDev / avgTokens; // CV = σ/μ
  if (cvRatio > 1.0) score -= 2;
  else if (cvRatio > 0.5) score -= 1;
  
  return Math.max(0, Math.round(score));
}

/**
 * Ordering Risk (5 pts)
 * Deduct for very long sections where important info may be buried.
 */
function computeOrderingRisk(structure: DocStructure, maxTokens: number): number {
  const MAX_SCORE = 5;
  
  if (structure.sections.length === 0) return MAX_SCORE;
  
  let score = MAX_SCORE;
  
  // Check for sections that are much larger than target
  for (const section of structure.sections) {
    const lineCount = section.endLine - section.startLine + 1;
    // Rough estimate: ~10 tokens per line
    const estimatedTokens = lineCount * 10;
    
    if (estimatedTokens > maxTokens * 3) {
      score -= 2;
    } else if (estimatedTokens > maxTokens * 2) {
      score -= 1;
    }
  }
  
  return Math.max(0, score);
}

