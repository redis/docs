# EXAMPLE: ruby_home_json
# STEP_START import
require 'redis'

# A short alias for the Query Engine namespace to keep the code below readable.
Search = Redis::Commands::Search
# STEP_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START create_data
user1 = {
  'name' => 'Paul John',
  'email' => 'paul.john@example.com',
  'age' => 42,
  'city' => 'London'
}

user2 = {
  'name' => 'Eden Zamir',
  'email' => 'eden.zamir@example.com',
  'age' => 29,
  'city' => 'Tel Aviv'
}

user3 = {
  'name' => 'Paul Zamir',
  'email' => 'paul.zamir@example.com',
  'age' => 35,
  'city' => 'Tel Aviv'
}
# STEP_END

# STEP_START connect
r = Redis.new
# STEP_END

# STEP_START cleanup_json
begin
  r.ft_dropindex('idx:users', delete_documents: true)
rescue Redis::CommandError
  # Index doesn't exist, so there is nothing to drop.
end

r.del('user:1', 'user:2', 'user:3')
# STEP_END

# STEP_START make_index
schema = Search::Schema.build do
  text_field '$.name', as: 'name'
  tag_field '$.city', as: 'city'
  numeric_field '$.age', as: 'age'
end

definition = Search::IndexDefinition.new(
  prefix: ['user:'],
  index_type: Search::IndexType::JSON
)

index = r.create_index('idx:users', schema, definition: definition)
puts index.name # >>> idx:users
# STEP_END

# STEP_START add_data
user1_set = r.json_set('user:1', '$', user1)
user2_set = r.json_set('user:2', '$', user2)
user3_set = r.json_set('user:3', '$', user3)
puts [user1_set, user2_set, user3_set].inspect # >>> ["OK", "OK", "OK"]
# STEP_END
# REMOVE_START
assert_equal('OK', user1_set)
assert_equal('OK', user2_set)
assert_equal('OK', user3_set)
# REMOVE_END

# STEP_START query1
find_paul_result = index.search('Paul @age:[30 40]')

puts find_paul_result.total # >>> 1
# The index has the key prefix `user:`, so the client returns the
# logical document id with that prefix removed.
find_paul_result.each { |doc| puts doc.id } # >>> 3
# STEP_END
# REMOVE_START
assert_equal(1, find_paul_result.total)
assert_equal('3', find_paul_result.documents.first.id)
# REMOVE_END

# STEP_START query2
cities_query = Search::Query.new('Paul').return_field('$.city', as_field: 'city')
cities_result = index.search(cities_query)

cities_result.documents.sort_by(&:id).each do |doc|
  puts "#{doc.id}: #{doc['city']}"
end
# >>> 1: London
# >>> 3: Tel Aviv
# STEP_END
# REMOVE_START
sorted_cities = cities_result.documents.sort_by(&:id)
assert_equal(%w[1 3], sorted_cities.map(&:id))
assert_equal(['London', 'Tel Aviv'], sorted_cities.map { |doc| doc['city'] })
# REMOVE_END

# STEP_START query3
request = Search::AggregateRequest.new('*')
                                  .group_by('@city', Search::Reducers.count.as('count'))

agg_result = index.aggregate(request)

agg_result.rows.sort_by { |row| row['city'] }.each do |row|
  puts "#{row['city']} - #{row['count']}"
end
# >>> London - 1
# >>> Tel Aviv - 2
# STEP_END
# REMOVE_START
sorted_rows = agg_result.rows.sort_by { |row| row['city'] }
assert_equal(['London', 'Tel Aviv'], sorted_rows.map { |row| row['city'] })
assert_equal(%w[1 2], sorted_rows.map { |row| row['count'] })
# REMOVE_END

# STEP_START cleanup_hash
begin
  r.ft_dropindex('hash-idx:users', delete_documents: true)
rescue Redis::CommandError
  # Index doesn't exist, so there is nothing to drop.
end

r.del('huser:1', 'huser:2', 'huser:3')
# STEP_END

# STEP_START make_hash_index
hash_schema = Search::Schema.build do
  text_field 'name'
  tag_field 'city'
  numeric_field 'age'
end

hash_definition = Search::IndexDefinition.new(
  prefix: ['huser:'],
  index_type: Search::IndexType::HASH
)

hash_index = r.create_index('hash-idx:users', hash_schema, definition: hash_definition)
puts hash_index.name # >>> hash-idx:users
# STEP_END

# STEP_START add_hash_data
huser1_set = r.hset('huser:1', user1)
huser2_set = r.hset('huser:2', user2)
huser3_set = r.hset('huser:3', user3)
puts [huser1_set, huser2_set, huser3_set].inspect # >>> [4, 4, 4]
# STEP_END
# REMOVE_START
assert_equal(4, huser1_set)
assert_equal(4, huser2_set)
assert_equal(4, huser3_set)
# REMOVE_END

# STEP_START query1_hash
find_paul_hash_result = hash_index.search('Paul @age:[30 40]')

puts find_paul_hash_result.total # >>> 1
find_paul_hash_result.each do |doc|
  puts "#{doc.id}: #{doc['name']}, #{doc['city']}"
end
# >>> 3: Paul Zamir, Tel Aviv
# STEP_END
# REMOVE_START
assert_equal(1, find_paul_hash_result.total)
assert_equal('3', find_paul_hash_result.documents.first.id)
# REMOVE_END

r.close
