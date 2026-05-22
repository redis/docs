import { listRedisCommands } from './tools/list-redis-commands.js';

/**
 * Integration test for list_redis_commands tool
 */

async function runTests() {
  console.log('🧪 Testing list_redis_commands Tool\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Get all commands
  try {
    console.log('Test 1: Get all commands');
    const result = await listRedisCommands({
      include_modules: true,
      include_deprecated: true,
      module_filter: [],
    });
    console.log(`  ✅ Got ${result.total_count} commands`);
    console.log(`  Modules: ${Object.keys(result.by_module).join(', ')}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 2: Get core commands only
  try {
    console.log('\nTest 2: Get core commands only');
    const result = await listRedisCommands({
      include_modules: false,
      include_deprecated: true,
      module_filter: [],
    });
    console.log(`  ✅ Got ${result.total_count} core commands`);
    if (result.commands.length > 0) {
      console.log(`  Sample: ${result.commands.slice(0, 3).map((c) => c.name).join(', ')}`);
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 3: Filter by specific modules
  try {
    console.log('\nTest 3: Filter by specific modules (json, bloom)');
    const result = await listRedisCommands({
      include_modules: true,
      include_deprecated: true,
      module_filter: ['json', 'bloom'],
    });
    console.log(`  ✅ Got ${result.total_count} commands`);
    console.log(`  Modules: ${Object.keys(result.by_module).join(', ')}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 4: Exclude deprecated
  try {
    console.log('\nTest 4: Exclude deprecated commands');
    const result = await listRedisCommands({
      include_modules: true,
      include_deprecated: false,
      module_filter: [],
    });
    console.log(`  ✅ Got ${result.total_count} non-deprecated commands`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 5: Response structure
  try {
    console.log('\nTest 5: Verify response structure');
    const result = await listRedisCommands({
      include_modules: true,
      include_deprecated: true,
      module_filter: [],
    });
    
    // Check structure
    if (!Array.isArray(result.commands)) throw new Error('commands is not an array');
    if (typeof result.total_count !== 'number') throw new Error('total_count is not a number');
    if (typeof result.by_module !== 'object') throw new Error('by_module is not an object');
    
    // Check command structure
    if (result.commands.length > 0) {
      const cmd = result.commands[0];
      if (!cmd.name || !cmd.module) throw new Error('command missing name or module');
    }
    
    console.log(`  ✅ Response structure is valid`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Summary
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

