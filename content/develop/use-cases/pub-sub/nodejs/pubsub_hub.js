/**
 * Redis-backed pub/sub hub helper.
 *
 * Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection commands
 * (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small, named API
 * that:
 *
 *   - publishes JSON-encoded messages to a channel and counts how many
 *     subscribers Redis reported delivering to
 *   - creates named in-process subscribers that own a dedicated Redis
 *     connection and a listener callback for each delivered message
 *   - tracks per-channel publish counters and per-subscriber received
 *     counts for the demo UI
 *
 * Pub/sub has at-most-once delivery: a message that arrives while a
 * subscriber is disconnected is gone. If you need persistence or replay,
 * use Redis Streams instead.
 *
 * @module pubsub_hub
 */

"use strict";

/**
 * Message shape delivered to every Subscription listener. Pattern
 * subscriptions carry the original pattern in `pattern`; exact-match
 * subscriptions leave it null.
 */
class ReceivedMessage {
  constructor(channel, pattern, payload, receivedAtMs) {
    this.channel = channel;
    this.pattern = pattern;
    this.payload = payload;
    this.received_at_ms = receivedAtMs;
  }

  toJSON() {
    return {
      channel: this.channel,
      pattern: this.pattern,
      payload: this.payload,
      received_at_ms: this.received_at_ms,
    };
  }
}

/**
 * A named in-process subscriber bound to one or more channels or patterns.
 *
 * Each Subscription owns its own Redis connection (obtained by
 * `client.duplicate()`) and a listener that pumps incoming messages
 * into the per-subscriber ring buffer plus the optional `onMessage`
 * callback. Subscriptions are independent: closing one does not affect
 * another, even if they share channels.
 *
 * In node-redis 5.x, a client used for `subscribe`/`pSubscribe` is in
 * subscribe-only mode for the lifetime of those subscriptions, so we
 * cannot share a connection with the hub's regular command client.
 */
class Subscription {
  constructor(name, targets, isPattern, bufferSize = 50, onMessage = null) {
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error("Subscription requires at least one channel or pattern");
    }
    this.name = name;
    this.targets = [...targets];
    this.isPattern = isPattern;
    this.bufferSize = bufferSize;
    this._onMessage = onMessage;
    this._buffer = [];
    this._received = 0;
    this._closed = false;
    this._client = null;
    this._connected = false;
  }

  // Open the dedicated subscribe-mode connection and bind the targets.
  // Done as a separate step so callers can `await` connection failures
  // before the subscription is added to the hub registry.
  async _connect(hubClient) {
    this._client = hubClient.duplicate();
    // Swallow connection errors after close to avoid noisy unhandled
    // rejections when the hub is torn down.
    this._client.on("error", (err) => {
      if (!this._closed) {
        console.error(`[subscription:${this.name}] redis error:`, err.message);
      }
    });
    await this._client.connect();
    this._connected = true;

    const listener = (message, channel) => this._dispatch(message, channel);

    if (this.isPattern) {
      // pSubscribe's listener receives (message, channel) where channel
      // is the actual published channel; the matching pattern is the
      // first argument to `pSubscribe`. We bind one listener per target
      // so we can carry the matched pattern through to the buffer.
      for (const pattern of this.targets) {
        await this._client.pSubscribe(pattern, (message, channel) => {
          this._dispatch(message, channel, pattern);
        });
      }
    } else {
      for (const channel of this.targets) {
        await this._client.subscribe(channel, listener);
      }
    }
  }

  // Wrap the raw published payload as a ReceivedMessage and append it
  // to the per-subscriber buffer. The buffer is most-recent-first so
  // the UI can render it without reversing.
  _dispatch(rawMessage, channel, pattern = null) {
    let payload;
    try {
      payload = JSON.parse(rawMessage);
    } catch (_err) {
      payload = rawMessage;
    }
    const message = new ReceivedMessage(
      channel || "",
      pattern,
      payload,
      Date.now(),
    );
    this._buffer.unshift(message);
    if (this._buffer.length > this.bufferSize) {
      this._buffer.length = this.bufferSize;
    }
    this._received += 1;
    if (typeof this._onMessage === "function") {
      try {
        this._onMessage(message);
      } catch (_err) {
        // The callback is user-supplied; don't let it kill the
        // dispatch path or block the next message.
      }
    }
  }

  messages(limit = null) {
    const copy = this._buffer.slice();
    if (limit !== null && limit !== undefined) {
      return copy.slice(0, limit);
    }
    return copy;
  }

  receivedTotal() {
    return this._received;
  }

  resetReceived() {
    this._buffer = [];
    this._received = 0;
  }

  isAlive() {
    return !this._closed && this._connected;
  }

  async close() {
    if (this._closed) {
      return;
    }
    this._closed = true;
    if (this._client !== null) {
      try {
        if (this.isPattern) {
          await this._client.pUnsubscribe();
        } else {
          await this._client.unsubscribe();
        }
      } catch (_err) {
        // The connection may already be torn down; nothing to do.
      }
      try {
        await this._client.quit();
      } catch (_err) {
        try {
          await this._client.disconnect();
        } catch (_err2) {
          // Ignore — we're tearing down.
        }
      }
    }
    this._connected = false;
  }

  toJSON() {
    return {
      name: this.name,
      targets: [...this.targets],
      is_pattern: this.isPattern,
      received_total: this.receivedTotal(),
      alive: this.isAlive(),
    };
  }
}

