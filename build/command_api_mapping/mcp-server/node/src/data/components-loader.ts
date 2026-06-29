import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Represents a Redis client library with its metadata
 */
export interface ClientInfo {
  id: string;
  type: string;
  name: string;
  language: string;
  label: string;
  repository?: {
    git_uri?: string;
    branch?: string;
    path?: string;
  };
  examples?: {
    git_uri?: string;
    path?: string;
    pattern?: string;
  };
}

/**
 * Load all client library metadata from JSON files
 * Filters out hiredis (hi_redis) from the client list
 */
export function loadAllComponents(): Map<string, ClientInfo> {
  const clients = new Map<string, ClientInfo>();

  try {
    // Get the repository root
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(currentDir, '../../../../../..');
    const indexPath = path.resolve(repoRoot, 'data/components/index.json');

    if (!fs.existsSync(indexPath)) {
      console.warn(`Components index not found: ${indexPath}`);
      return clients;
    }

    // Load the index to get list of client IDs
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const indexData = JSON.parse(indexContent) as { clients: string[] };
    const clientIds = indexData.clients || [];

    console.log(`Found ${clientIds.length} clients in index`);

    // Load each client's metadata
    for (const clientId of clientIds) {
      // Skip hiredis
      if (clientId === 'hi_redis') {
        console.log(`Skipping hiredis (hi_redis)`);
        continue;
      }

      try {
        const clientPath = path.resolve(repoRoot, `data/components/${clientId}.json`);

        if (!fs.existsSync(clientPath)) {
          console.warn(`Client file not found: ${clientPath}`);
          continue;
        }

        const clientContent = fs.readFileSync(clientPath, 'utf-8');
        const clientData = JSON.parse(clientContent) as ClientInfo;

        // Use the actual client ID from the JSON file, not the file name
        const actualClientId = clientData.id;
        clients.set(actualClientId, {
          id: clientData.id,
          type: clientData.type,
          name: clientData.name,
          language: clientData.language,
          label: clientData.label,
          repository: clientData.repository,
          examples: clientData.examples,
        });

        console.log(`Loaded client: ${actualClientId} (${clientData.language})`);
      } catch (error) {
        console.error(`Error loading client ${clientId}:`, error);
      }
    }

    console.log(`Loaded ${clients.size} clients total`);
  } catch (error) {
    console.error('Error loading components:', error);
  }

  return clients;
}

/**
 * Get language from client info
 */
export function getLanguageFromClient(client: ClientInfo): string {
  return client.language;
}

