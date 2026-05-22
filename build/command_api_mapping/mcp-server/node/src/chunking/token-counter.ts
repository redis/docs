/**
 * Token Counter Utility
 * 
 * Provides token counting for RAG quality analysis.
 * Uses a simple heuristic for speed, with optional tiktoken accuracy.
 */

// Lightweight wrapper type for the tokenizer encoder
type Encoder = {
  encode(text: string): { length: number };
  free(): void;
};

// Cached encoder instance
let cachedEncoder: Encoder | null = null;
let encoderLoadAttempted = false;

/**
 * Fast approximate token count using word-based heuristic.
 * Rule of thumb: ~4 characters per token for English text.
 * More accurate for code: ~3 characters per token.
 */
export function countTokensApprox(text: string): number {
  if (!text) return 0;
  
  // Simple heuristic: split on whitespace and punctuation
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  // Estimate tokens: roughly 1.3 tokens per word on average
  // (accounting for subword tokenization)
  return Math.ceil(words.length * 1.3);
}

/**
 * Count tokens using tiktoken if available, otherwise use heuristic.
 * This is synchronous for simplicity - loads encoder lazily.
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  
  // Try to use cached encoder
  if (cachedEncoder) {
    try {
      return cachedEncoder.encode(text).length;
    } catch {
      // Fall through to heuristic
    }
  }
  
  // Fall back to heuristic
  return countTokensApprox(text);
}

/**
 * Initialize the token counter with tiktoken (optional).
 * Call this at startup if accurate token counting is needed.
 */
export async function initTokenCounter(): Promise<boolean> {
  if (encoderLoadAttempted) {
    return cachedEncoder !== null;
  }
  
  encoderLoadAttempted = true;
  
  try {
    const { get_encoding } = (await import("@dqbd/tiktoken")) as {
      get_encoding: (encodingName: string) => Encoder;
    };
    
    // Use o200k_base (GPT-4.1 / GPT-4o encoding)
    cachedEncoder = get_encoding("o200k_base");
    return true;
  } catch {
    // tiktoken not available - use heuristic
    return false;
  }
}

/**
 * Cleanup the cached encoder (call on shutdown).
 */
export function cleanupTokenCounter(): void {
  if (cachedEncoder) {
    try {
      cachedEncoder.free();
    } catch {
      // Ignore cleanup errors
    }
    cachedEncoder = null;
  }
}

/**
 * Compute standard deviation of token counts.
 * Used for coefficient of variation (CV = stdDev / mean) in scoring.
 */
export function computeStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

