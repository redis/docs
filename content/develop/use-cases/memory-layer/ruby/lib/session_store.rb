# Working-memory store for an agent session, backed by a Redis Hash.
#
# Each session is one Hash document at `agent:session:{thread_id}`.
# The hash holds the running scratchpad, the current goal, a rolling
# window of recent turns (serialized as a JSON list to fit in one
# field), and a few audit fields. One `HGETALL` returns the whole
# session in a single round trip on every step of the agent loop.
#
# Every write refreshes the key's TTL with `EXPIRE`, so idle sessions
# fall off without a separate cleanup job and active sessions stay
# alive as long as the agent keeps touching them. A separate
# `LongTermMemory` (see `long_term_memory.rb`) is what survives beyond
# a session's TTL.
#
# The turn window is bounded to `max_turns` in application code; the
# hash itself doesn't grow, so the working set per thread stays
# constant regardless of how long the agent has been running.

require 'json'
require 'redis'
require 'securerandom'

module AgentMemory
  MAX_TURNS = 20

  # Loaded session state. `recent_turns` is an Array of Hashes
  # (`role`, `content`, `ts`). `ttl_seconds` is the remaining lifetime
  # at load time; `0` means no TTL or already expired.
  SessionState = Struct.new(
    :thread_id, :user, :agent, :goal, :scratchpad,
    :turn_count, :created_ts, :last_active_ts,
    :recent_turns, :ttl_seconds, keyword_init: true
  ) do
    def to_h
      {
        thread_id: thread_id,
        user: user,
        agent: agent,
        goal: goal,
        scratchpad: scratchpad,
        turn_count: turn_count,
        created_ts: created_ts,
        last_active_ts: last_active_ts,
        recent_turns: recent_turns,
        ttl_seconds: ttl_seconds
      }
    end
  end

  class AgentSession
    attr_reader :redis, :key_prefix, :default_ttl_seconds, :max_turns

    def initialize(redis_client: nil,
                   key_prefix: 'agent:session:',
                   default_ttl_seconds: 3600,
                   max_turns: MAX_TURNS)
      @redis = redis_client || Redis.new(host: 'localhost', port: 6379)
      @key_prefix = key_prefix
      @default_ttl_seconds = default_ttl_seconds
      @max_turns = max_turns
    end

    def session_key(thread_id)
      "#{@key_prefix}#{thread_id}"
    end

    def new_thread_id
      SecureRandom.hex(6) # 12 hex chars, matches sibling demos
    end

    # Create a fresh working memory for a thread. Overwrites any
    # existing session at the same key. The agent normally calls this
    # once per thread at the first turn and relies on `load` /
    # `append_turn` for subsequent steps.
    def start(thread_id, user: 'default', agent: 'default',
              goal: '', ttl_seconds: nil)
      ttl = ttl_seconds || @default_ttl_seconds
      now = Time.now.to_f
      state = SessionState.new(
        thread_id: thread_id,
        user: user, agent: agent,
        goal: goal, scratchpad: '',
        turn_count: 0,
        created_ts: now, last_active_ts: now,
        recent_turns: [],
        ttl_seconds: ttl
      )
      write_state(state, ttl)
      state
    end

    # Return the session state, or `nil` if it has expired.
    def load(thread_id)
      key = session_key(thread_id)
      raw = @redis.hgetall(key)
      return nil if raw.nil? || raw.empty?
      ttl = @redis.ttl(key)
      turns_blob = raw['recent_turns'] || '[]'
      turns = begin
        JSON.parse(turns_blob)
      rescue JSON::ParserError
        []
      end
      SessionState.new(
        thread_id: thread_id,
        user: raw['user'] || 'default',
        agent: raw['agent'] || 'default',
        goal: raw['goal'] || '',
        scratchpad: raw['scratchpad'] || '',
        turn_count: (raw['turn_count'] || '0').to_i,
        created_ts: (raw['created_ts'] || '0').to_f,
        last_active_ts: (raw['last_active_ts'] || '0').to_f,
        recent_turns: turns,
        ttl_seconds: ttl && ttl.positive? ? ttl.to_i : 0
      )
    end

    # Append a turn, bound the rolling window, refresh the TTL.
    #
    # `user` and `agent` are only consulted when the session does not
    # yet exist — they seed the auto-created session so the
    # working-memory hash matches the user the caller is operating
    # against. On an existing session they're ignored; the original
    # `start` values stand.
    #
    # Read-modify-write here is last-writer-wins on the turn list if
    # two concurrent turns reach the same thread; the demo never
    # triggers that race in practice (one browser, one turn at a
    # time) but a multi-worker agent that shares a thread id would
    # wrap this in `WATCH` / `MULTI` / `EXEC` or a Lua script that
    # does the append atomically server-side.
    def append_turn(thread_id, role:, content:,
                    user: nil, agent: nil, ttl_seconds: nil)
      state = load(thread_id)
      if state.nil?
        state = start(
          thread_id,
          user: user || 'default',
          agent: agent || 'default',
          ttl_seconds: ttl_seconds
        )
      end
      state.recent_turns << {
        'role' => role,
        'content' => content,
        'ts' => Time.now.to_f
      }
      if state.recent_turns.length > @max_turns
        state.recent_turns = state.recent_turns.last(@max_turns)
      end
      state.turn_count += 1
      state.last_active_ts = Time.now.to_f
      ttl = ttl_seconds || @default_ttl_seconds
      state.ttl_seconds = ttl
      write_state(state, ttl)
      state
    end

    # Update the agent's running scratchpad and refresh TTL.
    def set_scratchpad(thread_id, text, ttl_seconds: nil)
      state = load(thread_id)
      return nil if state.nil?
      state.scratchpad = text
      state.last_active_ts = Time.now.to_f
      ttl = ttl_seconds || @default_ttl_seconds
      state.ttl_seconds = ttl
      write_state(state, ttl)
      state
    end

    # Update the goal field without touching turns or the scratchpad.
    #
    # Creates the session if it doesn't exist yet — setting a goal on
    # a fresh thread is a sensible first step in the agent loop, so
    # this method covers both the "rename the goal mid-session" and
    # the "start a thread with this goal" cases.
    def set_goal(thread_id, text,
                 user: nil, agent: nil, ttl_seconds: nil)
      state = load(thread_id)
      if state.nil?
        return start(
          thread_id,
          user: user || 'default',
          agent: agent || 'default',
          goal: text,
          ttl_seconds: ttl_seconds
        )
      end
      state.goal = text
      state.last_active_ts = Time.now.to_f
      ttl = ttl_seconds || @default_ttl_seconds
      state.ttl_seconds = ttl
      write_state(state, ttl)
      state
    end

    # Drop the session immediately. Returns `true` if it existed.
    def delete(thread_id)
      @redis.del(session_key(thread_id)).positive?
    end

    # Return active thread ids under this prefix (for a multi-thread
    # switcher UI). `SCAN` is used so a busy instance with many other
    # keys isn't blocked by a full `KEYS` sweep.
    def list_threads(limit: 100)
      out = []
      cursor = '0'
      loop do
        cursor, keys = @redis.scan(cursor, match: "#{@key_prefix}*", count: 200)
        keys.each do |key|
          out << (key.start_with?(@key_prefix) ? key[@key_prefix.length..] : key)
          return out if out.length >= limit
        end
        break if cursor == '0'
      end
      out
    end

    private

    def write_state(state, ttl)
      key = session_key(state.thread_id)
      mapping = {
        'thread_id' => state.thread_id,
        'user' => state.user,
        'agent' => state.agent,
        'goal' => state.goal,
        'scratchpad' => state.scratchpad,
        'turn_count' => state.turn_count.to_s,
        'created_ts' => state.created_ts.to_s,
        'last_active_ts' => state.last_active_ts.to_s,
        'recent_turns' => JSON.generate(state.recent_turns)
      }
      # MULTI/EXEC so HSET and EXPIRE either both apply or neither
      # does. A connection drop between the two writes would
      # otherwise leave the session without a TTL.
      @redis.multi do |m|
        m.hset(key, mapping)
        m.expire(key, ttl)
      end
    end
  end
end
