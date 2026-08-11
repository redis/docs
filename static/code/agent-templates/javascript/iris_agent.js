/*
 * Redis Context Engine Agent (Redis Iris — Agent Memory)
 *
 * A conversational agent whose memory is fully managed by the Redis Iris
 * Context Engine. Instead of building your own vector index, embeddings, and
 * session store, the agent calls the managed Agent Memory service through the
 * official agent-memory-client:
 *
 * Features:
 *   - Working memory: the running conversation is stored per session
 *   - Long-term memory: the service extracts and promotes important facts;
 *     the agent searches them semantically each turn
 *   - Cross-session recall: relevant facts follow the user across conversations
 *   - No embeddings, vector index, or Redis schema to manage
 *
 * Each turn the agent:
 *   1. Searches long-term memory for facts relevant to the new message
 *   2. Loads working memory for short-term conversational context
 *   3. Calls the LLM with that memory injected into the system prompt
 *   4. Writes the user and assistant messages back to working memory
 *      (long-term facts are extracted and promoted automatically)
 *
 * To run this code:
 *   Install dependencies:
 *     npm install agent-memory-client openai dotenv
 *
 *   Set environment variables (Agent Memory — from the Redis Cloud console):
 *     AGENT_MEMORY_URL=your_agent_memory_base_url
 *     AGENT_MEMORY_API_KEY=your_agent_memory_api_key
 *     AGENT_MEMORY_NAMESPACE=my-app        (optional - groups memories)
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
 *   Run:
 *     node iris_agent.js
 */

'use strict';

require('dotenv').config();
const { MemoryAPIClient } = require('agent-memory-client');
const OpenAI = require('openai');
const readline = require('readline');
const crypto = require('crypto');

// How many long-term memories to inject as relevant background each turn.
const MAX_LONG_TERM_RESULTS = 5;

class ${AgentClassName} {
    constructor(sessionId) {
        // Managed Agent Memory client. The service owns the vector index,
        // embeddings, and storage — this client just talks to its REST API.
        this.memory = new MemoryAPIClient({
            baseUrl: process.env.AGENT_MEMORY_URL,
            apiKey: process.env.AGENT_MEMORY_API_KEY,
            defaultNamespace: process.env.AGENT_MEMORY_NAMESPACE || 'default',
        });

        // Chat LLM. Uses the OpenAI SDK with a configurable base URL so any
        // OpenAI-compatible provider works.
        this.llm = new OpenAI({
            apiKey: process.env.LLM_API_KEY,
            baseURL: process.env.LLM_API_BASE_URL || '${CONFIG.models[formData.llmModel].baseUrl}',
        });
        this.model = process.env.LLM_MODEL || '${CONFIG.models[formData.llmModel].defaultModel}';

        // A session groups one conversation's working memory. Long-term memory
        // is shared across all of a user's sessions.
        this.sessionId = sessionId || `session-${crypto.randomBytes(6).toString('hex')}`;
    }

    // Semantic search over long-term memory for facts relevant to the query.
    async relevantMemories(query) {
        try {
            const results = await this.memory.searchLongTermMemory({ text: query });
            const memories = results.memories || results || [];
            return memories.slice(0, MAX_LONG_TERM_RESULTS).map(m => m.text || String(m));
        } catch (err) {
            console.error(`[memory] long-term search unavailable: ${err.message}`);
            return [];
        }
    }

    // Load working memory (recent messages) for short-term context.
    async recentTurns() {
        try {
            const working = await this.memory.getOrCreateWorkingMemory(this.sessionId);
            const messages = (working && working.messages) || [];
            return messages.map(m => ({
                role: String(m.role).toLowerCase().endsWith('assistant') ? 'assistant' : 'user',
                content: m.content,
            }));
        } catch (err) {
            console.error(`[memory] working memory unavailable: ${err.message}`);
            return [];
        }
    }

    async ask(userInput) {
        // 1. Pull relevant long-term facts and 2. recent conversation.
        const facts = await this.relevantMemories(userInput);
        const recent = await this.recentTurns();

        const systemPrompt =
            'You are a helpful assistant with persistent memory. ' +
            'Use the following remembered facts about the user when relevant. ' +
            'If nothing is relevant, answer normally.\n\n' +
            (facts.length
                ? 'Relevant memories:\n' + facts.map(f => `- ${f}`).join('\n')
                : 'Relevant memories: (none yet)');

        const messages = [
            { role: 'system', content: systemPrompt },
            ...recent,
            { role: 'user', content: userInput },
        ];

        // 3. Call the LLM.
        const response = await this.llm.chat.completions.create({ model: this.model, messages });
        const answer = response.choices[0].message.content;

        // 4. Append both turns to working memory. The service promotes durable
        // facts to long-term memory automatically.
        await this.memory.putWorkingMemory(this.sessionId, {
            messages: [
                ...recent,
                { role: 'user', content: userInput },
                { role: 'assistant', content: answer },
            ],
        });

        return answer;
    }
}

async function main() {
    const agent = new ${AgentClassName}();
    console.log('Redis Context Engine Agent — type "exit" to quit.');
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
