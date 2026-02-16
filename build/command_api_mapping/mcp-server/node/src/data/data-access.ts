import { loadAllCommands, CommandInfo, isDeprecated } from './commands-loader';

/**
 * Data access layer for Redis commands
 * Provides caching and filtering capabilities
 */

let commandsCache: Map<string, CommandInfo> | null = null;

/**
 * Get all commands (with caching)
 */
export function getAllCommands(): Map<string, CommandInfo> {
  if (commandsCache === null) {
    commandsCache = loadAllCommands();
  }
  return commandsCache;
}

/**
 * Filter options for command queries
 */
export interface FilterOptions {
  includeModules?: boolean;
  includeDeprecated?: boolean;
  moduleFilter?: string[];
}

/**
 * Get commands with filtering
 */
export function getCommandsByFilter(options: FilterOptions = {}): CommandInfo[] {
  const {
    includeModules = true,
    includeDeprecated = true,
    moduleFilter = [],
  } = options;

  const allCommands = getAllCommands();
  const filtered: CommandInfo[] = [];

  for (const cmd of allCommands.values()) {
    // Filter by module
    if (!includeModules && cmd.module !== 'core') {
      continue;
    }

    // Filter by specific modules
    if (moduleFilter.length > 0 && !moduleFilter.includes(cmd.module)) {
      continue;
    }

    // Filter deprecated
    if (!includeDeprecated && isDeprecated(cmd)) {
      continue;
    }

    filtered.push(cmd);
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get commands by module
 */
export function getCommandsByModule(module: string): CommandInfo[] {
  const allCommands = getAllCommands();
  const filtered: CommandInfo[] = [];

  for (const cmd of allCommands.values()) {
    if (cmd.module === module) {
      filtered.push(cmd);
    }
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get command count by module
 */
export function getCommandCountByModule(): Record<string, number> {
  const allCommands = getAllCommands();
  const counts: Record<string, number> = {};

  for (const cmd of allCommands.values()) {
    counts[cmd.module] = (counts[cmd.module] || 0) + 1;
  }

  return counts;
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  commandsCache = null;
}

