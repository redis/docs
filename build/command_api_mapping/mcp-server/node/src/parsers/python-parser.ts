/**
 * Python Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM Python parser.
 * It extracts method/function signatures from Python source code.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface PythonSignature {
  method_name: string;
  signature: string;
  parameters: string[];
  return_type?: string;
  line_number: number;
  is_async: boolean;
}

/**
 * Parse Python source code and extract function signatures
 * @param code Python source code to parse
 * @param methodNameFilter Optional filter to only return signatures matching this name
 * @returns Array of extracted signatures
 */
export function parsePythonSignatures(
  code: string,
  methodNameFilter?: string
): PythonSignature[] {
  try {
    const result = wasmModule.parse_python_signatures(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Python parser error: ${(result as any).error}`);
      return [];
    }

    // Convert result to array if needed
    let signatures: PythonSignature[] = [];

    if (Array.isArray(result)) {
      // Convert Map objects to plain objects
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
      // Try to extract signatures from object
      const resultObj = result as any;
      if (Array.isArray(resultObj.signatures)) {
        signatures = resultObj.signatures;
      } else if (resultObj.length !== undefined) {
        // It's array-like
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
    console.error('Error parsing Python signatures:', error);
    return [];
  }
}

/**
 * Parse Python file and extract signatures
 * @param code Python source code
 * @returns Array of all signatures
 */
export function extractAllSignatures(code: string): PythonSignature[] {
  return parsePythonSignatures(code);
}

/**
 * Find a specific method signature by name
 * @param code Python source code
 * @param methodName Name of the method to find
 * @returns The signature if found, undefined otherwise
 */
export function findSignatureByName(
  code: string,
  methodName: string
): PythonSignature | undefined {
  const signatures = parsePythonSignatures(code, methodName);
  return signatures.find(sig => sig.method_name === methodName);
}

/**
 * Get all async function signatures
 * @param code Python source code
 * @returns Array of async function signatures
 */
export function getAsyncSignatures(code: string): PythonSignature[] {
  const signatures = parsePythonSignatures(code);
  return signatures.filter(sig => sig.is_async);
}

/**
 * Get all regular (non-async) function signatures
 * @param code Python source code
 * @returns Array of regular function signatures
 */
export function getRegularSignatures(code: string): PythonSignature[] {
  const signatures = parsePythonSignatures(code);
  return signatures.filter(sig => !sig.is_async);
}

/**
 * Get signatures with return type annotations
 * @param code Python source code
 * @returns Array of signatures with return types
 */
export function getSignaturesWithReturnType(code: string): PythonSignature[] {
  const signatures = parsePythonSignatures(code);
  return signatures.filter(sig => sig.return_type !== undefined);
}

