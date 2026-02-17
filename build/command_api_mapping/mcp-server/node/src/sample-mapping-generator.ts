/**
 * Sample Mapping Generator
 * 
 * Demonstrates building a sample Redis command-to-API mapping file
 * using the MCP server tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import { getClientInfo } from './tools/get-client-info.js';
import { extractSignatures } from './tools/extract-signatures.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SampleMapping {
  version: string;
  generated: string;
  description: string;
  sample_commands: Array<{
    name: string;
    module: string;
    deprecated?: boolean;
    summary?: string;
  }>;
  sample_clients: Array<{
    client_id: string;
    client_name: string;
    language: string;
    sample_methods: Array<{
      method_name: string;
      signature: string;
    }>;
  }>;
}

async function generateSampleMapping() {
  console.log('🚀 Generating Sample Redis Command-to-API Mapping...\n');

  try {
    // Step 1: Get list of Redis commands
    console.log('📋 Step 1: Fetching Redis commands...');
    const commands = await listRedisCommands({
      include_modules: false,
      include_deprecated: false,
    });
    const commandList = commands.commands.slice(0, 5); // Sample first 5 commands
    console.log(`   ✓ Found ${commands.commands.length} total commands, sampling ${commandList.length}\n`);

    // Step 2: Get list of clients
    console.log('📋 Step 2: Fetching Redis clients...');
    const clientsResult = await listClients({});
    const sampleClients = clientsResult.clients.slice(0, 3); // Sample first 3 clients
    console.log(`   ✓ Found ${clientsResult.clients.length} total clients, sampling ${sampleClients.length}\n`);

    // Step 3: Get client info and extract signatures
    console.log('📋 Step 3: Extracting signatures from sample clients...');
    const mappedClients: Array<{
      client_id: string;
      client_name: string;
      language: string;
      sample_methods: Array<{ method_name: string; signature: string }>;
    }> = [];

    for (const client of sampleClients) {
      console.log(`   Processing ${client.name} (${client.language})...`);

      let clientInfo;
      try {
        clientInfo = await getClientInfo({ client_id: client.id });
      } catch (e) {
        console.log(`   ⚠ Could not get info for client ${client.id}, skipping...`);
        continue;
      }

      // Extract signatures - using repository path if available
      let signatures: any[] = [];
      if (clientInfo.repository?.path) {
        try {
          const sigResult = await extractSignatures({
            file_path: clientInfo.repository.path,
            language: client.language,
            method_name_filter: ['get', 'set', 'del', 'exists', 'incr'],
          });
          signatures = sigResult.signatures.slice(0, 3); // Sample first 3 methods
        } catch (e) {
          console.log(`   ⚠ Could not extract from ${clientInfo.repository.path}`);
        }
      }

      mappedClients.push({
        client_id: client.id,
        client_name: client.name,
        language: client.language,
        sample_methods: signatures.map(sig => ({
          method_name: sig.method_name,
          signature: sig.signature,
        })),
      });
    }

    // Step 4: Create mapping file
    const mapping: SampleMapping = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      description: 'Sample Redis Command-to-API Mapping (first 5 commands, 3 clients)',
      sample_commands: commandList,
      sample_clients: mappedClients,
    };

    // Save to file
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outputPath = path.resolve(currentDir, '../sample-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

    console.log(`\n✅ Sample mapping generated successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Commands sampled: ${mapping.sample_commands.length}`);
    console.log(`   Clients sampled: ${mapping.sample_clients.length}`);
    console.log(`   Total methods extracted: ${mappedClients.reduce((sum, c) => sum + c.sample_methods.length, 0)}`);

  } catch (error) {
    console.error('❌ Error generating sample mapping:', error);
    process.exit(1);
  }
}

generateSampleMapping();

