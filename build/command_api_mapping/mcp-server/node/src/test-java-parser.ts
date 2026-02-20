/**
 * Java Parser Test Suite
 * 
 * Tests for Java signature and JavaDoc comment extraction
 */

import { parseJavaSignatures, parseJavaDocComments } from './parsers/java-parser.js';

// Test counter
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

// Test 1: Simple method signature
const test1Code = `
public void setValue(String value) {
    this.value = value;
}
`;

const test1Sigs = parseJavaSignatures(test1Code);
assert(test1Sigs.length === 1, 'Test 1: Parse simple method');
assert(test1Sigs[0]?.method_name === 'setValue', 'Test 1: Method name is setValue');
assert(test1Sigs[0]?.modifiers.includes('public'), 'Test 1: Has public modifier');
assert(test1Sigs[0]?.return_type === 'void', 'Test 1: Return type is void');

// Test 2: Method with multiple parameters
const test2Code = `
public String getValue(String key, int defaultValue) {
    return map.getOrDefault(key, defaultValue);
}
`;

const test2Sigs = parseJavaSignatures(test2Code);
assert(test2Sigs.length === 1, 'Test 2: Parse method with multiple params');
assert(test2Sigs[0]?.parameters.length === 2, 'Test 2: Has 2 parameters');
assert(test2Sigs[0]?.return_type === 'String', 'Test 2: Return type is String');

// Test 3: Generic method
const test3Code = `
public <T> List<T> getList(Class<T> clazz) {
    return new ArrayList<>();
}
`;

const test3Sigs = parseJavaSignatures(test3Code);
assert(test3Sigs.length === 1, 'Test 3: Parse generic method');
assert(test3Sigs[0]?.method_name === 'getList', 'Test 3: Method name is getList');

// Test 4: Method with throws clause
const test4Code = `
public void connect() throws IOException, SQLException {
    // connection code
}
`;

const test4Sigs = parseJavaSignatures(test4Code);
assert(test4Sigs.length === 1, 'Test 4: Parse method with throws');
assert(test4Sigs[0]?.throws.length === 2, 'Test 4: Has 2 throws exceptions');
assert(test4Sigs[0]?.throws.includes('IOException'), 'Test 4: Has IOException');

// Test 5: Static method
const test5Code = `
public static String format(String pattern, Object... args) {
    return String.format(pattern, args);
}
`;

const test5Sigs = parseJavaSignatures(test5Code);
assert(test5Sigs.length === 1, 'Test 5: Parse static method');
assert(test5Sigs[0]?.modifiers.includes('static'), 'Test 5: Has static modifier');

// Test 6: JavaDoc with @param and @return
const test6Code = `
/**
 * Gets the value associated with the key.
 * 
 * @param key the key to look up
 * @return the value, or null if not found
 */
public String getValue(String key) {
    return map.get(key);
}
`;

const test6Docs = parseJavaDocComments(test6Code);
assert(Object.keys(test6Docs).length === 1, 'Test 6: Parse JavaDoc comment');
const test6Doc = test6Docs['getValue'];
assert(test6Doc !== undefined, 'Test 6: getValue doc exists');
if (test6Doc) {
  assert((test6Doc.summary ?? '').includes('Gets the value'), 'Test 6: Has summary');
  assert((test6Doc.parameters?.['key'] ?? '').includes('key to look up'), 'Test 6: Has @param');
  assert((test6Doc.returns ?? '').includes('value'), 'Test 6: Has @return');
}

// Test 7: JavaDoc with @throws
const test7Code = `
/**
 * Connects to the database.
 * 
 * @throws IOException if connection fails
 * @throws SQLException if database error occurs
 */
public void connect() throws IOException, SQLException {
    // code
}
`;

const test7Docs = parseJavaDocComments(test7Code);
assert(Object.keys(test7Docs).length === 1, 'Test 7: Parse JavaDoc with throws');
const test7Doc = test7Docs['connect'];
assert(test7Doc !== undefined, 'Test 7: connect doc exists');
if (test7Doc) {
  assert((test7Doc.throws?.['IOException'] ?? '').includes('connection fails'), 'Test 7: Has IOException doc');
  assert((test7Doc.throws?.['SQLException'] ?? '').includes('database error'), 'Test 7: Has SQLException doc');
}

// Test 8: Multiple methods
const test8Code = `
public void method1() {}
public void method2() {}
public void method3() {}
`;

const test8Sigs = parseJavaSignatures(test8Code);
assert(test8Sigs.length === 3, 'Test 8: Parse multiple methods');

// Test 9: Method with annotations
const test9Code = `
@Override
public String toString() {
    return "Test";
}
`;

const test9Sigs = parseJavaSignatures(test9Code);
assert(test9Sigs.length === 1, 'Test 9: Parse method with annotation');
assert(test9Sigs[0]?.method_name === 'toString', 'Test 9: Method name is toString');

// Test 10: Private method
const test10Code = `
private void internalMethod() {
    // internal code
}
`;

const test10Sigs = parseJavaSignatures(test10Code);
assert(test10Sigs.length === 1, 'Test 10: Parse private method');
assert(test10Sigs[0]?.modifiers.includes('private'), 'Test 10: Has private modifier');

// Test 11: Method name filtering
const test11Code = `
public void getValue() {}
public void setValue() {}
public void getSize() {}
`;

const test11Sigs = parseJavaSignatures(test11Code, 'get');
assert(test11Sigs.length === 2, 'Test 11: Filter methods by name');

// Test 12: Complex generic return type
const test12Code = `
public Map<String, List<Integer>> getComplexMap() {
    return new HashMap<>();
}
`;

const test12Sigs = parseJavaSignatures(test12Code);
assert(test12Sigs.length === 1, 'Test 12: Parse complex generic return type');
assert(test12Sigs[0]?.method_name === 'getComplexMap', 'Test 12: Method name correct');

// Test 13: Final and abstract methods
const test13Code = `
public final void finalMethod() {}
public abstract void abstractMethod();
`;

const test13Sigs = parseJavaSignatures(test13Code);
assert(test13Sigs.length === 2, 'Test 13: Parse final and abstract methods');
assert(test13Sigs[0]?.modifiers.includes('final'), 'Test 13: Has final modifier');
assert(test13Sigs[1]?.modifiers.includes('abstract'), 'Test 13: Has abstract modifier');

// Test 14: Empty parameter list
const test14Code = `
public void noParams() {
    System.out.println("test");
}
`;

const test14Sigs = parseJavaSignatures(test14Code);
assert(test14Sigs.length === 1, 'Test 14: Parse method with no params');
assert(test14Sigs[0]?.parameters.length === 0, 'Test 14: No parameters');

// Test 15: JavaDoc with description
const test15Code = `
/**
 * This is a summary.
 * 
 * This is a longer description that spans
 * multiple lines and provides more details.
 * 
 * @param value the input value
 */
public void process(String value) {}
`;

const test15Docs = parseJavaDocComments(test15Code);
assert(Object.keys(test15Docs).length === 1, 'Test 15: Parse JavaDoc with description');
const test15Doc = test15Docs['process'];
assert(test15Doc !== undefined, 'Test 15: process doc exists');
if (test15Doc) {
  assert((test15Doc.description ?? '').includes('longer description'), 'Test 15: Has description');
}

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);

