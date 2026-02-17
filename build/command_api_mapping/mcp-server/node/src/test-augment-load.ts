#!/usr/bin/env node

/**
 * Load Testing for Augment Integration
 *
 * Tests system stability under high load with various scenarios:
 * - Constant load
 * - Ramp-up load
 * - Spike testing
 * - Sustained high load
 */

interface LoadTestResult {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  successRate: number;
}

const results: Array<LoadTestResult> = [];
const testResults: Array<{ scenario: string; successRate: number }> = [];

async function runLoadTest(
  scenario: string,
  requestsPerSecond: number,
  durationSeconds: number,
  toolFn: (params: any) => Promise<any>,
  params: any
): Promise<LoadTestResult> {
  console.log(`\n🔥 Running: ${scenario}`);
  console.log(`   Target: ${requestsPerSecond} req/s for ${durationSeconds}s`);

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const responseTimes: number[] = [];

  const intervalMs = 1000 / requestsPerSecond;
  let nextRequestTime = startTime;

  while (Date.now() < endTime) {
    const now = Date.now();
    
    if (now >= nextRequestTime) {
      totalRequests++;
      const reqStart = performance.now();
      
      try {
        await toolFn(params);
        successfulRequests++;
      } catch {
        failedRequests++;
      }
      
      const duration = performance.now() - reqStart;
      responseTimes.push(duration);
      nextRequestTime += intervalMs;
    }
    
    // Prevent busy-waiting
    if (nextRequestTime > now) {
      const waitTime = Math.min(1, nextRequestTime - now);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  const totalDuration = Date.now() - startTime;
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const maxResponseTime = responseTimes.length > 0
    ? Math.max(...responseTimes)
    : 0;
  const minResponseTime = responseTimes.length > 0
    ? Math.min(...responseTimes)
    : 0;

  return {
    scenario,
    totalRequests,
    successfulRequests,
    failedRequests,
    duration: totalDuration,
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    throughput: (totalRequests / totalDuration) * 1000,
    successRate: (successfulRequests / totalRequests) * 100,
  };
}

async function runLoadTests(): Promise<void> {
  console.log("🚀 Starting Load Testing Suite...\n");

  try {
    // Import tool handlers
    const { listRedisCommands } = await import("./tools/list-redis-commands.js");
    const { listClients } = await import("./tools/list-clients.js");

    // Test 1: Constant load (50 req/s for 10s)
    const constantLoad: LoadTestResult = await runLoadTest(
      "Constant Load (50 req/s for 10s)",
      50,
      10,
      listRedisCommands,
      {}
    );
    results.push(constantLoad);

    // Test 2: Ramp-up load (10 → 100 req/s over 15s)
    console.log(`\n🔥 Running: Ramp-up Load (10 → 100 req/s over 15s)`);
    const rampStart = Date.now();
    const rampEnd = rampStart + 15000;
    let rampTotal = 0;
    let rampSuccess = 0;
    let rampFailed = 0;
    const rampTimes: number[] = [];

    while (Date.now() < rampEnd) {
      const elapsed = Date.now() - rampStart;
      const progress = elapsed / 15000;
      const currentRps = 10 + (100 - 10) * progress;
      const intervalMs = 1000 / currentRps;

      rampTotal++;
      const reqStart = performance.now();
      
      try {
        await listClients({});
        rampSuccess++;
      } catch {
        rampFailed++;
      }
      
      rampTimes.push(performance.now() - reqStart);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    (results as unknown as LoadTestResult[]).push({
      scenario: "Ramp-up Load (10 → 100 req/s over 15s)",
      totalRequests: rampTotal,
      successfulRequests: rampSuccess,
      failedRequests: rampFailed,
      duration: Date.now() - rampStart,
      avgResponseTime: rampTimes.reduce((a, b) => a + b, 0) / rampTimes.length,
      maxResponseTime: Math.max(...rampTimes),
      minResponseTime: Math.min(...rampTimes),
      throughput: (rampTotal / (Date.now() - rampStart)) * 1000,
      successRate: (rampSuccess / rampTotal) * 100,
    } as LoadTestResult);

    // Test 3: Spike test (sudden 10x load)
    const spikeResult: LoadTestResult = await runLoadTest(
      "Spike Test (200 req/s for 5s)",
      200,
      5,
      listRedisCommands,
      {}
    );
    (results as unknown as LoadTestResult[]).push(spikeResult);

    // Test 4: Sustained high load (100 req/s for 20s)
    const sustainedResult: LoadTestResult = await runLoadTest(
      "Sustained High Load (100 req/s for 20s)",
      100,
      20,
      listClients,
      {}
    );
    (results as unknown as LoadTestResult[]).push(sustainedResult);

    // Print results
    console.log("\n\n📊 Load Test Results:\n");
    console.log("Scenario                              | Total | Success | Failed | Avg (ms) | Max (ms) | Success Rate | Throughput");
    console.log("-".repeat(120));

    for (const result of (results as unknown as LoadTestResult[])) {
      const scenario = result.scenario.padEnd(37);
      const total = String(result.totalRequests).padStart(5);
      const success = String(result.successfulRequests).padStart(7);
      const failed = String(result.failedRequests).padStart(6);
      const avg = result.avgResponseTime.toFixed(2).padStart(8);
      const max = result.maxResponseTime.toFixed(2).padStart(8);
      const rate = result.successRate.toFixed(1).padStart(11);
      const throughput = result.throughput.toFixed(2).padStart(10);

      console.log(
        `${scenario} | ${total} | ${success} | ${failed} | ${avg} | ${max} | ${rate}% | ${throughput} req/s`
      );
    }

    // Summary
    console.log("\n📈 Summary:\n");
    const loadResults = results as unknown as LoadTestResult[];
    const totalRequests = loadResults.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccess = loadResults.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = loadResults.reduce((sum, r) => sum + r.failedRequests, 0);
    const avgSuccessRate = loadResults.reduce((sum, r) => sum + r.successRate, 0) / loadResults.length;

    console.log(`Total requests: ${totalRequests}`);
    console.log(`Successful: ${totalSuccess} (${((totalSuccess / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Average success rate: ${avgSuccessRate.toFixed(1)}%`);

    // Stability assessment
    console.log("\n🎯 Stability Assessment:\n");
    const allStable = (results as unknown as LoadTestResult[]).every(r => r.successRate >= 95);
    const status = allStable ? "✅ STABLE" : "⚠️ UNSTABLE";
    console.log(`Overall Status: ${status}`);

    for (const result of (results as unknown as LoadTestResult[])) {
      const stability = result.successRate >= 95 ? "✅" : "⚠️";
      console.log(`${stability} ${result.scenario}: ${result.successRate.toFixed(1)}% success rate`);
      testResults.push({ scenario: result.scenario, successRate: result.successRate });
    }

    console.log("\n✅ Load testing complete!\n");

  } catch (error) {
    console.error("❌ Load testing failed:", error);
    process.exit(1);
  }
}

runLoadTests().catch(console.error);

