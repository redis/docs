/**
 * Extract real method signatures from client libraries for sample commands
 * Uses the extract_signatures MCP tool to get actual signatures
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

        // Extract signatures for our sample commands
        const methodNames = commands.map(c => c.toLowerCase());
        const result = await extractSignatures({
          file_path: client.repository?.path || 'src',
          language: normalizedLanguage,
          method_name_filter: methodNames,
        });

        console.log(`   ✓ Found ${result.signatures.length} signatures`);

        // Map signatures to commands
        for (const cmd of commands) {
          const methodName = cmd.toLowerCase();
          const sig = result.signatures.find(s => 
            s.name.toLowerCase() === methodName
          );

          if (sig) {
            mapping[cmd].api_calls[client.id] = [
              {
                signature: sig.signature,
                params: sig.params || [],
                returns: sig.returns || { type: 'any', description: 'Result' }
              }
            ];
            console.log(`      ${cmd}: ${sig.signature}`);
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

