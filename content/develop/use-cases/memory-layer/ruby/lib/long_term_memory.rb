# Long-term memory store for an agent, backed by Redis JSON and Search.
#
# Each memory lives as one JSON document at `agent:mem:<id>`. The
# document holds the memory text, its embedding vector, and a small
# metadata block — user, namespace, kind, source thread, timestamps —
# that lets the recall query scope results without falling back to
# application-side filtering.
#
# A single Redis Search index covers the embedding plus every metadata
# field, so one `FT.SEARCH` call performs approximate-nearest-
# neighbor over the in-scope subset and returns the top-k memories
# ranked by cosine distance. The same KNN check runs at *write* time
# to deduplicate near-identical memories before they enter the store,
# which keeps the index from filling with paraphrases of the same fact
# as the agent reasons over similar topics across sessions.
#
# Memories carry one of two kinds:
#
# * `episodic` — "what happened" snapshots from a specific thread,
#   written with a medium TTL so old session detail decays naturally.
# * `semantic` — distilled facts and preferences the agent should
#   carry forward indefinitely. Written with no TTL by default.
#
# The split is enforced as a TAG on the index, so the recall query
# can ask for one kind or both with a filter — no separate keyspaces.

require 'json'
require 'redis'
require 'securerandom'
require 'set'

require_relative 'embeddings'

