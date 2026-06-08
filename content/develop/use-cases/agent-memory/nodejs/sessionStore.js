// Working-memory store for an agent session, backed by a Redis Hash.
//
// Each session is one Hash document at `agent:session:{threadId}`.
// The hash holds the running scratchpad, the current goal, a rolling
// window of recent turns (serialised as a JSON list to fit in one
// field), and a few audit fields. One `HGETALL` returns the whole
// session in a single round trip on every step of the agent loop.
//
// Every write refreshes the key's TTL with `EXPIRE`, so idle sessions
// fall off without a separate cleanup job and active sessions stay
// alive as long as the agent keeps touching them. A separate
// `LongTermMemory` (see `longTermMemory.js`) is what survives beyond
// a session's TTL.
//
// The turn window is bounded to `maxTurns` in application code; the
// hash itself doesn't grow, so the working set per thread stays
// constant regardless of how long the agent has been running.

import { randomUUID } from 'node:crypto';

// How many recent turns to keep inline on the session hash. Older
// turns flow through the event log (see `eventLog.js`) and the
// long-term memory store (see `longTermMemory.js`).
export const MAX_TURNS = 20;

export class AgentSession {
  constructor({
    client,
    keyPrefix = 'agent:session:',
    defaultTtlSeconds = 3600,
    maxTurns = MAX_TURNS,
  }) {
    this.client = client;
    this.keyPrefix = keyPrefix;
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.maxTurns = maxTurns;
  }

  sessionKey(threadId) {
    return `${this.keyPrefix}${threadId}`;
  }

  newThreadId() {
    return randomUUID().replace(/-/g, '').slice(0, 12);
  }

  // Create a fresh working memory for a thread. Overwrites any
  // existing session at the same key. The agent normally calls this
  // once per thread at the first turn and relies on `load` /
  // `appendTurn` for subsequent steps.
  async start(threadId, {
    user = 'default',
    agent = 'default',
    goal = '',
    ttlSeconds,
  } = {}) {
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    const now = Date.now() / 1000;
    const state = {
      thread_id: threadId,
      user,
      agent,
      goal,
      scratchpad: '',
      turn_count: 0,
      created_ts: now,
      last_active_ts: now,
      recent_turns: [],
      ttl_seconds: ttl,
    };
    await this._write(state, ttl);
    return state;
  }

  // Return the session state, or `null` if it has expired.
  async load(threadId) {
    const key = this.sessionKey(threadId);
    const raw = await this.client.hGetAll(key);
    if (!raw || Object.keys(raw).length === 0) return null;
    const ttl = await this.client.ttl(key);
    let turns = [];
    try {
      turns = JSON.parse(raw.recent_turns || '[]');
    } catch {
      turns = [];
    }
    return {
      thread_id: threadId,
      user: raw.user || 'default',
      agent: raw.agent || 'default',
      goal: raw.goal || '',
      scratchpad: raw.scratchpad || '',
      turn_count: parseInt(raw.turn_count || '0', 10) || 0,
      created_ts: parseFloat(raw.created_ts || '0') || 0,
      last_active_ts: parseFloat(raw.last_active_ts || '0') || 0,
      recent_turns: turns,
      ttl_seconds: ttl > 0 ? ttl : 0,
    };
  }

  // Append a turn, bound the rolling window, refresh the TTL.
  //
  // Read-modify-write here is last-writer-wins on the turn list if
  // two concurrent turns reach the same thread; the demo never
  // triggers that race in practice (one browser, one turn at a
  // time) but a multi-worker agent that shares a thread id would
  // wrap this in `WATCH` / `MULTI` / `EXEC` or a Lua script that
  // does the append atomically server-side.
  async appendTurn(threadId, { role, content, ttlSeconds } = {}) {
    let state = await this.load(threadId);
    if (!state) state = await this.start(threadId, { ttlSeconds });
    state.recent_turns.push({ role, content, ts: Date.now() / 1000 });
    if (state.recent_turns.length > this.maxTurns) {
      state.recent_turns = state.recent_turns.slice(-this.maxTurns);
    }
    state.turn_count += 1;
    state.last_active_ts = Date.now() / 1000;
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    state.ttl_seconds = ttl;
    await this._write(state, ttl);
    return state;
  }

  async setScratchpad(threadId, text, ttlSeconds) {
    const state = await this.load(threadId);
    if (!state) return null;
    state.scratchpad = text;
    state.last_active_ts = Date.now() / 1000;
    const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlSeconds;
    state.ttl_seconds = ttl;
    await this._write(state, ttl);
    return state;
  }

  async delete(threadId) {
    return (await this.client.del(this.sessionKey(threadId))) > 0;
  }

  // Return active thread ids (for the demo's thread switcher).
  async listThreads(limit = 100) {
    const out = [];
    for await (const key of this.client.scanIterator({
      MATCH: `${this.keyPrefix}*`, COUNT: 200,
    })) {
      const threadId = String(key).slice(this.keyPrefix.length);
      out.push(threadId);
      if (out.length >= limit) break;
    }
    return out;
  }

  async _write(state, ttl) {
    const key = this.sessionKey(state.thread_id);
    const mapping = {
      thread_id: state.thread_id,
      user: state.user,
      agent: state.agent,
      goal: state.goal,
      scratchpad: state.scratchpad,
      turn_count: String(state.turn_count),
      created_ts: String(state.created_ts),
      last_active_ts: String(state.last_active_ts),
      recent_turns: JSON.stringify(state.recent_turns),
    };
    // MULTI / EXEC so HSET and EXPIRE either both apply or neither
    // does. A connection drop between the two writes would otherwise
    // leave the session without a TTL.
    await this.client.multi()
      .hSet(key, mapping)
      .expire(key, ttl)
      .exec();
  }
}
