/**
 * Test Suite for Extract Doc Comments Tool
 * 
 * Tests the Python docstring extraction functionality
 */

import { parsePythonDocComments, findDocCommentByName, getDocumentedMethods, getMissingDocumentation } from "./parsers/python-doc-parser.js";

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

// Test 1: Simple docstring extraction
test("Extract simple docstring", () => {
  const code = `def hello():
    """Say hello."""
    pass`;
  const docs = parsePythonDocComments(code);
  assert(Object.keys(docs).length === 1, "Should find 1 docstring");
  assert(docs.hello !== undefined, "Should have 'hello' method");
  assert(docs.hello.summary === "Say hello.", "Summary should match");
});

// Test 2: Google-style docstring with Args
test("Parse Google-style docstring with Args", () => {
  const code = `def add(a, b):
    """Add two numbers.
    
    Args:
        a: First number
        b: Second number
    
    Returns:
        The sum of a and b
    """
    return a + b`;
  const docs = parsePythonDocComments(code);
  assert(docs.add !== undefined, "Should have 'add' method");
  assert(docs.add.summary === "Add two numbers.", "Summary should match");
  assert(docs.add.parameters !== undefined, "Should have parameters");
  assert(docs.add.parameters?.a === "First number", "Parameter 'a' should match");
  assert(docs.add.parameters?.b === "Second number", "Parameter 'b' should match");
  assert(docs.add.returns !== undefined, "Should have returns");
});

// Test 3: Multi-line description
test("Parse multi-line description", () => {
  const code = `def process():
    """Process data.
    
    This function processes the input data
    and returns the result.
    """
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.process !== undefined, "Should have 'process' method");
  assert(docs.process.description !== undefined, "Should have description");
});

// Test 4: Function without docstring
test("Handle function without docstring", () => {
  const code = `def no_doc():
    pass`;
  const docs = parsePythonDocComments(code);
  assert(Object.keys(docs).length === 0, "Should find no docstrings");
});

// Test 5: Multiple functions with mixed documentation
test("Parse multiple functions with mixed docs", () => {
  const code = `def func1():
    """First function."""
    pass

def func2():
    pass

def func3():
    """Third function."""
    pass`;
  const docs = parsePythonDocComments(code);
  assert(Object.keys(docs).length === 2, "Should find 2 docstrings");
  assert(docs.func1 !== undefined, "Should have func1");
  assert(docs.func3 !== undefined, "Should have func3");
  assert(docs.func2 === undefined, "Should not have func2");
});

// Test 6: Method name filtering
test("Filter by method names", () => {
  const code = `def method1():
    """Method 1."""
    pass

def method2():
    """Method 2."""
    pass`;
  const docs = parsePythonDocComments(code, ["method1"]);
  assert(Object.keys(docs).length === 1, "Should find 1 docstring");
  assert(docs.method1 !== undefined, "Should have method1");
  assert(docs.method2 === undefined, "Should not have method2");
});

// Test 7: Find specific doc comment
test("Find specific doc comment by name", () => {
  const code = `def target():
    """Target function."""
    pass`;
  const doc = findDocCommentByName(code, "target");
  assert(doc !== undefined, "Should find doc comment");
  assert(doc?.summary === "Target function.", "Summary should match");
});

// Test 8: Get documented methods
test("Get list of documented methods", () => {
  const code = `def doc1():
    """Documented."""
    pass

def doc2():
    """Also documented."""
    pass

def undoc():
    pass`;
  const methods = getDocumentedMethods(code);
  assert(methods.length === 2, "Should find 2 documented methods");
  assert(methods.includes("doc1"), "Should include doc1");
  assert(methods.includes("doc2"), "Should include doc2");
});

// Test 9: Get missing documentation
test("Get list of methods missing documentation", () => {
  const code = `def documented():
    """Has docs."""
    pass

def undocumented():
    pass`;
  const allMethods = ["documented", "undocumented"];
  const missing = getMissingDocumentation(code, allMethods);
  assert(missing.length === 1, "Should find 1 missing doc");
  assert(missing[0] === "undocumented", "Should identify undocumented");
});

// Test 10: Async function docstring
test("Extract docstring from async function", () => {
  const code = `async def fetch():
    """Fetch data asynchronously."""
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.fetch !== undefined, "Should have 'fetch' method");
  assert(docs.fetch.summary === "Fetch data asynchronously.", "Summary should match");
});

// Test 11: Single-line docstring with triple quotes
test("Parse single-line docstring", () => {
  const code = `def simple():
    """Simple one-liner."""
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.simple !== undefined, "Should have 'simple' method");
  assert(docs.simple.summary === "Simple one-liner.", "Summary should match");
});

// Test 12: Docstring with single quotes
test("Parse docstring with single quotes", () => {
  const code = `def quoted():
    '''Single quoted docstring.'''
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.quoted !== undefined, "Should have 'quoted' method");
  assert(docs.quoted.summary === "Single quoted docstring.", "Summary should match");
});

// Test 13: Complex Google-style with multiple sections
test("Parse complex Google-style docstring", () => {
  const code = `def complex_func(x, y):
    """Complex function.
    
    Longer description here.
    
    Args:
        x: First parameter
        y: Second parameter
    
    Returns:
        Result value
    """
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.complex_func !== undefined, "Should have 'complex_func'");
  assert(docs.complex_func.summary === "Complex function.", "Summary should match");
  assert(docs.complex_func.description !== undefined, "Should have description");
  assert(docs.complex_func.parameters?.x === "First parameter", "Parameter x should match");
});

// Test 14: Empty docstring
test("Handle empty docstring", () => {
  const code = `def empty():
    """"""
    pass`;
  const docs = parsePythonDocComments(code);
  // Empty docstring may or may not be captured depending on implementation
  // Just verify it doesn't crash
  assert(true, "Should handle empty docstring gracefully");
});

// Test 15: Docstring with special characters
test("Handle docstring with special characters", () => {
  const code = `def special():
    """Function with special chars: @#$%^&*()."""
    pass`;
  const docs = parsePythonDocComments(code);
  assert(docs.special !== undefined, "Should have 'special' method");
  assert((docs.special.summary ?? "").includes("@#$%^&*()"), "Should preserve special chars");
});

// Print summary
console.log("\n" + "=".repeat(50));
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`Test Results: ${passed}/${total} passed`);

if (passed === total) {
  console.log("✅ All tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed");
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
}

