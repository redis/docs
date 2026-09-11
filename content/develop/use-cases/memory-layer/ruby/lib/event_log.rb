# Append-only event log for an agent thread, backed by a Redis Stream.
#
# Each thread gets a stream at `agent:events:{thread_id}`. Every
# action the agent takes (a user turn arriving, a memory being
# recalled, a memory being written, a tool being called) is one
# `XADD` to that stream. Replay with `XREVRANGE` for the most recent
# N events; bound retention with `XADD MAXLEN ~` so the log stays
# cheap regardless of how long the thread has been running.
#
# The stream is independent of the session Hash (`session_store.rb`)
# and the long-term memory store (`long_term_memory.rb`): it answers
# the "what just happened" question without competing with either of
# those for indexing or memory budget. Consumer groups (not used in
# this demo) would let downstream workers — summarizers,
# consolidators, audit pipelines — replay the log without losing
# position.

require 'redis'

module AgentMemory
  # Approximate cap on stream length. `MAXLEN ~` lets Redis trim in
  # whole-node units instead of exactly-N units, which is much
  # cheaper at the cost of overshooting the bound by up to a node's
  # worth.
  DEFAULT_MAXLEN = 1000

  AgentEvent = Struct.new(
    :event_id, :thread_id, :action, :detail, :ts,
    keyword_init: true
  ) do
    def to_h
      {
        event_id: event_id,
        thread_id: thread_id,
        action: action,
        detail: detail,
        ts: ts
      }
    end
  end

  class AgentEventLog
    attr_reader :redis, :key_prefix, :max_len

    def initialize(redis_client: nil,
                   key_prefix: 'agent:events:',
                   max_len: DEFAULT_MAXLEN)
      @redis = redis_client || Redis.new(host: 'localhost', port: 6379)
      @key_prefix = key_prefix
      @max_len = max_len
    end

    def stream_key(thread_id)
      "#{@key_prefix}#{thread_id}"
    end

    # Append one event and return its stream id.
    #
    # `MAXLEN ~ N` keeps the stream bounded with near-zero overhead;
    # an exact bound (`MAXLEN N` without the tilde) forces a scan
    # and is rarely worth the cost.
    def record(thread_id, action, detail = '')
      @redis.xadd(
        stream_key(thread_id),
        {
          'action' => action,
          'detail' => detail,
          'ts' => Time.now.to_f.to_s
        },
        approximate: true,
        maxlen: @max_len
      )
    end

    # Return the most recent events, newest first.
    def recent(thread_id, count: 20)
      rows = @redis.xrevrange(stream_key(thread_id), count: count)
      rows.map do |entry_id, fields|
        AgentEvent.new(
          event_id: entry_id,
          thread_id: thread_id,
          action: fields['action'] || '',
          detail: fields['detail'] || '',
          ts: (fields['ts'] || '0').to_f
        )
      end
    end

    def length(thread_id)
      @redis.xlen(stream_key(thread_id))
    end

    def clear(thread_id)
      @redis.del(stream_key(thread_id)).positive?
    end
  end
end
