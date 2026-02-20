import {
  GetClientInfoInput,
  GetClientInfoInputSchema,
  GetClientInfoOutput,
} from "./schemas.js";
import { getClientById } from "../data/components-access.js";

/**
 * Get metadata about a specific Redis client library.
 *
 * Retrieves information from components/index.json including:
 * - Client name and language
 * - Repository information
 * - Client type (sync, async, reactive, etc.)
 *
 * @param input - Input parameters (client_id)
 * @returns Client metadata
 */
export async function getClientInfo(
  input: unknown
): Promise<GetClientInfoOutput> {
  // Validate input
  const validatedInput = GetClientInfoInputSchema.parse(input);

  try {
    // Get client from data access layer
    const client = getClientById(validatedInput.client_id);

    if (!client) {
      throw new Error(
        `Client not found: ${validatedInput.client_id}`
      );
    }

    return {
      id: client.id,
      name: client.name,
      language: client.language,
      type: client.type,
      label: client.label,
      repository: client.repository,
    };
  } catch (error) {
    throw new Error(
      `Failed to get client info: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

