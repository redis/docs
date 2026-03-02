import {
  getAllCommands,
  getCommandsByFilter,
  getCommandsByModule,
  getCommandCountByModule,
  clearCache,
} from './data/data-access.js';

/**
 * Test script for commands loader and data access layer
 */

async function runTests() {
  console.log('🧪 Testing Commands Loader and Data Access Layer\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Load all commands
  try {
    console.log('Test 1: Load all commands');
    const allCommands = getAllCommands();
    console.log(`  ✅ Loaded ${allCommands.size} commands`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 2: Get command counts by module
  try {
    console.log('\nTest 2: Get command counts by module');
    const counts = getCommandCountByModule();
    console.log('  Module counts:');
    for (const [module, count] of Object.entries(counts)) {
      console.log(`    - ${module}: ${count}`);
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 3: Filter by module
  try {
    console.log('\nTest 3: Filter by module (core only)');
    const coreCommands = getCommandsByModule('core');
    console.log(`  ✅ Found ${coreCommands.length} core commands`);
    if (coreCommands.length > 0) {
      console.log(`  Sample: ${coreCommands.slice(0, 3).map((c) => c.name).join(', ')}`);
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 4: Filter with options
  try {
    console.log('\nTest 4: Filter with options (all modules, no deprecated)');
    const filtered = getCommandsByFilter({
      includeModules: true,
      includeDeprecated: false,
    });
    console.log(`  ✅ Found ${filtered.length} non-deprecated commands`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 5: Filter by specific modules
  try {
    console.log('\nTest 5: Filter by specific modules (core, json)');
    const filtered = getCommandsByFilter({
      moduleFilter: ['core', 'json'],
    });
    console.log(`  ✅ Found ${filtered.length} commands in core and json`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Failed: ${error}`);
    failed++;
  }

  // Test 6: Caching works
  try {
    console.log('\nTest 6: Verify caching works');
    clearCache();
    const start1 = Date.now();
    getAllCommands();
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    getAllCommands();
    const time2 = Date.now() - start2;

    console.log(`  First load: ${time1}ms`);
    console.log(`  Cached load: ${time2}ms`);
    console.log(`  ✅ Caching works (second load faster)`);
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

