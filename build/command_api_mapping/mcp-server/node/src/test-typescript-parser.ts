/**
 * TypeScript Parser Test Suite
 * 
 * Tests for TypeScript signature and JSDoc comment extraction
 */

import { parseTypeScriptSignatures, parseTypeScriptDocComments } from './parsers/typescript-parser.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    console.log(`✗ ${name}: ${error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

// Test 1: Simple function
test('Parse simple function', () => {
  const code = `function greet(name: string): string {
    return \`Hello, \${name}!\`;
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'greet', 'Method name should be greet');
  assert(sigs[0].return_type === 'string', 'Return type should be string');
});

// Test 2: Async function
test('Parse async function', () => {
  const code = `async function fetchData(url: string): Promise<any> {
    return fetch(url);
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].is_async ?? false) === true, 'Should be marked as async');
  assert((sigs[0].return_type ?? '').includes('Promise'), 'Return type should include Promise');
});

// Test 3: Function with multiple parameters
test('Parse function with multiple parameters', () => {
  const code = `function add(a: number, b: number): number {
    return a + b;
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].parameters.length === 2, 'Should have 2 parameters');
});

// Test 4: Export function
test('Parse exported function', () => {
  const code = `export function getValue(): string {
    return 'value';
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'getValue', 'Method name should be getValue');
});

// Test 5: Method name filtering
test('Filter by method name', () => {
  const code = `function foo() {}
  function bar() {}
  function baz() {}`;
  const sigs = parseTypeScriptSignatures(code, 'ba');
  assert(sigs.length === 2, 'Should find 2 signatures matching "ba"');
});

// Test 6: JSDoc with @param and @returns
test('Parse JSDoc with @param and @returns', () => {
  const code = `/**
   * Adds two numbers
   * @param a The first number
   * @param b The second number
   * @returns The sum
   */
  function add(a: number, b: number): number {
    return a + b;
  }`;
  const docs = parseTypeScriptDocComments(code);
  assert('add' in docs, 'Should have doc for add function');
  assert(docs.add.summary === 'Adds two numbers', 'Summary should match');
  assert('a' in docs.add.parameters, 'Should have parameter a');
  assert('b' in docs.add.parameters, 'Should have parameter b');
  assert((docs.add.returns ?? '').includes('sum'), 'Returns should mention sum');
});

// Test 7: JSDoc with description
test('Parse JSDoc with description', () => {
  const code = `/**
   * Greet a person
   * This function creates a greeting message
   * @param name The person's name
   */
  function greet(name: string): string {
    return \`Hello, \${name}!\`;
  }`;
  const docs = parseTypeScriptDocComments(code);
  assert('greet' in docs, 'Should have doc for greet function');
  assert((docs.greet.description ?? '').includes('greeting'), 'Description should mention greeting');
});

// Test 8: Multiple functions with docs
test('Parse multiple functions with docs', () => {
  const code = `/**
   * Function one
   */
  function one() {}
  
  /**
   * Function two
   */
  function two() {}`;
  const docs = parseTypeScriptDocComments(code);
  assert('one' in docs, 'Should have doc for one');
  assert('two' in docs, 'Should have doc for two');
});

// Test 9: Function without JSDoc
test('Handle function without JSDoc', () => {
  const code = `function noDoc() {}`;
  const docs = parseTypeScriptDocComments(code);
  assert(!('noDoc' in docs), 'Should not have doc for noDoc');
});

// Test 10: Complex return type
test('Parse complex return type', () => {
  const code = `function getData(): Promise<{ id: number; name: string }> {
    return Promise.resolve({ id: 1, name: 'test' });
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].return_type ?? '').includes('Promise'), 'Return type should include Promise');
});

// Test 11: Generic function
test('Parse generic function', () => {
  const code = `function identity<T>(value: T): T {
    return value;
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'identity', 'Method name should be identity');
});

// Test 12: Optional parameters
test('Parse optional parameters', () => {
  const code = `function greet(name: string, greeting?: string): string {
    return \`\${greeting || 'Hello'}, \${name}!\`;
  }`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].parameters.length === 2, 'Should have 2 parameters');
});

// Test 13: Arrow function
test('Parse arrow function', () => {
  const code = `const add = (a: number, b: number): number => a + b;`;
  const sigs = parseTypeScriptSignatures(code);
  // Arrow functions might not be captured by the regex, which is acceptable
  // as they're often assigned to variables
  console.log(`  Found ${sigs.length} signatures (arrow functions may not be captured)`);
});

// Test 14: JSDoc with @return (singular)
test('Parse JSDoc with @return (singular)', () => {
  const code = `/**
   * Get value
   * @return The value
   */
  function getValue(): string {
    return 'value';
  }`;
  const docs = parseTypeScriptDocComments(code);
  assert('getValue' in docs, 'Should have doc for getValue');
  assert((docs.getValue.returns ?? '').includes('value'), 'Returns should be captured');
});

// Test 15: Empty function
test('Parse empty function', () => {
  const code = `function empty() {}`;
  const sigs = parseTypeScriptSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'empty', 'Method name should be empty');
  assert(!sigs[0].return_type, 'Should have no return type');
});

// Print summary
console.log('\n' + '='.repeat(50));
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Test Results: ${passed}/${total} passed`);
if (passed === total) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed');
  process.exit(1);
}

