/**
 * Error Handling Test Suite
 * 
 * Tests for invalid file paths, syntax errors in source code,
 * unsupported language features, malformed input, and edge cases.
 * 
 * Run with: npm run test-error-handling
 */

import { extractSignatures } from './tools/extract-signatures.js';
import { extractDocComments } from './tools/extract-doc-comments.js';
import { validateSignature } from './tools/validate-signature.js';
import { getClientInfo } from './tools/get-client-info.js';

interface ErrorTestResult {
  name: string;
  category: string;
  shouldFail: boolean;
  didFail: boolean;
  error?: string;
}

const results: ErrorTestResult[] = [];

async function testError(
  category: string,
  name: string,
  fn: () => Promise<void>,
  shouldFail: boolean = true
): Promise<void> {
  try {
    await fn();
    results.push({
      name,
      category,
      shouldFail,
      didFail: false,
    });
    if (shouldFail) {
      console.log(`  ✗ ${name} (should have failed but didn't)`);
    } else {
      console.log(`  ✓ ${name}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      category,
      shouldFail,
      didFail: true,
      error: errorMsg,
    });
    if (shouldFail) {
      console.log(`  ✓ ${name} (correctly failed)`);
    } else {
      console.log(`  ✗ ${name}: ${errorMsg}`);
    }
  }
}

async function runErrorTests(): Promise<void> {
  console.log('🚨 Error Handling Test Suite\n');

  // ========== Invalid File Paths ==========
  console.log('📁 Invalid File Paths');
  
  await testError('File Paths', 'Non-existent file', async () => {
    await extractSignatures({
      file_path: '/non/existent/file.py',
      language: 'python',
      method_name_filter: [],
    });
  }, true);

  await testError('File Paths', 'Empty file path', async () => {
    await extractSignatures({
      file_path: '',
      language: 'python',
      method_name_filter: [],
    });
  }, true);

  // ========== Invalid Language ==========
  console.log('\n🌐 Invalid Language');
  
  await testError('Language', 'Unsupported language', async () => {
    await extractSignatures({
      file_path: './test.xyz',
      language: 'unsupported' as any,
      method_name_filter: [],
    });
  }, true);

  // ========== Invalid Signatures ==========
  console.log('\n✅ Invalid Signatures');
  
  await testError('Signatures', 'Empty signature', async () => {
    await validateSignature({
      signature: '',
      language: 'python',
    });
  }, false); // Empty signature might be valid (no error)

  await testError('Signatures', 'Malformed Python signature', async () => {
    await validateSignature({
      signature: 'def hello((((',
      language: 'python',
    });
  }, false); // Validation might still return valid=false

  await testError('Signatures', 'Malformed Java signature', async () => {
    await validateSignature({
      signature: 'public String hello((((',
      language: 'java',
    });
  }, false);

  // ========== Invalid Client ID ==========
  console.log('\n👥 Invalid Client ID');
  
  await testError('Client Info', 'Non-existent client', async () => {
    await getClientInfo({
      client_id: 'non-existent-client-xyz',
    });
  }, true);

  await testError('Client Info', 'Empty client ID', async () => {
    await getClientInfo({
      client_id: '',
    });
  }, true);

  // ========== Edge Cases ==========
  console.log('\n🔧 Edge Cases');
  
  await testError('Edge Cases', 'Very long signature', async () => {
    const longSig = 'def ' + 'a'.repeat(10000) + '(): pass';
    await validateSignature({
      signature: longSig,
      language: 'python',
    });
  }, false); // Should handle gracefully

  await testError('Edge Cases', 'Special characters in signature', async () => {
    await validateSignature({
      signature: 'def hello(name: str) -> str: # 你好 🎉',
      language: 'python',
    });
  }, false); // Should handle gracefully

  await testError('Edge Cases', 'Null bytes in signature', async () => {
    await validateSignature({
      signature: 'def hello\x00(name: str)',
      language: 'python',
    });
  }, false); // Should handle gracefully

  // ========== Generate Report ==========
  console.log('\n' + '='.repeat(60));
  const totalTests = results.length;
  const passedTests = results.filter((r) => {
    if (r.shouldFail) return r.didFail;
    return !r.didFail;
  }).length;

  console.log(`\n📊 Error Handling Report`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Group by category
  const byCategory: Record<string, ErrorTestResult[]> = {};
  results.forEach((r) => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });

  console.log('\n📈 Results by Category:');
  Object.entries(byCategory).forEach(([category, tests]) => {
    const categoryPassed = tests.filter((t) => {
      if (t.shouldFail) return t.didFail;
      return !t.didFail;
    }).length;
    console.log(`  ${category}: ${categoryPassed}/${tests.length} passed`);
  });

  if (passedTests === totalTests) {
    console.log('\n✅ All error handling tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some error handling tests failed');
    process.exit(1);
  }
}

runErrorTests().catch((error) => {
  console.error('Error test runner error:', error);
  process.exit(1);
});

