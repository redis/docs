# Redis recommendation-engine helper backed by Redis Search.
#
# Items live as Hash documents at `product:<id>`. Each hash stores the
# item's structured metadata (name, description, category, brand, price,
# in-stock flag, rating) alongside the raw float32 bytes of its
# 384-dimensional embedding. A single Redis Search index covers every
# field, so one `FT.SEARCH` call does the KNN over the embedding and
# the TAG / NUMERIC / TEXT pre-filter in the same pass -- no cross-store
# joins, no extra round trips.
#
# Per-user state lives in `user:<id>:features`: a session vector
# written as an exponentially weighted average of recently-clicked item
# embeddings, plus per-category affinity counters incremented atomically
# with `HINCRBYFLOAT`. The next time the application reads that hash
# to build a query, it sees the click -- no batch cycle, no cache
# invalidation.
#
# The recommendation flow has two paths:
#
# * **Query path** (per recommendation request)
#   1. *Candidate retrieval* -- `FT.SEARCH` with `KNN` over the
#      embedding, optionally pre-filtered by structured attributes,
#      optionally biased toward a session vector blended into the query.
#   2. *Re-ranking* -- the client takes the top-N candidates and adds a
#      log-scaled per-category affinity bonus pulled from the user
#      features hash.
# * **Click path** (per user interaction) -- the click writes a new
#   EWMA-blended session vector and increments the category affinity in
#   the user features hash. The next query path picks both up.
#
# redis-rb 5.x ships typed wrappers for the core commands but no
# bindings for the Redis Search module. The Search calls in this file
# go through the raw `redis.call(...)` escape hatch so the helper can
# drive them directly. Binary fields (the `embedding` blob, the
# `session_vec` blob) round-trip cleanly: redis-rb hands binary replies
# back as `ASCII-8BIT` strings, which Ruby's `String#unpack('e*')`
# decodes straight back into a `Float` array.

require 'base64'
require 'redis'

# One result row from the candidate-retrieval stage.
#
# `vector_distance` is the cosine distance returned by `FT.SEARCH`
# (0 = identical, 2 = opposite). `score` starts equal to that and may
# be reduced by `RedisRecommender#rerank` when the user has category
# affinities. Lower is better in both fields.
Candidate = Struct.new(
  :id, :name, :description, :category, :brand,
  :price, :rating, :in_stock,
  :vector_distance, :score,
  keyword_init: true,
) do
  def to_h_payload
    {
      'id' => id,
      'name' => name,
      'description' => description,
      'category' => category,
      'brand' => brand,
      'price' => price,
      'rating' => rating,
      'in_stock' => in_stock,
      'vector_distance' => vector_distance.round(4),
      'score' => score.round(4),
    }
  end
end

