/**
 * Test Suite for Scaling Tools (Milestone 8.1)
 * 
 * Tests the extraction, review, and correction tools
 */

import { getClientQuirks, getAllQuirks, getQuirksByLanguage } from './client-quirks.js';
import { createReviewTemplate, calculateQualityScore, generateReviewReport } from './manual-review.js';
import { createCorrection, applyCorrection, generateCorrectionLog } from './corrections.js';
import { createClientMapping, createInitialMapping, calculateStatistics, validateMapping } from './final-mapping-generator.js';
import { createClientQualityMetrics, calculateOverallQualityScore, generateQualityReport } from './quality-report-generator.js';

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

// ============================================================================
// Client Quirks Tests
// ============================================================================

test('Get quirks for redis_py', () => {
  const quirks = getClientQuirks('redis_py');
  assert(quirks !== undefined, 'Should find redis_py quirks');
  assertEqual(quirks?.language, 'Python', 'Language should be Python');
  assert(quirks?.quirks.naming_conventions !== undefined, 'Should have naming conventions');
});

test('Get all quirks', () => {
  const allQuirks = getAllQuirks();
  assert(allQuirks.length > 0, 'Should have quirks');
  assert(allQuirks.length === 14, 'Should have 14 clients');
});

test('Get quirks by language', () => {
  const pythonQuirks = getQuirksByLanguage('Python');
  assert(pythonQuirks.length > 0, 'Should find Python clients');
  assert(pythonQuirks.every(q => q.language === 'Python'), 'All should be Python');
});

// ============================================================================
// Manual Review Tests
// ============================================================================

test('Create review template', () => {
  const review = createReviewTemplate('redis_py', 'redis-py', 'Python', 100);
  assertEqual(review.client_id, 'redis_py', 'Client ID should match');
  assertEqual(review.language, 'Python', 'Language should match');
  assert(review.sample_size > 0, 'Sample size should be positive');
  assert(review.sample_size <= 20, 'Sample size should not exceed 20');
});

test('Calculate quality score', () => {
  const review = createReviewTemplate('redis_py', 'redis-py', 'Python', 100);
  review.samples = [
    { method_name: 'get', signature: 'def get(key)', has_docs: true, doc_quality: 'excellent', issues: [], verified: true },
    { method_name: 'set', signature: 'def set(key, value)', has_docs: true, doc_quality: 'good', issues: [], verified: true },
  ];
  const score = calculateQualityScore(review);
  assert(score > 0, 'Score should be positive');
  assert(score <= 100, 'Score should not exceed 100');
});

test('Generate review report', () => {
  const review = createReviewTemplate('redis_py', 'redis-py', 'Python', 100);
  review.samples = [
    { method_name: 'get', signature: 'def get(key)', has_docs: true, doc_quality: 'excellent', issues: [], verified: true },
  ];
  review.status = 'completed';
  review.quality_score = 100;

  const report = generateReviewReport([review]);
  assertEqual(report.total_clients, 1, 'Should have 1 client');
  assertEqual(report.clients_reviewed, 1, 'Should have 1 reviewed');
});

// ============================================================================
// Corrections Tests
// ============================================================================

test('Create correction', () => {
  const correction = createCorrection(
    'redis_py',
    'get',
    'signature',
    'def get(key)',
    'def get(key: str) -> Any',
    'Added type hints'
  );
  assertEqual(correction.client_id, 'redis_py', 'Client ID should match');
  assertEqual(correction.method_name, 'get', 'Method name should match');
  assert(!correction.applied, 'Should not be applied initially');
});

test('Apply correction', () => {
  const correction = createCorrection(
    'redis_py',
    'get',
    'signature',
    'def get(key)',
    'def get(key: str) -> Any',
    'Added type hints'
  );
  const applied = applyCorrection(correction);
  assert(applied.applied, 'Should be marked as applied');
});

test('Generate correction log', () => {
  const corrections = [
    createCorrection('redis_py', 'get', 'signature', 'old', 'new', 'reason'),
    createCorrection('redis_py', 'set', 'signature', 'old', 'new', 'reason'),
  ];
  corrections[0] = applyCorrection(corrections[0]);

  const log = generateCorrectionLog(corrections);
  assertEqual(log.total_corrections, 2, 'Should have 2 corrections');
  assertEqual(log.applied_corrections, 1, 'Should have 1 applied');
  assertEqual(log.pending_corrections, 1, 'Should have 1 pending');
});

// ============================================================================
// Final Mapping Tests
// ============================================================================

test('Create initial mapping', () => {
  const mapping = createInitialMapping();
  assert(mapping.version !== undefined, 'Should have version');
  assert(mapping.generated !== undefined, 'Should have generated timestamp');
  assertEqual(mapping.clients.length, 0, 'Should start with no clients');
});

test('Add client to mapping', () => {
  const mapping = createInitialMapping();
  const clientMapping = createClientMapping('redis_py', 'redis-py', 'Python');
  mapping.clients.push(clientMapping);
  assertEqual(mapping.clients.length, 1, 'Should have 1 client');
});

test('Calculate mapping statistics', () => {
  const mapping = createInitialMapping();
  const clientMapping = createClientMapping('redis_py', 'redis-py', 'Python');
  clientMapping.total_methods = 50;
  clientMapping.documented_methods = 45;
  clientMapping.verified_methods = 40;
  mapping.clients.push(clientMapping);

  calculateStatistics(mapping);
  assertEqual(mapping.statistics.total_methods, 50, 'Should have 50 methods');
  assertEqual(mapping.statistics.total_documented, 45, 'Should have 45 documented');
});

test('Validate mapping', () => {
  const mapping = createInitialMapping();
  const validation = validateMapping(mapping);
  assert(validation.valid, 'Should be valid');
  assertEqual(validation.errors.length, 0, 'Should have no errors');
});

// ============================================================================
// Quality Report Tests
// ============================================================================

test('Create client quality metrics', () => {
  const metrics = createClientQualityMetrics('redis_py', 'redis-py', 'Python');
  assertEqual(metrics.client_id, 'redis_py', 'Client ID should match');
  assertEqual(metrics.metrics.overall_quality, 0, 'Should start at 0');
});

test('Calculate overall quality score', () => {
  const metrics = createClientQualityMetrics('redis_py', 'redis-py', 'Python');
  metrics.metrics.extraction_accuracy = 95;
  metrics.metrics.documentation_coverage = 85;
  metrics.metrics.signature_validity = 98;
  metrics.metrics.parameter_completeness = 90;
  metrics.metrics.return_type_accuracy = 92;
  metrics.metrics.overall_quality = 92;

  const score = calculateOverallQualityScore(metrics);
  assert(score > 0, 'Score should be positive');
});

test('Generate quality report', () => {
  const metrics = createClientQualityMetrics('redis_py', 'redis-py', 'Python');
  metrics.metrics.overall_quality = 90;

  const report = generateQualityReport([metrics]);
  assert(report.overall_quality_score >= 0, 'Should have quality score');
  assert(report.metrics.length > 0, 'Should have metrics');
});

// ============================================================================
// Summary
// ============================================================================

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n${'='.repeat(60)}`);
console.log(`Test Results: ${passed}/${results.length} passed`);
if (failed > 0) {
  console.log(`\nFailed tests:`);
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ✗ ${r.name}: ${r.error}`);
  });
}
console.log(`${'='.repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);

