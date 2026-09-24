// Append-only event log for an agent thread, backed by a Redis Stream.
//
// Each thread gets a stream at `agent:events:{threadId}`. Every
// action the agent takes (a user turn arriving, a memory being
// recalled, a memory being written, a tool being called) is one
// `XADD` to that stream. Replay with `XREVRANGE` for the most recent
// N events; bound retention with `XTRIM MAXLEN ~` so the log stays
// cheap regardless of how long the thread has been running.
//
// The stream is independent of the session hash (`sessionStore.js`)
// and the long-term memory store (`longTermMemory.js`): it answers
// the "what just happened" question without competing with either of
// those for indexing or memory budget. Consumer groups (not used in
// this demo) would let downstream workers — summarisers,
// consolidators, audit pipelines — replay the log without losing
// position.

// Approximate cap on stream length. `MAXLEN ~` lets Redis trim in
// whole-node units instead of exactly-N units, which is much cheaper
// at the cost of overshooting the bound by up to a node's worth.
export const DEFAULT_MAXLEN = 1000;

export class AgentEventLog {
  constructor({
    client,
    keyPrefix = 'agent:events:',
    maxLen = DEFAULT_MAXLEN,
  }) {
    this.client = client;
    this.keyPrefix = keyPrefix;
    this.maxLen = maxLen;
  }

  streamKey(threadId) {
    return `${this.keyPrefix}${threadId}`;
  }

  // Append one event and return its stream id.
  //
  // `MAXLEN ~ N` keeps the stream bounded with near-zero overhead;
  // an exact bound (`MAXLEN N` without the tilde) forces a scan and
  // is rarely worth the cost.
  async record(threadId, action, detail = '') {
    return await this.client.xAdd(
      this.streamKey(threadId),
      '*',
      {
        action,
        detail,
        ts: String(Date.now() / 1000),
      },
      {
        TRIM: {
          strategy: 'MAXLEN',
          strategyModifier: '~',
          threshold: this.maxLen,
        },
      },
    );
  }

  // Return the most recent events, newest first.
  async recent(threadId, count = 20) {
    const rows = await this.client.xRevRange(
      this.streamKey(threadId), '+', '-', { COUNT: count },
    );
    return rows.map(r => ({
      event_id: r.id,
      thread_id: threadId,
      action: r.message?.action ?? '',
      detail: r.message?.detail ?? '',
      ts: parseFloat(r.message?.ts ?? '0') || 0,
    }));
  }

  async length(threadId) {
    return await this.client.xLen(this.streamKey(threadId));
  }

  async clear(threadId) {
    return (await this.client.del(this.streamKey(threadId))) > 0;
  }
}
