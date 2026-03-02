/**
 * WASM Wrapper
 * 
 * This module provides a TypeScript wrapper around the Rust WASM functions.
 * It handles importing the WASM module and exposing its functions to Node.js.
 */

import * as wasmModule from '../../rust/pkg/redis_parser.js';

/**
 * Call the WASM add function
 * @param a First number
 * @param b Second number
 * @returns Sum of a and b
 */
export function callAdd(a: number, b: number): number {
  return wasmModule.add(a, b);
}

/**
 * Call the WASM greet function
 * @param name Name to greet
 * @returns Greeting message
 */
export function callGreet(name: string): string {
  return wasmModule.greet(name);
}

/**
 * Initialize WASM module
 * This function can be called to ensure WASM is properly initialized
 * @returns Promise that resolves when WASM is ready
 */
export async function initializeWasm(): Promise<void> {
  // WASM module is already initialized on import
  // This function is here for future use if async initialization is needed
  return Promise.resolve();
}

