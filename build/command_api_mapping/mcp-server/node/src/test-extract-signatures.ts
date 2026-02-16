/**
 * Test Suite for Extract Signatures Tool
 * 
 * Tests the Python signature extraction functionality
 */

import { parsePythonSignatures } from "./parsers/python-parser.js";

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

// Test 1: Simple function parsing
test("Parse simple function", () => {
  const code = `def hello():
    pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assertEqual(sigs[0].method_name, "hello", "Method name should be 'hello'");
  assertEqual(sigs[0].is_async ?? false, false, "Should not be async");
});

// Test 2: Function with parameters
test("Parse function with parameters", () => {
  const code = `def add(a, b):
    return a + b`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assertEqual(sigs[0].parameters.length, 2, "Should have 2 parameters");
  assert(sigs[0].parameters[0].includes("a"), "First param should be 'a'");
  assert(sigs[0].parameters[1].includes("b"), "Second param should be 'b'");
});

// Test 3: Function with type hints
test("Parse function with type hints", () => {
  const code = `def greet(name: str) -> str:
    return f"Hello, {name}"`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assert(sigs[0].return_type !== undefined, "Should have return type");
  assert((sigs[0].return_type ?? "").includes("str"), "Return type should be str");
});

// Test 4: Async function
test("Parse async function", () => {
  const code = `async def fetch_data():
    pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assertEqual(sigs[0].is_async ?? false, true, "Should be async");
});

// Test 5: Multiple functions
test("Parse multiple functions", () => {
  const code = `def func1():
    pass

def func2():
    pass

def func3():
    pass`;
  const sigs = parsePythonSignatures(code);
  assertEqual(sigs.length, 3, "Should find 3 signatures");
});

// Test 6: Function with default parameters
test("Parse function with default parameters", () => {
  const code = `def greet(name="World"):
    pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assert(sigs[0].parameters.length === 1, "Should have 1 parameter");
});

// Test 7: Complex function signature
test("Parse complex function signature", () => {
  const code = `def process(data: list, callback: callable = None) -> dict:
    pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assertEqual(sigs[0].parameters.length, 2, "Should have 2 parameters");
});

// Test 8: Line numbers
test("Track line numbers correctly", () => {
  const code = `def func1():
    pass

def func2():
    pass`;
  const sigs = parsePythonSignatures(code);
  assertEqual(sigs[0].line_number, 1, "First function should be on line 1");
  assertEqual(sigs[1].line_number, 4, "Second function should be on line 4");
});

// Test 9: Method name filtering
test("Filter by method name", () => {
  const code = `def get_user():
    pass

def set_user():
    pass

def delete_user():
    pass`;
  const sigs = parsePythonSignatures(code, "get");
  assertEqual(sigs.length, 1, "Should find 1 matching signature");
  assertEqual(sigs[0].method_name, "get_user", "Should match 'get_user'");
});

// Test 10: Empty file
test("Handle empty file", () => {
  const code = "";
  const sigs = parsePythonSignatures(code);
  assertEqual(sigs.length, 0, "Should find 0 signatures");
});

// Test 11: File with no functions
test("Handle file with no functions", () => {
  const code = `# Just a comment
x = 5
y = 10`;
  const sigs = parsePythonSignatures(code);
  assertEqual(sigs.length, 0, "Should find 0 signatures");
});

// Test 12: Indented functions (class methods)
test("Parse indented function (class method)", () => {
  const code = `class MyClass:
    def method(self):
        pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length >= 1, "Should find at least 1 signature");
});

// Test 13: Signature format
test("Signature format is correct", () => {
  const code = `def hello(name):
    pass`;
  const sigs = parsePythonSignatures(code);
  assert(sigs[0].signature.includes("def"), "Signature should include 'def'");
  assert(sigs[0].signature.includes("hello"), "Signature should include method name");
});

// Test 14: Mixed async and regular functions
test("Parse mixed async and regular functions", () => {
  const code = `def regular():
    pass

async def async_func():
    pass

def another_regular():
    pass`;
  const sigs = parsePythonSignatures(code);
  assertEqual(sigs.length, 3, "Should find 3 signatures");
  const asyncCount = sigs.filter(s => s.is_async).length;
  assertEqual(asyncCount, 1, "Should have 1 async function");
});

// Test 15: Real-world example
test("Parse real-world Redis client method", () => {
  const code = `def get(self, name: str) -> Optional[bytes]:
    """Get the value of a key."""
    return self.execute_command('GET', name)`;
  const sigs = parsePythonSignatures(code);
  assert(sigs.length === 1, "Should find 1 signature");
  assertEqual(sigs[0].method_name, "get", "Method name should be 'get'");
  assert(sigs[0].return_type !== undefined, "Should have return type");
});

// Print summary
console.log("\n" + "=".repeat(50));
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Test Results: ${passed}/${total} passed`);

if (passed === total) {
  console.log("✓ All tests passed!");
  process.exit(0);
} else {
  console.log("✗ Some tests failed");
  process.exit(1);
}

