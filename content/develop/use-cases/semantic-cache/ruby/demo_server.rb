#!/usr/bin/env ruby
# frozen_string_literal: true

# Redis semantic-cache demo server (Ruby).
#
# Run this file and visit http://localhost:8094 to drive a small
# semantic-cache demo backed by Redis Search. The UI lets you:
#
#   * Type a natural-language prompt and watch the cache decide hit or
#     miss. On a hit Redis returns the cached response in tens of
#     milliseconds and the demo LLM is not called at all; on a miss
#     the demo LLM "thinks" for ~1.5 s before answering and the new
#     prompt, response, and embedding are written back to Redis for
#     next time.
#   * Adjust the cosine-distance threshold to see how close a
#     paraphrase must be for the cache to serve it.
#   * Switch tenant, locale, or model version to see metadata isolation
#     in action — entries written under one tenant cannot be served to
#     another, because the TAG filter goes into the same `FT.SEARCH`
#     call as the KNN.
#   * Inspect every cached entry with TTL and hit count, and drop
#     individual entries to simulate eviction.
#
# The server holds a single `LocalEmbedder`, a single
# `RedisSemanticCache`, and a single `MockLLM` for the lifetime of the
# process. The first run downloads the embedding model into the local
# Hugging Face cache; everything after is local.

require 'json'
require 'optparse'
require 'webrick'
require 'cgi'

require 'redis'

$LOAD_PATH.unshift(File.expand_path('lib', __dir__))
require 'cache'
require 'embeddings'
require 'mock_llm'
require 'seed_cache'

