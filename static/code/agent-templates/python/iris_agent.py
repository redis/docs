'''
Redis Context Engine Agent (Redis Iris — Agent Memory)

A conversational agent whose memory is fully managed by the Redis Iris
Context Engine. Instead of building your own vector index, embeddings, and
session store, the agent calls the managed Agent Memory service:

Features:
- Session memory: every user and assistant turn is stored as a session event
- Long-term memory: the service automatically promotes important facts from
  session events; the agent searches them semantically each turn
- Cross-session recall: relevant facts follow the user across conversations
- No embeddings, vector index, or Redis schema to manage — the service does it

Each turn the agent:
  1. Searches long-term memory for facts relevant to the new message
  2. Loads recent session events for short-term conversational context
  3. Calls the LLM with that memory injected into the system prompt
  4. Writes the user and assistant messages back as session events
     (long-term facts are extracted and promoted automatically)

To run this code:
    Install dependencies:
        pip install redis-agent-memory openai

    Set environment variables (Agent Memory — from the Redis Cloud console):
        export AGENT_MEMORY_URL=your_agent_memory_base_url
        export STORE_ID=your_store_id
        export AGENT_MEMORY_API_KEY=your_agent_memory_api_key

    Set environment variables (LLM):
        export LLM_API_KEY=your_api_key_here
        export LLM_API_BASE_URL=your_${formData.llmModel.toLowerCase()}_api_base_url
            (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
        export LLM_MODEL=your_${formData.llmModel.toLowerCase()}_model
            (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})

    Note: this template uses the OpenAI SDK with a configurable base URL, so you
    can point it at any OpenAI-compatible chat provider. Agent memory is handled
    entirely by the managed Agent Memory service — see
    https://redis.io/docs/latest/develop/ai/context-engine/agent-memory/

    To create an Agent Memory service and get the values above, follow the
    Redis Cloud Agent Memory quickstart in the documentation.
'''

import os
import uuid
from datetime import datetime, timezone

import openai
from redis_agent_memory import AgentMemory, models

# How many recent session events to load for short-term context each turn.
MAX_SESSION_EVENTS = 12
# How many long-term memories to inject as relevant background each turn.
MAX_LONG_TERM_RESULTS = 5


class ${AgentClassName}:
    def __init__(self, session_id=None, actor_id='user'):
        # Managed Agent Memory client. The service owns the vector index,
        # embeddings, and storage — this client just talks to its REST API.
        self.memory = AgentMemory(
            os.environ['AGENT_MEMORY_URL'],
            store_id=os.environ['STORE_ID'],
            api_key=os.environ['AGENT_MEMORY_API_KEY'],
        )

        # Chat LLM. Uses the OpenAI SDK with a configurable base URL so any
        # OpenAI-compatible provider works.
        self.llm = openai.OpenAI(
            api_key=os.environ['LLM_API_KEY'],
            base_url=os.getenv('LLM_API_BASE_URL', '${CONFIG.models[formData.llmModel].baseUrl}'),
        )
        self.model = os.getenv('LLM_MODEL', '${CONFIG.models[formData.llmModel].defaultModel}')

        # A session groups the events of one conversation. Reuse the same
        # session_id to continue a conversation; long-term memory is shared
        # across all of a user's sessions.
        self.session_id = session_id or f'session-{uuid.uuid4().hex[:12]}'
        self.actor_id = actor_id

    def _relevant_memories(self, query):
        '''Semantic search over long-term memory for facts relevant to the query.'''
        try:
            results = self.memory.search_long_term_memory(request={'text': query})
        except Exception as e:
            print(f'[memory] long-term search unavailable: {e}')
            return []

        # Matching records come back in `.items`; each record exposes its `.text`.
        items = getattr(results, 'items', []) or []
        return [item.text for item in items[:MAX_LONG_TERM_RESULTS]]

    def _recent_turns(self):
        '''Load recent session events for short-term conversational context.'''
        try:
            session = self.memory.get_session_memory(session_id=self.session_id)
        except Exception:
            return []

        events = getattr(session, 'events', []) or []
        turns = []
        for event in events[-MAX_SESSION_EVENTS:]:
            role = getattr(event, 'role', 'USER')
            content = getattr(event, 'content', []) or []
            # Content parts are Content model objects (or dicts); read either.
            text = ' '.join(
                getattr(part, 'text', None) or (part.get('text', '') if isinstance(part, dict) else '')
                for part in content
            )
            turns.append({
                'role': 'assistant' if str(role).upper().endswith('ASSISTANT') else 'user',
                'content': text,
            })
        return turns

    def _record(self, role, text):
        '''Persist one turn as a session event. Long-term promotion is automatic.'''
        self.memory.add_session_event(
            actor_id=self.actor_id,
            role=role,
            content=[{'text': text}],
            created_at=datetime.now(timezone.utc),
            session_id=self.session_id,
        )

    def ask(self, user_input):
        # 1. Pull relevant long-term facts and 2. recent conversation.
        facts = self._relevant_memories(user_input)
        recent = self._recent_turns()

        system_prompt = (
            'You are a helpful assistant with persistent memory. '
            'Use the following remembered facts about the user when relevant. '
            'If nothing is relevant, answer normally.\n\n'
            + ('Relevant memories:\n' + '\n'.join(f'- {f}' for f in facts)
               if facts else 'Relevant memories: (none yet)')
        )

        messages = [{'role': 'system', 'content': system_prompt}]
        messages.extend(recent)
        messages.append({'role': 'user', 'content': user_input})

        # 3. Call the LLM.
        response = self.llm.chat.completions.create(model=self.model, messages=messages)
        answer = response.choices[0].message.content

        # 4. Write both turns back to session memory.
        self._record(models.MessageRole.USER, user_input)
        self._record(models.MessageRole.ASSISTANT, answer)

        return answer


def main():
    agent = ${AgentClassName}()
    print('Redis Context Engine Agent — type "exit" to quit.')
    print(f'Session: {agent.session_id}\n')
    while True:
        try:
            user_input = input('You: ').strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not user_input or user_input.lower() in ('exit', 'quit'):
            break
        print(f'Agent: {agent.ask(user_input)}\n')


if __name__ == '__main__':
    main()
