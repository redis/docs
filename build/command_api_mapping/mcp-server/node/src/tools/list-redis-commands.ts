import {
  ListRedisCommandsInput,
  ListRedisCommandsInputSchema,
  ListRedisCommandsOutput,
} from "./schemas.js";
import {
  getCommandsByFilter,
  getCommandCountByModule,
} from "../data/data-access.js";

/**
 * List all Redis commands from command definition files.
 *
 * This tool returns a list of all Redis commands, optionally filtered by:
 * - Module (core, redisearch, redisjson, etc.)
 * - Deprecated status
 *
 * @param input - Input parameters
 * @returns List of Redis commands with metadata
 */
export async function listRedisCommands(
  input: unknown
): Promise<ListRedisCommandsOutput> {
  // Validate input
  const validatedInput = ListRedisCommandsInputSchema.parse(input);

  try {
    // Get filtered commands from data access layer
    const commands = getCommandsByFilter({
      includeModules: validatedInput.include_modules,
      includeDeprecated: validatedInput.include_deprecated,
      moduleFilter: validatedInput.module_filter,
    });

    // Get command counts by module
    const byModule = getCommandCountByModule();

    // Format response
    const formattedCommands = commands.map((cmd) => ({
      name: cmd.name,
      module: cmd.module,
      deprecated: !!cmd.deprecated_since,
      summary: cmd.summary,
    }));

    return {
      commands: formattedCommands,
      total_count: commands.length,
      by_module: byModule,
    };
  } catch (error) {
    throw new Error(
      `Failed to list Redis commands: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

