# EXAMPLE: ruby_home_query_vec
# STEP_START import
require 'redis'
require 'informers'

# A short alias for the Query Engine namespace to keep the code below readable.
Search = Redis::Commands::Search
# STEP_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START model
# `informers` is a Ruby port of Hugging Face transformers that runs the
# ONNX-exported `all-MiniLM-L6-v2` encoder locally through `onnxruntime`.
# `Informers.pipeline("embedding", ...)` returns a callable that maps a
# string to a 384-element `Array<Float>`. The model data is downloaded
# into the local Hugging Face cache on the first call.
model = Informers.pipeline('embedding', 'sentence-transformers/all-MiniLM-L6-v2')
# STEP_END

# STEP_START helper_method
# Redis Search stores a `FLOAT32` vector as raw little-endian bytes, with
# no header. Ruby's `Array#pack` directive `'e'` is a little-endian
# single-precision float, so `'e*'` packs every element of the vector.
# The result is an ASCII-8BIT (binary) string that `redis-rb` sends
# through unchanged.
def to_bytes(vector)
  vector.pack('e*')
end
# STEP_END

# STEP_START connect
r = Redis.new
# STEP_END

# STEP_START create_index
begin
  r.ft_dropindex('vector_idx', delete_documents: true)
rescue Redis::CommandError
  # Index doesn't exist, so there is nothing to drop.
end

schema = Search::Schema.build do
  text_field 'content'
  tag_field 'genre'
  vector_field 'embedding', 'HNSW',
               type: 'FLOAT32', dim: 384, distance_metric: 'L2'
end

definition = Search::IndexDefinition.new(
  prefix: ['doc:'],
  index_type: Search::IndexType::HASH
)

index = r.create_index('vector_idx', schema, definition: definition)
puts index.name # >>> vector_idx
# STEP_END

# STEP_START add_data
# Pass `normalize: true` so `informers` L2-normalises each embedding in
# the ONNX graph; the L2 distances Redis reports are then directly
# comparable across documents.
sentence1 = 'That is a very happy person'
r.hset('doc:0', {
  'content' => sentence1,
  'genre' => 'persons',
  'embedding' => to_bytes(model.(sentence1, pooling: 'mean', normalize: true))
})

sentence2 = 'That is a happy dog'
r.hset('doc:1', {
  'content' => sentence2,
  'genre' => 'pets',
  'embedding' => to_bytes(model.(sentence2, pooling: 'mean', normalize: true))
})

sentence3 = 'Today is a sunny day'
r.hset('doc:2', {
  'content' => sentence3,
  'genre' => 'weather',
  'embedding' => to_bytes(model.(sentence3, pooling: 'mean', normalize: true))
})
# STEP_END

# STEP_START query
query_text = 'That is a happy person'
query_vec = to_bytes(model.(query_text, pooling: 'mean', normalize: true))

res = index.search(
  '*=>[KNN 3 @embedding $vec AS vector_distance]',
  sort_by: 'vector_distance',
  return_fields: ['content', 'vector_distance'],
  params: { 'vec' => query_vec }
)

puts res.total # >>> 3
# The index has the key prefix `doc:`, so `redis-rb` returns the logical
# document id with that prefix removed (`0`, not `doc:0`).
res.each do |doc|
  puts "#{doc.id}: #{doc['content']} (distance #{doc['vector_distance']})"
end
# STEP_END
# REMOVE_START
assert_equal(3, res.total)
assert_equal(%w[0 1 2], res.documents.map(&:id))
assert_equal('0', res.documents.first.id)
# REMOVE_END

# STEP_START json_index
begin
  r.ft_dropindex('vector_json_idx', delete_documents: true)
rescue Redis::CommandError
  # Index doesn't exist, so there is nothing to drop.
end

json_schema = Search::Schema.build do
  text_field '$.content', as: 'content'
  tag_field '$.genre', as: 'genre'
  vector_field '$.embedding', 'HNSW', as: 'embedding',
               type: 'FLOAT32', dim: 384, distance_metric: 'L2'
end

json_definition = Search::IndexDefinition.new(
  prefix: ['jdoc:'],
  index_type: Search::IndexType::JSON
)

json_index = r.create_index('vector_json_idx', json_schema, definition: json_definition)
puts json_index.name # >>> vector_json_idx
# STEP_END

# STEP_START json_data
# For a JSON document, store the embedding as a plain `Array<Float>`
# (a JSON array), not the packed binary string used for hashes.
r.json_set('jdoc:0', '$', {
  'content' => sentence1,
  'genre' => 'persons',
  'embedding' => model.(sentence1, pooling: 'mean', normalize: true)
})

r.json_set('jdoc:1', '$', {
  'content' => sentence2,
  'genre' => 'pets',
  'embedding' => model.(sentence2, pooling: 'mean', normalize: true)
})

r.json_set('jdoc:2', '$', {
  'content' => sentence3,
  'genre' => 'weather',
  'embedding' => model.(sentence3, pooling: 'mean', normalize: true)
})
# STEP_END

# STEP_START json_query
# The query vector is still passed as a packed binary string, even though
# the stored `embedding` field is a JSON array.
json_res = json_index.search(
  '*=>[KNN 3 @embedding $vec AS vector_distance]',
  sort_by: 'vector_distance',
  return_fields: ['content', 'vector_distance'],
  params: { 'vec' => query_vec }
)

puts json_res.total # >>> 3
json_res.each do |doc|
  puts "#{doc.id}: #{doc['content']} (distance #{doc['vector_distance']})"
end
# STEP_END
# REMOVE_START
assert_equal(3, json_res.total)
assert_equal(%w[0 1 2], json_res.documents.map(&:id))
# REMOVE_END

r.close
