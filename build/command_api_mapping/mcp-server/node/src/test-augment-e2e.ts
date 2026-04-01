#!/usr/bin/env node

/**
 * End-to-End Test for Augment Integration
 *
 * This script tests the full workflow with Augment including:
 * - Tool discovery
 * - Tool invocation
 * - Data flow
 * - Error scenarios
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTests(): Promise<void> {
  console.log("🚀 Running Augment E2E Tests...\n");

  try {
    // Import tool handlers
    const { listRedisCommands } = await import("./tools/list-redis-commands.js");
    const { listClients } = await import("./tools/list-clients.js");
    const { getClientInfo } = await import("./tools/get-client-info.js");
    const { extractSignatures } = await import("./tools/extract-signatures.js");

    // Test 1: Workflow - List clients then get info
    try {
      const clientsResponse = await listClients({});
      if (clientsResponse.clients && clientsResponse.clients.length > 0) {
        // Find a valid client (try redis_py first, then use first available)
        let clientId = clientsResponse.clients[0].id;
        const pythonClient = clientsResponse.clients.find(
          (c) => c.language === "Python"
        );
        if (pythonClient) {
          clientId = pythonClient.id;
        }

        const info = await getClientInfo({ client_id: clientId });
        results.push({
          name: "Workflow: List clients → Get client info",
          passed: !!info && typeof info === "object",
        });
      } else {
        results.push({
          name: "Workflow: List clients → Get client info",
          passed: false,
          error: "No clients available",
        });
      }
    } catch (error) {
      results.push({
        name: "Workflow: List clients → Get client info",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Workflow - List commands and verify structure
    try {
      const commands = await listRedisCommands({});
      const hasCommands = commands && typeof commands === "object";
      results.push({
        name: "Workflow: List Redis commands",
        passed: hasCommands,
        error: hasCommands ? undefined : "Invalid command structure",
      });
    } catch (error) {
      results.push({
        name: "Workflow: List Redis commands",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: Error handling - Invalid file path
    try {
      await extractSignatures({
        file_path: "/nonexistent/file.py",
        language: "python",
      });
      results.push({
        name: "Error handling: Invalid file path",
        passed: false,
        error: "Should have thrown error for invalid file",
      });
    } catch (error) {
      results.push({
        name: "Error handling: Invalid file path",
        passed: true,
      });
    }

    // Test 4: Error handling - Invalid language
    try {
      await extractSignatures({
        file_path: "test.txt",
        language: "invalid-lang" as any,
      });
      results.push({
        name: "Error handling: Invalid language",
        passed: false,
        error: "Should have thrown error for invalid language",
      });
    } catch (error) {
      results.push({
        name: "Error handling: Invalid language",
        passed: true,
      });
    }

    // Test 5: Data consistency - Multiple calls return same data
    try {
      const clients1 = await listClients({});
      const clients2 = await listClients({});
      const consistent =
        clients1.total_count === clients2.total_count &&
        clients1.clients.length === clients2.clients.length;
      results.push({
        name: "Data consistency: Multiple calls return same data",
        passed: consistent,
        error: consistent ? undefined : "Data inconsistency detected",
      });
    } catch (error) {
      results.push({
        name: "Data consistency: Multiple calls return same data",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 6: Response time - Tools respond quickly
    try {
      const start = Date.now();
      await listClients({});
      const duration = Date.now() - start;
      const isQuick = duration < 5000; // 5 second threshold
      results.push({
        name: `Response time: Tools respond quickly (${duration}ms)`,
        passed: isQuick,
        error: isQuick ? undefined : `Response took ${duration}ms`,
      });
    } catch (error) {
      results.push({
        name: "Response time: Tools respond quickly",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    results.push({
      name: "E2E test setup",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Print results
  console.log("\n📊 E2E Test Results:\n");
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

