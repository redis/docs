/**
 * Analyze RAG Quality Tool
 *
 * Evaluates documentation pages for RAG retrieval quality by:
 * 1. Parsing Markdown structure
 * 2. Applying structure-first chunking
 * 3. Detecting hard-fail conditions
 * 4. Computing quality scores
 * 5. Generating actionable recommendations
 */

import { readFileSync } from "fs";
import { resolve } from "path";

import {
  AnalyzeRagQualityInputSchema,
  AnalyzeRagQualityOutput,
  ChunkMetrics,
  ChunkPreview,
  PageType,
} from "./schemas.js";

import { parseMarkdownStructure } from "../chunking/markdown-parser.js";
import { chunkByStructure } from "../chunking/structure-chunker.js";
import { detectHardFails } from "../chunking/hard-fail-detector.js";
import { computeScores, computeOverallScore, computeLabel } from "../chunking/scorer.js";
import { generateRecommendations, generateIssues } from "../chunking/recommender.js";
import { initTokenCounter, computeStdDev } from "../chunking/token-counter.js";
import { detectPageType, getScoringAdjustments } from "../chunking/page-type-detector.js";

/**
 * Analyze a documentation page for RAG retrieval quality.
 */
export async function analyzeRagQuality(
  input: unknown
): Promise<AnalyzeRagQualityOutput> {
  // Validate input
  const validatedInput = AnalyzeRagQualityInputSchema.parse(input);
  
  // Initialize token counter (loads tiktoken if available)
  await initTokenCounter();
  
  let content: string;
  let filePath: string | undefined;
  
  if (validatedInput.file_path) {
    filePath = resolve(validatedInput.file_path);
    try {
      content = readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else if (validatedInput.content) {
    content = validatedInput.content;
  } else {
    throw new Error("Either file_path or content must be provided");
  }
  
  const maxTokens = validatedInput.max_chunk_tokens;

  // Phase 1: Parse Markdown structure
  const structure = parseMarkdownStructure(content);

  // Phase 2: Chunk by structure
  const { chunks, oversizedSections } = chunkByStructure(structure, maxTokens);

  // Phase 2.5: Detect or use specified page type
  let pageType: PageType = validatedInput.page_type;
  if (pageType === "auto") {
    pageType = detectPageType(content, structure, chunks, filePath);
  }
  const adjustments = getScoringAdjustments(pageType);

  // Phase 3: Detect hard-fails (adjusted for page type)
  const hardFails = detectHardFails(chunks, structure, pageType, adjustments);

  // Phase 4: Generate issues (adjusted for page type)
  const issues = generateIssues(chunks, structure, oversizedSections, maxTokens, pageType, adjustments);

  // Phase 5: Compute scores
  const categoryScores = computeScores(chunks, structure, hardFails, maxTokens);
  const overallScore = computeOverallScore(categoryScores);
  const label = computeLabel(overallScore, hardFails);

  // Phase 6: Generate recommendations (adjusted for page type)
  const recommendations = generateRecommendations(
    hardFails,
    issues,
    chunks,
    structure,
    maxTokens,
    pageType,
    adjustments
  );
  
  // Compute metrics
  const tokenCounts = chunks.map(c => c.tokenCount);
  const metrics: ChunkMetrics = {
    chunk_count: chunks.length,
    avg_chunk_tokens: tokenCounts.length > 0 
      ? Math.round(tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length)
      : 0,
    max_chunk_tokens: tokenCounts.length > 0 ? Math.max(...tokenCounts) : 0,
    min_chunk_tokens: tokenCounts.length > 0 ? Math.min(...tokenCounts) : 0,
    std_dev: Math.round(computeStdDev(tokenCounts)),
  };
  
  // Generate chunk previews (first 5)
  const chunksPreview: ChunkPreview[] = chunks.slice(0, 5).map((chunk, i) => {
    const lines = chunk.content.split('\n');
    const firstNonEmpty = lines.find(l => l.trim().length > 0) || '';
    return {
      index: i,
      heading_path: chunk.headingPath,
      token_count: chunk.tokenCount,
      first_line: firstNonEmpty.substring(0, 80) + (firstNonEmpty.length > 80 ? '...' : ''),
    };
  });
  
  // Build output
  const output: AnalyzeRagQualityOutput = {
    page_type: pageType,
    label,
    overall_score: Math.round(overallScore),
    metrics,
    category_scores: categoryScores,
    hard_fails: hardFails,
    issues,
    recommendations,
    chunks_preview: chunksPreview,
  };

  if (filePath) {
    output.file_path = filePath;
  }

  return output;
}

