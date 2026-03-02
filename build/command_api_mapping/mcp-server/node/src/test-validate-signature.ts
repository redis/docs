/**
 * Test Suite for Validate Signature Tool
 * 
 * Tests signature validation for all 7 supported languages
 */

import { validateSignature, isValidSignature, getValidationReport } from "./parsers/signature-validator.js";

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
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}: ${error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// ============================================================================
// Python Tests
// ============================================================================

test("Python: Valid simple function", () => {
  const result = validateSignature("def hello():", "python");
  assert(result.valid, "Should be valid");
  assertEqual(result.errors.length, 0, "Should have no errors");
});

test("Python: Valid function with parameters", () => {
  const result = validateSignature("def greet(name: str, age: int):", "python");
  assert(result.valid, "Should be valid");
});

test("Python: Valid async function", () => {
  const result = validateSignature("async def fetch_data():", "python");
  assert(result.valid, "Should be valid");
});

test("Python: Valid function with return type", () => {
  const result = validateSignature("def get_value() -> str:", "python");
  assert(result.valid, "Should be valid");
});

test("Python: Invalid - missing def keyword", () => {
  const result = validateSignature("hello():", "python");
  assert(!result.valid, "Should be invalid");
  assert(result.errors.length > 0, "Should have errors");
});

test("Python: Invalid - missing parentheses", () => {
  const result = validateSignature("def hello:", "python");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// Java Tests
// ============================================================================

test("Java: Valid simple method", () => {
  const result = validateSignature("public void doSomething()", "java");
  assert(result.valid, "Should be valid");
});

test("Java: Valid method with parameters", () => {
  const result = validateSignature("public String getName(String id, int count)", "java");
  assert(result.valid, "Should be valid");
});

test("Java: Valid method with return type", () => {
  const result = validateSignature("public List<String> getItems()", "java");
  assert(result.valid, "Should be valid");
});

test("Java: Invalid - missing parentheses", () => {
  const result = validateSignature("public void doSomething", "java");
  assert(!result.valid, "Should be invalid");
});

test("Java: Invalid - no method name", () => {
  const result = validateSignature("public void ()", "java");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// Go Tests
// ============================================================================

test("Go: Valid simple function", () => {
  const result = validateSignature("func Hello()", "go");
  assert(result.valid, "Should be valid");
});

test("Go: Valid function with parameters", () => {
  const result = validateSignature("func Greet(name string, age int)", "go");
  assert(result.valid, "Should be valid");
});

test("Go: Valid function with error return", () => {
  const result = validateSignature("func FetchData() (string, error)", "go");
  assert(result.valid, "Should be valid");
});

test("Go: Valid receiver method", () => {
  const result = validateSignature("func (r *Reader) Read(p []byte) (n int, err error)", "go");
  assert(result.valid, "Should be valid");
});

test("Go: Invalid - missing func keyword", () => {
  const result = validateSignature("Hello()", "go");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// TypeScript Tests
// ============================================================================

test("TypeScript: Valid function declaration", () => {
  const result = validateSignature("function hello(): void", "typescript");
  assert(result.valid, "Should be valid");
});

test("TypeScript: Valid async function", () => {
  const result = validateSignature("async function fetchData(): Promise<string>", "typescript");
  assert(result.valid, "Should be valid");
});

test("TypeScript: Valid arrow function", () => {
  const result = validateSignature("const greet = (name: string): string =>", "typescript");
  assert(result.valid, "Should be valid");
});

test("TypeScript: Valid function with parameters", () => {
  const result = validateSignature("function add(a: number, b: number): number", "typescript");
  assert(result.valid, "Should be valid");
});

test("TypeScript: Invalid - missing parentheses", () => {
  const result = validateSignature("function hello: void", "typescript");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// Rust Tests
// ============================================================================

test("Rust: Valid simple function", () => {
  const result = validateSignature("fn hello() -> ()", "rust");
  assert(result.valid, "Should be valid");
});

test("Rust: Valid public function", () => {
  const result = validateSignature("pub fn greet(name: &str) -> String", "rust");
  assert(result.valid, "Should be valid");
});

test("Rust: Valid async function", () => {
  const result = validateSignature("async fn fetch_data() -> Result<String, Error>", "rust");
  assert(result.valid, "Should be valid");
});

test("Rust: Valid function with Result", () => {
  const result = validateSignature("fn parse(input: &str) -> Result<i32, ParseError>", "rust");
  assert(result.valid, "Should be valid");
});

test("Rust: Invalid - missing fn keyword", () => {
  const result = validateSignature("hello() -> ()", "rust");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// C# Tests
// ============================================================================

test("C#: Valid simple method", () => {
  const result = validateSignature("public void DoSomething()", "csharp");
  assert(result.valid, "Should be valid");
});

test("C#: Valid async method", () => {
  const result = validateSignature("public async Task FetchDataAsync()", "csharp");
  assert(result.valid, "Should be valid");
});

test("C#: Valid method with return type", () => {
  const result = validateSignature("public string GetName(int id)", "csharp");
  assert(result.valid, "Should be valid");
});

test("C#: Valid method with generic return", () => {
  const result = validateSignature("public List<string> GetItems()", "csharp");
  assert(result.valid, "Should be valid");
});

test("C#: Invalid - missing parentheses", () => {
  const result = validateSignature("public void DoSomething", "csharp");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// PHP Tests
// ============================================================================

test("PHP: Valid simple function", () => {
  const result = validateSignature("function hello()", "php");
  assert(result.valid, "Should be valid");
});

test("PHP: Valid public method", () => {
  const result = validateSignature("public function greet(string $name)", "php");
  assert(result.valid, "Should be valid");
});

test("PHP: Valid method with return type", () => {
  const result = validateSignature("public function getName(): string", "php");
  assert(result.valid, "Should be valid");
});

test("PHP: Valid static method", () => {
  const result = validateSignature("public static function create()", "php");
  assert(result.valid, "Should be valid");
});

test("PHP: Invalid - missing function keyword", () => {
  const result = validateSignature("hello()", "php");
  assert(!result.valid, "Should be invalid");
});

// ============================================================================
// Utility Function Tests
// ============================================================================

test("isValidSignature: Returns true for valid signature", () => {
  const valid = isValidSignature("def hello():", "python");
  assert(valid === true, "Should return true");
});

test("isValidSignature: Returns false for invalid signature", () => {
  const valid = isValidSignature("hello():", "python");
  assert(valid === false, "Should return false");
});

test("getValidationReport: Generates report for valid signature", () => {
  const report = getValidationReport("def hello():", "python");
  assert(report.includes("VALID"), "Report should indicate valid");
  assert(report.includes("python"), "Report should include language");
});

test("getValidationReport: Generates report for invalid signature", () => {
  const report = getValidationReport("hello():", "python");
  assert(report.includes("INVALID"), "Report should indicate invalid");
  assert(report.includes("Errors"), "Report should include errors section");
});

// ============================================================================
// Summary
// ============================================================================

console.log("\n" + "=".repeat(60));
console.log("Test Summary");
console.log("=".repeat(60));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log("\nFailed Tests:");
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  process.exit(1);
} else {
  console.log("\n✓ All tests passed!");
  process.exit(0);
}

