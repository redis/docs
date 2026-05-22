/**
 * Integration Tests for WASM Module
 * 
 * Comprehensive tests for WASM function integration with Node.js.
 * Run with: npm test
 */

import { callAdd, callGreet, initializeWasm } from './wasm-wrapper.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}`);
    if (error instanceof Error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

function assertEqual(actual: unknown, expected: unknown, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, got ${actual}`
    );
  }
}

async function runTests(): Promise<void> {
  console.log('Running WASM Integration Tests\n');

  // Initialize WASM
  await initializeWasm();

  // Test add function with various inputs
  test('add(0, 0) should return 0', () => {
    assertEqual(callAdd(0, 0), 0);
  });

  test('add(5, 3) should return 8', () => {
    assertEqual(callAdd(5, 3), 8);
  });

  test('add(-5, 3) should return -2', () => {
    assertEqual(callAdd(-5, 3), -2);
  });

  test('add(100, 200) should return 300', () => {
    assertEqual(callAdd(100, 200), 300);
  });

  test('add with negative numbers', () => {
    assertEqual(callAdd(-10, -20), -30);
  });

  // Test greet function with various inputs
  test('greet("World") should return "Hello, World!"', () => {
    assertEqual(callGreet('World'), 'Hello, World!');
  });

  test('greet("Alice") should return "Hello, Alice!"', () => {
    assertEqual(callGreet('Alice'), 'Hello, Alice!');
  });

  test('greet with empty string', () => {
    assertEqual(callGreet(''), 'Hello, !');
  });

  test('greet with special characters', () => {
    assertEqual(callGreet('World!'), 'Hello, World!!');
  });

  test('greet with unicode characters', () => {
    assertEqual(callGreet('世界'), 'Hello, 世界!');
  });

  // Print results
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\nTest Results: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

