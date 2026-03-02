/**
 * Final Schema Validation (Milestone 8.2 - Task 2)
 * 
 * Validates the final mapping file against the schema.
 * Checks:
 * - File exists and is valid JSON
 * - All required fields present
 * - All data types correct
 * - Statistics are accurate
 * - Metadata is complete
 * 
 * Run with: npm run validate-schema
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { validateMapping } from './final-mapping-generator.js';

interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
  };
}

function getRepoRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '../../../../../..');
}

async function validateSchema(): Promise<SchemaValidationResult> {
  const result: SchemaValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    statistics: {
      total_checks: 0,
      passed_checks: 0,
      failed_checks: 0,
    },
  };
  
  console.log('🔍 Validating Final Schema...\n');
  
  const repoRoot = getRepoRoot();
  const mappingPath = path.resolve(repoRoot, 'commands_api_mapping.json');
  
  // Check 1: File exists
  result.statistics.total_checks++;
  if (!fs.existsSync(mappingPath)) {
    result.errors.push('Mapping file not found: commands_api_mapping.json');
    result.valid = false;
    result.statistics.failed_checks++;
  } else {
    result.statistics.passed_checks++;
    console.log('✅ Mapping file exists');
  }
  
  if (!result.valid) {
    return result;
  }
  
  // Check 2: Valid JSON
  result.statistics.total_checks++;
  let mapping: any;
  try {
    const content = fs.readFileSync(mappingPath, 'utf-8');
    mapping = JSON.parse(content);
    result.statistics.passed_checks++;
    console.log('✅ Valid JSON format');
  } catch (e) {
    result.errors.push(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    result.valid = false;
    result.statistics.failed_checks++;
    return result;
  }
  
  // Check 3: Required fields
  result.statistics.total_checks++;
  const requiredFields = ['version', 'generated', 'description', 'clients', 'statistics', 'metadata'];
  const missingFields = requiredFields.filter(f => !(f in mapping));
  if (missingFields.length > 0) {
    result.errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    result.valid = false;
    result.statistics.failed_checks++;
  } else {
    result.statistics.passed_checks++;
    console.log('✅ All required fields present');
  }
  
  // Check 4: Data types
  result.statistics.total_checks++;
  const typeErrors: string[] = [];
  if (typeof mapping.version !== 'string') typeErrors.push('version must be string');
  if (typeof mapping.generated !== 'string') typeErrors.push('generated must be string');
  if (typeof mapping.description !== 'string') typeErrors.push('description must be string');
  if (!Array.isArray(mapping.clients)) typeErrors.push('clients must be array');
  if (typeof mapping.statistics !== 'object') typeErrors.push('statistics must be object');
  if (typeof mapping.metadata !== 'object') typeErrors.push('metadata must be object');
  
  if (typeErrors.length > 0) {
    result.errors.push(`Type validation errors: ${typeErrors.join(', ')}`);
    result.valid = false;
    result.statistics.failed_checks++;
  } else {
    result.statistics.passed_checks++;
    console.log('✅ All data types correct');
  }
  
  // Check 5: Statistics accuracy
  result.statistics.total_checks++;
  const stats = mapping.statistics;
  if (stats.total_clients !== mapping.clients.length) {
    result.warnings.push(`Statistics mismatch: total_clients (${stats.total_clients}) != clients.length (${mapping.clients.length})`);
  } else {
    result.statistics.passed_checks++;
    console.log('✅ Statistics are accurate');
  }
  
  // Check 6: Metadata completeness
  result.statistics.total_checks++;
  const requiredMetadata = ['schema_version', 'extraction_tool_version', 'supported_languages'];
  const missingMetadata = requiredMetadata.filter(f => !(f in mapping.metadata));
  if (missingMetadata.length > 0) {
    result.warnings.push(`Missing metadata fields: ${missingMetadata.join(', ')}`);
  } else {
    result.statistics.passed_checks++;
    console.log('✅ Metadata is complete');
  }
  
  // Check 7: Schema validation using existing validator
  result.statistics.total_checks++;
  const validation = validateMapping(mapping);
  if (!validation.valid) {
    result.errors.push(`Schema validation failed: ${validation.errors.join(', ')}`);
    result.valid = false;
    result.statistics.failed_checks++;
  } else {
    result.statistics.passed_checks++;
    console.log('✅ Schema validation passed');
  }
  
  return result;
}

validateSchema().then(result => {
  console.log('\n📋 Validation Summary:');
  console.log(`Total Checks: ${result.statistics.total_checks}`);
  console.log(`Passed: ${result.statistics.passed_checks}`);
  console.log(`Failed: ${result.statistics.failed_checks}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  console.log(`\n${result.valid ? '✅ Schema validation passed!' : '❌ Schema validation failed!'}`);
  process.exit(result.valid ? 0 : 1);
}).catch(console.error);

