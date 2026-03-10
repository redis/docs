/**
 * TypeScript Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM TypeScript parser.
 * It extracts function signatures and JSDoc comments from TypeScript source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface TypeScriptSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  is_async: boolean;
}

export interface TypeScriptDocComment {
  method_name: string;
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters: Record<string, string>;
  returns?: string;
  line_number: number;
}

/**
 * Parse TypeScript source code and extract function signatures
 * @param code TypeScript source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parseTypeScriptSignatures(
  code: string,
  methodNameFilter?: string
): TypeScriptSignature[] {
  try {
    const result = wasmModule.parse_typescript_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`TypeScript parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: TypeScriptSignature[] = [];

    if (Array.isArray(result)) {
      signatures = result.map((item: any) => {
        if (item instanceof Map) {
          return {
            method_name: item.get('method_name'),
            signature: item.get('signature'),
            parameters: item.get('parameters') || [],
            return_type: item.get('return_type'),
            line_number: item.get('line_number'),
            is_async: item.get('is_async'),
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
    console.error('Error parsing TypeScript signatures:', error);
    return [];
  }
}

/**
 * Parse TypeScript source code and extract JSDoc comments
 * @param code TypeScript source code to parse
 * @returns Map of method names to doc comments
 */
export function parseTypeScriptDocComments(code: string): Record<string, TypeScriptDocComment> {
  try {
    const result = wasmModule.parse_typescript_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`TypeScript doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert Map to object if needed
    let docComments: Record<string, TypeScriptDocComment> = {};

    if (result instanceof Map) {
      result.forEach((value: any, key: string) => {
        // Convert nested Maps to objects
        let parameters: Record<string, string> = {};
        if (value instanceof Map) {
          // value is a Map, need to use .get() to access properties
          const parametersMap = value.get('parameters');
          if (parametersMap instanceof Map) {
            parametersMap.forEach((paramValue: string, paramKey: string) => {
              parameters[paramKey] = paramValue;
            });
          } else if (parametersMap && typeof parametersMap === 'object') {
            parameters = parametersMap;
          }

          docComments[key] = {
            method_name: key,
            raw_comment: value.get('raw_comment') || '',
            summary: value.get('summary'),
            description: value.get('description'),
            parameters,
            returns: value.get('returns'),
            line_number: value.get('line_number'),
          };
        } else {
          // value is already an object
          docComments[key] = {
            method_name: key,
            raw_comment: value.raw_comment || '',
            summary: value.summary,
            description: value.description,
            parameters: value.parameters || {},
            returns: value.returns,
            line_number: value.line_number,
          };
        }
      });
    } else if (typeof result === 'object' && result !== null) {
      docComments = result as Record<string, TypeScriptDocComment>;
    }

    return docComments;
  } catch (error) {
    console.error('Error parsing TypeScript doc comments:', error);
    return {};
  }
}

