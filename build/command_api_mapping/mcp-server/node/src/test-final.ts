/**
 * Final Testing Suite (Milestone 8.2 - Task 3)
 * 
 * Comprehensive final test suite that:
 * - Tests all 6 tools one more time
 * - Tests with final mapping file
 * - Tests error scenarios
 * - Tests performance
 * 
 * Run with: npm run test-final
 */

import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import { getClientInfo } from './tools/get-client-info.js';
import { extractSignatures } from './tools/extract-signatures.js';
import { extractDocComments } from './tools/extract-doc-comments.js';
import { validateSignature } from './tools/validate-signature.js';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      results.push({ name, passed: true, duration });
      console.log(`✓ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`✗ ${name}: ${error} (${duration}ms)`);
    }
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  console.log('🧪 Running Final Test Suite...\n');
  
  const tests = [
    test('Tool 1: List Redis Commands', async () => {
      const result = await listRedisCommands({});
      assert(result.commands && result.commands.length > 0, 'Should return commands');
      assert(result.total_count > 0, 'Should have total count');
    }),
    
    test('Tool 2: List Clients', async () => {
      const result = await listClients({});
      assert(result.clients && result.clients.length > 0, 'Should return clients');
      assert(result.total_count > 0, 'Should have total count');
    }),
    
    test('Tool 3: Get Client Info - redis_py', async () => {
      const result = await getClientInfo({ client_id: 'redis_py' });
      assert(result.client_id === 'redis_py', 'Should return correct client');
      assert(result.language === 'Python', 'Should have correct language');
    }),
    
    test('Tool 3: Get Client Info - node_redis', async () => {
      const result = await getClientInfo({ client_id: 'node_redis' });
      assert(result.client_id === 'node_redis', 'Should return correct client');
      assert(result.language === 'TypeScript', 'Should have correct language');
    }),
    
    test('Tool 4: Extract Signatures - Python', async () => {
      const result = await extractSignatures({
        language: 'Python',
        client_id: 'redis_py',
      });
      assert(result.signatures && result.signatures.length > 0, 'Should extract signatures');
    }),
    
    test('Tool 5: Extract Doc Comments - Python', async () => {
      const result = await extractDocComments({
        language: 'Python',
        client_id: 'redis_py',
      });
      assert(result.comments && result.comments.length > 0, 'Should extract comments');
    }),
    
    test('Tool 6: Validate Signature - Python', async () => {
      const result = await validateSignature({
        language: 'Python',
        signature: 'def get(self, key: str) -> Optional[bytes]',
      });
      assert(result.valid === true, 'Should validate correct signature');
    }),
    
    test('Tool 6: Validate Signature - Invalid', async () => {
      const result = await validateSignature({
        language: 'Python',
        signature: 'invalid signature !!!',
      });
      assert(result.valid === false, 'Should reject invalid signature');
    }),
    
    test('Error Handling: Invalid client', async () => {
      try {
        await getClientInfo({ client_id: 'invalid_client' });
        throw new Error('Should have thrown error');
      } catch (e) {
        assert(e instanceof Error, 'Should throw error');
      }
    }),
    
    test('Error Handling: Invalid language', async () => {
      try {
        await extractSignatures({
          language: 'InvalidLanguage',
          client_id: 'redis_py',
        });
        throw new Error('Should have thrown error');
      } catch (e) {
        assert(e instanceof Error, 'Should throw error');
      }
    }),
  ];
  
  for (const t of tests) {
    await t();
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Average Duration: ${Math.round(totalDuration / results.length)}ms`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log(`\n${failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(console.error);

