/**
 * Test script for the analyze_rag_quality tool.
 */

import { analyzeRagQuality } from "./tools/analyze-rag-quality.js";

// Sample Markdown content for testing
const SAMPLE_GOOD_DOC = `# Getting Started with Redis

This guide helps you get started with Redis quickly.

## Installation

Install Redis using your package manager:

\`\`\`bash
brew install redis
\`\`\`

Or on Ubuntu:

\`\`\`bash
sudo apt-get install redis-server
\`\`\`

## Basic Usage

Connect to Redis and run your first commands:

\`\`\`python
import redis

r = redis.Redis(host='localhost', port=6379)
r.set('key', 'value')
print(r.get('key'))
\`\`\`

This creates a connection and stores a value.

## Next Steps

- Read the [Commands Reference](/commands)
- Explore [Data Types](/data-types)
`;

const SAMPLE_PROBLEMATIC_DOC = `# Mega Documentation Page

This page has issues that affect chunking.

## First Section

Some intro text.

\`\`\`python
# This is a very long code block that might get split
def very_long_function():
    # Line 1
    # Line 2
    # Line 3
    # Line 4
    # Line 5
    # Line 6
    # Line 7
    # Line 8
    # Line 9
    # Line 10
    pass
\`\`\`

## Empty Section

## Another Section With Only Code

\`\`\`javascript
// No explanation, just code
const x = 1;
const y = 2;
const z = x + y;
console.log(z);
\`\`\`

## Very Long Section Without Subheadings

This section goes on and on with lots of text but no subheadings to break it up.
Paragraph 1 with some content that fills up space.
Paragraph 2 with more content that keeps going.
Paragraph 3 continues the trend of lengthy prose.
Paragraph 4 adds even more to this oversized section.
Paragraph 5 is yet another block of text here.
Paragraph 6 keeps the section growing larger.
Paragraph 7 makes this section problematic for chunking.
Paragraph 8 is nearing the end finally.
Paragraph 9 wraps up this massive section.
Paragraph 10 concludes this demonstration.
`;

async function main() {
  console.log("=== Testing RAG Quality Analysis Tool ===\n");

  // Test 1: Good document
  console.log("--- Test 1: Well-structured document ---\n");
  try {
    const result1 = await analyzeRagQuality({
      content: SAMPLE_GOOD_DOC,
      max_chunk_tokens: 200,
    });
    console.log(`Label: ${result1.label}`);
    console.log(`Score: ${result1.overall_score}/55`);
    console.log(`Chunks: ${result1.metrics.chunk_count}`);
    console.log(`Hard Fails: ${result1.hard_fails.length}`);
    console.log(`Issues: ${result1.issues.length}`);
    console.log(`Recommendations: ${result1.recommendations.length}`);
    if (result1.recommendations.length > 0) {
      console.log(`  - ${result1.recommendations.slice(0, 3).join("\n  - ")}`);
    }
    console.log();
  } catch (error) {
    console.error("Test 1 failed:", error);
  }

  // Test 2: Problematic document
  console.log("--- Test 2: Problematic document ---\n");
  try {
    const result2 = await analyzeRagQuality({
      content: SAMPLE_PROBLEMATIC_DOC,
      max_chunk_tokens: 150,
    });
    console.log(`Label: ${result2.label}`);
    console.log(`Score: ${result2.overall_score}/55`);
    console.log(`Chunks: ${result2.metrics.chunk_count}`);
    console.log(`Hard Fails: ${result2.hard_fails.length}`);
    if (result2.hard_fails.length > 0) {
      for (const fail of result2.hard_fails) {
        console.log(`  - ${fail.type}: ${fail.description}`);
      }
    }
    console.log(`Issues: ${result2.issues.length}`);
    console.log(`Recommendations: ${result2.recommendations.length}`);
    if (result2.recommendations.length > 0) {
      console.log(`  - ${result2.recommendations.slice(0, 5).join("\n  - ")}`);
    }
    console.log();
  } catch (error) {
    console.error("Test 2 failed:", error);
  }

  // Test 3: Built documentation file (concept page)
  console.log("--- Test 3: Built documentation file (concept page) ---\n");
  try {
    const repoRoot = new URL("../../../../..", import.meta.url).pathname;
    const testFile = `${repoRoot}/public/integrate/redis-data-integration/architecture/index.html.md`;
    const result3 = await analyzeRagQuality({
      file_path: testFile,
      max_chunk_tokens: 512,
    });
    console.log(`File: ${result3.file_path}`);
    console.log(`Page Type: ${result3.page_type}`);
    console.log(`Label: ${result3.label}`);
    console.log(`Score: ${result3.overall_score}/55`);
    console.log(`Chunks: ${result3.metrics.chunk_count}`);
    console.log(`Hard Fails: ${result3.hard_fails.length}`);
    console.log(`Issues: ${result3.issues.length}`);
  } catch (error) {
    console.error("Test 3 failed:", error);
  }

  // Test 4: Index page (should detect as 'index' and ignore tiny chunks)
  console.log("\n--- Test 4: Index page (page type detection) ---\n");
  try {
    const repoRoot = new URL("../../../../..", import.meta.url).pathname;
    const testFile = `${repoRoot}/public/operate/rc/index.html.md`;
    const result4 = await analyzeRagQuality({
      file_path: testFile,
      max_chunk_tokens: 512,
    });
    console.log(`File: ${result4.file_path}`);
    console.log(`Page Type: ${result4.page_type} (auto-detected)`);
    console.log(`Label: ${result4.label}`);
    console.log(`Score: ${result4.overall_score}/55`);
    console.log(`Chunks: ${result4.metrics.chunk_count}`);
    console.log(`Avg tokens/chunk: ${result4.metrics.avg_chunk_tokens}`);
    console.log(`Hard Fails: ${result4.hard_fails.length}`);
    console.log(`Issues: ${result4.issues.length}`);
    console.log(`Recommendations: ${result4.recommendations.length}`);
    if (result4.recommendations.length > 0) {
      console.log(`  - ${result4.recommendations.slice(0, 3).join("\n  - ")}`);
    }
  } catch (error) {
    console.error("Test 4 failed:", error);
  }

  console.log("\n=== Tests Complete ===");
}

main().catch(console.error);

