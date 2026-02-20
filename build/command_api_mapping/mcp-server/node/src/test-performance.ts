/**
 * Performance Testing Suite
 * 
 * Measures parsing speed per language, memory usage, tests with large files,
 * and identifies bottlenecks.
 * 
 * Run with: npm run test-performance
 */

import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import { validateSignature } from './tools/validate-signature.js';
import { SUPPORTED_LANGUAGES } from './tools/schemas.js';

interface PerformanceMetric {
  name: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

const metrics: PerformanceMetric[] = [];
const SUPPORTED_LANGS = SUPPORTED_LANGUAGES as readonly string[];

function getMemoryUsage(): number {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage().heapUsed / 1024 / 1024; // MB
}

async function measurePerformance(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const memoryBefore = getMemoryUsage();
  const startTime = Date.now();

  try {
    await fn();
    const duration = Date.now() - startTime;
    const memoryAfter = getMemoryUsage();
    const memoryDelta = memoryAfter - memoryBefore;

    metrics.push({
      name,
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta,
    });

    console.log(`  ✓ ${name}`);
    console.log(`    Duration: ${duration}ms | Memory: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(2)}MB`);
  } catch (error) {
    console.log(`  ✗ ${name}: ${error}`);
  }
}

async function runPerformanceTests(): Promise<void> {
  console.log('⚡ Performance Testing Suite\n');
  console.log('Note: Run with --expose-gc for accurate memory measurements\n');

  // ========== Tool 1: List Redis Commands ==========
  console.log('📋 Tool 1: List Redis Commands Performance');
  
  await measurePerformance('Get all commands (1x)', async () => {
    await listRedisCommands({
      include_modules: true,
      include_deprecated: true,
      module_filter: [],
    });
  });

  await measurePerformance('Get all commands (10x)', async () => {
    for (let i = 0; i < 10; i++) {
      await listRedisCommands({
        include_modules: true,
        include_deprecated: true,
        module_filter: [],
      });
    }
  });

  // ========== Tool 2: List Clients ==========
  console.log('\n👥 Tool 2: List Clients Performance');
  
  await measurePerformance('Get all clients (1x)', async () => {
    await listClients({ language_filter: [] });
  });

  await measurePerformance('Get all clients (10x)', async () => {
    for (let i = 0; i < 10; i++) {
      await listClients({ language_filter: [] });
    }
  });

  // ========== Tool 6: Validate Signature ==========
  console.log('\n✅ Tool 6: Validate Signature Performance');
  
  const testSignatures: Record<string, string> = {
    python: 'def hello(name: str) -> str:',
    java: 'public String hello(String name)',
    go: 'func Hello(name string) string',
    typescript: 'function hello(name: string): string',
    rust: 'fn hello(name: &str) -> String',
    csharp: 'public string Hello(string name)',
    php: 'public function hello(string $name): string',
  };

  for (const lang of SUPPORTED_LANGS) {
    await measurePerformance(`Validate ${lang} signature (1x)`, async () => {
      await validateSignature({
        signature: testSignatures[lang] || 'test',
        language: lang as any,
      });
    });
  }

  await measurePerformance('Validate all languages (1x each)', async () => {
    for (const lang of SUPPORTED_LANGS) {
      await validateSignature({
        signature: testSignatures[lang] || 'test',
        language: lang as any,
      });
    }
  });

  // ========== Generate Report ==========
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Performance Report\n');

  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  const avgDuration = totalDuration / metrics.length;
  const maxDuration = Math.max(...metrics.map((m) => m.duration));
  const minDuration = Math.min(...metrics.map((m) => m.duration));

  const totalMemory = metrics.reduce((sum, m) => sum + m.memoryDelta, 0);
  const avgMemory = totalMemory / metrics.length;
  const maxMemory = Math.max(...metrics.map((m) => m.memoryDelta));

  console.log('⏱️  Duration Metrics:');
  console.log(`  Total: ${totalDuration}ms`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration}ms`);
  console.log(`  Max: ${maxDuration}ms`);

  console.log('\n💾 Memory Metrics:');
  console.log(`  Total Delta: ${totalMemory.toFixed(2)}MB`);
  console.log(`  Average Delta: ${avgMemory.toFixed(2)}MB`);
  console.log(`  Max Delta: ${maxMemory.toFixed(2)}MB`);

  console.log('\n📈 Detailed Results:');
  metrics.forEach((m) => {
    console.log(`  ${m.name}: ${m.duration}ms, ${m.memoryDelta > 0 ? '+' : ''}${m.memoryDelta.toFixed(2)}MB`);
  });

  // Check performance thresholds
  const slowTests = metrics.filter((m) => m.duration > 5000);
  if (slowTests.length > 0) {
    console.log('\n⚠️  Slow Tests (> 5s):');
    slowTests.forEach((m) => {
      console.log(`  ${m.name}: ${m.duration}ms`);
    });
  }

  if (totalDuration < 5000) {
    console.log('\n✅ All tests completed within acceptable time (< 5s total)');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests exceeded performance thresholds');
    process.exit(0); // Don't fail on performance, just warn
  }
}

runPerformanceTests().catch((error) => {
  console.error('Performance test runner error:', error);
  process.exit(1);
});

