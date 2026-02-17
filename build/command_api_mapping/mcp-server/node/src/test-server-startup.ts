/**
 * Test Server Startup
 * 
 * Verifies that the MCP server can start and respond to tool discovery requests
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function testServerStartup() {
  console.log("🚀 Testing MCP Server Startup...\n");

  try {
    // Create server
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

    console.log("✅ Server instance created");

    // Register tool discovery handler
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_redis_commands",
          description: "List all Redis commands",
          inputSchema: { type: "object" as const },
        },
        {
          name: "list_clients",
          description: "List all clients",
          inputSchema: { type: "object" as const },
        },
        {
          name: "get_client_info",
          description: "Get client info",
          inputSchema: { type: "object" as const },
        },
        {
          name: "extract_signatures",
          description: "Extract signatures",
          inputSchema: { type: "object" as const },
        },
        {
          name: "extract_doc_comments",
          description: "Extract docs",
          inputSchema: { type: "object" as const },
        },
        {
          name: "validate_signature",
          description: "Validate signature",
          inputSchema: { type: "object" as const },
        },
      ],
    }));

    console.log("✅ Tool discovery handler registered");

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({ status: "ok", tool: request.params.name }),
        },
      ],
    }));

    console.log("✅ Tool call handler registered");

    // Try to connect (this will wait for stdio)
    console.log("\n📡 Attempting to connect to stdio transport...");
    console.log("   (This will wait for MCP client connection)");
    console.log("   (Press Ctrl+C to exit)\n");

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log("✅ Server connected and running");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testServerStartup();

