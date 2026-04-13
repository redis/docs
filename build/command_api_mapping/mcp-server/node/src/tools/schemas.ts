import { z } from "zod";

// Supported languages
export const SUPPORTED_LANGUAGES = [
  "python",
  "java",
  "go",
  "typescript",
  "rust",
  "csharp",
  "php",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ============================================================================
// Tool 1: List Redis Commands
// ============================================================================

export const ListRedisCommandsInputSchema = z.object({
  include_modules: z.boolean().default(true),
  include_deprecated: z.boolean().default(true),
  module_filter: z.array(z.string()).default([]),
});

export type ListRedisCommandsInput = z.infer<
  typeof ListRedisCommandsInputSchema
>;

export const RedisCommandSchema = z.object({
  name: z.string(),
  module: z.string(),
  deprecated: z.boolean().optional(),
  summary: z.string().optional(),
});

export const ListRedisCommandsOutputSchema = z.object({
  commands: z.array(RedisCommandSchema),
  total_count: z.number(),
  by_module: z.record(z.number()),
});

export type ListRedisCommandsOutput = z.infer<
  typeof ListRedisCommandsOutputSchema
>;

// ============================================================================
// Tool 2: Extract Signatures
// ============================================================================

export const ExtractSignaturesInputSchema = z.object({
  // Either file_path OR client_id must be provided
  file_path: z.string().optional(),
  client_id: z.string().optional(),
  // Language is required when using file_path, inferred when using client_id
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  method_name_filter: z.array(z.string()).default([]),
}).refine(
  (data) => data.file_path || data.client_id,
  { message: "Either file_path or client_id must be provided" }
).refine(
  (data) => !data.file_path || data.language,
  { message: "language is required when using file_path" }
);

export type ExtractSignaturesInput = z.infer<
  typeof ExtractSignaturesInputSchema
>;

export const ParameterSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  default: z.string().nullable().optional(),
});

export const SignatureSchema = z.object({
  method_name: z.string(),
  signature: z.string(),
  parameters: z.array(ParameterSchema).optional(),
  return_type: z.string(),
  return_description: z.string().optional(),
  line_number: z.number().optional(),
  is_async: z.boolean().optional(),
  /** Context of the source file (e.g., 'json', 'search', 'timeseries' for module commands) */
  source_context: z.string().optional(),
});

export const ExtractSignaturesOutputSchema = z.object({
  file_path: z.string(),
  language: z.string(),
  signatures: z.array(SignatureSchema),
  total_count: z.number(),
  errors: z.array(z.string()).optional(),
});

export type ExtractSignaturesOutput = z.infer<
  typeof ExtractSignaturesOutputSchema
>;

// ============================================================================
// Tool 3: Extract Doc Comments
// ============================================================================

export const ExtractDocCommentsInputSchema = z.object({
  file_path: z.string(),
  language: z.enum(SUPPORTED_LANGUAGES),
  method_names: z.array(z.string()).default([]),
});

export type ExtractDocCommentsInput = z.infer<
  typeof ExtractDocCommentsInputSchema
>;

export const DocCommentSchema = z.object({
  raw_comment: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.record(z.string()).optional(),
  returns: z.string().optional(),
  line_number: z.number().optional(),
});

export const ExtractDocCommentsOutputSchema = z.object({
  file_path: z.string(),
  language: z.string(),
  doc_comments: z.record(DocCommentSchema),
  total_count: z.number(),
  missing_docs: z.array(z.string()).optional(),
});

export type ExtractDocCommentsOutput = z.infer<
  typeof ExtractDocCommentsOutputSchema
>;

// ============================================================================
// Tool 4: Validate Signature
// ============================================================================

export const ValidateSignatureInputSchema = z.object({
  signature: z.string(),
  language: z.enum(SUPPORTED_LANGUAGES),
});

export type ValidateSignatureInput = z.infer<
  typeof ValidateSignatureInputSchema
>;

export const ValidateSignatureOutputSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type ValidateSignatureOutput = z.infer<
  typeof ValidateSignatureOutputSchema
>;

// ============================================================================
// Tool 5: Get Client Info
// ============================================================================

export const GetClientInfoInputSchema = z.object({
  client_id: z.string(),
});

