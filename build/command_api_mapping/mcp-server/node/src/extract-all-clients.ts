/**
 * Extract signatures and documentation from all 14 Redis client libraries
 * 
 * This script:
 * 1. Iterates through all 14 clients
 * 2. Extracts signatures and docs for each
 * 3. Handles client-specific paths
 * 4. Aggregates results into a single JSON file
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getClientsByFilter } from './data/components-access.js';
import { extractSignatures } from './tools/extract-signatures.js';
import { extractDocComments } from './tools/extract-doc-comments.js';

interface ExtractionResult {
  client_id: string;
  client_name: string;
  language: string;
  signatures_count: number;
  docs_count: number;
  files_processed: number;
  errors: string[];
  status: 'success' | 'partial' | 'failed';
}

interface AggregatedData {
  timestamp: string;
  total_clients: number;
  clients_processed: number;
  results: ExtractionResult[];
  summary: {
    total_signatures: number;
    total_docs: number;
    total_files: number;
    success_rate: number;
  };
}

const results: ExtractionResult[] = [];
let totalSignatures = 0;
let totalDocs = 0;
let totalFiles = 0;

async function extractFromClient(clientId: string, clientName: string, language: string): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    client_id: clientId,
    client_name: clientName,
    language,
    signatures_count: 0,
    docs_count: 0,
    files_processed: 0,
    errors: [],
    status: 'success',
  };

  try {
    // Get repository info
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(currentDir, '../../../../../..');
    const clientDataPath = path.resolve(repoRoot, `data/components/${clientId}.json`);
    
    if (!fs.existsSync(clientDataPath)) {
      result.errors.push(`Client data file not found: ${clientDataPath}`);
      result.status = 'failed';
      return result;
    }

    const clientData = JSON.parse(fs.readFileSync(clientDataPath, 'utf-8'));
    console.log(`\n📦 Processing ${clientName} (${language})...`);
    
    // TODO: Extract from actual client repositories
    // For now, this is a placeholder that will be extended
    result.files_processed = 0;
    result.signatures_count = 0;
    result.docs_count = 0;
    
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.status = 'failed';
  }

  return result;
}

async function main() {
  console.log('🚀 Starting extraction from all Redis clients...\n');
  
  const clients = getClientsByFilter();
  console.log(`Found ${clients.length} clients to process\n`);

  for (const client of clients) {
    const result = await extractFromClient(client.id, client.name, client.language);
    results.push(result);
    
    totalSignatures += result.signatures_count;
    totalDocs += result.docs_count;
    totalFiles += result.files_processed;
    
    console.log(`  ✓ ${result.client_name}: ${result.signatures_count} signatures, ${result.docs_count} docs`);
  }

  // Generate aggregated data
  const aggregated: AggregatedData = {
    timestamp: new Date().toISOString(),
    total_clients: clients.length,
    clients_processed: results.filter(r => r.status !== 'failed').length,
    results,
    summary: {
      total_signatures: totalSignatures,
      total_docs: totalDocs,
      total_files: totalFiles,
      success_rate: results.filter(r => r.status === 'success').length / results.length,
    },
  };

  // Save results
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(currentDir, '../extraction-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(aggregated, null, 2));
  
  console.log(`\n✅ Extraction complete!`);
  console.log(`📊 Results saved to: ${outputPath}`);
  console.log(`\n📈 Summary:`);
  console.log(`   Total clients: ${aggregated.total_clients}`);
  console.log(`   Processed: ${aggregated.clients_processed}`);
  console.log(`   Signatures: ${aggregated.summary.total_signatures}`);
  console.log(`   Docs: ${aggregated.summary.total_docs}`);
  console.log(`   Success rate: ${(aggregated.summary.success_rate * 100).toFixed(1)}%`);
}

main().catch(console.error);

