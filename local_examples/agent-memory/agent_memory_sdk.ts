// EXAMPLE: agent_memory_sdk

// STEP_START connect_health_check
import { AgentMemory } from "@redis-iris/agent-memory";

async function checkHealth() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const health = await agentMemory.health();
  console.log("Service health:");
  console.dir(health, { depth: null });
}

checkHealth().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START add_session_event
import { AgentMemory } from "@redis-iris/agent-memory";

async function buildConversationContext() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const sessionId = "travel-planning-session";
  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

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

buildConversationContext().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START search_long_term_memory_basic
import { AgentMemory } from "@redis-iris/agent-memory";

async function recallExtractedMemory() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

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

recallExtractedMemory().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START add_conversation_turns
import { AgentMemory } from "@redis-iris/agent-memory";

async function addConversationTurns() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const sessionId = "travel-planning-session";
  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const turns = [
    { role: "ASSISTANT", actorId: "travel-agent", text: "What dates are you traveling?" },
    { role: "USER", actorId: userId, text: "I arrive on October 10 and leave on October 18." },
    { role: "ASSISTANT", actorId: "travel-agent", text: "Would you like formal or casual restaurants?" },
    { role: "USER", actorId: userId, text: "Mostly casual places near public transit." },
    { role: "ASSISTANT", actorId: "travel-agent", text: "Do you have a preferred budget?" },
    { role: "USER", actorId: userId, text: "About 40 euros per person." },
  ] as const;

  for (const turn of turns) {
    await agentMemory.addSessionEvent({
      sessionId,
      actorId: turn.actorId,
      role: turn.role,
      content: [{ text: turn.text }],
      createdAt: new Date(),
    });
  }
}

addConversationTurns().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START retrieve_session_summary
import { AgentMemory } from "@redis-iris/agent-memory";

async function retrieveSessionSummary() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const sessionId = "travel-planning-session";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const compactedSession = await agentMemory.getSessionMemory(sessionId);
  console.log("Compacted session memory:");
  console.dir(compactedSession, { depth: null });
}

retrieveSessionSummary().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START search_long_term_memory_custom_type
import { AgentMemory } from "@redis-iris/agent-memory";

async function searchCustomMemoryType() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const customResults = await agentMemory.searchLongTermMemory({
    text: "What are the requirements for the user's trip?",
    filter: {
      ownerId: { eq: userId },
      memoryType: { eq: "trip_preference" },
    },
    limit: 5,
  });
  console.log("Trip preference memories:");
  console.dir(customResults, { depth: null });
}

searchCustomMemoryType().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START add_session_event_sensitive
import { AgentMemory } from "@redis-iris/agent-memory";

async function addSensitiveEvent() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const sessionId = "travel-planning-session";
  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const sensitiveEvent = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{
      text: "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9.",
    }],
    createdAt: new Date(),
  });
  console.log("Event with excluded information:");
  console.dir(sensitiveEvent, { depth: null });
}

addSensitiveEvent().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END

// STEP_START search_long_term_memory_exclusion
import { AgentMemory } from "@redis-iris/agent-memory";

async function searchWithExclusion() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Set the API_KEY environment variable.");
  }

  const userId = "quickstart-user";

  const agentMemory = new AgentMemory({
    serverURL: "<ENDPOINT>",
    storeId: "<STORE_ID>",
    apiKey,
  });

  const exclusionResults = await agentMemory.searchLongTermMemory({
    text: "Where is the user staying in Tokyo?",
    filter: {
      ownerId: { eq: userId },
    },
    limit: 5,
  });
  console.log("Memories after semantic exclusion:");
  console.dir(exclusionResults, { depth: null });
}

searchWithExclusion().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
// STEP_END
