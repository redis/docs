/**
 * Go Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM Go parser.
 * It extracts function signatures and doc comments from Go source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface GoSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  is_method: boolean;
  receiver?: string;
}

export interface GoDocComment {
  method_name: string;
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters: Record<string, string>;
  returns?: string;
  line_number: number;
}

/**
 * Parse Go source code and extract function signatures
 * @param code Go source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parseGoSignatures(
  code: string,
  methodNameFilter?: string
): GoSignature[] {
  try {
    const result = wasmModule.parse_go_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Go parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: GoSignature[] = [];

    if (Array.isArray(result)) {
      signatures = result.map((item: any) => {
        if (item instanceof Map) {
          return {
            method_name: item.get('method_name'),
            signature: item.get('signature'),
            parameters: item.get('parameters') || [],
            return_type: item.get('return_type'),
            line_number: item.get('line_number'),
            is_method: item.get('is_method'),
            receiver: item.get('receiver'),
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
    console.error('Error parsing Go signatures:', error);
    return [];
  }
}

/**
 * Parse Go source code and extract doc comments
 * @param code Go source code to parse
 * @returns Map of function names to doc comments
 */
export function parseGoDocComments(code: string): Record<string, GoDocComment> {
  try {
    const result = wasmModule.parse_go_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Go doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert Map to object if needed
    if (result instanceof Map) {
      const docMap: Record<string, GoDocComment> = {};
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
    console.error('Error parsing Go doc comments:', error);
    return {};
  }
}

/**
 * Find a specific function signature by name
 * @param code Go source code
 * @param functionName Name of the function to find
 * @returns The signature if found, undefined otherwise
 */
export function findSignatureByName(
  code: string,
  functionName: string
): GoSignature | undefined {
  const signatures = parseGoSignatures(code, functionName);
  return signatures.find(sig => sig.method_name === functionName);
}

