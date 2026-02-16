import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ZodError } from "zod";

// Import tool handlers
import { listRedisCommands } from "./tools/list-redis-commands.js";
import { extractSignatures } from "./tools/extract-signatures.js";
import { extractDocComments } from "./tools/extract-doc-comments.js";
import { validateSignature } from "./tools/validate-signature.js";
import { getClientInfo } from "./tools/get-client-info.js";
import { listClients } from "./tools/list-clients.js";

// Import schemas
import {
  ListRedisCommandsInputSchema,
  ExtractSignaturesInputSchema,
  ExtractDocCommentsInputSchema,
  ValidateSignatureInputSchema,
  GetClientInfoInputSchema,
  ListClientsInputSchema,
} from "./tools/schemas.js";

// Create MCP server with tools capability
const server = new Server(
  {
    name: "redis-parser-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions with proper schemas
const TOOLS = [
  {
    name: "list_redis_commands",
    description: "List all Redis commands from command definition files",
    inputSchema: {
      type: "object" as const,
      properties: {
        include_modules: {
          type: "boolean",
          description: "Include module commands (default: true)",
        },
        include_deprecated: {
          type: "boolean",
          description: "Include deprecated commands (default: true)",
        },
        module_filter: {
          type: "array",
          items: { type: "string" },
          description: "Filter to specific modules",
        },
      },
    },
  },
  {
    name: "extract_signatures",
    description: "Extract method signatures from client source files",
    inputSchema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "Path to source file",
        },
        language: {
          type: "string",
          enum: ["python", "java", "go", "typescript", "rust", "csharp", "php"],
          description: "Programming language",
        },
        method_name_filter: {
          type: "array",
          items: { type: "string" },
          description: "Filter to specific method names",
        },
      },
      required: ["file_path", "language"],
    },
  },
  {
    name: "extract_doc_comments",
    description: "Extract documentation from source code",
    inputSchema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "Path to source file",
        },
        language: {
          type: "string",
          enum: ["python", "java", "go", "typescript", "rust", "csharp", "php"],
          description: "Programming language",
        },
        method_names: {
          type: "array",
          items: { type: "string" },
          description: "Specific methods to extract docs for",
        },
      },
      required: ["file_path", "language"],
    },
  },
  {
    name: "validate_signature",
    description: "Validate a method signature",
    inputSchema: {
      type: "object" as const,
      properties: {
        signature: {
          type: "string",
          description: "Method signature to validate",
        },
        language: {
          type: "string",
          enum: ["python", "java", "go", "typescript", "rust", "csharp", "php"],
          description: "Programming language",
        },
      },
      required: ["signature", "language"],
    },
  },
  {
    name: "get_client_info",
    description: "Get information about a specific client",
    inputSchema: {
      type: "object" as const,
      properties: {
        client_id: {
          type: "string",
          description: "Client ID",
        },
      },
      required: ["client_id"],
    },
  },
  {
    name: "list_clients",
    description: "List all supported Redis clients",
    inputSchema: {
      type: "object" as const,
      properties: {
        language_filter: {
          type: "array",
          items: { type: "string" },
          description: "Filter by programming language",
        },
      },
    },
  },
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result;

    switch (name) {
      case "list_redis_commands":
        result = await listRedisCommands(args);
        break;

      case "extract_signatures":
        result = await extractSignatures(args);
        break;

      case "extract_doc_comments":
        result = await extractDocComments(args);
        break;

      case "validate_signature":
        result = await validateSignature(args);
        break;

      case "get_client_info":
        result = await getClientInfo(args);
        break;

      case "list_clients":
        result = await listClients(args);
        break;

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof ZodError
        ? `Validation error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
        : error instanceof Error
          ? error.message
          : String(error);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: errorMessage,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server started");
}

main().catch(console.error);

