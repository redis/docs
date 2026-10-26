// EXAMPLE: agent_memory_sdk

// STEP_START connect_health_check
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "travel-planning-session";
const userId = process.env.OWNER_ID ?? "quickstart-user";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.storeHealth();
  console.log("Store health:");
  console.dir(health, { depth: null });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
});
// STEP_END

// STEP_START add_session_event
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "travel-planning-session";
const userId = process.env.OWNER_ID ?? "quickstart-user";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.storeHealth();
  console.log("Store health:");
  console.dir(health, { depth: null });

  const event = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{
      text: "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food.",
    }],
    createdAt: new Date(),
  });
  console.log("Created event:");
  console.dir(event, { depth: null });

  const session = await agentMemory.getSessionMemory(sessionId);
  console.log("Session memory:");
  console.dir(session, { depth: null });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
});
// STEP_END

// STEP_START search_long_term_memory_basic
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "travel-planning-session";
const userId = process.env.OWNER_ID ?? "quickstart-user";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.storeHealth();
  console.log("Store health:");
  console.dir(health, { depth: null });

  const results = await agentMemory.searchLongTermMemory({
    text: "What dietary requirements and food preferences does the user have?",
    filter: {
      ownerId: {
        eq: userId,
      },
    },
    limit: 5,
  });
  console.log("Automatically extracted memories:");
  console.dir(results, { depth: null });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
});
// STEP_END
