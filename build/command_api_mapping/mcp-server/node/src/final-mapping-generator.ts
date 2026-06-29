/**
 * Final Mapping File Generator
 * 
 * Combines all extracted data and generates the final commands_api_mapping.json file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface MethodSignature {
  name: string;
  signature: string;
  parameters: Array<{
    name: string;
    type: string;
    default?: string;
  }>;
  return_type: string;
  is_async?: boolean;
  line_number?: number;
}

export interface MethodDocumentation {
  summary?: string;
  description?: string;
  parameters?: Record<string, string>;
  returns?: string;
  examples?: string[];
  notes?: string[];
}

export interface ClientMethodMapping {
  method_name: string;
  signature: MethodSignature;
  documentation?: MethodDocumentation;
  redis_command?: string;
  verified?: boolean;
  quality_score?: number;
}

export interface ClientMapping {
  client_id: string;
  client_name: string;
  language: string;
  repository?: string;
  methods: ClientMethodMapping[];
  total_methods: number;
  documented_methods: number;
  verified_methods: number;
}

export interface CommandsApiMapping {
  version: string;
  generated: string;
  description: string;
  clients: ClientMapping[];
  statistics: {
    total_clients: number;
    total_methods: number;
    total_documented: number;
    total_verified: number;
    coverage_percentage: number;
    documentation_percentage: number;
    verification_percentage: number;
  };
  metadata: {
    schema_version: string;
    extraction_tool_version: string;
    supported_languages: string[];
  };
}

/**
 * Create an empty client mapping
 */
export function createClientMapping(
  clientId: string,
  clientName: string,
  language: string,
  repository?: string
): ClientMapping {
  return {
    client_id: clientId,
    client_name: clientName,
    language,
    repository,
    methods: [],
    total_methods: 0,
    documented_methods: 0,
    verified_methods: 0,
  };
}

/**
 * Add a method to client mapping
 */
export function addMethodToMapping(
  clientMapping: ClientMapping,
  method: ClientMethodMapping
): void {
  clientMapping.methods.push(method);
  clientMapping.total_methods++;
  if (method.documentation) {
    clientMapping.documented_methods++;
  }
  if (method.verified) {
    clientMapping.verified_methods++;
  }
}

/**
 * Calculate statistics for the mapping
 */
export function calculateStatistics(mapping: CommandsApiMapping): void {
  const totalMethods = mapping.clients.reduce((sum, c) => sum + c.total_methods, 0);
  const totalDocumented = mapping.clients.reduce((sum, c) => sum + c.documented_methods, 0);
  const totalVerified = mapping.clients.reduce((sum, c) => sum + c.verified_methods, 0);

  mapping.statistics = {
    total_clients: mapping.clients.length,
    total_methods: totalMethods,
    total_documented: totalDocumented,
    total_verified: totalVerified,
    coverage_percentage: totalMethods > 0 ? Math.round((totalDocumented / totalMethods) * 100) : 0,
    documentation_percentage: totalMethods > 0 ? Math.round((totalDocumented / totalMethods) * 100) : 0,
    verification_percentage: totalMethods > 0 ? Math.round((totalVerified / totalMethods) * 100) : 0,
  };
}

/**
 * Create initial mapping structure
 */
export function createInitialMapping(): CommandsApiMapping {
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    description: 'Redis Command to API Mapping - Extracted from 14 client libraries',
    clients: [],
    statistics: {
      total_clients: 0,
      total_methods: 0,
      total_documented: 0,
      total_verified: 0,
      coverage_percentage: 0,
      documentation_percentage: 0,
      verification_percentage: 0,
    },
    metadata: {
      schema_version: '1.0.0',
      extraction_tool_version: '1.0.0',
      supported_languages: ['Python', 'Java', 'Go', 'TypeScript', 'Rust', 'C#', 'PHP'],
    },
  };
}

/**
 * Save mapping to file
 */
export function saveMappingToFile(mapping: CommandsApiMapping, filePath: string): void {
  fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2));
  console.log(`✅ Mapping saved to: ${filePath}`);
}

/**
 * Load mapping from file
 */
export function loadMappingFromFile(filePath: string): CommandsApiMapping {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CommandsApiMapping;
}

/**
 * Validate mapping structure
 */
export function validateMapping(mapping: CommandsApiMapping): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!mapping.version) errors.push('Missing version');
  if (!mapping.generated) errors.push('Missing generated timestamp');
  if (!Array.isArray(mapping.clients)) errors.push('Clients must be an array');
  if (!mapping.statistics) errors.push('Missing statistics');
  if (!mapping.metadata) errors.push('Missing metadata');

  for (const client of mapping.clients) {
    if (!client.client_id) errors.push(`Client missing id`);
    if (!client.language) errors.push(`Client ${client.client_id} missing language`);
    if (!Array.isArray(client.methods)) errors.push(`Client ${client.client_id} methods not an array`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate mapping summary
 */
export function generateMappingSummary(mapping: CommandsApiMapping): string {
  let summary = '# Commands API Mapping Summary\n\n';
  summary += `Generated: ${mapping.generated}\n`;
  summary += `Version: ${mapping.version}\n\n`;

  summary += `## Statistics\n`;
  summary += `- Total Clients: ${mapping.statistics.total_clients}\n`;
  summary += `- Total Methods: ${mapping.statistics.total_methods}\n`;
  summary += `- Documented: ${mapping.statistics.total_documented} (${mapping.statistics.documentation_percentage}%)\n`;
  summary += `- Verified: ${mapping.statistics.total_verified} (${mapping.statistics.verification_percentage}%)\n\n`;

  summary += `## Clients\n`;
  for (const client of mapping.clients) {
    summary += `- **${client.client_name}** (${client.language}): ${client.total_methods} methods\n`;
  }

  return summary;
}

