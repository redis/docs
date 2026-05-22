/**
 * PHP Parser Test Suite
 * 
 * Tests for PHP signature and PHPDoc comment extraction
 */

import { parsePHPSignatures, parsePHPDocComments } from './parsers/php-parser.js';

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error}`);
    testsFailed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Simple function signature
test('Parse simple function signature', () => {
  const code = `function hello() {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].method_name === 'hello', 'Method name should be hello');
  assert(sigs[0].parameters.length === 0, 'Should have no parameters');
});

// Test 2: Function with parameters
test('Parse function with parameters', () => {
  const code = `function add($a, $b) {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs.length === 1, 'Should find 1 signature');
  assert(sigs[0].parameters.length === 2, 'Should have 2 parameters');
});

// Test 3: Function with return type
test('Parse function with return type', () => {
  const code = `function getValue(): string {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].return_type === 'string', 'Return type should be string');
});

// Test 4: Public method
test('Parse public method', () => {
  const code = `public function doSomething() {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].modifiers.includes('public'), 'Should have public modifier');
});

// Test 5: Static method
test('Parse static method', () => {
  const code = `public static function getInstance() {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].modifiers.includes('static'), 'Should have static modifier');
});

// Test 6: Variadic parameters
test('Parse variadic parameters', () => {
  const code = `function sum(...$numbers) {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].is_variadic === true, 'Should detect variadic parameters');
});

// Test 7: Type hints
test('Parse type hints', () => {
  const code = `function process(array $data, int $count): bool {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].parameters.length === 2, 'Should have 2 parameters');
  assert(sigs[0].return_type === 'bool', 'Return type should be bool');
});

// Test 8: Nullable types
test('Parse nullable types', () => {
  const code = `function getValue(): ?string {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].return_type === '?string', 'Return type should be ?string');
});

// Test 9: PHPDoc comment extraction
test('Extract PHPDoc comment', () => {
  const code = `
/**
 * Get user by ID
 * @param int $id User ID
 * @return User|null
 */
function getUser($id) {}`;
  const docs = parsePHPDocComments(code);
  assert(Object.keys(docs).length === 1, 'Should find 1 documented function');
  assert(docs['getUser'].summary === 'Get user by ID', 'Summary should match');
});

// Test 10: PHPDoc parameters
test('Extract PHPDoc parameters', () => {
  const code = `
/**
 * @param string $name User name
 * @param int $age User age
 */
function createUser($name, $age) {}`;
  const docs = parsePHPDocComments(code);
  assert(Object.keys(docs['createUser'].parameters).length === 2, 'Should have 2 parameters');
});

// Test 11: PHPDoc return type
test('Extract PHPDoc return type', () => {
  const code = `
/**
 * @return array List of users
 */
function getUsers() {}`;
  const docs = parsePHPDocComments(code);
  assert(docs['getUsers'].returns === 'array List of users', 'Return should match');
});

// Test 12: Multiple functions
test('Parse multiple functions', () => {
  const code = `
function first() {}
function second() {}
function third() {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs.length === 3, 'Should find 3 functions');
});

// Test 13: Method name filtering
test('Filter by method name', () => {
  const code = `
function getValue() {}
function setValue() {}
function process() {}`;
  const sigs = parsePHPSignatures(code, 'Value');
  assert(sigs.length === 2, 'Should find 2 functions with Value in name');
});

// Test 14: Complex PHPDoc
test('Parse complex PHPDoc', () => {
  const code = `
/**
 * Process data with validation
 * 
 * @param array $data Input data
 * @param bool $validate Whether to validate
 * @return array Processed data
 */
function processData($data, $validate) {}`;
  const docs = parsePHPDocComments(code);
  assert(docs['processData'].summary === 'Process data with validation', 'Summary should match');
  assert(docs['processData'].parameters['data'] !== undefined, 'Should have data parameter');
});

// Test 15: Private method
test('Parse private method', () => {
  const code = `private function internalMethod() {}`;
  const sigs = parsePHPSignatures(code);
  assert(sigs[0].modifiers.includes('private'), 'Should have private modifier');
});

// Print results
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}`);

process.exit(testsFailed > 0 ? 1 : 0);

