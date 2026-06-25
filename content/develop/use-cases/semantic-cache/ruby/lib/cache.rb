# Redis semantic-cache helper backed by Redis Search (Ruby).
#
# Each cache entry lives as a Hash document at `cache:<id>`. The hash
# stores the user's prompt and the corresponding LLM response alongside
# the raw float32 bytes of the prompt's 384-dimensional embedding and a
# small set of metadata fields — tenant, locale, model version, and a
# safety flag.
#
# A single Redis Search index covers the embedding plus every metadata
# field, so one `FT.SEARCH` call does an approximate-nearest-neighbour
# lookup against the cached prompts with a TAG pre-filter applied in
# the same pass — no cross-store joins, no extra round trips, and
# tenant isolation is enforced *inside* the query rather than after
# the fact in application code.
#
# The lookup is thresholded: `FT.SEARCH` always returns the closest
# cached prompt, but the cache only serves it as a hit when the cosine
# distance is at or below `distance_threshold`. Anything further away
# is treated as a miss; the caller is expected to run the underlying
# LLM and write the new prompt, response, and embedding back with
# `put`.
#
# Each cache entry is written with `EXPIRE`, so stale answers age out
# without manual cleanup; setting an eviction policy on the database
# (`allkeys-lfu` is the common choice) caps memory under pressure.
# This helper assumes the `redis-rb` client default — String I/O — and
# packs the binary embedding bytes into a String with ASCII-8BIT
# encoding so the protocol writer transmits the exact bytes without
# any UTF-8 transcoding.

require 'redis'
require 'securerandom'
require 'set'

