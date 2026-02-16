import {
  ValidateSignatureInput,
  ValidateSignatureInputSchema,
  ValidateSignatureOutput,
} from "./schemas.js";
import { validateSignature as validateSignatureImpl } from "../parsers/signature-validator.js";

/**
 * Validate that a signature is well-formed for a given language.
 *
 * Checks if a method signature follows the syntax rules of the specified language.
 * Supports: Python, Java, Go, TypeScript, Rust, C#, PHP
 *
 * @param input - Input parameters (signature, language)
 * @returns Validation result with any errors or warnings
 */
export async function validateSignature(
  input: unknown
): Promise<ValidateSignatureOutput> {
  // Validate input
  const validatedInput = ValidateSignatureInputSchema.parse(input);

  try {
    // Call the validator implementation
    const result = validateSignatureImpl(
      validatedInput.signature,
      validatedInput.language
    );

    return {
      valid: result.valid,
      errors: result.errors.length > 0 ? result.errors : undefined,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to validate signature: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

