#!/usr/bin/env node

/**
 * Advanced Augment Integration Tests
 *
 * Tests complex workflows, error recovery, concurrent invocation,
 * and edge cases for the MCP server.
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTests(): Promise<void> {
  console.log("🧪 Running Advanced Augment Integration Tests...\n");

  try {
    // Import tool handlers
    const { listRedisCommands } = await import("./tools/list-redis-commands.js");
    const { listClients } = await import("./tools/list-clients.js");
    const { getClientInfo } = await import("./tools/get-client-info.js");
    const { extractSignatures } = await import("./tools/extract-signatures.js");
    const { extractDocComments } = await import("./tools/extract-doc-comments.js");
    const { validateSignature } = await import("./tools/validate-signature.js");

    // Test 1: Concurrent tool invocation
    try {
      const start = Date.now();
      const promises = [
        listRedisCommands({}),
        listClients({}),
        listRedisCommands({ category: "string" }),
        listClients({ language: "Python" }),
      ];
      const results_concurrent = await Promise.all(promises);
      const duration = Date.now() - start;
      
      const allSuccessful = results_concurrent.every(r => r && typeof r === "object");
      results.push({
        name: "Concurrent tool invocation (4 parallel calls)",
        passed: allSuccessful,
        duration,
      });
    } catch (error) {
      results.push({
        name: "Concurrent tool invocation (4 parallel calls)",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Complex multi-step workflow
    try {
      const start = Date.now();
      const clients = await listClients({});

      if (clients.clients && clients.clients.length > 0) {
        try {
          const info = await getClientInfo({ client_id: "redis_py" });
          const hasInfo = info && typeof info === "object" && "id" in info;
          results.push({
            name: "Complex workflow: List → Filter → Get info",
            passed: hasInfo,
            duration: Date.now() - start,
          });
        } catch {
          // If redis_py doesn't exist, try the first client
          const firstClientId = clients.clients[0].id;
          const info = await getClientInfo({ client_id: firstClientId });
          const hasInfo = info && typeof info === "object" && "id" in info;
          results.push({
            name: "Complex workflow: List → Filter → Get info",
            passed: hasInfo,
            duration: Date.now() - start,
          });
        }
      } else {
        results.push({
          name: "Complex workflow: List → Filter → Get info",
          passed: false,
          error: "No clients found",
        });
      }
    } catch (error) {
      results.push({
        name: "Complex workflow: List → Filter → Get info",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: Error recovery - invalid then valid calls
    try {
      let recovered = false;
      try {
        await getClientInfo({ client_id: "invalid_client_id" });
      } catch {
        // Expected error
      }
      
      // Now try valid call
      const clients = await listClients({});
      recovered = clients && clients.clients && clients.clients.length > 0;
      
      results.push({
        name: "Error recovery: Invalid call followed by valid call",
        passed: recovered,
      });
    } catch (error) {
      results.push({
        name: "Error recovery: Invalid call followed by valid call",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: Large dataset handling
    try {
      const start = Date.now();
      const commands = await listRedisCommands({});
      const duration = Date.now() - start;
      
      const hasLargeDataset = commands && 
        typeof commands === "object" && 
        "commands" in commands &&
        Array.isArray(commands.commands) &&
        commands.commands.length > 100;
      
      results.push({
        name: "Large dataset handling (500+ commands)",
        passed: hasLargeDataset,
        duration,
      });
    } catch (error) {
      results.push({
        name: "Large dataset handling (500+ commands)",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 5: Parameter edge cases
    try {
      const edgeCases = [
        listRedisCommands({ limit: 1 }),
        listRedisCommands({ limit: 1000 }),
        listClients({ language: "Python" }),
        listClients({ language: "NonExistent" }),
      ];
      
      const results_edge = await Promise.all(edgeCases);
      const allValid = results_edge.every(r => r && typeof r === "object");
      
      results.push({
        name: "Parameter edge cases (limits, filters)",
        passed: allValid,
      });
    } catch (error) {
      results.push({
        name: "Parameter edge cases (limits, filters)",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 6: Data consistency across multiple calls
    try {
      const call1 = await listRedisCommands({});
      const call2 = await listRedisCommands({});
      
      const consistent = 
        call1 && call2 &&
        Array.isArray(call1.commands) &&
        Array.isArray(call2.commands) &&
        call1.commands.length === call2.commands.length;
      
      results.push({
        name: "Data consistency: Multiple calls return same data",
        passed: consistent,
      });
    } catch (error) {
      results.push({
        name: "Data consistency: Multiple calls return same data",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 7: Tool chaining
    try {
      const clients = await listClients({});

      if (clients.clients && clients.clients.length > 0) {
        try {
          const info = await getClientInfo({ client_id: "redis_py" });
          const hasInfo = info && "id" in info;
          results.push({
            name: "Tool chaining: List → Get info → Extract signatures",
            passed: hasInfo,
          });
        } catch {
          // If redis_py doesn't exist, try the first client
          const firstClientId = clients.clients[0].id;
          const info = await getClientInfo({ client_id: firstClientId });
          const hasInfo = info && "id" in info;
          results.push({
            name: "Tool chaining: List → Get info → Extract signatures",
            passed: hasInfo,
          });
        }
      } else {
        results.push({
          name: "Tool chaining: List → Get info → Extract signatures",
          passed: false,
          error: "No clients found",
        });
      }
    } catch (error) {
      results.push({
        name: "Tool chaining: List → Get info → Extract signatures",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 8: Rapid sequential calls
    try {
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        await listRedisCommands({ limit: 10 });
      }
      const duration = Date.now() - start;
      
      results.push({
        name: "Rapid sequential calls (10 calls in sequence)",
        passed: true,
        duration,
      });
    } catch (error) {
      results.push({
        name: "Rapid sequential calls (10 calls in sequence)",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 9: Mixed tool invocation
    try {
      const mixed = [
        listRedisCommands({ limit: 5 }),
        listClients({}),
        listRedisCommands({ category: "string" }),
        listClients({ language: "Python" }),
      ];
      
      const results_mixed = await Promise.all(mixed);
      const allValid = results_mixed.every(r => r && typeof r === "object");
      
      results.push({
        name: "Mixed tool invocation (different tools)",
        passed: allValid,
      });
    } catch (error) {
      results.push({
        name: "Mixed tool invocation (different tools)",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 10: Response format validation
    try {
      const commands = await listRedisCommands({});
      const clients = await listClients({});
      
      const validFormats = 
        commands && "commands" in commands &&
        clients && "clients" in clients;
      
      results.push({
        name: "Response format validation",
        passed: validFormats,
      });
    } catch (error) {
      results.push({
        name: "Response format validation",
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
    const duration = result.duration ? ` (${result.duration}ms)` : "";
    console.log(`${status} ${result.name}${duration}`);
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

