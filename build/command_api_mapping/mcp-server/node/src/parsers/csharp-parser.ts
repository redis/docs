/**
 * C# Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM C# parser.
 * It extracts method signatures and XML doc comments from C# source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface CSharpSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  modifiers: string[];
  is_async: boolean;
}

export interface CSharpDocComment {
  method_name: string;
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters: Record<string, string>;
  returns?: string;
  line_number: number;
}

/**
 * Parse C# source code and extract method signatures
 * @param code C# source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parseCSharpSignatures(
  code: string,
  methodNameFilter?: string
): CSharpSignature[] {
  try {
    const result = wasmModule.parse_csharp_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`C# parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: CSharpSignature[] = [];

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
            is_async: item.get('is_async') || false,
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
    console.error('Error parsing C# signatures:', error);
    return [];
  }
}

/**
 * Parse C# source code and extract XML doc comments
 * @param code C# source code to parse
 * @returns Map of method names to XML doc comments
 */
export function parseCSharpDocComments(code: string): Record<string, CSharpDocComment> {
  try {
    const result = wasmModule.parse_csharp_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`C# doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert Map to object if needed
    if (result instanceof Map) {
      const docMap: Record<string, CSharpDocComment> = {};
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
    console.error('Error parsing C# doc comments:', error);
    return {};
  }
}

/**
 * Find a specific method signature by name
 * @param code C# source code
 * @param methodName Name of the method to find
 * @returns The signature if found, undefined otherwise
 */
export function findSignatureByName(
  code: string,
  methodName: string
): CSharpSignature | undefined {
  const signatures = parseCSharpSignatures(code, methodName);
  return signatures.find(sig => sig.method_name === methodName);
}

/**
 * Get all public method signatures
 * @param code C# source code
 * @returns Array of public method signatures
 */
export function getPublicSignatures(code: string): CSharpSignature[] {
  const signatures = parseCSharpSignatures(code);
  return signatures.filter(sig => sig.modifiers.includes('public'));
}

/**
 * Get all async method signatures
 * @param code C# source code
 * @returns Array of async method signatures
 */
export function getAsyncSignatures(code: string): CSharpSignature[] {
  const signatures = parseCSharpSignatures(code);
  return signatures.filter(sig => sig.is_async);
}

