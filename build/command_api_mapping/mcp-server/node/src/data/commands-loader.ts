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
 * Map a command's group to its owning module.
 *
 * All commands now live in a single data/commands.json. The former module
 * commands carry fine-grained groups, so the module is derived from the group.
 */
function moduleFromGroup(group?: string): string {
  switch (group) {
    case 'json':
      return 'json';
    case 'search':
    case 'suggestion':
      return 'redisearch';
    case 'bf':
    case 'cf':
    case 'cms':
    case 'topk':
    case 'tdigest':
      return 'bloom';
    case 'timeseries':
      return 'timeseries';
    default:
      return 'core';
  }
}

/**
 * Load all Redis commands from the consolidated data/commands.json
 */
export function loadAllCommands(): Map<string, CommandInfo> {
  const commands = new Map<string, CommandInfo>();
  const file = 'data/commands.json';

  try {
    // Get the repository root by resolving from current file location.
    // This file is at: <repo>/build/command_api_mapping/mcp-server/node/src/data/commands-loader.ts
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    // Go up: data -> src -> node -> mcp-server -> command_api_mapping -> build -> docs (6 levels)
    const repoRoot = path.resolve(currentDir, '../../../../../..');
    const filePath = path.resolve(repoRoot, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`Commands file not found: ${filePath}`);
      return commands;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as Record<string, any>;

    for (const [cmdName, cmdData] of Object.entries(data)) {
      commands.set(cmdName, {
        name: cmdName,
        module: moduleFromGroup(cmdData.group),
        summary: cmdData.summary,
        deprecated_since: cmdData.deprecated_since,
        group: cmdData.group,
        since: cmdData.since,
      });
    }

    console.log(`Loaded ${Object.keys(data).length} commands from ${file}`);
  } catch (error) {
    console.error(`Error loading commands from ${file}:`, error);
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

