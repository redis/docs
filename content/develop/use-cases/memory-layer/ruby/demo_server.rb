#!/usr/bin/env ruby
# frozen_string_literal: true

# Redis agent-memory demo server (Ruby).
#
# Run this file and visit http://localhost:8091 to drive a small
# agent-memory demo backed by Redis Hashes, JSON, Search, and
# Streams. The UI lets you:
#
#   * Type a turn as the user (or paste a goal). The server appends
#     the turn to the per-thread working-memory hash, embeds the
#     turn, recalls the top-k semantically nearest long-term
#     memories, optionally writes the turn back as a new memory with
#     write-time deduplication, and appends an event to the per-thread
#     stream.
#   * Watch the three memory tiers update in place: working memory in
#     one Hash, long-term memories as JSON documents under one index,
#     and the event log in one Stream.
#   * Switch user, namespace, kind, and recall threshold to see how
#     scoping changes which memories the agent sees.
#   * Inspect every long-term memory and drop individual memories to
#     simulate eviction.
#
# The server holds a single `LocalEmbedder`, one `AgentSession`, one
# `LongTermMemory`, and one `AgentEventLog` for the lifetime of the
# process. The first run downloads the ONNX-exported embedding model
# into the local Hugging Face cache; everything after is local.

require 'json'
require 'optparse'
require 'uri'
require 'webrick'

require 'redis'

$LOAD_PATH.unshift(File.expand_path('lib', __dir__))
require 'embeddings'
require 'event_log'
require 'long_term_memory'
require 'seed_memory'
require 'session_store'

