/**
 * Signature Validator Wrapper
 * 
 * Wraps the WASM signature validator and provides a clean TypeScript interface
 * for validating method signatures across all supported languages.
 */

import { SupportedLanguage } from "../tools/schemas.js";
import * as wasmModule from "../../../rust/pkg/redis_parser.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a method signature for a given language
 * 
 * @param signature - The method signature to validate
 * @param language - The programming language (python, java, go, typescript, rust, csharp, php)
 * @returns Validation result with any errors or warnings
 */
export function validateSignature(
  signature: string,
  language: SupportedLanguage
): ValidationResult {
  try {
    // Call WASM validator
    const result = wasmModule.validate_signature(signature, language);

    // Validate and convert result
    if (!result || typeof result !== "object") {
      return {
        valid: false,
        errors: ["Invalid validation result from WASM module"],
        warnings: [],
      };
    }

    // Extract fields with defaults
    const valid = result.valid === true;
    const errors = Array.isArray(result.errors) ? result.errors : [];
    const warnings = Array.isArray(result.warnings) ? result.warnings : [];

    return {
      valid,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      ],
      warnings: [],
    };
  }
}

/**
 * Validates multiple signatures and returns aggregated results
 * 
 * @param signatures - Array of signatures to validate
 * @param language - The programming language for all signatures
 * @returns Array of validation results
 */
export function validateSignatures(
  signatures: string[],
  language: SupportedLanguage
): ValidationResult[] {
  return signatures.map((sig) => validateSignature(sig, language));
}

/**
 * Checks if a signature is valid (no errors)
 * 
 * @param signature - The method signature to check
 * @param language - The programming language
 * @returns True if signature is valid, false otherwise
 */
export function isValidSignature(
  signature: string,
  language: SupportedLanguage
): boolean {
  const result = validateSignature(signature, language);
  return result.valid && result.errors.length === 0;
}

/**
 * Gets a human-readable validation report
 * 
 * @param signature - The method signature
 * @param language - The programming language
 * @returns Formatted validation report
 */
export function getValidationReport(
  signature: string,
  language: SupportedLanguage
): string {
  const result = validateSignature(signature, language);

  let report = `Validation Report for ${language}:\n`;
  report += `Signature: ${signature}\n`;
  report += `Status: ${result.valid ? "✓ VALID" : "✗ INVALID"}\n`;

  if (result.errors.length > 0) {
    report += `\nErrors (${result.errors.length}):\n`;
    result.errors.forEach((err, i) => {
      report += `  ${i + 1}. ${err}\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += `\nWarnings (${result.warnings.length}):\n`;
    result.warnings.forEach((warn, i) => {
      report += `  ${i + 1}. ${warn}\n`;
    });
  }

  return report;
}

