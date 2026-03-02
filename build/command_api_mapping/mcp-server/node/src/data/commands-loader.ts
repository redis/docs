import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Represents a Redis command with its metadata
 */
export interface CommandInfo {
  name: string;
  module: string;
  summary?: string;
  deprecated_since?: string;
  group?: string;
  since?: string;
}

/**
 * Load all Redis commands from JSON files
 * Merges commands from multiple sources with core taking precedence
 */
export function loadAllCommands(): Map<string, CommandInfo> {
  const commands = new Map<string, CommandInfo>();

  // Define command files to load (in order of precedence - first wins)
  const commandFiles = [
    { file: 'data/commands_core.json', module: 'core' },
    { file: 'data/commands_redisearch.json', module: 'redisearch' },
    { file: 'data/commands_redisjson.json', module: 'json' },
    { file: 'data/commands_redisbloom.json', module: 'bloom' },
    { file: 'data/commands_redistimeseries.json', module: 'timeseries' },
  ];

  for (const { file, module } of commandFiles) {
    try {
      // Get the repository root by resolving from current file location
      // This file is at: /Users/andrew.stark/Documents/Repos/docs/build/command_api_mapping/mcp-server/node/src/data/commands-loader.ts
      // We need to go to: /Users/andrew.stark/Documents/Repos/docs
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      // Go up: data -> src -> node -> mcp-server -> command_api_mapping -> build -> docs (6 levels)
      const repoRoot = path.resolve(currentDir, '../../../../../..');
      const filePath = path.resolve(repoRoot, file);

      if (!fs.existsSync(filePath)) {
        console.warn(`Commands file not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as Record<string, any>;

      // Add each command if not already present (core takes precedence)
      for (const [cmdName, cmdData] of Object.entries(data)) {
        if (!commands.has(cmdName)) {
          commands.set(cmdName, {
            name: cmdName,
            module,
            summary: cmdData.summary,
            deprecated_since: cmdData.deprecated_since,
            group: cmdData.group,
            since: cmdData.since,
          });
        }
      }

      console.log(`Loaded ${Object.keys(data).length} commands from ${module}`);
    } catch (error) {
      console.error(`Error loading commands from ${file}:`, error);
    }
  }

  return commands;
}

/**
 * Get module name from command info
 */
export function getModuleFromCommand(cmd: CommandInfo): string {
  return cmd.module;
}

/**
 * Check if command is deprecated
 */
export function isDeprecated(cmd: CommandInfo): boolean {
  return !!cmd.deprecated_since;
}

