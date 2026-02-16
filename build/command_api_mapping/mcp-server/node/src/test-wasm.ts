/**
 * WASM Integration Test Script
 * 
 * This script tests basic WASM functionality by calling the add() and greet() functions.
 * Run with: npm run test-wasm
 */

import { callAdd, callGreet } from './wasm-wrapper';

async function main() {
  console.log('Testing WASM functions...\n');

  try {
    // Test add function
    const addResult = callAdd(5, 3);
    console.log(`✓ add(5, 3) = ${addResult}`);
    if (addResult !== 8) {
      throw new Error(`Expected 8, got ${addResult}`);
    }

    // Test greet function
    const greetResult = callGreet('World');
    console.log(`✓ greet("World") = ${greetResult}`);
    if (greetResult !== 'Hello, World!') {
      throw new Error(`Expected 'Hello, World!', got '${greetResult}'`);
    }

    console.log('\n✅ All WASM tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ WASM test failed:', error);
    process.exit(1);
  }
}

main();

