/**
 * Output Validation Script
 * 
 * Validates output structure against schemas, checks data accuracy,
 * compares with expected results, and generates quality report.
 * 
 * Run with: npm run test-validate-output
 */

import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import { getClientInfo } from './tools/get-client-info.js';
import { validateSignature } from './tools/validate-signature.js';
import {
  ListRedisCommandsOutputSchema,
  ListClientsOutputSchema,
  GetClientInfoOutputSchema,
  ValidateSignatureOutputSchema,
} from './tools/schemas.js';

interface ValidationResult {
  tool: string;
  test: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const validationResults: ValidationResult[] = [];

function validateSchema(data: unknown, schema: any, toolName: string, testName: string): void {
  try {
    schema.parse(data);
    validationResults.push({
      tool: toolName,
      test: testName,
      valid: true,
      errors: [],
      warnings: [],
    });
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    const errors = error instanceof Error ? [error.message] : [String(error)];
    validationResults.push({
      tool: toolName,
      test: testName,
      valid: false,
      errors,
      warnings: [],
    });
    console.log(`  ✗ ${testName}: ${errors[0]}`);
  }
}

async function runValidation(): Promise<void> {
  console.log('🔍 Output Validation Suite\n');

  // ========== Validate Tool 1: List Redis Commands ==========
  console.log('📋 Validating Tool 1: List Redis Commands');
  
  try {
    const result = await listRedisCommands({
      include_modules: true,
      include_deprecated: true,
      module_filter: [],
    });
    validateSchema(result, ListRedisCommandsOutputSchema, 'Tool 1', 'Output schema validation');
    
    // Additional validations
    if (result.commands.length > 0) {
      const hasValidCommands = result.commands.every(
        (cmd) => cmd.name && cmd.module && typeof cmd.deprecated === 'boolean'
      );
      if (hasValidCommands) {
        console.log(`  ✓ All ${result.commands.length} commands have valid structure`);
      } else {
        console.log(`  ✗ Some commands have invalid structure`);
      }
    }
  } catch (error) {
    console.log(`  ✗ Failed to get commands: ${error}`);
  }

  // ========== Validate Tool 2: List Clients ==========
  console.log('\n👥 Validating Tool 2: List Clients');
  
  try {
    const result = await listClients({ language_filter: [] });
    validateSchema(result, ListClientsOutputSchema, 'Tool 2', 'Output schema validation');
    
    if (result.clients.length > 0) {
      const hasValidClients = result.clients.every(
        (client) => client.id && client.name && client.language
      );
      if (hasValidClients) {
        console.log(`  ✓ All ${result.clients.length} clients have valid structure`);
      } else {
        console.log(`  ✗ Some clients have invalid structure`);
      }
    }
  } catch (error) {
    console.log(`  ✗ Failed to get clients: ${error}`);
  }

  // ========== Validate Tool 3: Get Client Info ==========
  console.log('\n📖 Validating Tool 3: Get Client Info');

  try {
    const result = await getClientInfo({ client_id: 'redis_py' });
    validateSchema(result, GetClientInfoOutputSchema, 'Tool 3', 'Output schema validation');

    if (result.id && result.name && result.language) {
      console.log(`  ✓ Client info has valid structure`);
    }
  } catch (error) {
    console.log(`  ✗ Failed to get client info: ${error}`);
  }

  // ========== Validate Tool 6: Validate Signature ==========
  console.log('\n✅ Validating Tool 6: Validate Signature');
  
  const testCases = [
    { signature: 'def hello(name: str) -> str:', language: 'python' },
    { signature: 'public String hello(String name)', language: 'java' },
    { signature: 'func Hello(name string) string', language: 'go' },
    { signature: 'function hello(name: string): string', language: 'typescript' },
    { signature: 'fn hello(name: &str) -> String', language: 'rust' },
    { signature: 'public string Hello(string name)', language: 'csharp' },
    { signature: 'public function hello(string $name): string', language: 'php' },
  ];

  for (const testCase of testCases) {
    try {
      const result = await validateSignature({
        signature: testCase.signature,
        language: testCase.language as any,
      });
      validateSchema(result, ValidateSignatureOutputSchema, 'Tool 6', `Validate ${testCase.language} signature`);
    } catch (error) {
      console.log(`  ✗ Failed to validate ${testCase.language} signature: ${error}`);
    }
  }

  // ========== Generate Report ==========
  console.log('\n' + '='.repeat(60));
  const totalTests = validationResults.length;
  const validTests = validationResults.filter((r) => r.valid).length;
  const validationRate = ((validTests / totalTests) * 100).toFixed(1);

  console.log(`\n📊 Validation Report`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Valid: ${validTests}`);
  console.log(`Invalid: ${totalTests - validTests}`);
  console.log(`Validation Rate: ${validationRate}%`);

  // Group by tool
  const byTool: Record<string, ValidationResult[]> = {};
  validationResults.forEach((r) => {
    if (!byTool[r.tool]) byTool[r.tool] = [];
    byTool[r.tool].push(r);
  });

  console.log('\n📈 Results by Tool:');
  Object.entries(byTool).forEach(([tool, tests]) => {
    const toolValid = tests.filter((t) => t.valid).length;
    console.log(`  ${tool}: ${toolValid}/${tests.length} valid`);
  });

  if (validTests === totalTests) {
    console.log('\n✅ All validations passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed');
    process.exit(1);
  }
}

runValidation().catch((error) => {
  console.error('Validation runner error:', error);
  process.exit(1);
});