module AgentMemory
  # AgentMemoryDemo owns the embedder, session store, long-term
  # memory, and event log for the lifetime of the process. The
  # handlers thread requests through `handle_turn` and the
  # seed / new-thread endpoints reuse it so there is only one
  # description of the demo lifecycle.
  class AgentMemoryDemo
    attr_reader :session_store, :memory, :event_log, :embedder
    attr_accessor :current_thread_id

    def initialize(session_store:, memory:, event_log:, embedder:,
                   default_user: 'default', default_namespace: 'default')
      @session_store = session_store
      @memory = memory
      @event_log = event_log
      @embedder = embedder
      @default_user = default_user
      @default_namespace = default_namespace
      @current_thread_id = session_store.new_thread_id
    end

    # `seed` / `new_thread` / `handle_turn` all touch
    # `current_thread_id` without coordination — see the walkthrough's
    # "Concurrency caveats" section. The demo is single-user in
    # practice, so the race never triggers; a multi-user agent would
    # carry the thread id on each request instead of holding it as
    # shared server state.

    def seed(user:, namespace:)
      @memory.clear
      @session_store.delete(@current_thread_id)
      @event_log.clear(@current_thread_id)
      written = SeedMemory.seed(
        @memory, @embedder,
        user: user, namespace: namespace, source_thread: 'seed'
      )
      @current_thread_id = @session_store.new_thread_id
      written
    end

    def new_thread(user:, namespace:)
      @event_log.clear(@current_thread_id)
      @current_thread_id = @session_store.new_thread_id
      @session_store.start(
        @current_thread_id, user: user, agent: 'demo-agent', goal: ''
      )
      @event_log.record(
        @current_thread_id, 'thread_started',
        "user=#{user} namespace=#{namespace}"
      )
      @current_thread_id
    end

    # One pass through the agent loop: append, recall, remember, log.
    #
    # The order matters. We embed once and reuse the vector for both
    # the recall and (if asked) the remember step — no point encoding
    # the same text twice. Recall runs *before* the remember write so
    # the agent doesn't see its own just-written turn echoed back as
    # a recalled memory.
    def handle_turn(text:, user:, namespace:, kind:, role:,
                    threshold:, action:)
      thread_id = @current_thread_id

      t0 = monotonic_ms
      vec = @embedder.encode_one(text)
      embed_ms = monotonic_ms - t0

      if action == 'goal'
        @session_store.set_goal(
          thread_id, text, user: user, agent: 'demo-agent'
        )
        session_action = 'goal_set'
      else
        @session_store.append_turn(
          thread_id, role: role, content: text,
          user: user, agent: 'demo-agent'
        )
        session_action = "turn_appended:#{role}"
      end

      t1 = monotonic_ms
      recalled = @memory.recall(
        vec,
        user: user, namespace: namespace, k: 5,
        distance_threshold: threshold
      )
      recall_ms = monotonic_ms - t1

      write_skipped = (kind == 'skip' || action == 'goal')
      write_result = nil
      write_ms = 0.0
      unless write_skipped
        t2 = monotonic_ms
        write_result = @memory.remember(
          text: text, embedding: vec,
          user: user, namespace: namespace,
          kind: kind, source_thread: thread_id
        )
        write_ms = monotonic_ms - t2
      end

      if write_result
        event_detail = write_result.deduped \
          ? "deduped onto #{write_result.id}" \
          : "wrote #{write_result.id} as #{kind}"
        @event_log.record(thread_id, session_action, event_detail)
      else
        @event_log.record(thread_id, session_action, '')
      end

      {
        thread_id: thread_id,
        write_skipped: write_skipped,
        memory_id: write_result&.id,
        deduped: write_result ? write_result.deduped : false,
        existing_distance: write_result&.existing_distance,
        kind: write_skipped ? nil : kind,
        recalled: recalled.map(&:to_h),
        embed_ms: embed_ms,
        recall_ms: recall_ms,
        write_ms: write_ms
      }
    end

    private

    def monotonic_ms
      Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
    end
  end

  # ----------------------------------------------------------------
  # HTTP plumbing
  # ----------------------------------------------------------------

  # Cap POST bodies so a runaway client (or, more realistically, a
  # `curl --data-binary @big-file` by mistake) cannot accumulate
  # unbounded memory before the handler runs. WEBrick has no
  # built-in cap, so each POST handler calls `body_too_large?`
  # before touching `req.body` and returns 413 if the request's
  # `Content-Length` exceeds the limit. The demo's largest
  # legitimate body is a few hundred bytes of form-encoded query
  # fields; 1 MiB matches the Python / Node / Go / Java / PHP caps.
  MAX_BODY_BYTES = 1 * 1024 * 1024

  def self.body_too_large?(req)
    req['Content-Length'].to_i > MAX_BODY_BYTES
  end

  # Sanitize the threshold parameter from the form body.
  # `Float()` happily handles "nan" → NaN and "inf" → +Inf. Either
  # would silently turn recall into "every memory" or "nothing".
  # Clamp to the meaningful cosine-distance range so a malformed POST
  # cannot override the threshold semantics. Falls back to the
  # configured `--recall-threshold` rather than a hard-coded constant
  # so the server-wide flag actually drives the default.
  def self.clamp_threshold(raw, fallback)
    return fallback if raw.nil? || raw.empty?
    parsed = Float(raw, exception: false)
    return fallback if parsed.nil? || !parsed.finite?
    [[parsed, 0.0].max, 2.0].min
  end

  # Build the response shape /state serves. The Python / Node /
  # other-language siblings serve the same shape so the shared HTML
  # works without modification.
  def self.build_state(deps, user:, namespace:)
    memory = deps.fetch(:memory)
    session_store = deps.fetch(:session_store)
    event_log = deps.fetch(:event_log)
    embedder = deps.fetch(:embedder)
    demo = deps.fetch(:demo)
    stack_label = deps.fetch(:stack_label)

    info = memory.index_info
    thread_id = demo.current_thread_id
    session = session_store.load(thread_id)
    memories = memory.list_memories(
      user: user, namespace: namespace, limit: 200
    )
    events = event_log.recent(thread_id, count: 20)
    {
      index: {
        num_docs: info[:num_docs],
        indexing_failures: info[:indexing_failures],
        index_name: memory.index_name,
        model: embedder.model_name,
        session_ttl_seconds: session_store.default_ttl_seconds,
        dedup_threshold: memory.dedup_threshold,
        default_recall_threshold: memory.recall_threshold,
        stack_label: stack_label
      },
      thread_id: thread_id,
      session: session&.to_h,
      memories: memories.map(&:to_h),
      events: events.map(&:to_h),
      # `recalled` is populated by /turn; on plain /state reads the
      # UI keeps showing the last turn's result, which is the useful
      # behavior for an "agent" panel.
      recalled: []
    }
  end

  # Parse a URL-encoded form body into a plain Hash<String, String>.
  def self.parse_form(body)
    URI.decode_www_form(body.to_s).to_h
  rescue ArgumentError
    {}
  end

  # Wrap every handler so an uncaught exception lands as a JSON 500
  # rather than letting WEBrick render a plain-text stack trace. The
  # demo's JS client always calls `await res.json()`, so a non-JSON
  # body would surface as an opaque parse error.
  def self.with_json_errors(response)
    yield
  rescue StandardError => e
    warn("[demo] handler error: #{e.class}: #{e.message}")
    warn(e.backtrace.first(8).join("\n"))
    response.status = 500
    response['Content-Type'] = 'application/json'
    response.body = JSON.generate(error: e.message, type: e.class.name)
  end

  def self.send_json(response, payload, status: 200)
    response.status = status
    response['Content-Type'] = 'application/json'
    response.body = JSON.generate(payload)
  end

  def self.send_html(response, html, status: 200)
    response.status = status
    response['Content-Type'] = 'text/html; charset=utf-8'
    response.body = html
  end

  def self.empty_or(value, default)
    value.nil? || value.empty? ? default : value
  end

  # ----------------------------------------------------------------
  # Handlers
  # ----------------------------------------------------------------

  def self.install_handlers(server, deps)
    memory = deps.fetch(:memory)
    demo = deps.fetch(:demo)
    html_page = deps.fetch(:html_page)
    recall_threshold = deps.fetch(:recall_threshold)

    server.mount_proc '/' do |req, res|
      with_json_errors(res) do
        if req.path != '/' && req.path != '/index.html'
          send_json(res, { error: 'not found' }, status: 404)
          next
        end
        if req.request_method != 'GET'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        send_html(res, html_page)
      end
    end

    server.mount_proc '/state' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'GET'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        query = req.query
        send_json(res, build_state(
          deps,
          user: empty_or(query['user'], 'default'),
          namespace: empty_or(query['namespace'], 'default')
        ))
      end
    end

    server.mount_proc '/turn' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, {
            error: "request body exceeds #{MAX_BODY_BYTES} bytes"
          }, status: 413)
          next
        end
        params = parse_form(req.body)
        text = (params['text'] || '').strip
        if text.empty?
          send_json(res, { error: 'text is required' }, status: 400)
          next
        end
        payload = demo.handle_turn(
          text: text,
          user: empty_or(params['user'], 'default'),
          namespace: empty_or(params['namespace'], 'default'),
          kind: empty_or(params['kind'], 'episodic'),
          role: empty_or(params['role'], 'user'),
          threshold: clamp_threshold(params['threshold'], recall_threshold),
          action: empty_or(params['action'], 'turn')
        )
        send_json(res, payload)
      end
    end

    server.mount_proc '/new_thread' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, {
            error: "request body exceeds #{MAX_BODY_BYTES} bytes"
          }, status: 413)
          next
        end
        params = parse_form(req.body)
        thread_id = demo.new_thread(
          user: empty_or(params['user'], 'default'),
          namespace: empty_or(params['namespace'], 'default')
        )
        send_json(res, { thread_id: thread_id })
      end
    end

    server.mount_proc '/reset' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, {
            error: "request body exceeds #{MAX_BODY_BYTES} bytes"
          }, status: 413)
          next
        end
        params = parse_form(req.body)
        seeded = demo.seed(
          user: empty_or(params['user'], 'default'),
          namespace: empty_or(params['namespace'], 'default')
        )
        send_json(res, { seeded: seeded })
      end
    end

    server.mount_proc '/drop_memory' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, {
            error: "request body exceeds #{MAX_BODY_BYTES} bytes"
          }, status: 413)
          next
        end
        params = parse_form(req.body)
        memory_id = (params['memory_id'] || '').strip
        if memory_id.empty?
          send_json(res, { error: 'memory_id is required' }, status: 400)
          next
        end
        deleted = memory.delete_memory(memory_id)
        send_json(res, { deleted: deleted, memory_id: memory_id })
      end
    end
  end

  # ----------------------------------------------------------------
  # Main
  # ----------------------------------------------------------------

  def self.parse_flags(argv)
    options = {
      host: '127.0.0.1',
      port: 8091,
      redis_host: 'localhost',
      redis_port: 6379,
      mem_index_name: 'agentmem:idx',
      mem_key_prefix: 'agent:mem:',
      session_key_prefix: 'agent:session:',
      event_key_prefix: 'agent:events:',
      session_ttl_seconds: 3600,
      dedup_threshold: DEFAULT_DEDUP_THRESHOLD,
      recall_threshold: DEFAULT_RECALL_THRESHOLD,
      no_reset: false
    }
    OptionParser.new do |opts|
      opts.banner = 'Usage: ruby demo_server.rb [options]'
      opts.on('--host HOST', 'Interface to bind to') { |v| options[:host] = v }
      opts.on('--port PORT', Integer, 'HTTP port') { |v| options[:port] = v }
      opts.on('--redis-host HOST', 'Redis host') { |v| options[:redis_host] = v }
      opts.on('--redis-port PORT', Integer, 'Redis port') { |v| options[:redis_port] = v }
      opts.on('--mem-index-name NAME', 'Memory index name') { |v| options[:mem_index_name] = v }
      opts.on('--mem-key-prefix PREFIX', 'JSON memory key prefix') { |v| options[:mem_key_prefix] = v }
      opts.on('--session-key-prefix PREFIX', 'Session hash key prefix') { |v| options[:session_key_prefix] = v }
      opts.on('--event-key-prefix PREFIX', 'Event stream key prefix') { |v| options[:event_key_prefix] = v }
      opts.on('--session-ttl-seconds N', Integer, 'Working-memory TTL') { |v| options[:session_ttl_seconds] = v }
      opts.on('--dedup-threshold F', Float, 'Dedup cosine-distance cutoff') { |v| options[:dedup_threshold] = v }
      opts.on('--recall-threshold F', Float, 'Recall cosine-distance cutoff') { |v| options[:recall_threshold] = v }
      opts.on('--no-reset', 'Keep existing memories on startup') { options[:no_reset] = true }
    end.parse!(argv)
    options
  end

  def self.run!(argv = ARGV)
    args = parse_flags(argv)

    client = Redis.new(host: args[:redis_host], port: args[:redis_port])
    begin
      client.ping
    rescue StandardError => e
      warn("Error: cannot reach Redis at #{args[:redis_host]}:#{args[:redis_port]}")
      warn("  (#{e.message})")
      exit 1
    end

    session_store = AgentSession.new(
      redis_client: client,
      key_prefix: args[:session_key_prefix],
      default_ttl_seconds: args[:session_ttl_seconds]
    )
    memory = LongTermMemory.new(
      redis_client: client,
      index_name: args[:mem_index_name],
      key_prefix: args[:mem_key_prefix],
      dedup_threshold: args[:dedup_threshold],
      recall_threshold: args[:recall_threshold]
    )
    memory.create_index
    event_log = AgentEventLog.new(
      redis_client: client,
      key_prefix: args[:event_key_prefix]
    )

    puts 'Loading embedding model (first run downloads the ONNX weights)...'
    embedder = LocalEmbedder.new

    demo = AgentMemoryDemo.new(
      session_store: session_store, memory: memory,
      event_log: event_log, embedder: embedder
    )

    unless args[:no_reset]
      puts "Dropping any existing memories under '#{args[:mem_key_prefix]}*' " \
           "and re-seeding from the sample memory list (pass --no-reset to keep)."
      seeded = demo.seed(user: 'default', namespace: 'default')
      puts "Seeded #{seeded} memories."
    end

    # Load the HTML once and replace the template tokens with the
    # configured key prefixes and index name so the lede shows the
    # actual values in use rather than the default copies.
    raw_html = File.read(File.expand_path('index.html', __dir__))
    html_page = raw_html
                .gsub('__SESSION_PREFIX__', args[:session_key_prefix])
                .gsub('__MEM_PREFIX__', args[:mem_key_prefix])
                .gsub('__MEM_INDEX__', args[:mem_index_name])
                .gsub('__EVENT_PREFIX__', args[:event_key_prefix])

    stack_label = 'redis-rb + informers + WEBrick'

    # WEBrick: turn down access logging so the console isn't a flood
    # of GET / lines while the demo is running.
    server = WEBrick::HTTPServer.new(
      BindAddress: args[:host],
      Port: args[:port],
      Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
      AccessLog: []
    )

    install_handlers(server, {
                       session_store: session_store,
                       memory: memory,
                       event_log: event_log,
                       embedder: embedder,
                       demo: demo,
                       html_page: html_page,
                       stack_label: stack_label,
                       recall_threshold: args[:recall_threshold]
                     })

    trap('INT')  { server.shutdown }
    trap('TERM') { server.shutdown }

    puts "Redis agent memory demo listening on http://#{args[:host]}:#{args[:port]}"
    puts "Using Redis at #{args[:redis_host]}:#{args[:redis_port]} " \
         "with memory index '#{args[:mem_index_name]}'"
    server.start
  ensure
    client&.close
  end
end

AgentMemory.run! if $PROGRAM_NAME == __FILE__
