/**
 * Extract real method signatures from client libraries for sample commands
 * Uses the extract_signatures MCP tool to get actual signatures
 *
 * This script uses the client_id parameter which automatically fetches from
 * the correct source files including external dependencies (e.g., StackExchange.Redis
 * for NRedisStack).
 */

import { listClients } from './tools/list-clients.js';
import { extractSignatures } from './tools/extract-signatures.js';
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

/**
 * Map client language labels to parser language names
 */
const LANGUAGE_MAP: { [key: string]: string } = {
  'Python': 'python',
  'Node.js': 'typescript',
  'Java-Sync': 'java',
  'Java-Async': 'java',
  'Java-Reactive': 'java',
  'Lettuce-Sync': 'java',
  'Go': 'go',
  'C#': 'csharp',
  'PHP': 'php',
  'Rust-Sync': 'rust',
  'Rust-Async': 'rust',
};

/**
 * 20 sample Redis commands covering different data types and operations
 */
const SAMPLE_COMMANDS = [
  // String commands
  'GET', 'SET', 'MGET', 'MSET', 'INCR', 'DECR',
  // Key commands
  'DEL', 'EXISTS', 'EXPIRE', 'TTL',
  // List commands
  'LPUSH', 'RPUSH', 'LPOP', 'RPOP', 'LRANGE',
  // Hash commands
  'HSET', 'HGET', 'HGETALL',
  // Set commands
  'SADD', 'SMEMBERS',
];

/**
 * Clients to extract signatures from (excluding redisvl which is a special case)
 */
const CLIENT_CONFIGS = [
  { id: 'redis_py', language: 'python' },
  { id: 'jedis', language: 'java' },
  { id: 'lettuce_sync', language: 'java' },
  { id: 'lettuce_async', language: 'java' },
  { id: 'lettuce_reactive', language: 'java' },
  { id: 'go-redis', language: 'go' },
  { id: 'node_redis', language: 'typescript' },
  { id: 'ioredis', language: 'typescript' },
  { id: 'redis_rs_sync', language: 'rust' },
  { id: 'redis_rs_async', language: 'rust' },
  { id: 'nredisstack_sync', language: 'csharp' },
  { id: 'nredisstack_async', language: 'csharp' },
  { id: 'php', language: 'php' },
];

async function extractRealSignatures() {
  console.log('🔍 Extracting Real Method Signatures from Client Libraries...\n');
  console.log(`📋 Commands to extract: ${SAMPLE_COMMANDS.length}`);
  console.log(`📦 Clients to process: ${CLIENT_CONFIGS.length}\n`);

  const mapping: CommandMapping = {};

  // Initialize mapping structure
  for (const cmd of SAMPLE_COMMANDS) {
    mapping[cmd] = { api_calls: {} };
  }

  // Extract signatures for each client using client_id (uses configured source files)
  for (const clientConfig of CLIENT_CONFIGS) {
    console.log(`\n📦 Extracting from ${clientConfig.id} (${clientConfig.language})...`);

    try {
      // Use client_id parameter - this automatically fetches from configured sources
      // including external dependencies like StackExchange.Redis for NRedisStack
      const result = await extractSignatures({
        client_id: clientConfig.id,
        language: clientConfig.language,
      });

      console.log(`   ✓ Total signatures available: ${result.total_count}`);

      // Map signatures to commands
      let foundCount = 0;
      for (const cmd of SAMPLE_COMMANDS) {
        // Find ALL overloads for this command
        // Use EXACT matching with known aliases for each command
        const sigs = result.signatures.filter(s => {
          const methodLower = s.method_name.toLowerCase();
          const cmdLower = cmd.toLowerCase();

          // Define exact method names that correspond to each Redis command
          // This handles different naming conventions across clients
          const commandAliases: { [key: string]: string[] } = {
            // String commands
            'get': ['get', 'stringget'],
            'set': ['set', 'stringset'],
            'mget': ['mget'],
            'mset': ['mset'],
            'incr': ['incr', 'incrby', 'stringincrement'],
            'decr': ['decr', 'decrby', 'stringdecrement'],
            // Key commands
            'del': ['del', 'delete', 'keydelete'],
            'exists': ['exists', 'keyexists'],
            'expire': ['expire', 'keyexpire'],
            'ttl': ['ttl', 'keytimetolive'],
            // List commands
            'lpush': ['lpush', 'listleftpush'],
            'rpush': ['rpush', 'listrightpush'],
            'lpop': ['lpop', 'listleftpop'],
            'rpop': ['rpop', 'listrightpop'],
            'lrange': ['lrange', 'listrange'],
            // Hash commands
            'hset': ['hset', 'hashset'],
            'hget': ['hget', 'hashget'],
            'hgetall': ['hgetall', 'hashgetall'],
            // Set commands
            'sadd': ['sadd', 'setadd'],
            'smembers': ['smembers', 'setmembers'],
          };

          const aliases = commandAliases[cmdLower] || [cmdLower];
          // Only exact matches - no substring matching
          return aliases.includes(methodLower);
        });

        if (sigs.length > 0) {
          foundCount++;
          // Convert all overloads to the mapping format
          mapping[cmd].api_calls[clientConfig.id] = sigs.slice(0, 5).map(sig => ({
            signature: sig.signature,
            params: sig.parameters?.map((p: any) => {
              if (typeof p === 'string') {
                const parts = p.split(':');
                return {
                  name: parts[0].trim(),
                  type: parts.length > 1 ? parts[1].trim() : 'any',
                  description: ''
                };
              } else if (typeof p === 'object' && p !== null) {
                return {
                  name: p.name || '',
                  type: p.type || 'any',
                  description: p.description || ''
                };
              }
              return { name: '', type: 'any', description: '' };
            }) || [],
            returns: sig.return_type ? {
              type: sig.return_type,
              description: (sig as any).return_description || ''
            } : undefined
          }));
        }
      }
      console.log(`   📊 Commands matched: ${foundCount}/${SAMPLE_COMMANDS.length}`);

    } catch (error) {
      console.log(`   ⚠ Error extracting from ${clientConfig.id}: ${error}`);
    }
  }

  // Save to file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(currentDir, '../extracted-real-signatures.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));

  for (const cmd of SAMPLE_COMMANDS) {
    const clientCount = Object.keys(mapping[cmd].api_calls).length;
    const status = clientCount > 0 ? '✓' : '✗';
    console.log(`${status} ${cmd.padEnd(12)} - ${clientCount} clients`);
  }

  console.log('='.repeat(60));
  console.log(`\n✅ Real signatures extracted!`);
  console.log(`📁 Saved to: ${outputPath}`);
}

extractRealSignatures();

