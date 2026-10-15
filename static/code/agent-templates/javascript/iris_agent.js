/*
 * Redis Iris Conversational Assistant (Agent Memory)
 *
 * A conversational agent whose memory is fully managed by the Redis Iris
 * Context Engine on Redis Cloud. Instead of building your own vector index,
 * embeddings, and session store, the agent calls the managed, store-scoped
 * Agent Memory REST API directly:
 *
 * Features:
 *   - Session memory: every user and assistant turn is stored as a session event
 *   - Long-term memory: the service extracts and promotes important facts;
 *     the agent searches them semantically each turn
 *   - Session summaries: older turns are compacted into a summary the agent
 *     folds back into context, so long conversations don't lose their history
 *   - No embeddings, vector index, or Redis schema to manage
 *
 * Each turn the agent:
 *   1. Searches long-term memory for facts relevant to the new message
 *   2. Loads the session (recent events + compacted summary) for short-term context
 *   3. Calls the LLM with that memory injected into the system prompt
 *   4. Writes the user and assistant messages back as session events
 *      (long-term facts are extracted and promoted automatically)
 *
 * To run this code:
 *   Install dependencies:
 *     npm install openai dotenv
 *     (Node.js 18+ is required for the built-in fetch used to call the API.)
 *
 *   Set environment variables (Agent Memory — from the Redis Cloud console):
 *     AGENT_MEMORY_URL=your_agent_memory_base_url
 *     STORE_ID=your_store_id
 *     AGENT_MEMORY_API_KEY=your_agent_memory_api_key
 *
 *   Set environment variables (LLM):
 *     LLM_API_KEY=your_api_key_here
 *     LLM_API_BASE_URL=your_base_url       (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
 *     LLM_MODEL=your_model                 (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})
 *
 *   Note: this template uses the OpenAI SDK with a configurable base URL, so you
 *   can point it at any OpenAI-compatible chat provider. Agent memory is handled
 *   entirely by the managed Agent Memory service — see
 *   https://redis.io/docs/latest/develop/ai/context-engine/agent-memory/
 *
 *   To create an Agent Memory service and get the values above, follow the
 *   Redis Cloud Agent Memory quickstart in the documentation.
 *
 *   Run:
 *     node iris_agent.js
 */

'use strict';

require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline');
const crypto = require('crypto');

// How many long-term memories to inject as relevant background each turn.
const MAX_LONG_TERM_RESULTS = 5;
// How many recent session events to load for short-term context each turn.
const MAX_SESSION_EVENTS = 12;

class ${AgentClassName} {
    constructor(sessionId, actorId = 'user') {
        // Managed Agent Memory service (Redis Cloud). The service owns the
        // vector index, embeddings, and storage; we call its store-scoped
        // REST API directly with fetch.
        this.baseUrl = (process.env.AGENT_MEMORY_URL || '').replace(/\/$/, '');
        this.storeId = process.env.STORE_ID;
        this.apiKey = process.env.AGENT_MEMORY_API_KEY;

        // Chat LLM. Uses the OpenAI SDK with a configurable base URL so any
        // OpenAI-compatible provider works.
        this.llm = new OpenAI({
            apiKey: process.env.LLM_API_KEY,
            baseURL: process.env.LLM_API_BASE_URL || '${CONFIG.models[formData.llmModel].baseUrl}',
        });
        this.model = process.env.LLM_MODEL || '${CONFIG.models[formData.llmModel].defaultModel}';

        // A session groups the events of one conversation. Long-term memory is
        // shared across all of a user's sessions.
        this.sessionId = sessionId || `session-${crypto.randomBytes(6).toString('hex')}`;
        this.actorId = actorId;
    }

    // Call the store-scoped Agent Memory API. Returns parsed JSON, or null on
    // 404 (e.g. a session that doesn't exist yet).
    async memoryRequest(method, path, body) {
        const res = await fetch(`${this.baseUrl}/v1/stores/${this.storeId}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (res.status === 404) return null;
        if (!res.ok) {
            throw new Error(`Agent Memory ${method} ${path} -> ${res.status}: ${await res.text()}`);
        }
        return res.json();
    }

    // Semantic search over long-term memory for facts relevant to the query.
    async relevantMemories(query) {
        try {
            const results = await this.memoryRequest('POST', '/long-term-memory/search', { text: query });
            const items = (results && results.items) || [];
            return items.slice(0, MAX_LONG_TERM_RESULTS).map(item => item.text);
        } catch (err) {
            console.error(`[memory] long-term search unavailable: ${err.message}`);
            return [];
        }
    }

    // Load the session: recent events for short-term context, plus the
    // compacted summary of older turns the service has already summarized.
    async loadSession() {
        try {
            const session = await this.memoryRequest('GET', `/session-memory/${this.sessionId}`);
            if (!session) return { turns: [], summary: '' };
            const events = (session.events || []).slice(-MAX_SESSION_EVENTS);
            const turns = events.map(event => ({
                role: String(event.role).toUpperCase() === 'ASSISTANT' ? 'assistant' : 'user',
                content: (event.content || []).map(part => part.text || '').join(' '),
            }));
            return { turns, summary: (session.summary && session.summary.text) || '' };
        } catch (err) {
            console.error(`[memory] session load unavailable: ${err.message}`);
            return { turns: [], summary: '' };
        }
    }

    // Persist one turn as a session event. Long-term promotion is automatic.
    async recordEvent(role, text) {
        await this.memoryRequest('POST', '/session-memory/events', {
            sessionId: this.sessionId,
            actorId: this.actorId,
            role,
            content: [{ text }],
            createdAt: new Date().toISOString(),
        });
    }

    async ask(userInput) {
        // 1. Relevant long-term facts and 2. this session's recent turns + summary.
        const facts = await this.relevantMemories(userInput);
        const { turns, summary } = await this.loadSession();

        let systemPrompt =
            'You are a helpful assistant with persistent memory. ' +
            'Use the following remembered facts about the user when relevant. ' +
            'If nothing is relevant, answer normally.\n\n' +
            (facts.length
                ? 'Relevant memories:\n' + facts.map(f => `- ${f}`).join('\n')
                : 'Relevant memories: (none yet)');
        if (summary) {
            systemPrompt += `\n\nSummary of earlier conversation:\n${summary}`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...turns,
            { role: 'user', content: userInput },
        ];

        // 3. Call the LLM.
        const response = await this.llm.chat.completions.create({ model: this.model, messages });
        const answer = response.choices[0].message.content;

        // 4. Write both turns back as session events.
        await this.recordEvent('USER', userInput);
        await this.recordEvent('ASSISTANT', answer);

        return answer;
    }
}

async function main() {
    const agent = new ${AgentClassName}();
    console.log('Redis Iris Conversational Assistant — type "exit" to quit.');
    console.log(`Session: ${agent.sessionId}\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = () => new Promise(resolve => rl.question('You: ', resolve));

    for (;;) {
        const userInput = (await prompt()).trim();
        if (!userInput || ['exit', 'quit'].includes(userInput.toLowerCase())) break;
        console.log(`Agent: ${await agent.ask(userInput)}\n`);
    }
    rl.close();
}

if (require.main === module) {
    main().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

module.exports = ${AgentClassName};
