# frozen_string_literal: true

# Redis-backed pub/sub hub helper.
#
# Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection
# commands (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a
# small, named API that:
#
# * publishes JSON-encoded messages to a channel and counts how many
#   subscribers Redis reported delivering to
# * creates named in-process subscribers, each with its own Redis
#   connection and a background thread that pumps incoming messages
#   into a callback
# * tracks per-channel publish counters and per-subscriber received
#   counts for the demo UI
#
# Pub/sub has at-most-once delivery: a message that arrives while a
# subscriber is disconnected is gone. If you need persistence or
# replay, use Redis Streams instead.
#
# Ruby specifics
# --------------
# In redis-rb 5.x, `Redis#subscribe` (and `psubscribe`) blocks the
# calling thread *and* monopolises the connection. The Subscription
# class spawns one Thread per subscriber, each with its own Redis
# client. To tear down a subscription cleanly, the helper calls
# `unsubscribe` (or `punsubscribe`) on the same Redis client from the
# main thread — redis-rb forwards the command down the open
# subscriber connection, the subscribe block returns, and the worker
# thread exits without a sentinel message or a forced kill.

require 'json'
require 'redis'
require 'thread'

module PubSubHub
  # Message shape delivered to every Subscription callback. Pattern
  # subscriptions carry the original pattern in `pattern`; exact-match
  # subscriptions leave it nil.
  class ReceivedMessage
    attr_reader :channel, :pattern, :payload, :received_at_ms

    def initialize(channel:, pattern:, payload:, received_at_ms:)
      @channel = channel
      @pattern = pattern
      @payload = payload
      @received_at_ms = received_at_ms
    end

    def to_h
      {
        'channel' => @channel,
        'pattern' => @pattern,
        'payload' => @payload,
        'received_at_ms' => @received_at_ms
      }
    end
  end

  # A named in-process subscriber bound to one or more channels or
  # patterns. Each Subscription owns its own Redis client (and
  # therefore its own connection) and a background thread that pumps
  # incoming messages into the registered callback.
  class Subscription
    attr_reader :name, :targets

    def initialize(name:, hub:, targets:, is_pattern:, on_message: nil,
                   buffer_size: 50, redis_options: {})
      raise ArgumentError, 'Subscription requires at least one channel or pattern' if targets.nil? || targets.empty?

      @name = name
      @hub = hub
      @targets = targets.dup.freeze
      @is_pattern = is_pattern
      @on_message = on_message
      @buffer_size = buffer_size
      @buffer = []
      @lock = Mutex.new
      @received = 0
      @closed = false

      # Each Subscription gets its own Redis client. Sharing one across
      # subscribers would couple their lifetimes — closing one would
      # close the subscriber connection for the others.
      @redis = Redis.new(redis_options)

      # ready_latch lets the caller wait until SUBSCRIBE/PSUBSCRIBE has
      # actually been acknowledged by the server before publishing,
      # so the very first message can't race the subscription handshake.
      @ready_latch = Queue.new
      @thread = Thread.new { run }
      # Block until the first subscribe acknowledgement arrives. The
      # worker pushes `true` on a successful SUBSCRIBE/PSUBSCRIBE ack
      # and `false` if it errored before getting an ack — surface the
      # failure here instead of registering a dead subscription.
      ack = @ready_latch.pop
      unless ack
        begin
          @redis.close
        rescue StandardError
          # ignore — we're already aborting
        end
        raise "subscribe acknowledgement did not arrive for '#{@name}'"
      end
    end

    def is_pattern?
      @is_pattern
    end

    # Alias kept so callers can read either spelling.
    def is_pattern
      @is_pattern
    end

    def received_total
      @lock.synchronize { @received }
    end

    def messages(limit = nil)
      copy = @lock.synchronize { @buffer.dup }
      limit ? copy.first(limit) : copy
    end

    def reset_received
      @lock.synchronize do
        @buffer.clear
        @received = 0
      end
    end

    # Tear the subscription down by asking the server to unsubscribe
    # us. redis-rb sends the command down the same connection the
    # subscribe loop is reading from, so the subscribe block returns
    # naturally and the worker thread exits. After the join, close the
    # Redis client.
    def close
      return if @closed

      @closed = true
      begin
        if @is_pattern
          @redis.punsubscribe
        else
          @redis.unsubscribe
        end
      rescue StandardError
        # If the connection is already gone (e.g. server bounced), the
        # worker thread is on its way out anyway.
      end

      @thread.join(2)
      # If the worker is still stuck (rare), drop the connection
      # under it so the blocking read returns and the thread exits.
      if @thread.alive?
        begin
          @redis.close
        rescue StandardError
          # ignore
        end
        @thread.join(1)
        @thread.kill if @thread.alive?
      end

      begin
        @redis.close
      rescue StandardError
        # ignore
      end
    end

    def alive?
      !@closed && @thread.alive?
    end

    def to_h
      {
        'name' => @name,
        'targets' => @targets.to_a,
        'is_pattern' => @is_pattern,
        'received_total' => received_total,
        'alive' => alive?
      }
    end

    private

    def run
      if @is_pattern
        @redis.psubscribe(*@targets) do |on|
          on.psubscribe { |_pattern, _count| @ready_latch.push(true) }
          on.pmessage do |pattern, channel, raw|
            dispatch(channel: channel, pattern: pattern, raw: raw)
          end
          on.punsubscribe { |_pattern, _count| }
        end
      else
        @redis.subscribe(*@targets) do |on|
          on.subscribe { |_channel, _count| @ready_latch.push(true) }
          on.message do |channel, raw|
            dispatch(channel: channel, pattern: nil, raw: raw)
          end
          on.unsubscribe { |_channel, _count| }
        end
      end
    rescue StandardError
      # Make sure the constructor doesn't block forever if subscribe
      # blew up before its first ack.
      @ready_latch.push(false) if @ready_latch.empty?
    ensure
      # In case `close` wasn't called, mark the subscription closed
      # so #alive? reports correctly.
      @closed = true
    end

    def dispatch(channel:, pattern:, raw:)
      payload =
        begin
          JSON.parse(raw)
        rescue JSON::ParserError, TypeError
          raw
        end
      message = ReceivedMessage.new(
        channel: channel || '',
        pattern: pattern,
        payload: payload,
        received_at_ms: (Time.now.to_f * 1000).to_i
      )
      @lock.synchronize do
        @buffer.unshift(message)
        @buffer.pop while @buffer.length > @buffer_size
        @received += 1
      end
      if @on_message
        begin
          @on_message.call(message)
        rescue StandardError
          # User-supplied callback; don't let it kill the dispatch
          # thread or block the next message.
        end
      end
    end
  end

  # Publish/subscribe helper with publisher counters and subscriber
  # registry.
  class RedisPubSubHub
    attr_reader :redis

    def initialize(redis_client: nil, buffer_size: 50, redis_options: nil)
      @redis_options = redis_options || { host: 'localhost', port: 6379 }
      # Plain (non-subscriber) client for PUBLISH and PUBSUB
      # introspection commands.
      @redis = redis_client || Redis.new(@redis_options)
      @buffer_size = buffer_size

      @subs_lock = Mutex.new
      @subscriptions = {}

      @stats_lock = Mutex.new
      @published_total = 0
      @delivered_total = 0
      @channel_published = Hash.new(0)
    end

    # Publish a message to a channel. The body is JSON-encoded so
    # callers can pass hashes, arrays, or scalars without converting
    # on every call. The return value is what Redis itself reports:
    # the number of clients that were subscribed (directly or via
    # pattern) at the moment the message was fanned out.
    def publish(channel, message)
      payload = JSON.generate(message)
      delivered = @redis.publish(channel, payload).to_i
      @stats_lock.synchronize do
        @published_total += 1
        @delivered_total += delivered
        @channel_published[channel] += 1
      end
      delivered
    end

    def subscribe(name:, channels:, on_message: nil)
      register(name: name, targets: channels, is_pattern: false, on_message: on_message)
    end

    def psubscribe(name:, patterns:, on_message: nil)
      register(name: name, targets: patterns, is_pattern: true, on_message: on_message)
    end

    def unsubscribe(name)
      sub = @subs_lock.synchronize { @subscriptions.delete(name) }
      return false unless sub

      sub.close
      true
    end

    def subscriptions
      @subs_lock.synchronize { @subscriptions.values.dup }
    end

    def get_subscription(name)
      @subs_lock.synchronize { @subscriptions[name] }
    end

    # PUBSUB CHANNELS — list server-side channels with at least one
    # exact-match subscriber. Pattern subscribers are counted
    # separately via #pattern_subscriber_count.
    def active_channels(pattern = '*')
      result = @redis.pubsub('channels', pattern)
      Array(result).map(&:to_s).sort
    end

    # PUBSUB NUMSUB — subscriber count per channel. Returns an alternating
    # [channel, count, channel, count, ...] array in redis-rb; flatten it
    # into a hash keyed by channel name.
    def channel_subscriber_counts(channels)
      return {} if channels.nil? || channels.empty?

      flat = @redis.pubsub('numsub', *channels)
      result = {}
      Array(flat).each_slice(2) do |ch, count|
        result[ch.to_s] = count.to_i
      end
      result
    end

    # PUBSUB NUMPAT — server-wide active pattern subscription count.
    def pattern_subscriber_count
      @redis.pubsub('numpat').to_i
    end

    def stats
      published_total, delivered_total, channel_published =
        @stats_lock.synchronize do
          [@published_total, @delivered_total, @channel_published.dup]
        end
      subs = subscriptions
      received_total = subs.sum(&:received_total)
      {
        'published_total' => published_total,
        'delivered_total' => delivered_total,
        'received_total' => received_total,
        'active_subscriptions' => subs.length,
        'channel_published' => channel_published,
        'pattern_subscriptions' => pattern_subscriber_count
      }
    end

    def reset_stats
      @stats_lock.synchronize do
        @published_total = 0
        @delivered_total = 0
        @channel_published.clear
      end
      subscriptions.each(&:reset_received)
    end

    # Close every active subscription. Safe to call more than once.
    def shutdown
      subs = @subs_lock.synchronize do
        all = @subscriptions.values
        @subscriptions.clear
        all
      end
      subs.each(&:close)
    end

    private

    def register(name:, targets:, is_pattern:, on_message:)
      @subs_lock.synchronize do
        raise ArgumentError, "subscription named '#{name}' already exists" if @subscriptions.key?(name)

        sub = Subscription.new(
          name: name,
          hub: self,
          targets: targets,
          is_pattern: is_pattern,
          on_message: on_message,
          buffer_size: @buffer_size,
          redis_options: @redis_options
        )
        @subscriptions[name] = sub
        sub
      end
    end
  end
end