export type GetClientInfoInput = z.infer<typeof GetClientInfoInputSchema>;

export const RepositorySchema = z.object({
  git_uri: z.string().optional(),
  branch: z.string().optional(),
  path: z.string().optional(),
});

export const GetClientInfoOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  type: z.string().optional(),
  label: z.string().optional(),
  repository: RepositorySchema.optional(),
});

export type GetClientInfoOutput = z.infer<typeof GetClientInfoOutputSchema>;

// ============================================================================
// Tool 6: List Clients
// ============================================================================

export const ListClientsInputSchema = z.object({
  language_filter: z.array(z.string()).default([]),
});

export type ListClientsInput = z.infer<typeof ListClientsInputSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  type: z.string().optional(),
});

export const ListClientsOutputSchema = z.object({
  clients: z.array(ClientSchema),
  total_count: z.number(),
  by_language: z.record(z.number()),
});

export type ListClientsOutput = z.infer<typeof ListClientsOutputSchema>;

// ============================================================================
// Tool 7: Analyze Metadata Size
// ============================================================================

export const AnalyzeMetadataSizeInputSchema = z.object({
  /** Path to the documentation file containing JSON metadata */
  file_path: z.string().optional(),
  /** Raw content to analyze (if not using file_path) */
  content: z.string().optional(),
}).refine(
  (data) => data.file_path || data.content,
  { message: "Either file_path or content must be provided" }
);

export type AnalyzeMetadataSizeInput = z.infer<typeof AnalyzeMetadataSizeInputSchema>;

export const SectionSizeSchema = z.object({
  /** Size in bytes (UTF-8 encoded) */
  bytes: z.number(),
  /** Size in characters */
  chars: z.number(),
  /** Number of items (for arrays/objects) */
  item_count: z.number().nullable().optional(),
});

export type SectionSize = z.infer<typeof SectionSizeSchema>;

export const AnalyzeMetadataSizeOutputSchema = z.object({
  /** Path to the analyzed file (if file_path was provided) */
  file_path: z.string().optional(),
  /** Whether metadata was found in the content */
  metadata_found: z.boolean(),
  /** Total size of the metadata block in bytes */
  total_bytes: z.number(),
  /** Total size of the metadata block in characters */
  total_chars: z.number(),
  /** Size breakdown by top-level section/field */
  sections: z.record(SectionSizeSchema),
  /** The format in which metadata was found (html-head, html-body, markdown) */
  format: z.string().nullable().optional(),
  /** Any errors encountered during analysis */
  errors: z.array(z.string()).optional(),
});

export type AnalyzeMetadataSizeOutput = z.infer<typeof AnalyzeMetadataSizeOutputSchema>;
// =========================================================================
// Tool 8: Analyze Token Usage
// =========================================================================

export const AnalyzeTokenUsageInputSchema = z
  .object({
    /** Path to the documentation file whose token usage should be analyzed */
    file_path: z.string().optional(),
    /** Raw content to analyze (if not using file_path) */
    content: z.string().optional(),
    /** Optional model name to select tokenizer encoding (e.g., 'gpt-4.1') */
    model: z.string().optional(),
  })
  .refine(
    (data) => data.file_path || data.content,
    { message: "Either file_path or content must be provided" }
  );

export type AnalyzeTokenUsageInput = z.infer<typeof AnalyzeTokenUsageInputSchema>;

export const AnalyzeTokenUsageOutputSchema = z.object({
  /** Path to the analyzed file (if file_path was provided) */
  file_path: z.string().optional(),
  /** Model name that was used to select the tokenizer encoding */
  model: z.string(),
  /** Name of the tiktoken encoding used (e.g., 'o200k_base') */
  encoding: z.string(),
  /** Total number of characters in the analyzed text */
  char_count: z.number(),
  /** Total number of whitespace-delimited words in the analyzed text */
  word_count: z.number(),
  /** Total number of tokens in the analyzed text */
  total_tokens: z.number(),
});

export type AnalyzeTokenUsageOutput = z.infer<typeof AnalyzeTokenUsageOutputSchema>;

// ============================================================================
// Tool 9: Analyze RAG Quality
// ============================================================================

