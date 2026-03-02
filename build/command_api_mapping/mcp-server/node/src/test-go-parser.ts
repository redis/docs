/**
 * Go Parser Test Suite
 * 
 * Tests for Go function signature and doc comment extraction
 */

import { parseGoSignatures, parseGoDocComments } from './parsers/go-parser.js';

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

// Test 1: Simple function signature
const test1Code = `
func getValue() string {
    return "test"
}
`;

const test1Sigs = parseGoSignatures(test1Code);
assert(test1Sigs.length === 1, 'Test 1: Parse simple function');
assert(test1Sigs[0]?.method_name === 'getValue', 'Test 1: Function name is getValue');
assert(test1Sigs[0]?.return_type === 'string', 'Test 1: Return type is string');
assert((test1Sigs[0]?.is_method ?? false) === false, 'Test 1: Not a method');

// Test 2: Function with parameters
const test2Code = `
func setValue(key string, value interface{}) error {
    return nil
}
`;

const test2Sigs = parseGoSignatures(test2Code);
assert(test2Sigs.length === 1, 'Test 2: Parse function with params');
assert(test2Sigs[0]?.parameters.length === 2, 'Test 2: Has 2 parameters');
assert(test2Sigs[0]?.return_type === 'error', 'Test 2: Return type is error');

// Test 3: Method with receiver
const test3Code = `
func (c *Client) Get(key string) (string, error) {
    return "", nil
}
`;

const test3Sigs = parseGoSignatures(test3Code);
assert(test3Sigs.length === 1, 'Test 3: Parse method with receiver');
assert(test3Sigs[0]?.method_name === 'Get', 'Test 3: Method name is Get');
assert((test3Sigs[0]?.is_method ?? false) === true, 'Test 3: Is a method');
assert(test3Sigs[0]?.receiver === 'c *Client', 'Test 3: Has receiver');

// Test 4: Function with multiple return values
const test4Code = `
func getValues() (string, int, error) {
    return "", 0, nil
}
`;

const test4Sigs = parseGoSignatures(test4Code);
assert(test4Sigs.length === 1, 'Test 4: Parse function with multiple returns');
assert((test4Sigs[0]?.return_type ?? '').includes('string'), 'Test 4: Return type includes string');

// Test 5: Function with no parameters
const test5Code = `
func init() {
    // initialization
}
`;

const test5Sigs = parseGoSignatures(test5Code);
assert(test5Sigs.length === 1, 'Test 5: Parse function with no params');
assert(test5Sigs[0]?.parameters.length === 0, 'Test 5: No parameters');

// Test 6: Go doc comment - simple
const test6Code = `
// getValue returns the value for the given key.
func getValue(key string) string {
    return ""
}
`;

const test6Docs = parseGoDocComments(test6Code);
assert(Object.keys(test6Docs).length === 1, 'Test 6: Parse Go doc comment');
const test6Doc = test6Docs['getValue'];
assert(test6Doc !== undefined, 'Test 6: getValue doc exists');
if (test6Doc) {
  assert((test6Doc.summary ?? '').includes('returns the value'), 'Test 6: Has summary');
}

// Test 7: Multiple functions
const test7Code = `
func func1() {}
func func2() {}
func func3() {}
`;

const test7Sigs = parseGoSignatures(test7Code);
assert(test7Sigs.length === 3, 'Test 7: Parse multiple functions');

// Test 8: Function name filtering
const test8Code = `
func getValue() {}
func setValue() {}
func getSize() {}
`;

const test8Sigs = parseGoSignatures(test8Code, 'get');
assert(test8Sigs.length === 2, 'Test 8: Filter functions by name');

// Test 9: Method with value receiver
const test9Code = `
func (c Client) String() string {
    return ""
}
`;

const test9Sigs = parseGoSignatures(test9Code);
assert(test9Sigs.length === 1, 'Test 9: Parse method with value receiver');
assert(test9Sigs[0]?.receiver === 'c Client', 'Test 9: Has value receiver');

// Test 10: Function with variadic parameters
const test10Code = `
func process(values ...string) error {
    return nil
}
`;

const test10Sigs = parseGoSignatures(test10Code);
assert(test10Sigs.length === 1, 'Test 10: Parse function with variadic params');
assert(test10Sigs[0]?.parameters.length === 1, 'Test 10: Has 1 parameter');

// Test 11: Function with pointer return type
const test11Code = `
func newClient() *Client {
    return &Client{}
}
`;

const test11Sigs = parseGoSignatures(test11Code);
assert(test11Sigs.length === 1, 'Test 11: Parse function with pointer return');
assert((test11Sigs[0]?.return_type ?? '').includes('*Client'), 'Test 11: Return type is pointer');

// Test 12: Function with slice return type
const test12Code = `
func getKeys() []string {
    return []string{}
}
`;

const test12Sigs = parseGoSignatures(test12Code);
assert(test12Sigs.length === 1, 'Test 12: Parse function with slice return');
assert((test12Sigs[0]?.return_type ?? '').includes('[]string'), 'Test 12: Return type is slice');

// Test 13: Function with map parameter
const test13Code = `
func process(data map[string]interface{}) error {
    return nil
}
`;

const test13Sigs = parseGoSignatures(test13Code);
assert(test13Sigs.length === 1, 'Test 13: Parse function with map param');

// Test 14: Go doc comment with multiple lines
const test14Code = `
// getValue returns the value for the given key.
// It returns an error if the key is not found.
func getValue(key string) (string, error) {
    return "", nil
}
`;

const test14Docs = parseGoDocComments(test14Code);
assert(Object.keys(test14Docs).length === 1, 'Test 14: Parse multi-line doc comment');

// Test 15: Function with channel parameter
const test15Code = `
func listen(ch chan string) {
    // listen on channel
}
`;

const test15Sigs = parseGoSignatures(test15Code);
assert(test15Sigs.length === 1, 'Test 15: Parse function with channel param');

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);

