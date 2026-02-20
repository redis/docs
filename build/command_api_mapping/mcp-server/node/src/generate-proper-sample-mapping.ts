/**
 * Generate a proper sample mapping following SCHEMA_DESIGN.md
 * 
 * Structure:
 * {
 *   "COMMAND_NAME": {
 *     "api_calls": {
 *       "client_id": [
 *         {
 *           "signature": "...",
 *           "params": [...],
 *           "returns": {...}
 *         }
 *       ]
 *     }
 *   }
 * }
 */

import { listRedisCommands } from './tools/list-redis-commands.js';
import { listClients } from './tools/list-clients.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SignatureObject {
  signature: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
}

interface CommandMapping {
  [commandName: string]: {
    api_calls: {
      [clientId: string]: SignatureObject[];
    };
  };
}

async function generateProperMapping() {
  console.log('🚀 Generating Proper Sample Mapping (following SCHEMA_DESIGN.md)...\n');

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

    // Build mapping with realistic placeholder signatures
    const mapping: CommandMapping = {};

    // Helper to generate language-specific signatures
    function generateSignature(cmdName: string, language: string): string {
      const methodName = cmdName.toLowerCase();
      const MethodName = cmdName.charAt(0).toUpperCase() + cmdName.slice(1).toLowerCase();

      switch (language) {
        case 'Python':
          return `${methodName}(name: str) -> str | None`;
        case 'Node.js':
          return `${methodName}(key: string): Promise<string | null>`;
        case 'Go':
          return `${MethodName}(ctx context.Context, key string) *StringCmd`;
        case 'Java-Sync':
          return `${methodName}(byte[] key) -> byte[]`;
        case 'Java-Async':
          return `${methodName}(byte[] key) -> RedisFuture<byte[]>`;
        case 'Java-Reactive':
          return `${methodName}(byte[] key) -> Mono<byte[]>`;
        case 'Lettuce-Sync':
          return `${methodName}(byte[] key) -> byte[]`;
        case 'C#':
          return `${MethodName}(string key) -> Task<string>`;
        case 'PHP':
          return `${methodName}($key) -> mixed`;
        case 'Rust-Sync':
          return `fn ${methodName}(&self, key: &str) -> Result<String>`;
        case 'Rust-Async':
          return `async fn ${methodName}(&self, key: &str) -> Result<String>`;
        default:
          return `${methodName}(...) -> result`;
      }
    }

    for (const cmd of commands) {
      mapping[cmd.name] = {
        api_calls: {}
      };

      for (const client of clientsResult.clients) {
        const signature = generateSignature(cmd.name, client.language);

        mapping[cmd.name].api_calls[client.id] = [
          {
            signature: signature,
            params: [
              {
                name: "key",
                type: "string",
                description: "The key name"
              }
            ],
            returns: {
              type: "any",
              description: "Command result"
            }
          }
        ];
      }
    }

    // Save to file
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outputPath = path.resolve(currentDir, '../proper-sample-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

    console.log(`✅ Proper mapping generated!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Commands: ${Object.keys(mapping).length}`);
    console.log(`   Clients per command: ${clientsResult.clients.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateProperMapping();

