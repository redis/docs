import { readFileSync } from "fs";
import { resolve } from "path";
import {
  AnalyzeTokenUsageInputSchema,
  AnalyzeTokenUsageOutput,
} from "./schemas.js";

// Lightweight wrapper type for the tokenizer encoder to avoid tight coupling
// to a specific tiktoken TypeScript definition.
type Encoder = {
  encode(text: string): { length: number };
  free(): void;
};

const DEFAULT_MODEL = "gpt-4.1";
// Default encoding chosen for modern GPT-4.1/4o-style models.
const DEFAULT_ENCODING = "o200k_base";

/**
 * Very small, explicit mapping from model name → encoding.
 *
 * This keeps the behavior predictable without depending on any
 * model-name-specific helpers from the tokenizer library.
 */
function getEncodingForModel(model: string | undefined): {
  modelUsed: string;
  encodingName: string;
} {
  const modelUsed = model || DEFAULT_MODEL;
  const m = modelUsed.toLowerCase();

  // Modern OpenAI models that are known to use o200k_base.
  if (
    m.startsWith("gpt-4.1") ||
    m.startsWith("gpt-4o") ||
    m.startsWith("gpt-4o-mini") ||
    m.includes("-o1")
  ) {
    return { modelUsed, encodingName: "o200k_base" };
  }

  // Older GPT-4 / 3.5-turbo style models typically use cl100k_base.
  if (m.startsWith("gpt-4") || m.startsWith("gpt-3.5")) {
    return { modelUsed, encodingName: "cl100k_base" };
  }

  // Fallback: use the default encoding.
  return { modelUsed, encodingName: DEFAULT_ENCODING };
}

async function loadEncoder(
  model: string | undefined
): Promise<{ modelUsed: string; encodingName: string; encoder: Encoder }> {
  let get_encoding: (encodingName: string) => unknown;

  try {
    // Dynamic import so the server can start even if the dependency is missing,
    // and to give a clearer error message when it isn't installed.
    ({ get_encoding } = (await import("@dqbd/tiktoken")) as {
      get_encoding: (encodingName: string) => unknown;
    });
  } catch (error) {
    throw new Error(
      "The '@dqbd/tiktoken' package is required for analyze_token_usage but is not installed. " +
        "Please run 'npm install @dqbd/tiktoken' in build/command_api_mapping/mcp-server/node."
    );
  }

  const { modelUsed, encodingName } = getEncodingForModel(model);
  const encoder = get_encoding(encodingName) as Encoder;

  return { modelUsed, encodingName, encoder };
}

/**
 * Analyze character, word, and token usage of documentation content.
 *
 * This uses a local tiktoken-compatible tokenizer only; no OpenAI API calls
 * are made. It is safe to use in offline or air-gapped environments.
 */
export async function analyzeTokenUsage(
  input: unknown
): Promise<AnalyzeTokenUsageOutput> {
  const validatedInput = AnalyzeTokenUsageInputSchema.parse(input);

  let content: string;
  let filePath: string | undefined;

  if (validatedInput.file_path) {
    filePath = resolve(validatedInput.file_path);
    try {
      content = readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to read file: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } else if (validatedInput.content) {
    content = validatedInput.content;
  } else {
    // This should be unreachable because of the Zod refine, but keep a
    // defensive check here for clarity.
    throw new Error("Either file_path or content must be provided");
  }

  const charCount = content.length;
  const trimmed = content.trim();
  const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

  const { modelUsed, encodingName, encoder } = await loadEncoder(
    validatedInput.model
  );

  let totalTokens = 0;
  try {
    const tokens = encoder.encode(content);
    totalTokens = tokens.length;
  } finally {
    try {
      encoder.free();
    } catch {
      // Ignore errors during encoder cleanup
    }
  }

  const output: AnalyzeTokenUsageOutput = {
    file_path: filePath,
    model: modelUsed,
    encoding: encodingName,
    char_count: charCount,
    word_count: wordCount,
    total_tokens: totalTokens,
  };

  return output;
}

