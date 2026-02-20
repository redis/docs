/**
 * C# Parser Test Suite
 * 
 * Tests for C# signature and XML doc comment extraction
 */

import { parseCSharpSignatures, parseCSharpDocComments } from './parsers/csharp-parser.js';

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
public void SetValue(string value) {
    this.value = value;
}
`;

const test1Sigs = parseCSharpSignatures(test1Code);
assert(test1Sigs.length === 1, 'Test 1: Parse simple method');
assert(test1Sigs[0]?.method_name === 'SetValue', 'Test 1: Method name is SetValue');
assert(test1Sigs[0]?.modifiers.includes('public'), 'Test 1: Has public modifier');
assert(test1Sigs[0]?.return_type === 'void', 'Test 1: Return type is void');

// Test 2: Method with multiple parameters
const test2Code = `
public string GetValue(string key, int defaultValue) {
    return map.GetOrDefault(key, defaultValue);
}
`;

const test2Sigs = parseCSharpSignatures(test2Code);
assert(test2Sigs.length === 1, 'Test 2: Parse method with multiple params');
assert(test2Sigs[0]?.parameters.length === 2, 'Test 2: Has 2 parameters');
assert(test2Sigs[0]?.return_type === 'string', 'Test 2: Return type is string');

// Test 3: Async method
const test3Code = `
public async Task<string> GetValueAsync(string key) {
    return await Task.FromResult(map.Get(key));
}
`;

const test3Sigs = parseCSharpSignatures(test3Code);
assert(test3Sigs.length === 1, 'Test 3: Parse async method');
assert((test3Sigs[0]?.is_async ?? false) === true, 'Test 3: Is async');
assert((test3Sigs[0]?.return_type ?? '').includes('Task'), 'Test 3: Returns Task');

// Test 4: Generic method
const test4Code = `
public List<T> GetList<T>(Type type) {
    return new List<T>();
}
`;

const test4Sigs = parseCSharpSignatures(test4Code);
assert(test4Sigs.length === 1, 'Test 4: Parse generic method');
assert(test4Sigs[0]?.method_name === 'GetList', 'Test 4: Method name is GetList');

// Test 5: Static method
const test5Code = `
public static string Format(string pattern, params object[] args) {
    return string.Format(pattern, args);
}
`;

const test5Sigs = parseCSharpSignatures(test5Code);
assert(test5Sigs.length === 1, 'Test 5: Parse static method');
assert(test5Sigs[0]?.modifiers.includes('static'), 'Test 5: Has static modifier');

// Test 6: XML doc with summary and param
const test6Code = `
/// <summary>Gets the value associated with the key.</summary>
/// <param name="key">The key to look up</param>
/// <returns>The value, or null if not found</returns>
public string GetValue(string key) {
    return map.Get(key);
}
`;

const test6Docs = parseCSharpDocComments(test6Code);
assert(Object.keys(test6Docs).length === 1, 'Test 6: Parse XML doc comment');
const test6Doc = test6Docs['GetValue'];
assert(test6Doc !== undefined, 'Test 6: GetValue doc exists');
if (test6Doc) {
  assert((test6Doc.summary ?? '').includes('Gets the value'), 'Test 6: Has summary');
  assert(test6Doc.parameters['key'] !== undefined, 'Test 6: Has key parameter');
  assert((test6Doc.returns ?? '').includes('value'), 'Test 6: Has returns');
}

// Test 7: Nullable type
const test7Code = `
public string? GetNullableValue(string? key) {
    return map.Get(key);
}
`;

const test7Sigs = parseCSharpSignatures(test7Code);
assert(test7Sigs.length === 1, 'Test 7: Parse nullable type');
assert((test7Sigs[0]?.return_type ?? '').includes('?'), 'Test 7: Return type is nullable');

// Test 8: Private method
const test8Code = `
private void InternalMethod() {
    // internal logic
}
`;

const test8Sigs = parseCSharpSignatures(test8Code);
assert(test8Sigs.length === 1, 'Test 8: Parse private method');
assert(test8Sigs[0]?.modifiers.includes('private'), 'Test 8: Has private modifier');

// Test 9: Virtual method
const test9Code = `
public virtual void Execute() {
    // base implementation
}
`;

const test9Sigs = parseCSharpSignatures(test9Code);
assert(test9Sigs.length === 1, 'Test 9: Parse virtual method');
assert(test9Sigs[0]?.modifiers.includes('virtual'), 'Test 9: Has virtual modifier');

// Test 10: Override method
const test10Code = `
public override string ToString() {
    return base.ToString();
}
`;

const test10Sigs = parseCSharpSignatures(test10Code);
assert(test10Sigs.length === 1, 'Test 10: Parse override method');
assert(test10Sigs[0]?.modifiers.includes('override'), 'Test 10: Has override modifier');

// Test 11: Abstract method
const test11Code = `
public abstract void AbstractMethod();
`;

const test11Sigs = parseCSharpSignatures(test11Code);
assert(test11Sigs.length === 1, 'Test 11: Parse abstract method');
assert(test11Sigs[0]?.modifiers.includes('abstract'), 'Test 11: Has abstract modifier');

// Test 12: Method with no parameters
const test12Code = `
public void NoParams() {
    // no parameters
}
`;

const test12Sigs = parseCSharpSignatures(test12Code);
assert(test12Sigs.length === 1, 'Test 12: Parse method with no params');
assert(test12Sigs[0]?.parameters.length === 0, 'Test 12: Has 0 parameters');

// Test 13: Async void method
const test13Code = `
public async void ExecuteAsync() {
    await Task.Delay(100);
}
`;

const test13Sigs = parseCSharpSignatures(test13Code);
assert(test13Sigs.length === 1, 'Test 13: Parse async void method');
assert(test13Sigs[0]?.is_async === true, 'Test 13: Is async');
assert(test13Sigs[0]?.return_type === 'void', 'Test 13: Returns void');

// Test 14: Protected method
const test14Code = `
protected void ProtectedMethod() {
    // protected logic
}
`;

const test14Sigs = parseCSharpSignatures(test14Code);
assert(test14Sigs.length === 1, 'Test 14: Parse protected method');
assert(test14Sigs[0]?.modifiers.includes('protected'), 'Test 14: Has protected modifier');

// Test 15: Internal method
const test15Code = `
internal void InternalMethod() {
    // internal logic
}
`;

const test15Sigs = parseCSharpSignatures(test15Code);
assert(test15Sigs.length === 1, 'Test 15: Parse internal method');
assert(test15Sigs[0]?.modifiers.includes('internal'), 'Test 15: Has internal modifier');

// Print summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}`);

process.exit(testsFailed > 0 ? 1 : 0);

