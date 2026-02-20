/**
 * Rust Parser Test Suite
 * 
 * Tests for Rust signature and doc comment extraction
 */

import { parseRustSignatures, parseRustDocComments } from './parsers/rust-parser.js';

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
  const code = `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'greet', 'Method name should be greet');
  assert(sigs[0].return_type === 'String', 'Return type should be String');
});

// Test 2: Async function
test('Parse async function', () => {
  const code = `async fn fetch_data(url: &str) -> Result<String, Error> {
    Ok(String::new())
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].is_async ?? false) === true, 'Should be marked as async');
  assert((sigs[0].return_type ?? '').includes('Result'), 'Return type should include Result');
});

// Test 3: Unsafe function
test('Parse unsafe function', () => {
  const code = `unsafe fn dangerous_operation() {
    // unsafe code
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].is_unsafe ?? false) === true, 'Should be marked as unsafe');
});

// Test 4: Function with multiple parameters
test('Parse function with multiple parameters', () => {
  const code = `fn add(a: i32, b: i32) -> i32 {
    a + b
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].parameters.length === 2, 'Should have 2 parameters');
});

// Test 5: Public function
test('Parse public function', () => {
  const code = `pub fn get_value() -> String {
    String::from("value")
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'get_value', 'Method name should be get_value');
});

// Test 6: Generic function
test('Parse generic function', () => {
  const code = `fn identity<T>(x: T) -> T {
    x
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'identity', 'Method name should be identity');
});

// Test 7: Method name filtering
test('Filter by method name', () => {
  const code = `fn foo() {}
  fn bar() {}
  fn baz() {}`;
  const sigs = parseRustSignatures(code, 'ba');
  assert(sigs.length === 2, 'Should find 2 signatures matching "ba"');
});

// Test 8: Doc comment with summary
test('Parse doc comment with summary', () => {
  const code = `/// Adds two numbers together
  fn add(a: i32, b: i32) -> i32 {
    a + b
  }`;
  const docs = parseRustDocComments(code);
  assert(Object.keys(docs).length === 1, 'Should find 1 documented function');
  assert(docs['add']?.summary === 'Adds two numbers together', 'Summary should match');
});

// Test 9: Doc comment with parameters
test('Parse doc comment with parameters', () => {
  const code = `/// Multiplies two numbers
  /// # Arguments
  /// * \`a\` - First number
  /// * \`b\` - Second number
  fn multiply(a: i32, b: i32) -> i32 {
    a * b
  }`;
  const docs = parseRustDocComments(code);
  assert(Object.keys(docs).length === 1, 'Should find 1 documented function');
  assert(docs['multiply']?.summary === 'Multiplies two numbers', 'Summary should match');
});

// Test 10: Doc comment with returns
test('Parse doc comment with returns', () => {
  const code = `/// Gets the value
  /// # Returns
  /// The stored value
  fn get_value() -> String {
    String::from("value")
  }`;
  const docs = parseRustDocComments(code);
  assert(Object.keys(docs).length === 1, 'Should find 1 documented function');
  assert(docs['get_value']?.returns === 'The stored value', 'Returns should match');
});

// Test 11: Multiple functions
test('Parse multiple functions', () => {
  const code = `fn foo() {}
  fn bar() {}
  fn baz() {}`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 3, 'Should find 3 signatures');
});

// Test 12: Function with Result type
test('Parse function with Result type', () => {
  const code = `fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.parse()
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].return_type ?? '').includes('Result'), 'Return type should include Result');
});

// Test 13: Async unsafe function
test('Parse async unsafe function', () => {
  const code = `pub async unsafe fn risky_operation() -> Result<(), Error> {
    Ok(())
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert((sigs[0].is_async ?? false) === true, 'Should be marked as async');
  assert((sigs[0].is_unsafe ?? false) === true, 'Should be marked as unsafe');
});

// Test 14: Function with lifetime parameters
test('Parse function with lifetime parameters', () => {
  const code = `fn borrow<'a>(s: &'a str) -> &'a str {
    s
  }`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'borrow', 'Method name should be borrow');
});

// Test 15: Empty function
test('Parse empty function', () => {
  const code = `fn noop() {}`;
  const sigs = parseRustSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].parameters.length === 0, 'Should have 0 parameters');
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

