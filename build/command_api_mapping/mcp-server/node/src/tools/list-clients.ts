import {
  ListClientsInput,
  ListClientsInputSchema,
  ListClientsOutput,
} from "./schemas.js";
import {
  getClientsByFilter,
  getClientCountByLanguage,
} from "../data/components-access.js";

/**
 * List all supported Redis client libraries.
 *
 * Returns a list of all client libraries (excluding hiredis), optionally
 * filtered by programming language.
 *
 * @param input - Input parameters (optional language_filter)
 * @returns List of clients with metadata
 */
export async function listClients(input: unknown): Promise<ListClientsOutput> {
  // Validate input
  const validatedInput = ListClientsInputSchema.parse(input);

  try {
    // Get filtered clients from data access layer
    const clients = getClientsByFilter({
      languageFilter: validatedInput.language_filter,
    });

    // Get client counts by language
    const byLanguage = getClientCountByLanguage();

    // Format response
    const formattedClients = clients.map((client) => ({
      id: client.id,
      name: client.name,
      language: client.language,
      type: client.type,
    }));

    return {
      clients: formattedClients,
      total_count: clients.length,
      by_language: byLanguage,
    };
  } catch (error) {
    throw new Error(
      `Failed to list clients: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

