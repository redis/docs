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