/** Page types for adjusted scoring */
export const PageType = z.enum([
  "auto",       // Auto-detect from content (default)
  "index",      // Navigation/overview page with links to subpages
  "tutorial",   // Step-by-step guide with substantial content
  "reference",  // API/command reference with code examples
  "concept",    // Explanatory content about concepts
]);
export type PageType = z.infer<typeof PageType>;

export const AnalyzeRagQualityInputSchema = z.object({
  /** Path to the Markdown documentation file */
  file_path: z.string().optional(),
  /** Raw Markdown content to analyze (if not using file_path) */
  content: z.string().optional(),
  /** Target max tokens per chunk (default: 512) */
  max_chunk_tokens: z.number().default(512),
  /** Page type for adjusted scoring (default: auto-detect) */
  page_type: PageType.default("auto"),
}).refine(
  (data) => data.file_path || data.content,
  { message: "Either file_path or content must be provided" }
);

export type AnalyzeRagQualityInput = z.infer<typeof AnalyzeRagQualityInputSchema>;

/** Quality label for the page */
export const RagQualityLabel = z.enum(["GREEN", "YELLOW", "RED"]);
export type RagQualityLabel = z.infer<typeof RagQualityLabel>;

/** Hard-fail types that block good retrieval */
export const HardFailType = z.enum([
  "SPLIT_CODE_BLOCK",
  "SPLIT_TABLE",
  "ORPHANED_SYNTAX",
  "EMPTY_SECTION"
]);
export type HardFailType = z.infer<typeof HardFailType>;

/** Location in the document */
export const LocationSchema = z.object({
  line: z.number(),
  heading: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

/** A hard-fail issue that blocks good retrieval */
export const HardFailSchema = z.object({
  type: HardFailType,
  location: LocationSchema,
  description: z.string(),
});
export type HardFail = z.infer<typeof HardFailSchema>;

/** A non-blocking issue or warning */
export const RagIssueSchema = z.object({
  severity: z.enum(["warning", "info"]),
  type: z.string(),
  location: LocationSchema.optional(),
  description: z.string(),
});
export type RagIssue = z.infer<typeof RagIssueSchema>;

/** Preview of a chunk */
export const ChunkPreviewSchema = z.object({
  index: z.number(),
  heading_path: z.array(z.string()),
  token_count: z.number(),
  first_line: z.string(),
});
export type ChunkPreview = z.infer<typeof ChunkPreviewSchema>;

/** Chunk metrics */
export const ChunkMetricsSchema = z.object({
  chunk_count: z.number(),
  avg_chunk_tokens: z.number(),
  max_chunk_tokens: z.number(),
  min_chunk_tokens: z.number(),
  std_dev: z.number().describe("Standard deviation of chunk token counts"),
});
export type ChunkMetrics = z.infer<typeof ChunkMetricsSchema>;

/** Category scores */
export const CategoryScoresSchema = z.object({
  structural_integrity: z.number(),  // 0-25
  self_containment: z.number(),      // 0-15
  efficiency: z.number(),            // 0-10
  ordering_risk: z.number(),         // 0-5
});
export type CategoryScores = z.infer<typeof CategoryScoresSchema>;

/** Full output of RAG quality analysis */
export const AnalyzeRagQualityOutputSchema = z.object({
  /** Path to the analyzed file (if file_path was provided) */
  file_path: z.string().optional(),
  /** Detected or specified page type */
  page_type: PageType,
  /** Overall quality label */
  label: RagQualityLabel,
  /** Overall score (0-55) */
  overall_score: z.number(),
  /** Chunk metrics */
  metrics: ChunkMetricsSchema,
  /** Scores by category */
  category_scores: CategoryScoresSchema,
  /** Blocking issues that cause retrieval problems */
  hard_fails: z.array(HardFailSchema),
  /** Non-blocking issues and warnings */
  issues: z.array(RagIssueSchema),
  /** Actionable recommendations */
  recommendations: z.array(z.string()),
  /** Preview of chunks (optional) */
  chunks_preview: z.array(ChunkPreviewSchema).optional(),
});

export type AnalyzeRagQualityOutput = z.infer<typeof AnalyzeRagQualityOutputSchema>;
