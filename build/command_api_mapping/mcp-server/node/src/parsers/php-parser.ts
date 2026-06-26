/**
 * PHP Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM PHP parser.
 * It extracts function/method signatures and PHPDoc comments from PHP source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface PHPSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  modifiers: string[];
  is_variadic: boolean;
}

export interface PHPDocComment {
  method_name: string;
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters: Record<string, string>;
  returns?: string;
  line_number: number;
}

/**
 * Parse PHP source code and extract function/method signatures
 * @param code PHP source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parsePHPSignatures(
  code: string,
  methodNameFilter?: string
): PHPSignature[] {
  try {
    const result = wasmModule.parse_php_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`PHP parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: PHPSignature[] = [];

    if (Array.isArray(result)) {
      signatures = result.map((item: any) => {
        if (item instanceof Map) {
          return {
            method_name: item.get('method_name'),
            signature: item.get('signature'),
            parameters: item.get('parameters') || [],
            return_type: item.get('return_type'),
            line_number: item.get('line_number'),
            modifiers: item.get('modifiers') || [],
            is_variadic: item.get('is_variadic') || false,
          };
        }
        return item;
      });
    } else if (result && typeof result === 'object') {
      const resultObj = result as any;
      if (Array.isArray(resultObj.signatures)) {
        signatures = resultObj.signatures;
      } else if (resultObj.length !== undefined) {
        signatures = Array.from(resultObj);
      }
    }

    // Apply method name filter if provided
    if (methodNameFilter && signatures.length > 0) {
      signatures = signatures.filter(sig =>
        sig && sig.method_name && sig.method_name.includes(methodNameFilter)
      );
    }

    return signatures;
  } catch (error) {
    console.error('Error parsing PHP signatures:', error);
    return [];
  }
}

/**
 * Parse PHP source code and extract PHPDoc comments
 * @param code PHP source code to parse
 * @returns Map of method names to PHPDoc comments
 */
export function parsePHPDocComments(code: string): Record<string, PHPDocComment> {
  try {
    const result = wasmModule.parse_php_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`PHP doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert Map to object if needed
    if (result instanceof Map) {
      const docMap: Record<string, PHPDocComment> = {};
      result.forEach((value: any, key: string) => {
        // Convert nested Maps to objects
        let docComment: any = {};
        if (value instanceof Map) {
          value.forEach((v: any, k: string) => {
            if (v instanceof Map) {
              // Convert nested Maps (like parameters)
              const nestedObj: Record<string, string> = {};
              v.forEach((nv: any, nk: string) => {
                nestedObj[nk] = nv;
              });
              docComment[k] = nestedObj;
            } else {
              docComment[k] = v;
            }
          });
        } else {
          docComment = value;
        }
        docMap[key] = docComment;
      });
      return docMap;
    }

    return result || {};
  } catch (error) {
    console.error('Error parsing PHP doc comments:', error);
    return {};
  }
}

/**
 * Find a specific function signature by name
 * @param code PHP source code
 * @param methodName Name of the function to find
 * @returns The signature if found, undefined otherwise
 */
export function findSignatureByName(
  code: string,
  methodName: string
): PHPSignature | undefined {
  const signatures = parsePHPSignatures(code, methodName);
  return signatures.find(sig => sig.method_name === methodName);
}

/**
 * Get all public function signatures
 * @param code PHP source code
 * @returns Array of public function signatures
 */
export function getPublicSignatures(code: string): PHPSignature[] {
  const signatures = parsePHPSignatures(code);
  return signatures.filter(sig => sig.modifiers.includes('public') || sig.modifiers.length === 0);
}

