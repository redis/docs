import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ExtractSignaturesInput,
  ExtractSignaturesInputSchema,
  ExtractSignaturesOutput,
  SignatureSchema,
} from "./schemas.js";
import { parsePythonSignatures } from "../parsers/python-parser.js";
import { parseJavaSignatures } from "../parsers/java-parser.js";
import { parseGoSignatures } from "../parsers/go-parser.js";
import { parseTypeScriptSignatures } from "../parsers/typescript-parser.js";
import { parseRustSignatures } from "../parsers/rust-parser.js";
import { parseCSharpSignatures } from "../parsers/csharp-parser.js";
import { parsePHPSignatures } from "../parsers/php-parser.js";

/**
 * Extract method signatures from a client library source file.
 *
 * Parses source code in the specified language and extracts method signatures,
 * including parameter types, return types, and async status.
 *
 * @param input - Input parameters (file_path, language, optional method_name_filter)
 * @returns Extracted signatures with metadata
 */
export async function extractSignatures(
  input: unknown
): Promise<ExtractSignaturesOutput> {
  // Validate input
  const validatedInput = ExtractSignaturesInputSchema.parse(input);

  try {
    // Read file from disk
    const filePath = resolve(validatedInput.file_path);
    let code: string;
    try {
      code = readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Parse based on language
    let rawSignatures: any[] = [];
    const errors: string[] = [];

    if (validatedInput.language === "python") {
      rawSignatures = parsePythonSignatures(code);
    } else if (validatedInput.language === "java") {
      rawSignatures = parseJavaSignatures(code);
    } else if (validatedInput.language === "go") {
      rawSignatures = parseGoSignatures(code);
    } else if (validatedInput.language === "typescript") {
      rawSignatures = parseTypeScriptSignatures(code);
    } else if (validatedInput.language === "rust") {
      rawSignatures = parseRustSignatures(code);
    } else if (validatedInput.language === "csharp") {
      rawSignatures = parseCSharpSignatures(code);
    } else if (validatedInput.language === "php") {
      rawSignatures = parsePHPSignatures(code);
    } else {
      errors.push(
        `Language '${validatedInput.language}' not yet implemented. Currently Python, Java, Go, TypeScript, Rust, C#, and PHP are supported.`
      );
    }

    // Apply method name filter if provided
    let filteredSignatures = rawSignatures;
    if (validatedInput.method_name_filter.length > 0) {
      filteredSignatures = rawSignatures.filter((sig) =>
        validatedInput.method_name_filter.some((filter) =>
          sig.method_name.includes(filter)
        )
      );
    }

    // Convert to schema format
    const signatures = filteredSignatures.map((sig) => ({
      method_name: sig.method_name,
      signature: sig.signature,
      parameters: sig.parameters.map((p: string) => ({
        name: p.split(":")[0].trim(),
        type: p.includes(":") ? p.split(":")[1].trim() : "Any",
      })),
      return_type: sig.return_type || "Any",
      line_number: sig.line_number,
      is_async: sig.is_async,
    }));

    // Validate with schema
    const validatedSignatures = signatures.map((sig) =>
      SignatureSchema.parse(sig)
    );

    return {
      file_path: validatedInput.file_path,
      language: validatedInput.language,
      signatures: validatedSignatures,
      total_count: validatedSignatures.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract signatures: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

