import {
  getAllClients,
  getClientById,
  getClientsByLanguage,
  getClientsByFilter,
  getClientCountByLanguage,
  getAllLanguages,
  clearCache,
} from "./data/components-access.js";

/**
 * Test suite for components loader and data access layer
 */

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    testsFailed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Load all clients
test("Load all clients", () => {
  clearCache();
  const clients = getAllClients();
  assert(clients.size > 0, "Should load at least one client");
  assert(clients.size === 14, `Should load 14 clients, got ${clients.size}`);
  console.log(`   Loaded ${clients.size} clients`);
});

// Test 2: Get client by ID
test("Get client by ID", () => {
  clearCache();
  const client = getClientById("redis_py");
  assert(client !== undefined, "Should find redis_py client");
  assert(client?.name === "redis-py", `Expected name 'redis-py', got '${client?.name}'`);
  assert(client?.language === "Python", `Expected language 'Python', got '${client?.language}'`);
});

// Test 3: Get clients by language
test("Get clients by language", () => {
  clearCache();
  const pythonClients = getClientsByLanguage("Python");
  assert(pythonClients.length > 0, "Should find Python clients");
  console.log(`   Found ${pythonClients.length} Python clients`);
});

// Test 4: Get client counts by language
test("Get client counts by language", () => {
  clearCache();
  const counts = getClientCountByLanguage();
  assert(Object.keys(counts).length > 0, "Should have language counts");
  assert(counts["Python"] !== undefined, "Should have Python count");
  console.log(`   Language counts:`, counts);
});

// Test 5: Get all languages
test("Get all languages", () => {
  clearCache();
  const languages = getAllLanguages();
  assert(languages.length > 0, "Should have at least one language");
  assert(languages.includes("Python"), "Should include Python");
  console.log(`   Languages: ${languages.join(", ")}`);
});

// Test 6: Filter by language
test("Filter clients by language", () => {
  clearCache();
  const pythonClients = getClientsByFilter({ languageFilter: ["Python"] });
  assert(pythonClients.length > 0, "Should find Python clients");
  for (const client of pythonClients) {
    assert(client.language === "Python", `Expected Python, got ${client.language}`);
  }
  console.log(`   Found ${pythonClients.length} Python clients`);
});

// Test 7: Filter by multiple languages
test("Filter by multiple languages", () => {
  clearCache();
  const clients = getClientsByFilter({ languageFilter: ["Python", "Java-Sync"] });
  assert(clients.length > 0, "Should find clients");
  for (const client of clients) {
    assert(
      client.language === "Python" || client.language === "Java-Sync",
      `Expected Python or Java-Sync, got ${client.language}`
    );
  }
  console.log(`   Found ${clients.length} clients (Python + Java-Sync)`);
});

// Test 8: Verify hiredis is excluded
test("Verify hiredis is excluded", () => {
  clearCache();
  const clients = getAllClients();
  const hiredis = clients.get("hi_redis");
  assert(hiredis === undefined, "hiredis should be excluded");
});

// Test 9: Verify client metadata structure
test("Verify client metadata structure", () => {
  clearCache();
  const client = getClientById("redis_py");
  assert(client?.id !== undefined, "Should have id");
  assert(client?.name !== undefined, "Should have name");
  assert(client?.language !== undefined, "Should have language");
  assert(client?.type !== undefined, "Should have type");
  assert(client?.label !== undefined, "Should have label");
  assert(client?.repository !== undefined, "Should have repository");
});

// Test 10: Caching works
test("Caching works", () => {
  clearCache();
  const start1 = Date.now();
  getAllClients();
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  getAllClients();
  const time2 = Date.now() - start2;

  console.log(`   First load: ${time1}ms, Cached: ${time2}ms`);
  assert(time2 <= time1, "Cached load should be faster or equal");
});

// Test 11: Tool integration - list_clients
test("Tool integration - list_clients", async () => {
  clearCache();
  const { listClients } = await import("./tools/list-clients.js");
  const result = await listClients({ language_filter: [] });
  assert(result.clients.length === 14, `Expected 14 clients, got ${result.clients.length}`);
  assert(result.total_count === 14, `Expected total_count 14, got ${result.total_count}`);
  assert(Object.keys(result.by_language).length > 0, "Should have language counts");
  console.log(`   Returned ${result.clients.length} clients`);
});

// Test 12: Tool integration - get_client_info
test("Tool integration - get_client_info", async () => {
  clearCache();
  const { getClientInfo } = await import("./tools/get-client-info.js");
  const result = await getClientInfo({ client_id: "redis_py" });
  assert(result.id === "redis_py", `Expected id 'redis_py', got '${result.id}'`);
  assert(result.name === "redis-py", `Expected name 'redis-py', got '${result.name}'`);
  assert(result.language === "Python", `Expected language 'Python', got '${result.language}'`);
});

// Summary
console.log("\n" + "=".repeat(60));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log("=".repeat(60));

if (testsFailed > 0) {
  process.exit(1);
}