module AgentMemory
  VECTOR_DIM_DEFAULT = 384

  # How close (cosine distance) a candidate must be to an existing
  # memory to count as a duplicate at write time. Smaller = stricter.
  # 0.20 is calibrated to the `all-MiniLM-L6-v2` embedding model used
  # in the demo, where a paraphrase of an existing memory lands in
  # the 0.10 – 0.20 range and a distinct memory lands above 0.50.
  DEFAULT_DEDUP_THRESHOLD = 0.20

  # How close (cosine distance) a candidate must be to count as a
  # relevant recall result. Larger than the dedup threshold so the
  # agent gets a wider net at read time than at write time.
  DEFAULT_RECALL_THRESHOLD = 0.55

  # TTL tiers, in seconds. `nil` means "no TTL" — the memory persists
  # until explicitly deleted or evicted under memory pressure.
  TTL_BY_KIND = {
    'episodic' => 7 * 24 * 3600,
    'semantic' => nil
  }.freeze

  # A single memory document returned from the store.
  MemoryRecord = Struct.new(
    :id, :user, :namespace, :kind, :source_thread,
    :text, :created_ts, :hit_count,
    :distance, :ttl_seconds, keyword_init: true
  ) do
    def to_h
      {
        id: id,
        user: user,
        namespace: namespace,
        kind: kind,
        source_thread: source_thread,
        text: text,
        created_ts: created_ts,
        hit_count: hit_count,
        distance: distance.nil? ? nil : distance.round(4),
        ttl_seconds: ttl_seconds
      }
    end
  end

  # Outcome of a `remember` call. `deduped` is `true` when the write
  # skipped because a similar memory already existed; `id` is then
  # the existing memory's id. `existing_distance` is the cosine
  # distance to the nearest memory regardless of which branch was
  # taken — useful for tracing.
  WriteResult = Struct.new(
    :id, :deduped, :existing_distance, keyword_init: true
  ) do
    def to_h
      {
        id: id,
        deduped: deduped,
        existing_distance:
          existing_distance.nil? ? nil : existing_distance.round(4)
      }
    end
  end

  class LongTermMemory
    # Characters Redis Search treats as syntax inside a TAG value; any
    # of them in a user-supplied filter must be backslash-escaped or
    # the surrounding `{...}` block won't parse correctly.
    TAG_SPECIAL = Set.new("\\,.<>{}[]\"':;!@#$%^&*()-+=~| ".chars).freeze

    attr_reader :redis, :index_name, :key_prefix, :vector_dim,
                :dedup_threshold, :recall_threshold, :ttl_by_kind

    def initialize(redis_client: nil,
                   index_name: 'agentmem:idx',
                   key_prefix: 'agent:mem:',
                   vector_dim: VECTOR_DIM_DEFAULT,
                   dedup_threshold: DEFAULT_DEDUP_THRESHOLD,
                   recall_threshold: DEFAULT_RECALL_THRESHOLD,
                   ttl_by_kind: nil)
      @redis = redis_client || Redis.new(host: 'localhost', port: 6379)
      @index_name = index_name
      @key_prefix = key_prefix
      @vector_dim = vector_dim
      @dedup_threshold = dedup_threshold
      @recall_threshold = recall_threshold
      @ttl_by_kind = ttl_by_kind || TTL_BY_KIND.dup
    end

    # ----------------------------------------------------------------
    # Keys and index
    # ----------------------------------------------------------------

    def memory_key(memory_id)
      "#{@key_prefix}#{memory_id}"
    end

    # Create the Redis Search index if it doesn't already exist.
    #
    # The index is declared on the JSON document type, with a
    # `$.embedding` path holding the vector and TAG fields for
    # `user`, `namespace`, `kind`, and `source_thread`. One
    # `FT.SEARCH` can therefore pre-filter by any combination of
    # those tags and KNN-rank the matching memories in one pass.
    def create_index
      args = [
        'FT.CREATE', @index_name,
        'ON', 'JSON',
        'PREFIX', '1', @key_prefix,
        'SCHEMA',
        '$.text',          'AS', 'text',          'TEXT',
        '$.user',          'AS', 'user',          'TAG',
        '$.namespace',     'AS', 'namespace',     'TAG',
        '$.kind',          'AS', 'kind',          'TAG',
        '$.source_thread', 'AS', 'source_thread', 'TAG',
        '$.created_ts',    'AS', 'created_ts',    'NUMERIC', 'SORTABLE',
        '$.hit_count',     'AS', 'hit_count',     'NUMERIC', 'SORTABLE',
        '$.embedding',     'AS', 'embedding',     'VECTOR', 'HNSW', '6',
        'TYPE', 'FLOAT32',
        'DIM', @vector_dim.to_s,
        'DISTANCE_METRIC', 'COSINE'
      ]
      @redis.call(*args)
    rescue Redis::CommandError => e
      raise unless e.message.include?('Index already exists')
    end

    def drop_index(delete_documents: false)
      args = ['FT.DROPINDEX', @index_name]
      args << 'DD' if delete_documents
      @redis.call(*args)
    rescue Redis::CommandError => e
      message = e.message.downcase
      raise unless message.include?('no such index') ||
                   message.include?('unknown index name')
    end

    # ----------------------------------------------------------------
    # Write
    # ----------------------------------------------------------------

    # Write a new memory, deduplicating against existing entries.
    #
    # Runs one in-scope KNN(1) against the index first. If the
    # nearest existing memory is within `dedup_threshold`, the new
    # memory is skipped (its content is already represented) and the
    # existing memory's `hit_count` is bumped. Otherwise a fresh JSON
    # document is written under a new id with a TTL derived from the
    # memory's `kind`.
    #
    # The KNN-then-write sequence is not atomic; two workers that
    # remember the same fact at the same time can both miss each
    # other's in-flight write and insert duplicate memories. See the
    # walkthrough's "Concurrency caveats" section for the production
    # fix (periodic background consolidator that merges
    # near-duplicates).
    def remember(text:, embedding:,
                 user: 'default', namespace: 'default',
                 kind: 'episodic', source_thread: '',
                 ttl_seconds: :default)
      validate_dim!(embedding, 'embedding')

      nearest = nearest_neighbors(
        embedding, user: user, namespace: namespace, kind: kind, k: 1
      )
      nearest_distance = nearest.first&.distance
      if !nearest.empty? &&
         !nearest.first.distance.nil? &&
         nearest.first.distance <= @dedup_threshold
        # Duplicate. Bump the hit count on the existing memory so the
        # admin UI can show how often it's been re-derived.
        bump_hit_count(nearest.first.id)
        return WriteResult.new(
          id: nearest.first.id,
          deduped: true,
          existing_distance: nearest_distance
        )
      end

      memory_id = SecureRandom.hex(6)
      key = memory_key(memory_id)
      now = Time.now.to_f
      doc = {
        'id' => memory_id,
        'user' => user,
        'namespace' => namespace,
        'kind' => kind,
        'source_thread' => source_thread,
        'text' => text,
        'embedding' => embedding,
        'created_ts' => now,
        'hit_count' => 0
      }
      ttl = resolve_ttl(kind, ttl_seconds)

      # MULTI/EXEC so the JSON document and its TTL apply together. A
      # connection drop between the JSON.SET and EXPIRE would
      # otherwise leave the memory without an expiry.
      @redis.multi do |m|
        m.call('JSON.SET', key, '$', JSON.generate(doc))
        m.expire(key, ttl) unless ttl.nil?
      end
      WriteResult.new(
        id: memory_id,
        deduped: false,
        existing_distance: nearest_distance
      )
    end

    # ----------------------------------------------------------------
    # Recall
    # ----------------------------------------------------------------

    # Return the top-k in-scope memories ranked by similarity.
    #
    # Memories beyond `distance_threshold` (or the instance default)
    # are dropped — the index always returns *something* for KNN, so
    # a recall result on an unrelated query would otherwise be a
    # confidently-wrong false positive.
    def recall(query_embedding,
               user: 'default', namespace: 'default',
               kind: nil, k: 5, distance_threshold: nil)
      threshold = distance_threshold || @recall_threshold
      candidates = nearest_neighbors(
        query_embedding,
        user: user, namespace: namespace, kind: kind, k: k
      )
      candidates.select do |c|
        !c.distance.nil? && c.distance <= threshold
      end
    end

    # ----------------------------------------------------------------
    # Admin / inspection
    # ----------------------------------------------------------------

    # Subset of `FT.INFO` useful for the demo UI.
    def index_info
      raw = @redis.call('FT.INFO', @index_name)
      info = ft_info_to_hash(raw)
      {
        num_docs: (info['num_docs'] || 0).to_i,
        indexing_failures: (info['hash_indexing_failures'] || 0).to_i
      }
    rescue Redis::CommandError
      { num_docs: 0, indexing_failures: 0 }
    end

    # Return memories matching the filters, newest first. The
    # admin-panel listing skips the distance column (no KNN ran).
    def list_memories(user: nil, namespace: nil, kind: nil, limit: 100)
      filter_clause = self.class.build_filter_clause(
        user: user, namespace: namespace, kind: kind
      )
      args = [
        'FT.SEARCH', @index_name, filter_clause,
        'RETURN', '7',
        'user', 'namespace', 'kind', 'source_thread',
        'text', 'created_ts', 'hit_count',
        'SORTBY', 'created_ts', 'DESC',
        'LIMIT', '0', limit.to_s,
        'DIALECT', '2'
      ]
      begin
        result = @redis.call(*args)
      rescue Redis::CommandError
        return []
      end
      parse_search_result(result).map do |doc|
        raw_key = doc[:_key]
        memory_id = strip_prefix(raw_key)
        ttl = @redis.ttl(memory_key(memory_id))
        MemoryRecord.new(
          id: memory_id,
          user: doc[:user] || '',
          namespace: doc[:namespace] || '',
          kind: doc[:kind] || '',
          source_thread: doc[:source_thread] || '',
          text: doc[:text] || '',
          created_ts: (doc[:created_ts] || '0').to_f,
          hit_count: (doc[:hit_count] || '0').to_i,
          distance: nil,
          ttl_seconds: ttl && ttl.positive? ? ttl.to_i : nil
        )
      end
    end

    def delete_memory(memory_id)
      @redis.del(memory_key(memory_id)).positive?
    end

    # Drop the index and every memory document. Returns the count of
    # documents that were removed. In production the equivalent is
    # `FLUSHDB` on a dedicated memory database, or letting TTLs and
    # eviction expire entries naturally.
    def clear
      before = index_info[:num_docs]
      drop_index(delete_documents: true)
      create_index
      before
    end

    # ----------------------------------------------------------------
    # Filter clause
    # ----------------------------------------------------------------

    def self.escape_tag_value(value)
      value.each_char.map { |c| TAG_SPECIAL.include?(c) ? "\\#{c}" : c }.join
    end

    def self.build_filter_clause(user:, namespace:, kind:)
      # `nil` and `""` mean "no filter"; any other value, including
      # `"0"`, must scope so a user named "0" isn't silently merged
      # into the rest of the corpus.
      clauses = []
      clauses << "@user:{#{escape_tag_value(user)}}" unless user.nil? || user.empty?
      clauses << "@namespace:{#{escape_tag_value(namespace)}}" unless namespace.nil? || namespace.empty?
      clauses << "@kind:{#{escape_tag_value(kind)}}" unless kind.nil? || kind.empty?
      clauses.empty? ? '(*)' : "(#{clauses.join(' ')})"
    end

    private

    def nearest_neighbors(embedding, user:, namespace:, kind:, k:)
      validate_dim!(embedding, 'embedding')
      filter_clause = self.class.build_filter_clause(
        user: user, namespace: namespace, kind: kind
      )
      knn_query = "#{filter_clause}=>[KNN #{k} @embedding $vec AS distance]"
      vec_bytes = LocalEmbedder.to_bytes(embedding)
      args = [
        'FT.SEARCH', @index_name, knn_query,
        'PARAMS', '2', 'vec', vec_bytes,
        'SORTBY', 'distance', 'ASC',
        'RETURN', '8',
        'user', 'namespace', 'kind', 'source_thread',
        'text', 'created_ts', 'hit_count', 'distance',
        'LIMIT', '0', k.to_s,
        'DIALECT', '2'
      ]
      result = @redis.call(*args)
      parse_search_result(result).map do |doc|
        raw_key = doc[:_key]
        memory_id = strip_prefix(raw_key)
        ttl = @redis.ttl(memory_key(memory_id))
        MemoryRecord.new(
          id: memory_id,
          user: doc[:user] || '',
          namespace: doc[:namespace] || '',
          kind: doc[:kind] || '',
          source_thread: doc[:source_thread] || '',
          text: doc[:text] || '',
          created_ts: (doc[:created_ts] || '0').to_f,
          hit_count: (doc[:hit_count] || '0').to_i,
          distance: doc[:distance].nil? ? nil : doc[:distance].to_f,
          ttl_seconds: ttl && ttl.positive? ? ttl.to_i : nil
        )
      end
    end

    def bump_hit_count(memory_id)
      @redis.call('JSON.NUMINCRBY', memory_key(memory_id), '$.hit_count', 1)
    rescue Redis::CommandError
      # The doc may have expired between recall and bump — fine, we
      # just lose the hit count update.
    end

    def resolve_ttl(kind, override)
      return @ttl_by_kind[kind] if override == :default
      override
    end

    def strip_prefix(raw_key)
      raw_key.start_with?(@key_prefix) ? raw_key[@key_prefix.length..] : raw_key
    end

    def validate_dim!(vector, label)
      unless vector.respond_to?(:length) && vector.length == @vector_dim
        actual = vector.respond_to?(:length) ? vector.length : 'unknown'
        raise ArgumentError,
              "#{label} has length #{actual}; index expects #{@vector_dim}"
      end
    end

    # Parse the raw `FT.SEARCH` reply (RESP2 layout). The shape is:
    #   [ total, key1, [field1, value1, field2, value2, ...], key2, ... ]
    # where each key is followed by a flat field/value array.
    def parse_search_result(reply)
      return [] unless reply.is_a?(Array) && !reply.empty?
      docs = []
      i = 1
      while i < reply.length
        key = reply[i]
        fields = reply[i + 1]
        i += 2
        next if fields.nil?
        doc = { _key: key }
        j = 0
        while j < fields.length
          doc[fields[j].to_s.to_sym] = fields[j + 1]
          j += 2
        end
        docs << doc
      end
      docs
    end

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
