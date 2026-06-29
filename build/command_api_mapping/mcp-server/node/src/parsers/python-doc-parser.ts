/**
 * Python Doc Comment Parser Module
 * 
 * This module provides a TypeScript wrapper around the Rust WASM Python doc parser.
 * It extracts docstrings from Python source code and parses them into structured data.
 */

import * as wasmModule from '../../../rust/pkg/redis_parser.js';

export interface DocParameter {
  [key: string]: string;
}

export interface PythonDocComment {
  raw_comment: string;
  summary?: string;
  description?: string;
  parameters?: DocParameter;
  returns?: string;
  line_number: number;
}

export interface ParsedDocComments {
  [methodName: string]: PythonDocComment;
}

/**
 * Parse Python source code and extract doc comments
 * @param code Python source code to parse
 * @param methodNameFilter Optional filter to only return docs for specific methods
 * @returns Object mapping method names to their doc comments
 */
export function parsePythonDocComments(
  code: string,
  methodNameFilter?: string[]
): ParsedDocComments {
  try {
    const result = wasmModule.parse_python_doc_comments(code);

    // Handle error response from WASM
    if (result && typeof result === 'object' && 'error' in result) {
      console.warn(`Python doc parser error: ${(result as any).error}`);
      return {};
    }

    // Convert result to object if needed
    let docComments: ParsedDocComments = {};

    if (result && typeof result === 'object') {
      // Convert Map objects to plain objects
      if (result instanceof Map) {
        result.forEach((value, key) => {
          docComments[key] = convertDocCommentValue(value);
        });
      } else {
        // Already a plain object
        docComments = result as ParsedDocComments;
      }
    }

    // Apply method name filter if provided
    if (methodNameFilter && methodNameFilter.length > 0) {
      const filtered: ParsedDocComments = {};
      methodNameFilter.forEach(methodName => {
        if (docComments[methodName]) {
          filtered[methodName] = docComments[methodName];
        }
      });
      return filtered;
    }

    return docComments;
  } catch (error) {
    console.error('Error parsing Python doc comments:', error);
    return {};
  }
}

/**
 * Convert doc comment value from WASM (which may be a Map) to plain object
 */
function convertDocCommentValue(value: any): PythonDocComment {
  if (value instanceof Map) {
    const doc: PythonDocComment = {
      raw_comment: value.get('raw_comment') || '',
      line_number: value.get('line_number') || 0,
    };

    if (value.has('summary')) {
      doc.summary = value.get('summary');
    }
    if (value.has('description')) {
      doc.description = value.get('description');
    }
    if (value.has('returns')) {
      doc.returns = value.get('returns');
    }

    const params = value.get('parameters');
    if (params) {
      if (params instanceof Map) {
        doc.parameters = {};
        params.forEach((v: any, k: string) => {
          if (doc.parameters) {
            doc.parameters[k] = v;
          }
        });
      } else {
        doc.parameters = params;
      }
    }

    return doc;
  }

  return value as PythonDocComment;
}

/**
 * Extract all doc comments from Python code
 * @param code Python source code
 * @returns All doc comments found
 */
export function extractAllDocComments(code: string): ParsedDocComments {
  return parsePythonDocComments(code);
}

/**
 * Find a specific method's doc comment by name
 * @param code Python source code
 * @param methodName Name of the method to find
 * @returns The doc comment if found, undefined otherwise
 */
export function findDocCommentByName(
  code: string,
  methodName: string
): PythonDocComment | undefined {
  const docComments = parsePythonDocComments(code, [methodName]);
  return docComments[methodName];
}

/**
 * Get all methods that have documentation
 * @param code Python source code
 * @returns Array of method names with documentation
 */
export function getDocumentedMethods(code: string): string[] {
  const docComments = parsePythonDocComments(code);
  return Object.keys(docComments);
}

/**
 * Get all methods that are missing documentation
 * @param code Python source code
 * @param allMethodNames All method names in the code
 * @returns Array of method names without documentation
 */
export function getMissingDocumentation(
  code: string,
  allMethodNames: string[]
): string[] {
  const docComments = parsePythonDocComments(code);
  return allMethodNames.filter(name => !docComments[name]);
}