class RedisRecommender
  VECTOR_DIM_DEFAULT = 384

  # Characters Redis Search treats as syntax inside a TAG value; any of
  # them appearing in a user-supplied filter must be backslash-escaped
  # or the surrounding `{...}` block won't parse correctly. The list
  # comes from the Redis Search query-syntax documentation. The
  # backslash itself is included so a value containing a literal `\`
  # can't eat the next character's escape.
  TAG_SPECIAL = %("\\,.<>{}[]':;!@\#$%^&*()-+=~| ).chars.to_set.freeze

  attr_reader :redis, :index_name, :key_prefix, :user_key_prefix, :vector_dim

  def initialize(redis:, index_name: 'recommend:idx',
                 key_prefix: 'product:', user_key_prefix: 'user:',
                 vector_dim: VECTOR_DIM_DEFAULT)
    @redis = redis
    @index_name = index_name
    @key_prefix = key_prefix
    @user_key_prefix = user_key_prefix
    @vector_dim = vector_dim
  end

  # ------------------------------------------------------------------
  # Keys
  # ------------------------------------------------------------------

  def product_key(product_id) = "#{@key_prefix}#{product_id}"
  def user_key(user_id) = "#{@user_key_prefix}#{user_id}:features"

  # ------------------------------------------------------------------
  # Index management
  # ------------------------------------------------------------------

  # Create the Redis Search index if it doesn't already exist.
  #
  # One index covers every queryable field. The vector field is HNSW
  # with cosine distance so KNN is approximate but fast, and the
  # TAG / NUMERIC / TEXT fields share the same index so a single
  # `FT.SEARCH` can pre-filter and then KNN-rank in one pass.
  def create_index
    @redis.call(
      'FT.CREATE', @index_name,
      'ON', 'HASH', 'PREFIX', '1', @key_prefix,
      'SCHEMA',
      'name', 'TEXT', 'WEIGHT', '1',
      'description', 'TEXT', 'WEIGHT', '0.5',
      'category', 'TAG',
      'brand', 'TAG',
      'in_stock', 'TAG',
      'price', 'NUMERIC', 'SORTABLE',
      'rating', 'NUMERIC', 'SORTABLE',
      'embedding', 'VECTOR', 'HNSW', '6',
      'TYPE', 'FLOAT32',
      'DIM', @vector_dim.to_s,
      'DISTANCE_METRIC', 'COSINE'
    )
  rescue Redis::CommandError => exc
    raise unless exc.message.include?('Index already exists')
  end

  # Drop the search index. Optionally also delete the documents.
  def drop_index(delete_documents: false)
    args = ['FT.DROPINDEX', @index_name]
    args << 'DD' if delete_documents
    @redis.call(*args)
  rescue Redis::CommandError => exc
    msg = exc.message.downcase
    # Different Redis Search versions phrase the missing-index error
    # differently; tolerate either.
    raise unless msg.include?('no such index') || msg.include?('unknown index name')
  end

  # ------------------------------------------------------------------
  # Catalogue ingest
  # ------------------------------------------------------------------

  # Pipeline a batch of `HSET` writes for the catalogue.
  #
  # Each product must include the fields named in `create_index` plus
  # either `embedding` (an Array of `Float`) or `embedding_b64` (the
  # base64-encoded float32 bytes -- that's what `build_catalog.rb`
  # writes into `catalog.json`).
  def index_products(products)
    products = products.to_a
    return 0 if products.empty?
    @redis.pipelined do |pipe|
      products.each do |product|
        pipe.hset(product_key(product['id']), encode_product(product))
      end
    end
    products.length
  end

  # Build the hash mapping passed to `HSET` for one product. The
  # product id lives in the Redis key itself (`product:<id>`); we don't
  # repeat it as a hash field. The embedding is packed into raw
  # little-endian float32 bytes -- exactly what Redis Search expects in
  # a `VECTOR FLOAT32` field.
  def encode_product(product)
    {
      'name' => product['name'].to_s,
      'description' => product['description'].to_s,
      'category' => product['category'].to_s,
      'brand' => product['brand'].to_s,
      'price' => product['price'].to_f.to_s,
      'rating' => product['rating'].to_f.to_s,
      'in_stock' => product['in_stock'] ? 'true' : 'false',
      'embedding' => extract_vector_bytes(product),
    }
  end

  def extract_vector_bytes(product)
    if product['embedding_b64']
      Base64.decode64(product['embedding_b64'])
    elsif product['embedding'].is_a?(String)
      # Already the raw byte string (e.g. from another helper).
      product['embedding']
    elsif product['embedding'].is_a?(Array)
      product['embedding'].pack('e*')
    else
      raise ArgumentError, "product #{product['id']}: no usable embedding"
    end
  end

  # ------------------------------------------------------------------
  # Candidate retrieval (KNN + optional pre-filter)
  # ------------------------------------------------------------------

  # Retrieve top-`k` candidates with `FT.SEARCH` KNN + filters.
  #
  # Pre-filter knobs are TAG (`category`, `brand`, `in_stock_only`),
  # NUMERIC (`min_price` / `max_price`, `min_rating`), and TEXT
  # (`text_match` against `text_field`, default `description`). They
  # combine with an implicit AND in front of the `KNN` clause, so Redis
  # evaluates them first and then KNN-ranks only the matching documents.
  #
  # If `session_vec` is provided, the query vector is blended with it
  # before retrieval -- that's the real-time signal path. Returns
  # `Candidate` rows ordered by ascending cosine distance (closest
  # first); `score` starts equal to the distance and may be reduced by
  # `rerank` when the user has affinities.
  def candidate_retrieve(query_vec, category: nil, brand: nil,
                         min_price: nil, max_price: nil,
                         in_stock_only: false, min_rating: nil,
                         text_match: nil, text_field: 'description',
                         k: 10, session_vec: nil, session_weight: 0.3)
    # Blend query + session signal so a session's clicks pull the next
    # retrieval toward the things the user has been engaging with. Both
    # inputs are unit-normalised so cosine scores stay comparable.
    effective_vec = blend_vectors(query_vec, session_vec, session_weight)

    filter_clause = self.class.build_filter_clause(
      category: category, brand: brand,
      min_price: min_price, max_price: max_price,
      in_stock_only: in_stock_only, min_rating: min_rating,
      text_match: text_match, text_field: text_field,
    )
    knn_query = "#{filter_clause}=>[KNN #{k} @embedding $vec AS vector_score]"

    raw = @redis.call(
      'FT.SEARCH', @index_name, knn_query,
      'PARAMS', '2', 'vec', effective_vec.pack('e*'),
      'SORTBY', 'vector_score',
      'RETURN', '8',
      'name', 'description', 'category', 'brand',
      'price', 'rating', 'in_stock', 'vector_score',
      'LIMIT', '0', k.to_s,
      'DIALECT', '2'
    )
    decode_search_reply(raw)
  end

  # Build the pre-filter clause that goes in front of the `KNN` clause.
  # Empty filters return `(*)`, which is a no-op pre-filter under
  # `DIALECT 2`.
  def self.build_filter_clause(category: nil, brand: nil,
                               min_price: nil, max_price: nil,
                               in_stock_only: false, min_rating: nil,
                               text_match: nil, text_field: 'description')
    clauses = []
    clauses << "@category:{#{escape_tag_value(category)}}" if category && !category.empty?
    clauses << "@brand:{#{escape_tag_value(brand)}}" if brand && !brand.empty?
    if !min_price.nil? || !max_price.nil?
      lo = min_price.nil? ? '-inf' : min_price.to_f.to_s
      hi = max_price.nil? ? '+inf' : max_price.to_f.to_s
      clauses << "@price:[#{lo} #{hi}]"
    end
    clauses << "@rating:[#{min_rating.to_f} +inf]" unless min_rating.nil?
    clauses << '@in_stock:{true}' if in_stock_only
    if text_match && !text_match.empty?
      # TEXT-field filter. Wrapping in quotes makes the value a single
      # phrase and avoids tripping the query parser on operators
      # (`-`, `|`, `"`, etc.) that a user might legitimately type into
      # a search box.
      safe = text_match.gsub('\\', '\\\\\\\\').gsub('"', '\\"')
      clauses << "@#{text_field}:\"#{safe}\""
    end
    clauses.empty? ? '(*)' : "(#{clauses.join(' ')})"
  end

  # Backslash-escape characters that have meaning inside `@tag:{...}`.
  #
  # With this in place a TAG filter built from external input can't
  # accidentally close the brace, inject an additional clause, or
  # misparse a value that simply contains a space or a hyphen.
  def self.escape_tag_value(value)
    value.each_char.map { |ch| TAG_SPECIAL.include?(ch) ? "\\#{ch}" : ch }.join
  end

  # ------------------------------------------------------------------
  # Re-ranking with user affinities
  # ------------------------------------------------------------------

  # Apply a per-category affinity bonus and re-sort.
  #
  # `user_features[:affinities]` is a `{category => weight}` map
  # accumulated from previous clicks. The bonus is shaped by
  # `log(1 + affinity) * affinity_weight` so repeated clicks see
  # diminishing returns and a single dominant category can't push the
  # bonus arbitrarily large. The bonus is subtracted from the cosine
  # distance, so a category the user has shown interest in pulls its
  # members up the list (closer to zero) without overwhelming the
  # vector signal.
  def rerank(candidates, user_features, affinity_weight: 0.15)
    affinities = user_features[:affinities] || {}
    if affinities.empty? || affinity_weight <= 0
      return candidates.sort_by(&:score)
    end
    candidates.each do |c|
      raw_aff = [affinities[c.category].to_f, 0.0].max
      bonus = Math.log1p(raw_aff) * affinity_weight
      c.score = c.vector_distance - bonus
    end
    candidates.sort_by(&:score)
  end

  # ------------------------------------------------------------------
  # Session signals (clicks)
  # ------------------------------------------------------------------

  # Update a user's session vector and category affinity.
  #
  # Reads the clicked item's embedding from its hash, blends it into
  # the user's session vector with an exponentially weighted moving
  # average, and bumps the category counter and click total.
  #
  # `ewma_alpha` is the weight given to the *new* click; the previous
  # session keeps `1 - ewma_alpha`. The default biases history (0.6)
  # over the latest click (0.4) so a single accidental click doesn't
  # swing the session.
  #
  # The category-affinity bump and click-count bump use
  # `HINCRBYFLOAT` / `HINCRBY` so they're atomic against any
  # concurrent caller. The session vector blend is inherently
  # read-modify-write -- the new vector depends on the previous one --
  # and is *not* atomic against a concurrent click for the same user.
  # For the per-user data this helper writes, that window is rare in
  # practice; if it matters in a given deployment, wrap the read and
  # the writeback in `WATCH/MULTI/EXEC` or move the whole blend into a
  # Lua script.
  def record_click(user_id, product_id, ewma_alpha: 0.4, affinity_step: 1.0)
    product_key_ = product_key(product_id)
    raw = @redis.hmget(product_key_, 'embedding', 'category')
    raise KeyError, "unknown product #{product_id}" if raw[0].nil?

    clicked_vec = bytes_to_vec(raw[0])
    category = raw[1] || 'unknown'

    user_key_ = user_key(user_id)
    previous_raw = @redis.hget(user_key_, 'session_vec')
    new_session =
      if previous_raw && !previous_raw.empty?
        previous_vec = bytes_to_vec(previous_raw)
        mixed = Array.new(clicked_vec.length) do |i|
          ewma_alpha * clicked_vec[i] + (1.0 - ewma_alpha) * previous_vec[i]
        end
        norm = Math.sqrt(mixed.sum { |x| x * x })
        norm = 1e-12 if norm < 1e-12
        mixed.map! { |x| x / norm }
        mixed
      else
        # First click: the clicked vector is already unit-normalised.
        clicked_vec
      end

    # Affinity and click counters are independent atomic increments;
    # only the session vector needs the read-modify-write because it
    # depends on the previous value. Pipelining sends the three writes
    # in one round trip.
    results = @redis.pipelined do |pipe|
      pipe.hset(user_key_, {
        'session_vec' => new_session.pack('e*'),
        'last_clicked_id' => product_id,
        'last_clicked_category' => category,
      })
      pipe.hincrbyfloat(user_key_, "aff:#{category}", affinity_step)
      pipe.hincrby(user_key_, 'clicks', 1)
    end

    {
      'category' => category,
      'affinity' => results[1].to_f,
      'clicks' => results[2].to_i,
      'last_clicked_id' => product_id,
    }
  end

  # Read a user's session vector and affinities for re-ranking.
  def get_user_features(user_id)
    raw = @redis.hgetall(user_key(user_id))
    if raw.nil? || raw.empty?
      return { session_vec: nil, affinities: {}, clicks: 0,
               last_clicked_id: nil, last_clicked_category: nil }
    end
    session_raw = raw['session_vec']
    session_vec = session_raw && !session_raw.empty? ? bytes_to_vec(session_raw) : nil
    affinities = {}
    raw.each do |field, value|
      next unless field.start_with?('aff:')
      category = field[4..]
      f = Float(value) rescue nil
      affinities[category] = f if f
    end
    {
      session_vec: session_vec,
      affinities: affinities,
      clicks: (raw['clicks'] || '0').to_i,
      last_clicked_id: empty_to_nil(raw['last_clicked_id']),
      last_clicked_category: empty_to_nil(raw['last_clicked_category']),
    }
  end

  # Delete a user's feature hash. Next request starts cold.
  def reset_user(user_id)
    @redis.del(user_key(user_id))
  end

  # ------------------------------------------------------------------
  # Hot embedding refresh (no serving downtime)
  # ------------------------------------------------------------------

  # Overwrite the embedding for one product.
  #
  # The HNSW index reflects the change as soon as the `HSET` commits,
  # so subsequent `FT.SEARCH` calls see the new vector without any
  # index rebuild or serving downtime. The same call path is what an
  # offline retraining pipeline would use to roll out a re-trained
  # model: stream the new vectors into Redis and the serving tier
  # picks them up on the next query.
  #
  # Raises `KeyError` if `product_id` does not already exist -- `HSET`
  # would otherwise happily create a new key with only an `embedding`
  # field, which the index would then pick up as a partially-populated
  # document. Also rejects vectors with the wrong dimensionality so a
  # model swap doesn't quietly corrupt the index.
  def refresh_embedding(product_id, new_vector)
    raise ArgumentError, 'new_vector must respond to :length' unless new_vector.respond_to?(:length)
    if new_vector.length != @vector_dim
      raise ArgumentError,
            "new_vector has length #{new_vector.length}; index expects #{@vector_dim}"
    end
    key = product_key(product_id)
    raise KeyError, "unknown product #{product_id}" if @redis.exists(key).zero?
    @redis.hset(key, 'embedding', new_vector.pack('e*'))
  end

  # ------------------------------------------------------------------
  # Inspection
  # ------------------------------------------------------------------

  # Subset of `FT.INFO` useful for the demo UI.
  #
  # `FT.INFO` returns a flat key-value Array (`[k, v, k, v, ...]`).
  # redis-rb does not parse it; the helper walks the pairs and pulls
  # out the fields the demo needs.
  def index_info
    raw = @redis.call('FT.INFO', @index_name)
    info = flat_array_to_hash(raw)
    {
      'num_docs' => (info['num_docs'] || 0).to_i,
      'indexing_failures' => (info['hash_indexing_failures'] || 0).to_i,
      'vector_index_size_mb' => (info['vector_index_sz_mb'] || 0).to_f,
    }
  rescue Redis::CommandError
    { 'num_docs' => 0, 'indexing_failures' => 0, 'vector_index_size_mb' => 0.0 }
  end

  # Return every indexed product (metadata only, no vector). Used by
  # the demo to show the full catalogue and to know what IDs exist for
  # the "click" buttons.
  def list_products(limit: 100)
    raw = @redis.call(
      'FT.SEARCH', @index_name, '*',
      'RETURN', '6', 'name', 'category', 'brand', 'price', 'rating', 'in_stock',
      'LIMIT', '0', limit.to_s,
      'SORTBY', 'price'
    )
    decode_list_reply(raw)
  end

  def list_categories
    raw = @redis.call('FT.TAGVALS', @index_name, 'category')
    Array(raw).sort
  rescue Redis::CommandError
    []
  end

  def list_brands
    raw = @redis.call('FT.TAGVALS', @index_name, 'brand')
    Array(raw).sort
  rescue Redis::CommandError
    []
  end

  private

  def blend_vectors(query_vec, session_vec, session_weight)
    return query_vec if session_vec.nil? || session_weight <= 0
    mixed = Array.new(query_vec.length) do |i|
      (1.0 - session_weight) * query_vec[i] + session_weight * session_vec[i]
    end
    norm = Math.sqrt(mixed.sum { |x| x * x })
    return query_vec if norm == 0.0
    mixed.map! { |x| x / norm }
    mixed
  end

  # Decode raw little-endian float32 bytes back into an Array of Float.
  # Validates the byte length so a corrupted or wrong-dim field surfaces
  # a useful error here rather than as an opaque numeric or Redis
  # Search rejection later.
  def bytes_to_vec(raw)
    expected_bytes = @vector_dim * 4
    if raw.bytesize != expected_bytes
      raise ArgumentError,
            "expected #{expected_bytes} bytes for a #{@vector_dim}-dim " \
            "float32 vector, got #{raw.bytesize}"
    end
    raw.unpack('e*')
  end

  def empty_to_nil(value)
    return nil if value.nil? || value.empty?
    value
  end

  # FT.SEARCH replies look like
  #   [total, key1, [field, value, field, value, ...], key2, [...], ...]
  # The redis-rb gem returns the raw array. Walk it pair-by-pair so
  # the demo never has to deal with the wire format.
  def decode_search_reply(reply)
    return [] if reply.nil? || reply.length < 2
    out = []
    i = 1
    while i < reply.length
      raw_key = reply[i]
      pairs = reply[i + 1] || []
      i += 2
      fields = flat_array_to_hash(pairs)
      bare_id = raw_key.to_s.start_with?(@key_prefix) ? raw_key[@key_prefix.length..] : raw_key.to_s
      # `vector_score` is the cosine *distance* (0 = identical,
      # 2 = opposite); lower means closer. Initial `score` mirrors the
      # distance and may be reduced by `rerank`.
      distance = (fields['vector_score'] || '0').to_f
      out << Candidate.new(
        id: bare_id,
        name: fields['name'].to_s,
        description: fields['description'].to_s,
        category: fields['category'].to_s,
        brand: fields['brand'].to_s,
        price: (fields['price'] || '0').to_f,
        rating: (fields['rating'] || '0').to_f,
        in_stock: fields['in_stock'] == 'true',
        vector_distance: distance,
        score: distance,
      )
    end
    out
  end

  # Smaller cousin of `decode_search_reply` for the catalogue listing.
  def decode_list_reply(reply)
    return [] if reply.nil? || reply.length < 2
    out = []
    i = 1
    while i < reply.length
      raw_key = reply[i]
      pairs = reply[i + 1] || []
      i += 2
      fields = flat_array_to_hash(pairs)
      bare_id = raw_key.to_s.start_with?(@key_prefix) ? raw_key[@key_prefix.length..] : raw_key.to_s
      out << {
        'id' => bare_id,
        'name' => fields['name'].to_s,
        'category' => fields['category'].to_s,
        'brand' => fields['brand'].to_s,
        'price' => (fields['price'] || '0').to_f,
        'rating' => (fields['rating'] || '0').to_f,
        'in_stock' => fields['in_stock'] == 'true',
      }
    end
    out
  end

  def flat_array_to_hash(pairs)
    out = {}
    return out if pairs.nil?
    pairs.each_slice(2) { |k, v| out[k.to_s] = v }
    out
  end
end
