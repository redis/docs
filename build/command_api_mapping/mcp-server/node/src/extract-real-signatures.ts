/**
 * Extract real method signatures from client libraries for sample commands
 * Uses the extract_signatures MCP tool to get actual signatures
 */

import { listClients } from './tools/list-clients.js';
import { getClientInfo } from './tools/get-client-info.js';
import { extractSignatures } from './tools/extract-signatures.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, statSync } from 'fs';

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
 * Fetch source file content from GitHub raw URL
 */
async function fetchSourceFileFromGitHub(gitUri: string, filePath: string): Promise<string | null> {
  try {
    // Convert git URI to raw GitHub URL
    // https://github.com/redis/jedis -> https://raw.githubusercontent.com/redis/jedis/main/...
    const match = gitUri.match(/github\.com\/([^/]+)\/([^/]+)(\.git)?$/);
    if (!match) {
      return null;
    }

    const owner = match[1];
    const repo = match[2];

    // Try common branch names
    const branches = ['main', 'master', 'develop'];

    for (const branch of branches) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      try {
        const response = await fetch(rawUrl);
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        // Try next branch
        continue;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Find the main source file path based on language and client
 */
function getSourceFilePath(clientId: string, language: string): string | null {
  // Language-specific file patterns for main client files
  const patterns: { [key: string]: { [clientId: string]: string } } = {
    'python': {
      'redis_py': 'redis/client.py',
      'redisvl': 'redisvl/client.py',
    },
    'java': {
      'jedis': 'src/main/java/redis/clients/jedis/Jedis.java',
      'lettuce_sync': 'src/main/java/io/lettuce/core/api/sync/RedisCommands.java',
      'lettuce_async': 'src/main/java/io/lettuce/core/api/async/RedisAsyncCommands.java',
      'lettuce_reactive': 'src/main/java/io/lettuce/core/api/reactive/RedisReactiveCommands.java',
    },
    'go': {
      'go-redis': 'client.go',
    },
    'typescript': {
      'node_redis': 'packages/client/lib/client.ts',
      'ioredis': 'lib/redis.ts',
    },
    'rust': {
      'redis_rs_sync': 'redis/src/lib.rs',
      'redis_rs_async': 'redis/src/lib.rs',
    },
    'csharp': {
      'nredisstack_sync': 'src/NRedisStack/NRedisDatabase.cs',
      'nredisstack_async': 'src/NRedisStack/NRedisDatabase.cs',
    },
    'php': {
      'php': 'src/Client.php',
    },
  };

  const langPatterns = patterns[language];
  if (langPatterns && langPatterns[clientId]) {
    return langPatterns[clientId];
  }

  return null;
}

async function extractRealSignatures() {
  console.log('🔍 Extracting Real Method Signatures from Client Libraries...\n');

  try {
    // Get clients
    console.log('📋 Fetching Redis clients...');
    const clientsResult = await listClients({});
    console.log(`✓ Found ${clientsResult.clients.length} clients\n`);

    // Commands to extract
    const commands = ['GET', 'SET', 'DEL', 'LPUSH', 'RPOP', 'SADD', 'HSET', 'ZADD', 'INCR', 'EXPIRE'];
    const mapping: CommandMapping = {};

    // Initialize mapping structure
    for (const cmd of commands) {
      mapping[cmd] = { api_calls: {} };
    }

    // Extract signatures for each client
    for (const client of clientsResult.clients) {
      console.log(`\n📦 Extracting from ${client.name} (${client.language})...`);

      try {
        // Get full client info - client.id is already the actual client ID from the JSON
        const { loadAllComponents } = await import('./data/components-loader.js');
        const allClients = loadAllComponents();
        const clientInfo = allClients.get(client.id);

        if (!clientInfo) {
          console.log(`   ⚠ Client data not found for ${client.id}`);
          continue;
        }

        // Normalize language name to lowercase for the tool
        const languageMap: { [key: string]: string } = {
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

        const normalizedLanguage = languageMap[client.language] || client.language.toLowerCase();

        // Get the source file path for this client
        const sourceFilePath = getSourceFilePath(client.id, normalizedLanguage);
        if (!sourceFilePath) {
          console.log(`   ⚠ No source file path configured for ${client.id}`);
          continue;
        }

        // Fetch source code from GitHub
        const gitUri = clientInfo.repository?.git_uri;
        if (!gitUri) {
          console.log(`   ⚠ No git URI found for ${client.id}`);
          continue;
        }

        console.log(`   📥 Fetching from GitHub: ${sourceFilePath}`);
        const sourceCode = await fetchSourceFileFromGitHub(gitUri, sourceFilePath);
        if (!sourceCode) {
          console.log(`   ⚠ Could not fetch source file from GitHub`);
          continue;
        }

        // Write to temp file for extraction
        const tempFile = path.join('/tmp', `${client.id}-${Date.now()}.${normalizedLanguage}`);
        fs.writeFileSync(tempFile, sourceCode);

        // Extract signatures for our sample commands
        const methodNames = commands.map(c => c.toLowerCase());
        const result = await extractSignatures({
          file_path: tempFile,
          language: normalizedLanguage,
          method_name_filter: methodNames,
        });

        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }

        console.log(`   ✓ Found ${result.signatures.length} signatures`);

        // Map signatures to commands
        for (const cmd of commands) {
          const methodName = cmd.toLowerCase();
          // Find ALL overloads for this method, not just the first one
          const sigs = result.signatures.filter(s =>
            s.method_name.toLowerCase() === methodName
          );

          if (sigs.length > 0) {
            // Convert all overloads to the mapping format
            mapping[cmd].api_calls[client.id] = sigs.map(sig => ({
              signature: sig.signature,
              params: sig.parameters?.map((p: any) => {
                // Handle both string and object parameter formats
                if (typeof p === 'string') {
                  const parts = p.split(':');
                  return {
                    name: parts[0].trim(),
                    type: parts.length > 1 ? parts[1].trim() : 'any',
                    description: ''
                  };
                } else if (typeof p === 'object' && p !== null) {
                  // Already an object with name and type
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
                description: ''
              } : undefined
            }));
            console.log(`      ${cmd}: Found ${sigs.length} overload(s)`);
            sigs.forEach((sig, idx) => {
              console.log(`        [${idx + 1}] ${sig.signature}`);
            });
          } else {
            console.log(`      ${cmd}: (not found)`);
          }
        }
      } catch (error) {
        console.log(`   ⚠ Error extracting from ${client.name}: ${error}`);
      }
    }

    // Save to file
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const outputPath = path.resolve(currentDir, '../extracted-real-signatures.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

    console.log(`\n✅ Real signatures extracted!`);
    console.log(`📁 Saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

extractRealSignatures();

