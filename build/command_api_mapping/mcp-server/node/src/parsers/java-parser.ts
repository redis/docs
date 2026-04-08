/**
 * Java Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM Java parser.
 * It extracts method signatures and JavaDoc comments from Java source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface JavaSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  modifiers: string[];
  throws: string[];
}

export interface JavaDocComment {
  method_name: string;
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters: Record<string, string>;
  returns?: string;
  throws: Record<string, string>;
  line_number: number;
}

/**
 * Parse Java source code and extract method signatures
 * @param code Java source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parseJavaSignatures(
  code: string,
  methodNameFilter?: string
): JavaSignature[] {
  try {
    const result = wasmModule.parse_java_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Java parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: JavaSignature[] = [];

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
            throws: item.get('throws') || [],
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
    console.error('Error parsing Java signatures:', error);
    return [];
  }
}

/**
 * Parse Java source code and extract JavaDoc comments
 * @param code Java source code to parse
 * @returns Map of method names to JavaDoc comments
 */
export function parseJavaDocComments(code: string): Record<string, JavaDocComment> {
  try {
    const result = wasmModule.parse_java_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Java doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert Map to object if needed
    if (result instanceof Map) {
      const docMap: Record<string, JavaDocComment> = {};
      result.forEach((value: any, key: string) => {
        // Convert nested Maps to objects
        let docComment: any = {};
        if (value instanceof Map) {
          value.forEach((v: any, k: string) => {
            if (v instanceof Map) {
              // Convert nested Maps (like parameters and throws)
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
    console.error('Error parsing Java doc comments:', error);
    return {};
  }
}

/**
 * Find a specific method signature by name
 * @param code Java source code
 * @param methodName Name of the method to find
 * @returns The signature if found, undefined otherwise
 */
export function findSignatureByName(
  code: string,
  methodName: string
): JavaSignature | undefined {
  const signatures = parseJavaSignatures(code, methodName);
  return signatures.find(sig => sig.method_name === methodName);
}

/**
 * Get all public method signatures
 * @param code Java source code
 * @returns Array of public method signatures
 */
export function getPublicSignatures(code: string): JavaSignature[] {
  const signatures = parseJavaSignatures(code);
  return signatures.filter(sig => sig.modifiers.includes('public'));
}

/**
 * Get all static method signatures
 * @param code Java source code
 * @returns Array of static method signatures
 */
export function getStaticSignatures(code: string): JavaSignature[] {
  const signatures = parseJavaSignatures(code);
  return signatures.filter(sig => sig.modifiers.includes('static'));
}

