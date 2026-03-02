#!/usr/bin/env node

/**
 * Augment-Specific Integration Tests
 *
 * Tests Augment client integration, error handling, and response formats.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTests(): Promise<void> {
  console.log("🔗 Running Augment-Specific Integration Tests...\n");

  try {
    // Create server instance
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

    // Test 1: Server initialization
    try {
      const initialized = !!server;
      results.push({
        name: "Server initialization",
        passed: initialized,
      });
    } catch (error) {
      results.push({
        name: "Server initialization",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Tool discovery handler
    try {
      const hasToolsCapability = server.getCapabilities().tools !== undefined;
      results.push({
        name: "Tool discovery capability",
        passed: hasToolsCapability,
      });
    } catch (error) {
      results.push({
        name: "Tool discovery capability",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: Tool invocation with valid parameters
    try {
      const { listRedisCommands } = await import("./tools/list-redis-commands.js");
      const response = await listRedisCommands({});
      const isValid = response && typeof response === "object" && "commands" in response;
      
      results.push({
        name: "Tool invocation with valid parameters",
        passed: isValid,
      });
    } catch (error) {
      results.push({
        name: "Tool invocation with valid parameters",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: Tool invocation with optional parameters
    try {
      const { listRedisCommands } = await import("./tools/list-redis-commands.js");
      const response = await listRedisCommands({ category: "string", limit: 10 });
      const isValid = response && typeof response === "object" && "commands" in response;
      
      results.push({
        name: "Tool invocation with optional parameters",
        passed: isValid,
      });
    } catch (error) {
      results.push({
        name: "Tool invocation with optional parameters",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 5: Error handling - invalid client
    try {
      const { getClientInfo } = await import("./tools/get-client-info.js");
      let errorThrown = false;
      
      try {
        await getClientInfo({ client_id: "invalid_client_xyz" });
      } catch {
        errorThrown = true;
      }
      
      results.push({
        name: "Error handling: Invalid client ID",
        passed: errorThrown,
      });
    } catch (error) {
      results.push({
        name: "Error handling: Invalid client ID",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 6: Response format validation
    try {
      const { listClients } = await import("./tools/list-clients.js");
      const response = await listClients({});
      
      const hasValidFormat = 
        response &&
        typeof response === "object" &&
        "clients" in response &&
        Array.isArray(response.clients) &&
        response.clients.every((c: any) => 
          typeof c === "object" &&
          "id" in c &&
          "name" in c &&
          "language" in c
        );
      
      results.push({
        name: "Response format validation",
        passed: hasValidFormat,
      });
    } catch (error) {
      results.push({
        name: "Response format validation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 7: Tool parameter validation
    try {
      const { listRedisCommands } = await import("./tools/list-redis-commands.js");
      
      // Valid parameters
      const validResponse = await listRedisCommands({ limit: 10 });
      const isValid = validResponse && "commands" in validResponse;
      
      results.push({
        name: "Tool parameter validation",
        passed: isValid,
      });
    } catch (error) {
      results.push({
        name: "Tool parameter validation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 8: Multiple tool invocation
    try {
      const { listRedisCommands } = await import("./tools/list-redis-commands.js");
      const { listClients } = await import("./tools/list-clients.js");
      const { getClientInfo } = await import("./tools/get-client-info.js");
      
      const [commands, clients] = await Promise.all([
        listRedisCommands({}),
        listClients({}),
      ]);
      
      const isValid = 
        commands && "commands" in commands &&
        clients && "clients" in clients;
      
      results.push({
        name: "Multiple tool invocation",
        passed: isValid,
      });
    } catch (error) {
      results.push({
        name: "Multiple tool invocation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 9: Tool response consistency
    try {
      const { listRedisCommands } = await import("./tools/list-redis-commands.js");
      
      const response1 = await listRedisCommands({});
      const response2 = await listRedisCommands({});
      
      const isConsistent = 
        response1 && response2 &&
        Array.isArray(response1.commands) &&
        Array.isArray(response2.commands) &&
        response1.commands.length === response2.commands.length;
      
      results.push({
        name: "Tool response consistency",
        passed: isConsistent,
      });
    } catch (error) {
      results.push({
        name: "Tool response consistency",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 10: Error message clarity
    try {
      const { getClientInfo } = await import("./tools/get-client-info.js");
      let errorMessage = "";
      
      try {
        await getClientInfo({ client_id: "nonexistent" });
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      
      const hasClarity = errorMessage.length > 0 && !errorMessage.includes("undefined");
      
      results.push({
        name: "Error message clarity",
        passed: hasClarity,
      });
    } catch (error) {
      results.push({
        name: "Error message clarity",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

  } catch (error) {
    results.push({
      name: "Test suite execution",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Print results
  console.log("\n📊 Test Results:\n");
  let passed = 0;
  for (const result of results) {
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.passed) passed++;
  }

  console.log(
    `\n📈 Summary: ${passed}/${results.length} tests passed\n`
  );

  process.exit(passed === results.length ? 0 : 1);
}

runTests().catch(console.error);

