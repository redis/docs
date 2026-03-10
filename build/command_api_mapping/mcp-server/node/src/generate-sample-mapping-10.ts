/**
 * Generate a sample mapping with 10 Redis commands
 */

import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface CommandMapping {
  command: string;
  module: string;
  summary: string;
  clients: Array<{
    client_id: string;
    client_name: string;
    language: string;
    method_name?: string;
    signature?: string;
  }>;
}

interface MappingFile {
  version: string;
  generated: string;
  description: string;
  total_commands: number;
  total_clients: number;
  commands: CommandMapping[];
}

async function generateMapping() {
  console.log('🚀 Generating Sample Redis Command-to-API Mapping (10 commands)...\n');

  try {
    // Get Redis commands
    console.log('📋 Fetching Redis commands...');
    const commandsResult = await listRedisCommands({
      include_modules: false,
      include_deprecated: false,
    });
    
    // Select 10 diverse commands
    const selectedCommands = [
      'GET', 'SET', 'DEL', 'LPUSH', 'RPOP', 
      'SADD', 'HSET', 'ZADD', 'INCR', 'EXPIRE'
    ];
    
    const commands = commandsResult.commands.filter(c => 
      selectedCommands.includes(c.name)
    );
    console.log(`✓ Selected ${commands.length} commands\n`);

    // Get clients
    console.log('📋 Fetching Redis clients...');
    const clientsResult = await listClients({});
    console.log(`✓ Found ${clientsResult.clients.length} clients\n`);

    // Build mapping
    const mappings: CommandMapping[] = commands.map(cmd => ({
      command: cmd.name,
      module: cmd.module,
      summary: cmd.summary || '',
      clients: clientsResult.clients.map(client => ({
        client_id: client.id,
        client_name: client.name,
        language: client.language,
      })),
    }));

    // Create output
    const output: MappingFile = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      description: 'Sample Redis Command-to-API Mapping (10 core commands, 14 clients)',
      total_commands: mappings.length,
      total_clients: clientsResult.clients.length,
      commands: mappings,
    };

    // Save to file
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outputPath = path.resolve(currentDir, '../sample-mapping-10.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Mapping generated successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Commands: ${output.total_commands}`);
    console.log(`   Clients: ${output.total_clients}`);
    console.log(`   Total mappings: ${output.total_commands * output.total_clients}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateMapping();

