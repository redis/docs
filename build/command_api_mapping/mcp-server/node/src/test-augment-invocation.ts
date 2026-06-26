#!/usr/bin/env node

/**
 * Test script for Augment Tool Invocation
 *
 * This script tests each tool invocation via Augment with various inputs,
 * verifying response format and error handling.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTests(): Promise<void> {
  console.log("🔧 Testing Augment Tool Invocation...\n");

  try {
    // Create a test server instance
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

    // Import tool handlers
    const { listRedisCommands } = await import("./tools/list-redis-commands.js");
    const { listClients } = await import("./tools/list-clients.js");
    const { getClientInfo } = await import("./tools/get-client-info.js");

    // Test 1: list_redis_commands invocation
    try {
      const result = await listRedisCommands({});
      results.push({
        name: "list_redis_commands invocation",
        passed: !!result && typeof result === "object",
      });
    } catch (error) {
      results.push({
        name: "list_redis_commands invocation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: list_clients invocation
    try {
      const result = await listClients({});
      const isValid =
        !!result &&
        typeof result === "object" &&
        "clients" in result &&
        Array.isArray(result.clients);
      results.push({
        name: "list_clients invocation",
        passed: isValid,
      });
    } catch (error) {
      results.push({
        name: "list_clients invocation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: get_client_info invocation with valid client
    try {
      const result = await getClientInfo({ client_id: "redis_py" });
      results.push({
        name: "get_client_info invocation with valid client",
        passed: !!result && typeof result === "object",
      });
    } catch (error) {
      results.push({
        name: "get_client_info invocation with valid client",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: Error handling for invalid client
    try {
      const result = await getClientInfo({ client_id: "invalid-client" });
      results.push({
        name: "Error handling for invalid client",
        passed: false,
        error: "Should have thrown error for invalid client",
      });
    } catch (error) {
      results.push({
        name: "Error handling for invalid client",
        passed: true,
      });
    }

    // Test 5: Response format validation
    try {
      const result = await listClients({});
      const isValidFormat =
        result &&
        typeof result === "object" &&
        "clients" in result &&
        Array.isArray(result.clients) &&
        result.clients.length > 0;
      results.push({
        name: "Response format validation",
        passed: isValidFormat,
        error: isValidFormat ? undefined : "Invalid response format",
      });
    } catch (error) {
      results.push({
        name: "Response format validation",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 6: Tool invocation with optional parameters
    try {
      const result = await listRedisCommands({
        include_modules: true,
        include_deprecated: false,
      });
      results.push({
        name: "Tool invocation with optional parameters",
        passed: !!result && typeof result === "object",
      });
    } catch (error) {
      results.push({
        name: "Tool invocation with optional parameters",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    results.push({
      name: "Tool invocation test setup",
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

