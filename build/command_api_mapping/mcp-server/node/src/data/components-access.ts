import { loadAllComponents, ClientInfo, getLanguageFromClient } from './components-loader.js';

/**
 * Data access layer for client libraries
 * Provides caching and filtering capabilities
 */

let componentsCache: Map<string, ClientInfo> | null = null;

/**
 * Get all clients (with caching)
 */
export function getAllClients(): Map<string, ClientInfo> {
  if (componentsCache === null) {
    componentsCache = loadAllComponents();
  }
  return componentsCache;
}

/**
 * Get a specific client by ID
 */
export function getClientById(id: string): ClientInfo | undefined {
  const allClients = getAllClients();
  return allClients.get(id);
}

/**
 * Get all clients for a specific language
 */
export function getClientsByLanguage(language: string): ClientInfo[] {
  const allClients = getAllClients();
  const filtered: ClientInfo[] = [];

  for (const client of allClients.values()) {
    if (client.language === language) {
      filtered.push(client);
    }
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter options for client queries
 */
export interface ClientFilterOptions {
  languageFilter?: string[];
}

/**
 * Get clients with filtering
 */
export function getClientsByFilter(options: ClientFilterOptions = {}): ClientInfo[] {
  const { languageFilter = [] } = options;

  const allClients = getAllClients();
  const filtered: ClientInfo[] = [];

  for (const client of allClients.values()) {
    // Filter by specific languages
    if (languageFilter.length > 0 && !languageFilter.includes(client.language)) {
      continue;
    }

    filtered.push(client);
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get client count by language
 */
export function getClientCountByLanguage(): Record<string, number> {
  const allClients = getAllClients();
  const counts: Record<string, number> = {};

  for (const client of allClients.values()) {
    const language = getLanguageFromClient(client);
    counts[language] = (counts[language] || 0) + 1;
  }

  return counts;
}

/**
 * Get all unique languages
 */
export function getAllLanguages(): string[] {
  const counts = getClientCountByLanguage();
  return Object.keys(counts).sort();
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  componentsCache = null;
}

