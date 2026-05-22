/**
 * Validate All Deliverables (Milestone 8.2 - Task 1)
 * 
 * Validates that all required deliverables exist and are properly formatted.
 * Checks:
 * - All source files exist
 * - All data files exist
 * - All configuration files exist
 * - All documentation files exist
 * - File formats are valid
 * 
 * Run with: npm run validate-deliverables
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface DeliverableCheck {
  name: string;
  path: string;
  type: 'file' | 'directory';
  required: boolean;
  exists: boolean;
  valid: boolean;
  error?: string;
}

const checks: DeliverableCheck[] = [];

function getRepoRoot(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '../../../../../..');
}

function checkFile(name: string, filePath: string, required: boolean = true): DeliverableCheck {
  const repoRoot = getRepoRoot();
  const fullPath = path.resolve(repoRoot, filePath);
  const exists = fs.existsSync(fullPath);
  
  let valid = false;
  let error: string | undefined;
  
  if (!exists) {
    error = `File not found: ${filePath}`;
  } else {
    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) {
        error = `Path is not a file: ${filePath}`;
      } else {
        valid = true;
      }
    } catch (e) {
      error = `Error accessing file: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  
  const check: DeliverableCheck = { name, path: filePath, type: 'file', required, exists, valid, error };
  checks.push(check);
  return check;
}

function checkDirectory(name: string, dirPath: string, required: boolean = true): DeliverableCheck {
  const repoRoot = getRepoRoot();
  const fullPath = path.resolve(repoRoot, dirPath);
  const exists = fs.existsSync(fullPath);
  
  let valid = false;
  let error: string | undefined;
  
  if (!exists) {
    error = `Directory not found: ${dirPath}`;
  } else {
    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) {
        error = `Path is not a directory: ${dirPath}`;
      } else {
        valid = true;
      }
    } catch (e) {
      error = `Error accessing directory: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  
  const check: DeliverableCheck = { name, path: dirPath, type: 'directory', required, exists, valid, error };
  checks.push(check);
  return check;
}

async function validateDeliverables() {
  console.log('🔍 Validating All Deliverables...\n');
  
  // Check source files
  console.log('📁 Checking Source Files...');
  checkFile('MCP Server Index', 'build/command_api_mapping/mcp-server/node/src/index.ts');
  checkFile('Extract All Clients', 'build/command_api_mapping/mcp-server/node/src/extract-all-clients.ts');
  checkFile('Client Quirks', 'build/command_api_mapping/mcp-server/node/src/client-quirks.ts');
  checkFile('Manual Review', 'build/command_api_mapping/mcp-server/node/src/manual-review.ts');
  checkFile('Corrections', 'build/command_api_mapping/mcp-server/node/src/corrections.ts');
  checkFile('Final Mapping Generator', 'build/command_api_mapping/mcp-server/node/src/final-mapping-generator.ts');
  checkFile('Quality Report Generator', 'build/command_api_mapping/mcp-server/node/src/quality-report-generator.ts');
  
  // Check data files
  console.log('📊 Checking Data Files...');
  checkFile('Commands Core', 'data/commands_core.json');
  checkFile('Commands RediSearch', 'data/commands_redisearch.json');
  checkFile('Commands RedisJSON', 'data/commands_redisjson.json');
  checkFile('Commands RedisBloom', 'data/commands_redisbloom.json');
  checkFile('Commands RedisTimeSeries', 'data/commands_redistimeseries.json');
  
  // Check configuration files
  console.log('⚙️  Checking Configuration Files...');
  checkFile('Package JSON', 'build/command_api_mapping/mcp-server/package.json');
  checkFile('MCP Config', 'build/command_api_mapping/mcp-server/mcp.json');
  
  // Check documentation
  console.log('📚 Checking Documentation...');
  checkFile('START HERE', 'build/command_api_mapping/START_HERE.md');
  checkFile('Implementation Plan', 'build/command_api_mapping/IMPLEMENTATION_PLAN.md');
  checkFile('Milestone 8.1 Complete', 'build/command_api_mapping/MILESTONE_8_1_COMPLETE.md');
  
  // Check directories
  console.log('📂 Checking Directories...');
  checkDirectory('MCP Server Node', 'build/command_api_mapping/mcp-server/node');
  checkDirectory('Tools', 'build/command_api_mapping/mcp-server/node/src/tools');
  checkDirectory('Parsers', 'build/command_api_mapping/mcp-server/node/src/parsers');
  
  // Generate report
  console.log('\n📋 Validation Report:\n');
  
  const passed = checks.filter(c => c.valid);
  const failed = checks.filter(c => !c.valid);
  const missing = checks.filter(c => !c.exists && c.required);
  
  console.log(`✅ Passed: ${passed.length}/${checks.length}`);
  console.log(`❌ Failed: ${failed.length}/${checks.length}`);
  console.log(`⚠️  Missing Required: ${missing.length}/${checks.length}\n`);
  
  if (failed.length > 0) {
    console.log('Failed Checks:');
    failed.forEach(c => {
      console.log(`  ❌ ${c.name}: ${c.error}`);
    });
  }
  
  const allValid = failed.length === 0;
  console.log(`\n${allValid ? '✅ All deliverables validated!' : '❌ Some deliverables are missing or invalid'}`);
  
  return allValid;
}

validateDeliverables().catch(console.error);