module SemCache
  VECTOR_DIM_DEFAULT = 384

  # A cache lookup that returned a cached response. `distance` is the
  # cosine distance `FT.SEARCH` reported for the nearest cached
  # prompt (0 = identical, 2 = opposite). It is always at or below
  # the threshold the lookup was run with.
  CacheHit = Struct.new(
    :id, :prompt, :response, :tenant, :locale, :model_version,
    :distance, :ttl_seconds, :hit_count, keyword_init: true
  ) do
    def to_h
      {
        id: id,
        prompt: prompt,
        response: response,
        tenant: tenant,
        locale: locale,
        model_version: model_version,
        distance: distance.round(4),
        ttl_seconds: ttl_seconds,
        hit_count: hit_count
      }
    end

    def hit?
      true
    end
  end

  # A cache lookup that did not return a usable response.
  # `nearest_distance` is the cosine distance to the closest cached
  # prompt that *did* match the metadata filters. It is `nil` if the
  # cache had no entry in scope at all, which is what the demo UI
  # shows as "no candidate" vs. "candidate too far".
  CacheMiss = Struct.new(
    :nearest_distance, :nearest_id, keyword_init: true
  ) do
    def to_h
      {
        nearest_distance: nearest_distance ? nearest_distance.round(4) : nil,
        nearest_id: nearest_id
      }
    end

    def hit?
      false
    end
  end

  class RedisSemanticCache
    # Characters Redis Search treats as syntax inside a TAG value; any
    # of them in a user-supplied filter must be backslash-escaped or
    # the surrounding `{...}` block won't parse correctly.
    TAG_SPECIAL = Set.new("\\,.<>{}[]\"':;!@#$%^&*()-+=~| ".chars).freeze

    attr_reader :redis, :index_name, :key_prefix, :vector_dim,
                :distance_threshold, :default_ttl_seconds

    def initialize(redis_client: nil,
                   index_name: 'semcache:idx',
                   key_prefix: 'cache:',
                   vector_dim: VECTOR_DIM_DEFAULT,
                   distance_threshold: 0.5,
                   default_ttl_seconds: 3600)
      @redis = redis_client || Redis.new(host: 'localhost', port: 6379)
      @index_name = index_name
      @key_prefix = key_prefix
      @vector_dim = vector_dim
      @distance_threshold = distance_threshold
      @default_ttl_seconds = default_ttl_seconds
    end

    # ----------------------------------------------------------------
    # Keys
    # ----------------------------------------------------------------

    def entry_key(entry_id)
      "#{@key_prefix}#{entry_id}"
    end

    # ----------------------------------------------------------------
    # Index management
    # ----------------------------------------------------------------

    # Create the Redis Search index if it doesn't already exist. One
    # index covers the embedding plus every metadata field, so a
    # single `FT.SEARCH` can pre-filter by tenant / locale / model and
    # then KNN-rank the matching documents in one pass. The `prompt`
    # and `response` fields are stored as TEXT so the admin tooling
    # can grep the cache by content, but the cache lookup itself is
    # vector-only.
    def create_index
      args = [
        'FT.CREATE', @index_name,
        'ON', 'HASH',
        'PREFIX', '1', @key_prefix,
        'SCHEMA',
        'prompt',        'TEXT',
        'response',      'TEXT',
        'tenant',        'TAG',
        'locale',        'TAG',
        'model_version', 'TAG',
        'safety',        'TAG',
        'created_ts',    'NUMERIC', 'SORTABLE',
        'hit_count',     'NUMERIC', 'SORTABLE',
        'embedding',     'VECTOR', 'HNSW', '6',
        'TYPE', 'FLOAT32',
        'DIM', @vector_dim.to_s,
        'DISTANCE_METRIC', 'COSINE'
      ]
      @redis.call(*args)
    rescue Redis::CommandError => e
      raise unless e.message.include?('Index already exists')
    end

    # Drop the search index. Optionally also delete cached entries.
    def drop_index(delete_documents: false)
      args = ['FT.DROPINDEX', @index_name]
      args << 'DD' if delete_documents
      @redis.call(*args)
    rescue Redis::CommandError => e
      message = e.message.downcase
      raise unless message.include?('no such index') || message.include?('unknown index name')
    end

    # ----------------------------------------------------------------
    # Lookup
    # ----------------------------------------------------------------

    # Find the nearest in-scope cached prompt and decide hit / miss.
    #
    # `FT.SEARCH` returns the single nearest entry that satisfies the
    # TAG pre-filters. The lookup is a hit only if the reported cosine
    # distance is at or below `distance_threshold` (or the instance
    # default). Anything further away is a miss with the candidate
    # distance attached so the caller can log it.
    #
    # On a hit, the entry's `hit_count` is incremented atomically with
    # `HINCRBY` so the demo UI can show which entries are
    # load-bearing. The TTL is refreshed on every hit so frequently
    # used answers don't age out under cold tail entries.
    def lookup(query_vec, tenant: nil, locale: nil, model_version: nil,
               safety: 'ok', distance_threshold: nil)
      validate_dim!(query_vec, 'query_vec')

      threshold = distance_threshold || @distance_threshold

      filter_clause = self.class.build_filter_clause(
        tenant: tenant, locale: locale,
        model_version: model_version, safety: safety
      )
      query_str = "#{filter_clause}=>[KNN 1 @embedding $vec AS distance]"
      vec_bytes = LocalEmbedder.to_bytes(query_vec)

      args = [
        'FT.SEARCH', @index_name, query_str,
        'PARAMS', '2', 'vec', vec_bytes,
        'SORTBY', 'distance', 'ASC',
        'RETURN', '7',
        'prompt', 'response', 'tenant', 'locale',
        'model_version', 'hit_count', 'distance',
        'LIMIT', '0', '1',
        'DIALECT', '2'
      ]
      result = @redis.call(*args)
      docs = parse_search_result(result)

      return CacheMiss.new(nearest_distance: nil, nearest_id: nil) if docs.empty?

      doc = docs.first
      raw_key = doc[:_key]
      entry_id = raw_key.start_with?(@key_prefix) ? raw_key[@key_prefix.length..] : raw_key
      distance = doc[:distance].to_f

      if distance > threshold
        return CacheMiss.new(nearest_distance: distance, nearest_id: entry_id)
      end

      # The hash may have expired between FT.SEARCH returning the row
      # and us getting here — the search index lags expirations by its
      # periodic scan. If we just blindly HINCRBY-ed, Redis would
      # helpfully recreate the hash with only `hit_count` set and the
      # search index would then log it as an indexing failure (no
      # embedding, no metadata). EXISTS narrows that race to the
      # pipeline round-trip; a strictly race-free version would wrap
      # the bump in a Lua script that checks existence and acts in
      # one server-side step.
      ek = entry_key(entry_id)
      unless @redis.exists?(ek)
        return CacheMiss.new(nearest_distance: distance, nearest_id: entry_id)
      end

      # MULTI/EXEC the three writes so they apply as a unit on the
      # server — a partial failure between HINCRBY and EXPIRE would
      # otherwise leave the entry without a refreshed TTL.
      replies = @redis.multi do |m|
        m.hincrby(ek, 'hit_count', 1)
        m.expire(ek, @default_ttl_seconds)
        m.ttl(ek)
      end
      new_hit_count, _expired, ttl = replies

      CacheHit.new(
        id: entry_id,
        prompt: doc[:prompt] || '',
        response: doc[:response] || '',
        tenant: doc[:tenant] || '',
        locale: doc[:locale] || '',
        model_version: doc[:model_version] || '',
        distance: distance,
        ttl_seconds: ttl && ttl.positive? ? ttl.to_i : @default_ttl_seconds,
        hit_count: new_hit_count.to_i
      )
    end

    # ----------------------------------------------------------------
    # Write
    # ----------------------------------------------------------------

    # Write a new cache entry and return its id.
    #
    # The embedding is stored as raw little-endian float32 bytes — the
    # encoding Redis Search expects from a FLOAT32 vector field.
    # `EXPIRE` on the key gives every entry a bounded lifetime;
    # combine with an `allkeys-lfu` eviction policy on the database
    # to cap memory under pressure too.
    def put(prompt:, response:, embedding:,
            tenant: 'default', locale: 'en',
            model_version: 'gpt-4.5-2026', safety: 'ok',
            ttl_seconds: nil, entry_id: nil)
      validate_dim!(embedding, 'embedding')

      id = entry_id || SecureRandom.hex(6) # 12 hex chars, matches sibling demos
      key = entry_key(id)
      ttl = ttl_seconds || @default_ttl_seconds
      vec_bytes = LocalEmbedder.to_bytes(embedding)

      # MULTI/EXEC so HSET and EXPIRE either both apply or neither
      # does. Without the transaction wrapper a connection drop
      # between the two writes could leave the entry without a TTL
      # and the cache would then keep an answer past its intended
      # lifetime (or forever, on a database with no eviction policy).
      #
      # `redis-rb`'s HSET takes a flat list of field/value pairs or a
      # Hash. We pass the flat list so the binary `vec_bytes` is sent
      # as one argument without any String-to-Hash key coercion
      # touching it.
      @redis.multi do |m|
        m.hset(key,
               'prompt', prompt,
               'response', response,
               'tenant', tenant,
               'locale', locale,
               'model_version', model_version,
               'safety', safety,
               'created_ts', Time.now.to_f.to_s,
               'hit_count', '0',
               'embedding', vec_bytes)
        m.expire(key, ttl)
      end
      id
    end

    # ----------------------------------------------------------------
    # Filter clause
    # ----------------------------------------------------------------

    def self.escape_tag_value(value)
      value.each_char.map { |c| TAG_SPECIAL.include?(c) ? "\\#{c}" : c }.join
    end

    def self.build_filter_clause(tenant:, locale:, model_version:, safety:)
      clauses = []
      clauses << "@tenant:{#{escape_tag_value(tenant)}}" if tenant && !tenant.empty?
      clauses << "@locale:{#{escape_tag_value(locale)}}" if locale && !locale.empty?
      clauses << "@model_version:{#{escape_tag_value(model_version)}}" if model_version && !model_version.empty?
      clauses << "@safety:{#{escape_tag_value(safety)}}" if safety && !safety.empty?
      clauses.empty? ? '(*)' : "(#{clauses.join(' ')})"
    end

    # ----------------------------------------------------------------
    # Inspection / admin
    # ----------------------------------------------------------------

    # Subset of `FT.INFO` useful for the demo UI.
    def index_info
      raw = @redis.call('FT.INFO', @index_name)
      info = ft_info_to_hash(raw)
      {
        num_docs: (info['num_docs'] || 0).to_i,
        indexing_failures: (info['hash_indexing_failures'] || 0).to_i,
        vector_index_size_mb: (info['vector_index_sz_mb'] || 0).to_f
      }
    rescue Redis::CommandError
      { num_docs: 0, indexing_failures: 0, vector_index_size_mb: 0.0 }
    end

    # Return every cached entry (no embedding) for the admin UI.
    def list_entries(limit: 100)
      args = [
        'FT.SEARCH', @index_name, '*',
        'RETURN', '8',
        'prompt', 'response', 'tenant', 'locale',
        'model_version', 'safety', 'created_ts', 'hit_count',
        'LIMIT', '0', limit.to_s,
        'SORTBY', 'created_ts', 'DESC',
        'DIALECT', '2'
      ]
      result = @redis.call(*args)
      parse_search_result(result).map do |doc|
        raw_key = doc[:_key]
        entry_id = raw_key.start_with?(@key_prefix) ? raw_key[@key_prefix.length..] : raw_key
        ttl = @redis.ttl(entry_key(entry_id))
        {
          id: entry_id,
          prompt: doc[:prompt] || '',
          response: doc[:response] || '',
          tenant: doc[:tenant] || '',
          locale: doc[:locale] || '',
          model_version: doc[:model_version] || '',
          safety: doc[:safety] || '',
          hit_count: (doc[:hit_count] || '0').to_i,
          ttl_seconds: ttl && ttl.positive? ? ttl.to_i : 0,
          created_ts: (doc[:created_ts] || '0').to_f
        }
      end
    end

    # Drop a single entry. Returns true if the key existed.
    def delete_entry(entry_id)
      @redis.del(entry_key(entry_id)).positive?
    end

    # Drop the index and every cached entry. Returns the number of
    # entries that were removed. Used by the demo's "reset" button —
    # in production the equivalent is just `FLUSHDB` on a dedicated
    # cache database, or letting TTLs expire naturally.
    def clear
      before = index_info[:num_docs]
      drop_index(delete_documents: true)
      create_index
      before
    end

    # ----------------------------------------------------------------
    # Internals
    # ----------------------------------------------------------------

    private

    def validate_dim!(vector, label)
      unless vector.respond_to?(:length) && vector.length == @vector_dim
        actual = vector.respond_to?(:length) ? vector.length : 'unknown'
        raise ArgumentError,
              "#{label} has length #{actual}; index expects #{@vector_dim}"
      end
    end

    # Parse the raw `FT.SEARCH` reply (RESP2 layout). The shape is:
    #   [ total, key1, [field1, value1, field2, value2, ...], key2, [...], ... ]
    # where each key is followed by a flat field/value array.
    def parse_search_result(reply)
      return [] unless reply.is_a?(Array) && reply.length >= 1
      _total = reply[0]
      docs = []
      i = 1
      while i < reply.length
        key = reply[i]
        fields = reply[i + 1]
        i += 2
        next if fields.nil?
        doc = { _key: key }
        # `fields` is a flat [k, v, k, v, ...] array; convert pairs to
        # symbol-keyed entries on the doc hash for easy lookup.
        j = 0
        while j < fields.length
          field_name = fields[j].to_s
          field_value = fields[j + 1]
          doc[field_name.to_sym] = field_value
          j += 2
        end
        docs << doc
      end
      docs
    end

    # `FT.INFO` returns a flat alternating key/value array. Lift it to
    # a string-keyed hash, ignoring nested arrays we don't need.
    def ft_info_to_hash(reply)
      return {} unless reply.is_a?(Array)
      out = {}
      i = 0
      while i < reply.length
        out[reply[i].to_s] = reply[i + 1]
        i += 2
      end
      out
    end
  end
end
