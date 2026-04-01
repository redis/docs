#!/usr/bin/env node

/**
 * Performance Benchmarking for Augment Integration
 *
 * Measures response times, memory usage, throughput, and latency
 * for all MCP server tools.
 */

interface PerformanceMetrics {
  tool: string;
  calls: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // calls per second
}

const metrics: PerformanceMetrics[] = [];

function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function benchmarkTool(
  toolName: string,
  toolFn: (params: any) => Promise<any>,
  params: any,
  iterations: number = 100
): Promise<PerformanceMetrics> {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await toolFn(params);
    } catch {
      // Ignore errors for benchmarking
    }
    const duration = performance.now() - start;
    times.push(duration);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    tool: toolName,
    calls: iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    p50: calculatePercentile(times, 50),
    p95: calculatePercentile(times, 95),
    p99: calculatePercentile(times, 99),
    throughput: (iterations / totalTime) * 1000, // calls per second
  };
}

async function runBenchmarks(): Promise<void> {
  console.log("⚡ Running Performance Benchmarks...\n");

  try {
    // Import tool handlers
    const { listRedisCommands } = await import("./tools/list-redis-commands.js");
    const { listClients } = await import("./tools/list-clients.js");
    const { getClientInfo } = await import("./tools/get-client-info.js");
    const { extractSignatures } = await import("./tools/extract-signatures.js");
    const { extractDocComments } = await import("./tools/extract-doc-comments.js");
    const { validateSignature } = await import("./tools/validate-signature.js");

    // Get a valid client for testing
    const clients = await listClients({});
    const pythonClient = clients.clients?.find((c) => c.language === "Python");
    const clientId = pythonClient?.id || clients.clients?.[0]?.id || "redis_py";

    // Benchmark each tool
    console.log("Benchmarking tools (100 iterations each)...\n");

    // 1. list_redis_commands
    const listCommandsMetrics = await benchmarkTool(
      "list_redis_commands",
      listRedisCommands,
      {}
    );
    metrics.push(listCommandsMetrics);

    // 2. list_clients
    const listClientsMetrics = await benchmarkTool(
      "list_clients",
      listClients,
      {}
    );
    metrics.push(listClientsMetrics);

    // 3. get_client_info
    const getClientInfoMetrics = await benchmarkTool(
      "get_client_info",
      getClientInfo,
      { client_id: clientId }
    );
    metrics.push(getClientInfoMetrics);

    // 4. extract_signatures (if file exists)
    try {
      const extractSignaturesMetrics = await benchmarkTool(
        "extract_signatures",
        extractSignatures,
        { file_path: "test.py", language: "python" },
        50 // Fewer iterations for file operations
      );
      metrics.push(extractSignaturesMetrics);
    } catch {
      console.log("⚠️  Skipping extract_signatures (test file not available)\n");
    }

    // 5. extract_doc_comments (if file exists)
    try {
      const extractDocCommentsMetrics = await benchmarkTool(
        "extract_doc_comments",
        extractDocComments,
        { file_path: "test.py", language: "python" },
        50
      );
      metrics.push(extractDocCommentsMetrics);
    } catch {
      console.log("⚠️  Skipping extract_doc_comments (test file not available)\n");
    }

    // 6. validate_signature
    const validateSignatureMetrics = await benchmarkTool(
      "validate_signature",
      validateSignature,
      {
        signature: "def test(x: int) -> str:",
        language: "python",
      }
    );
    metrics.push(validateSignatureMetrics);

    // Print results
    console.log("\n📊 Performance Metrics:\n");
    console.log("Tool Name                    | Avg (ms) | Min (ms) | Max (ms) | P95 (ms) | P99 (ms) | Throughput");
    console.log("-".repeat(100));

    for (const metric of metrics) {
      const toolName = metric.tool.padEnd(28);
      const avg = metric.avgTime.toFixed(2).padStart(8);
      const min = metric.minTime.toFixed(2).padStart(8);
      const max = metric.maxTime.toFixed(2).padStart(8);
      const p95 = metric.p95.toFixed(2).padStart(8);
      const p99 = metric.p99.toFixed(2).padStart(8);
      const throughput = metric.throughput.toFixed(2).padStart(10);

      console.log(
        `${toolName} | ${avg} | ${min} | ${max} | ${p95} | ${p99} | ${throughput} req/s`
      );
    }

    // Summary
    console.log("\n📈 Summary:\n");
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgTime, 0) / metrics.length;
    const maxResponseTime = Math.max(...metrics.map(m => m.maxTime));
    const totalThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0);

    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Max response time: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`Total throughput: ${totalThroughput.toFixed(2)} req/s`);
    console.log(`Tools benchmarked: ${metrics.length}`);

    // Performance targets
    console.log("\n🎯 Performance Targets:\n");
    const p95Target = 100;
    const throughputTarget = 100;

    for (const metric of metrics) {
      const p95Status = metric.p95 <= p95Target ? "✅" : "⚠️";
      const throughputStatus = metric.throughput >= throughputTarget ? "✅" : "⚠️";
      
      console.log(`${metric.tool}:`);
      console.log(`  P95: ${metric.p95.toFixed(2)}ms ${p95Status} (target: ${p95Target}ms)`);
      console.log(`  Throughput: ${metric.throughput.toFixed(2)} req/s ${throughputStatus} (target: ${throughputTarget} req/s)`);
    }

    console.log("\n✅ Performance benchmarking complete!\n");

  } catch (error) {
    console.error("❌ Benchmarking failed:", error);
    process.exit(1);
  }
}

runBenchmarks().catch(console.error);