module SemCache
  # SemanticCacheDemo owns the cache, embedder, and LLM for the
  # lifetime of the process. The handlers thread requests through
  # `run_query` and the seed / reset endpoints reuse `seed` so there
  # is only one description of the cache lifecycle.
  class SemanticCacheDemo
    attr_reader :cache, :embedder, :llm,
                :default_tenant, :default_locale

    def initialize(cache:, embedder:, llm:,
                   default_tenant: 'acme', default_locale: 'en')
      @cache = cache
      @embedder = embedder
      @llm = llm
      @default_tenant = default_tenant
      @default_locale = default_locale
    end

    # Drop everything in scope and pre-populate with FAQ entries.
    def seed
      @cache.clear
      SeedCache.seed(
        @cache, @embedder,
        tenant: @default_tenant,
        locale: @default_locale,
        model_version: @llm.model_version
      )
    end

    # The hot path: embed, look up, optionally call the LLM, cache.
    #
    # Timings are taken with Process::CLOCK_MONOTONIC around each
    # bounded step so the UI can display the embed / lookup / LLM
    # breakdown separately. The cache write on a miss is *not*
    # included in `total_ms` so the latency number reflects the
    # user-facing wait, not the background bookkeeping.
    def run_query(prompt:, tenant:, locale:, model_version:,
                  threshold:, lookup_only:)
      t0 = monotonic_ms
      query_vec = @embedder.encode_one(prompt)
      embed_ms = monotonic_ms - t0

      t1 = monotonic_ms
      result = @cache.lookup(
        query_vec,
        tenant: tenant, locale: locale, model_version: model_version,
        distance_threshold: threshold
      )
      lookup_ms = monotonic_ms - t1

      if result.is_a?(CacheHit)
        return {
          outcome: 'hit',
          response: result.response,
          entry_id: result.id,
          distance: result.distance,
          ttl_seconds: result.ttl_seconds,
          hit_count: result.hit_count,
          threshold: threshold,
          embed_ms: embed_ms,
          lookup_ms: lookup_ms,
          llm_ms: nil,
          total_ms: embed_ms + lookup_ms,
          tokens_avoided: estimate_response_tokens(result.prompt, result.response),
          ms_avoided: @llm.latency_ms
        }
      end

      # Miss path. In "lookup only" mode the demo reports the miss
      # without actually calling the LLM — useful for sweeping the
      # threshold against a fixed prompt to see where the cutoff would
      # fall without polluting the cache.
      if lookup_only
        return {
          outcome: 'miss',
          response: '(LLM not called in lookup-only mode)',
          nearest_distance: result.nearest_distance,
          threshold: threshold,
          wrote_entry_id: nil,
          embed_ms: embed_ms,
          lookup_ms: lookup_ms,
          llm_ms: nil,
          total_ms: embed_ms + lookup_ms
        }
      end

      t2 = monotonic_ms
      llm_response = @llm.complete(prompt)
      llm_ms = monotonic_ms - t2

      # Write the new entry back. The embedding is the same vector we
      # already used for the lookup — no need to re-encode.
      entry_id = @cache.put(
        prompt: prompt,
        response: llm_response.response,
        embedding: query_vec,
        tenant: tenant, locale: locale, model_version: model_version
      )

      {
        outcome: 'miss',
        response: llm_response.response,
        nearest_distance: result.nearest_distance,
        threshold: threshold,
        wrote_entry_id: entry_id,
        embed_ms: embed_ms,
        lookup_ms: lookup_ms,
        llm_ms: llm_ms,
        total_ms: embed_ms + lookup_ms + llm_ms
      }
    end

    private

    def monotonic_ms
      Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
    end

    def estimate_response_tokens(prompt, response)
      [((prompt.to_s.length + response.to_s.length) / 4), 1].max
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
  # fields; 1 MiB matches the Node / Go / Java caps.
  MAX_BODY_BYTES = 1 * 1024 * 1024

  # Check whether the request's Content-Length exceeds MAX_BODY_BYTES.
  # WEBrick fully buffers `req.body` before the handler runs, so
  # checking here only avoids unbounded *handler* work — the wire
  # bytes already arrived. For a docs demo bound to loopback that
  # is acceptable; a hardened deployment would put a reverse proxy
  # in front of the server with its own request-size limit.
  def self.body_too_large?(req)
    length = req['Content-Length'].to_i
    length > MAX_BODY_BYTES
  end

  # Sanitise the threshold parameter from the form body.
  # `Float()` happily handles "nan" → NaN and "inf" → +Inf. Either
  # would silently turn the lookup into a permanent hit (NaN
  # comparisons are always false, so `distance > NaN` cannot reject)
  # or a permanent miss. Clamp to the meaningful cosine-distance
  # range so a malformed POST cannot override the threshold semantics.
  def self.clamp_threshold(raw)
    parsed = Float(raw, exception: false)
    return 0.5 if parsed.nil? || !parsed.finite?
    [[parsed, 0.0].max, 2.0].min
  end

  # Build the response shape /state serves. The Python / Node / Go /
  # Jedis siblings serve the same shape so the shared HTML works
  # without modification. `default_threshold` is what the
  # `--threshold` flag actually configures; the UI slider initialises
  # to this on first load so the flag visibly changes the demo's
  # behaviour. `stack_label` lets the same HTML render a per-language
  # badge (redis-py, node-redis, redis-rb, …) without forking the
  # file per language.
  def self.build_state(cache, embedder, llm, stack_label)
    info = cache.index_info
    {
      index: {
        num_docs: info[:num_docs],
        index_name: cache.index_name,
        indexing_failures: info[:indexing_failures],
        vector_index_size_mb: info[:vector_index_size_mb],
        model: embedder.model_name,
        mock_llm_latency_ms: llm.latency_ms,
        default_threshold: cache.distance_threshold,
        stack_label: stack_label
      },
      entries: cache.list_entries(limit: 200)
    }
  end

  # Parse a URL-encoded form body into a plain Hash<String, String>.
  # `URI.decode_www_form` returns an Array of pairs; we keep only the
  # last value for a repeated key, which matches the Python / Node
  # demos' behaviour.
  def self.parse_form(body)
    pairs = URI.decode_www_form(body.to_s)
    pairs.to_h
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

  # ----------------------------------------------------------------
  # Handlers
  # ----------------------------------------------------------------

  def self.install_handlers(server, deps)
    cache = deps.fetch(:cache)
    embedder = deps.fetch(:embedder)
    llm = deps.fetch(:llm)
    demo = deps.fetch(:demo)
    html_page = deps.fetch(:html_page)
    stack_label = deps.fetch(:stack_label)

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
        send_json(res, build_state(cache, embedder, llm, stack_label))
      end
    end

    server.mount_proc '/query' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, { error: "request body exceeds #{MAX_BODY_BYTES} bytes" }, status: 413)
          next
        end
        params = parse_form(req.body)
        prompt = (params['prompt'] || '').strip
        if prompt.empty?
          send_json(res, { error: 'prompt is required' }, status: 400)
          next
        end
        payload = demo.run_query(
          prompt: prompt,
          tenant: empty_or(params['tenant'], 'acme'),
          locale: empty_or(params['locale'], 'en'),
          model_version: empty_or(params['model_version'], llm.model_version),
          threshold: clamp_threshold(params['threshold'] || '0.5'),
          lookup_only: !(params['lookup_only'].nil? || params['lookup_only'].empty?)
        )
        send_json(res, payload)
      end
    end

    server.mount_proc '/reset' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        demo.seed
        send_json(res, { ok: true })
      end
    end

    server.mount_proc '/drop' do |req, res|
      with_json_errors(res) do
        if req.request_method != 'POST'
          send_json(res, { error: 'method not allowed' }, status: 405)
          next
        end
        if body_too_large?(req)
          send_json(res, { error: "request body exceeds #{MAX_BODY_BYTES} bytes" }, status: 413)
          next
        end
        params = parse_form(req.body)
        entry_id = (params['entry_id'] || '').strip
        if entry_id.empty?
          send_json(res, { error: 'entry_id is required' }, status: 400)
          next
        end
        deleted = cache.delete_entry(entry_id)
        send_json(res, { deleted: deleted, entry_id: entry_id })
      end
    end
  end

  def self.empty_or(value, default)
    value.nil? || value.empty? ? default : value
  end

  # ----------------------------------------------------------------
  # Main
  # ----------------------------------------------------------------

  def self.parse_flags(argv)
    options = {
      host: '127.0.0.1',
      port: 8094,
      redis_host: 'localhost',
      redis_port: 6379,
      index_name: 'semcache:idx',
      key_prefix: 'cache:',
      ttl_seconds: 3600,
      threshold: 0.5,
      llm_latency_ms: 1500.0,
      no_reset: false
    }
    OptionParser.new do |opts|
      opts.banner = 'Usage: ruby demo_server.rb [options]'
      opts.on('--host HOST', 'Interface to bind to')           { |v| options[:host] = v }
      opts.on('--port PORT', Integer, 'HTTP port for the UI') { |v| options[:port] = v }
      opts.on('--redis-host HOST', 'Redis host')              { |v| options[:redis_host] = v }
      opts.on('--redis-port PORT', Integer, 'Redis port')     { |v| options[:redis_port] = v }
      opts.on('--index-name NAME', 'Redis Search index name') { |v| options[:index_name] = v }
      opts.on('--key-prefix PREFIX', 'Key prefix for cache entries') { |v| options[:key_prefix] = v }
      opts.on('--ttl-seconds N', Integer, 'TTL on every entry') { |v| options[:ttl_seconds] = v }
      opts.on('--threshold F', Float, 'Default cosine-distance threshold') { |v| options[:threshold] = v }
      opts.on('--llm-latency-ms F', Float, 'Simulated mock LLM latency in ms') { |v| options[:llm_latency_ms] = v }
      opts.on('--no-reset', 'Skip the cache reset + seed on startup') { options[:no_reset] = true }
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

    cache = RedisSemanticCache.new(
      redis_client: client,
      index_name: args[:index_name],
      key_prefix: args[:key_prefix],
      distance_threshold: args[:threshold],
      default_ttl_seconds: args[:ttl_seconds]
    )
    cache.create_index

    puts 'Loading embedding model (first run downloads the ONNX weights)...'
    embedder = LocalEmbedder.new
    llm = MockLLM.new(latency_ms: args[:llm_latency_ms])

    demo = SemanticCacheDemo.new(cache: cache, embedder: embedder, llm: llm)
    unless args[:no_reset]
      puts "Dropping any existing cache under '#{args[:key_prefix]}*' and " \
           're-seeding from the FAQ list (pass --no-reset to keep).'
      seeded = demo.seed
      puts "Seeded #{seeded} entries."
    end

    # Load the HTML once and replace the template tokens with the
    # configured index name and key prefix so the docs panel shows
    # the actual values in use rather than the default copies.
    raw_html = File.read(File.expand_path('index.html', __dir__))
    html_page = raw_html
                .gsub('__INDEX_NAME__', args[:index_name])
                .gsub('__KEY_PREFIX__', args[:key_prefix])

    stack_label = 'redis-rb + informers + WEBrick'

    # WEBrick: turn down access logging so the console isn't a flood
    # of GET / lines while the demo is running. (WEBrick has no
    # built-in `MaxRequestBodySize` knob; each POST handler enforces
    # the 1 MiB cap explicitly via `body_too_large?`.)
    server = WEBrick::HTTPServer.new(
      BindAddress: args[:host],
      Port: args[:port],
      Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
      AccessLog: []
    )

    install_handlers(server, {
                       cache: cache, embedder: embedder, llm: llm,
                       demo: demo, html_page: html_page, stack_label: stack_label
                     })

    trap('INT')  { server.shutdown }
    trap('TERM') { server.shutdown }

    puts "Redis semantic cache demo listening on http://#{args[:host]}:#{args[:port]}"
    puts "Using Redis at #{args[:redis_host]}:#{args[:redis_port]} with index '#{args[:index_name]}'"
    server.start
  ensure
    client&.close
  end
end

SemCache.run! if $PROGRAM_NAME == __FILE__