/**
 * Publish/subscribe helper with publisher counters and subscriber registry.
 *
 * The hub keeps one regular client for PUBLISH and PUBSUB CHANNELS/NUMSUB/NUMPAT;
 * each Subscription opens its own duplicated connection because node-redis 5.x
 * puts a client into subscribe-only mode for the lifetime of any active
 * `subscribe`/`pSubscribe` binding.
 */
class RedisPubSubHub {
  constructor(redisClient, bufferSize = 50) {
    if (!redisClient) {
      throw new Error("RedisPubSubHub requires a connected redis client");
    }
    this.redis = redisClient;
    this.bufferSize = bufferSize;

    this._subscriptions = new Map();
    this._published_total = 0;
    this._delivered_total = 0;
    this._channel_published = new Map();
  }

  /**
   * Publish `message` to `channel` and return Redis' delivered count.
   *
   * `message` is JSON-encoded so callers can pass objects, arrays, or
   * scalars without converting on every call. The returned integer is
   * what Redis itself reports: the number of clients that were
   * subscribed (directly or via pattern) at the moment the message
   * was fanned out.
   */
  async publish(channel, message) {
    const payload = JSON.stringify(message);
    const delivered = Number(await this.redis.publish(channel, payload));
    this._published_total += 1;
    this._delivered_total += delivered;
    this._channel_published.set(
      channel,
      (this._channel_published.get(channel) || 0) + 1,
    );
    return delivered;
  }

  /** Register a named exact-match subscription on one or more channels. */
  async subscribe(name, channels, onMessage = null) {
    return this._register(name, channels, false, onMessage);
  }

  /** Register a named pattern subscription on one or more glob patterns. */
  async psubscribe(name, patterns, onMessage = null) {
    return this._register(name, patterns, true, onMessage);
  }

  async _register(name, targets, isPattern, onMessage) {
    if (this._subscriptions.has(name)) {
      throw new Error(`subscription named '${name}' already exists`);
    }
    const sub = new Subscription(
      name,
      targets,
      isPattern,
      this.bufferSize,
      onMessage,
    );
    await sub._connect(this.redis);
    this._subscriptions.set(name, sub);
    return sub;
  }

  /** Close and remove the named subscription. Returns true if it existed. */
  async unsubscribe(name) {
    const sub = this._subscriptions.get(name);
    if (sub === undefined) {
      return false;
    }
    this._subscriptions.delete(name);
    await sub.close();
    return true;
  }

  subscriptions() {
    return Array.from(this._subscriptions.values());
  }

  getSubscription(name) {
    return this._subscriptions.get(name) || null;
  }

  /** List server-side channels with at least one subscriber (PUBSUB CHANNELS). */
  async activeChannels(pattern = "*") {
    const channels = await this.redis.pubSubChannels(pattern);
    return channels.slice().sort();
  }

  /**
   * Count subscribers per channel (PUBSUB NUMSUB).
   *
   * Reports only exact-match subscriptions — pattern subscribers are
   * counted separately via `patternSubscriberCount()`.
   */
  async channelSubscriberCounts(channels) {
    if (!channels || channels.length === 0) {
      return {};
    }
    // node-redis 5.x returns a plain object: { "channel": count, ... }
    const result = await this.redis.pubSubNumSub(channels);
    const out = {};
    for (const channel of channels) {
      out[channel] = Number(result[channel] || 0);
    }
    return out;
  }

  /** Total active pattern subscriptions across all clients (PUBSUB NUMPAT). */
  async patternSubscriberCount() {
    return Number(await this.redis.pubSubNumPat());
  }

  /** Combined publish and subscribe counters plus the current registry size. */
  async stats() {
    const subs = this.subscriptions();
    const received_total = subs.reduce(
      (sum, s) => sum + s.receivedTotal(),
      0,
    );
    const channel_published = {};
    for (const [channel, count] of this._channel_published.entries()) {
      channel_published[channel] = count;
    }
    return {
      published_total: this._published_total,
      delivered_total: this._delivered_total,
      received_total,
      active_subscriptions: subs.length,
      channel_published,
      pattern_subscriptions: await this.patternSubscriberCount(),
    };
  }

  resetStats() {
    this._published_total = 0;
    this._delivered_total = 0;
    this._channel_published.clear();
    for (const sub of this.subscriptions()) {
      sub.resetReceived();
    }
  }

  /** Close every active subscription. Safe to call more than once. */
  async shutdown() {
    const subs = this.subscriptions();
    this._subscriptions.clear();
    await Promise.all(subs.map((s) => s.close()));
  }
}

module.exports = {
  RedisPubSubHub,
  Subscription,
  ReceivedMessage,
};
