import { readFileSync } from "fs";
import { resolve } from "path";
import {
  AnalyzeMetadataSizeInputSchema,
  AnalyzeMetadataSizeOutput,
  SectionSize,
} from "./schemas.js";

// Import the WASM module
// @ts-ignore - WASM module types
import { analyze_metadata_size } from "../../../rust/pkg/redis_parser.js";

/**
 * Recursively convert Map objects to plain objects.
 * WASM with serde-wasm-bindgen returns Map objects instead of plain objects.
 */
function mapToObject(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    value.forEach((v, k) => {
      obj[k] = mapToObject(v);
    });
    return obj;
  }
  if (Array.isArray(value)) {
    return value.map(mapToObject);
  }
  if (value !== null && typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = mapToObject(v);
    }
    return obj;
  }
  return value;
}

/**
 * Analyze the size of JSON metadata embedded in a documentation page.
 *
 * This tool helps AI agents understand how much context window space
 * will be consumed by the metadata in a documentation page.
 *
 * Supports multiple metadata embedding formats:
 * - HTML: <script type="application/json" data-ai-metadata>...</script>
 * - HTML: <div hidden data-redis-metadata="page">...</div>
 * - Markdown: ```json metadata\n...\n```
 *
 * @param input - Input parameters (file_path OR content)
 * @returns Metadata size analysis with section breakdown
 */
export async function analyzeMetadataSize(
  input: unknown
): Promise<AnalyzeMetadataSizeOutput> {
  // Validate input
  const validatedInput = AnalyzeMetadataSizeInputSchema.parse(input);

  try {
    let content: string;
    let filePath: string | undefined;

    if (validatedInput.file_path) {
      // Read from local file
      filePath = resolve(validatedInput.file_path);
      try {
        content = readFileSync(filePath, "utf-8");
      } catch (error) {
        throw new Error(
          `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else if (validatedInput.content) {
      // Use provided content directly
      content = validatedInput.content;
    } else {
      throw new Error("Either file_path or content must be provided");
    }

    // Call the Rust WASM function to analyze the metadata
    const rawAnalysis = analyze_metadata_size(content);

    // Convert Map objects to plain objects (WASM returns Maps)
    const analysis = mapToObject(rawAnalysis) as {
      metadata_found: boolean;
      total_bytes: number;
      total_chars: number;
      sections: Record<string, SectionSize>;
      format: string | null;
      errors: string[];
    };

    // Build the output, adding file_path if we read from a file
    const output: AnalyzeMetadataSizeOutput = {
      metadata_found: analysis.metadata_found,
      total_bytes: analysis.total_bytes,
      total_chars: analysis.total_chars,
      sections: analysis.sections || {},
      format: analysis.format || null,
      errors: analysis.errors?.length > 0 ? analysis.errors : undefined,
    };

    if (filePath) {
      output.file_path = filePath;
    }

    return output;
  } catch (error) {
    throw new Error(
      `Failed to analyze metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

