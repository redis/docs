---
LinkTitle: Vercel AI SDK
Title: Redis with the Vercel AI SDK
alwaysopen: false
categories:
- docs
- integrate
- rc
description: Give Vercel AI SDK agents session and long-term memory with Redis Agent Memory.
group: ai
stack: true
summary: Use the @redis/vercel-ai-sdk package to add Redis Agent Memory to agents built with the Vercel AI SDK.
type: integration
weight: 30
---

The [Vercel AI SDK](https://ai-sdk.dev/) is a TypeScript toolkit for building AI agents. The [`@redis/vercel-ai-sdk`](https://github.com/redis/vercel-ai-sdk) package adds [Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md) to those agents. It gives them short-term memory for the current session and long-term memories that follow the user across sessions.

The package works with any host that runs Node.js. Your app doesn't need to be deployed on Vercel. To deploy a Vercel app on a Redis Cloud database instead, see [Redis with Vercel](/content/integrate/vercel-redis/_index.md).

## Requirements

- Node.js 22 or later
- AI SDK 7.0.114 or later (7.x), and Zod 4.1.8 or later (4.x)
- A Redis Agent Memory store, which gives you a store URL, an API key, and a store ID. See [Create an Agent Memory service](/content/operate/iris/agent-memory/create-service.md).

The package is server-side only and ships as an ECMAScript module (ESM). Don't load it in a browser bundle, because it needs your API key.

## Install and configure

Install the package:

```bash
npm install @redis/vercel-ai-sdk
```

Set these environment variables in your server environment. The package has no default endpoint, so all three are required:

| Variable | Value |
|----------|-------|
| `AGENT_MEMORY_URL` | The HTTP endpoint of your store |
| `AGENT_MEMORY_STORE_ID` | The ID of your store |
| `AGENT_MEMORY_API_KEY` | The API key for your store |

Then create a memory object once, when your server starts:

```typescript
import { createRedisAgentMemory } from '@redis/vercel-ai-sdk';

const memory = createRedisAgentMemory({
  serverUrl: process.env.AGENT_MEMORY_URL,
  storeId: process.env.AGENT_MEMORY_STORE_ID,
  apiKey: process.env.AGENT_MEMORY_API_KEY,
});
```

The factory validates its options but makes no network calls. It accepts these optional settings:

| Option | Default | Description |
|--------|---------|-------------|
| `model` | None | The default AI SDK model object for `memory.model()`. Model name strings aren't accepted. |
| `scope` | None | A default scope: `userId`, `sessionId`, and `namespaceId`. Other fields throw an error. |
| `allowDeletes` | `false` | Exposes the deletion tools when `true`. |
| `namespaceTools` | `false` | Exposes the namespace administration tools when `true`. |
| `timeoutMs` | `30000` | The timeout for each HTTP request, in milliseconds. |

## Choose how the agent uses memory

The package offers two ways to add memory. You can use both in one agent.

| | Automatic memory | Memory tools |
|---|---|---|
| **Use** | `memory.model()` as the agent's model | `memory.tools()` as the agent's tools |
| **Recall** | Automatic, before each model call | The model decides when to search |
| **Recording** | Automatic, after each model call | The model decides what to save, or you add hooks |
| **Best for** | Continuity with no extra prompting | Selective, model-directed memory |

Don't combine automatic recording with session hooks or session-write tools for the same interaction. Both record the same events, so you get duplicates.

## Use automatic memory

Pass `memory.model()` as the agent's model. Before each model call, the wrapper restores the session and recalls relevant long-term memories. It injects them as a bounded block of context, marked as untrusted and possibly stale. After the call, it records the user message and each successful assistant step.

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { ToolLoopAgent, isStepCount } from 'ai';
import { createRedisAgentMemory } from '@redis/vercel-ai-sdk';

const memory = createRedisAgentMemory({
  serverUrl: process.env.AGENT_MEMORY_URL,
  storeId: process.env.AGENT_MEMORY_STORE_ID,
  apiKey: process.env.AGENT_MEMORY_API_KEY,
  model: anthropic('claude-sonnet-4-5'),
});

async function reply(userId: string, sessionId: string, prompt: string) {
  const agent = new ToolLoopAgent({
    model: memory.model({
      scope: { userId, sessionId },
      assistantId: 'assistant',
    }),
    stopWhen: isStepCount(8),
  });
  return agent.generate({ prompt });
}
```

Create a new `memory.model()` result for each request. Don't pass one to an agent that outlives the request.

Memories belong to a `userId`. Session restore and recording also need a `sessionId`, and recording needs an `assistantId`. Resolve the IDs from your authenticated user state, never from model output or user input.

### Limits and failure behavior

By default, the wrapper:

- Recalls up to 5 memories and caps the long-term context at 8,000 characters.
- Caps the restored session context at 24,000 characters.
- Applies a one-second deadline to reads and to each write.

Override these defaults with the `limits` option. A memory failure never replaces a successful model response. To see failures, pass an `onDiagnostic` callback. Its diagnostics never include prompt, memory, or credential text.

Recording is best-effort. Agent Memory has no idempotency key for appends, so a write that timed out may still have landed. Use collision-resistant session IDs, and handle one request at a time for each session.

If your application already stores the conversation history, set `historyMode: 'application'` and `recording: false`. The wrapper then recalls long-term memories but doesn't restore or record session events.

## Use memory tools

Call `memory.tools()` to get a standard AI SDK tool map. The model chooses when to search, save, update, or forget memories. The scope is fixed on your side, so the model can't read or write another user's memories.

```typescript
const tools = memory.tools({ scope: { userId, sessionId } });

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  tools,
  activeTools: ['search_memories', 'create_memories', 'update_memory'],
  stopWhen: isStepCount(8),
});
```

Use `activeTools` to expose only the tools the agent needs. The main tools are:

| Tool | Description |
|------|-------------|
| `search_memories` | Searches long-term memories with a text query and optional filters. |
| `create_memories` | Saves one or more long-term memories. |
| `update_memory` | Changes an existing memory. |
| `get_memory` | Reads one memory by ID. |
| `get_session_memory` | Reads a session's events and summary. |
| `add_session_event` | Adds an event to a session. |
| `start_session` | Starts a session and adds its first event. |
| `list_sessions` | Lists sessions. |
| `delete_memories`, `delete_session_event`, `delete_session_memory` | Delete data. Available only when `allowDeletes` is `true`. |

With `namespaceTools: true`, the map also includes tools to list, create, update, and delete namespaces, and to move memories between them. For every tool and its parameters, see [TOOLS.md](https://github.com/redis/vercel-ai-sdk/blob/main/TOOLS.md) in the repository.

### Record sessions with hooks

Memory tools don't record the conversation on their own. To save each turn, add the session event hooks to the agent:

```typescript
const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  tools,
  stopWhen: isStepCount(8),
  onStart: tools.createSessionEventHook({
    role: 'USER',
    actorId: userId,
    onError: error => console.error('USER session save failed:', error.message),
  }),
  onEnd: tools.createSessionEventHook({
    role: 'ASSISTANT',
    actorId: '<your-agent-id>',
    onError: error => console.error('ASSISTANT session save failed:', error.message),
  }),
});
```

The hook saves the user message before the model starts, and keeps it even if generation fails. It saves the assistant message only when the final text isn't empty. Writes aren't atomic, retried, or deduplicated.

## More info

- [@redis/vercel-ai-sdk on GitHub](https://github.com/redis/vercel-ai-sdk), including two runnable demos
- [@redis/vercel-ai-sdk on npm](https://www.npmjs.com/package/@redis/vercel-ai-sdk)
- [Build a meal-planning agent with Redis memory](https://ai-sdk.dev/cookbook/guides/redis-agent-memory), a step-by-step guide in the AI SDK cookbook
- [Give your Vercel AI SDK agents memory with Redis Agent Memory](https://redis.io/blog/give-your-vercel-ai-sdk-agents-memory-with-redis-agent-memory/)
- [Redis Agent Memory](/content/develop/ai/context-engine/agent-memory/_index.md)
