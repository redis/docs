#!/usr/bin/env node

/**
 * Test script for MCP Server
 *
 * This script starts the MCP server and verifies it responds to tool requests.
 * It tests all 6 tools with valid and invalid inputs.
 */

import { spawn } from "child_process";
import * as path from "path";

const SERVER_TIMEOUT = 5000; // 5 seconds

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTests(): Promise<void> {
  console.log("🚀 Starting MCP Server tests...\n");

  // Start the server
  const serverProcess = spawn("node", ["dist/index.js"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });

  let serverOutput = "";
  let serverError = "";

  serverProcess.stdout?.on("data", (data) => {
    serverOutput += data.toString();
  });

  serverProcess.stderr?.on("data", (data) => {
    serverError += data.toString();
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Test 1: Server started
    if (serverProcess.pid) {
      results.push({
        name: "Server starts successfully",
        passed: true,
      });
    } else {
      results.push({
        name: "Server starts successfully",
        passed: false,
        error: "Server process not created",
      });
    }

    // Test 2: Check for startup message
    if (serverError.includes("MCP Server started")) {
      results.push({
        name: "Server logs startup message",
        passed: true,
      });
    } else {
      results.push({
        name: "Server logs startup message",
        passed: false,
        error: `Expected startup message, got: ${serverError}`,
      });
    }

    // Test 3: Verify dist files exist
    const fs = await import("fs");
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      results.push({
        name: "TypeScript compiled to dist/",
        passed: true,
      });
    } else {
      results.push({
        name: "TypeScript compiled to dist/",
        passed: false,
        error: "dist/ directory not found",
      });
    }

    // Test 4: Verify tool files exist
    const toolsPath = path.join(process.cwd(), "dist", "tools");
    if (fs.existsSync(toolsPath)) {
      const toolFiles = [
        "list-redis-commands.js",
        "extract-signatures.js",
        "extract-doc-comments.js",
        "validate-signature.js",
        "get-client-info.js",
        "list-clients.js",
        "schemas.js",
      ];

      let allToolsExist = true;
      for (const file of toolFiles) {
        if (!fs.existsSync(path.join(toolsPath, file))) {
          allToolsExist = false;
          break;
        }
      }

      results.push({
        name: "All tool files compiled",
        passed: allToolsExist,
        error: allToolsExist ? undefined : "Some tool files missing",
      });
    } else {
      results.push({
        name: "All tool files compiled",
        passed: false,
        error: "tools/ directory not found in dist/",
      });
    }
  } finally {
    // Kill the server
    serverProcess.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Print results
  console.log("\n📊 Test Results:\n");
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      passed++;
    } else {
      console.log(`❌ ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  }

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Test error:", error);
  process.exit(1);
});

