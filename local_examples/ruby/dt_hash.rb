# EXAMPLE: hash_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('bike:1', 'bike:1:stats')
# REMOVE_END

# STEP_START set_get_all
res1 = r.hset('bike:1', {
  'model' => 'Deimos',
  'brand' => 'Ergonom',
  'type' => 'Enduro bikes',
  'price' => 4972
})
puts res1 # 4

res2 = r.hget('bike:1', 'model')
puts res2 # Deimos

res3 = r.hget('bike:1', 'price')
puts res3 # 4972

res4 = r.hgetall('bike:1')
puts res4.inspect
# {"model"=>"Deimos", "brand"=>"Ergonom", "type"=>"Enduro bikes", "price"=>"4972"}
# STEP_END

# REMOVE_START
assert_equal(4, res1)
assert_equal('Deimos', res2)
assert_equal('4972', res3)
assert_equal({
  'model' => 'Deimos',
  'brand' => 'Ergonom',
  'type' => 'Enduro bikes',
  'price' => '4972'
}, res4)
# REMOVE_END

# STEP_START hmget
# Recreate the bike:1 hash so this example runs on its own.
r.del('bike:1')
r.hset('bike:1', {
  'model' => 'Deimos',
  'brand' => 'Ergonom',
  'type' => 'Enduro bikes',
  'price' => 4972
})

res5 = r.hmget('bike:1', 'model', 'price', 'no-such-field')
puts res5.inspect # ["Deimos", "4972", nil]
# STEP_END

# REMOVE_START
assert_equal(['Deimos', '4972', nil], res5)
# REMOVE_END

# STEP_START hincrby
# Recreate the bike:1 hash so this example runs on its own.
r.del('bike:1')
r.hset('bike:1', {
  'model' => 'Deimos',
  'brand' => 'Ergonom',
  'type' => 'Enduro bikes',
  'price' => 4972
})

res6 = r.hincrby('bike:1', 'price', 100)
puts res6 # 5072

res7 = r.hincrby('bike:1', 'price', -100)
puts res7 # 4972
# STEP_END

# REMOVE_START
assert_equal(5072, res6)
assert_equal(4972, res7)
# REMOVE_END

# STEP_START incrby_get_mget
res8 = r.hincrby('bike:1:stats', 'rides', 1)
puts res8 # 1

res9 = r.hincrby('bike:1:stats', 'rides', 1)
puts res9 # 2

res10 = r.hincrby('bike:1:stats', 'rides', 1)
puts res10 # 3

res11 = r.hincrby('bike:1:stats', 'crashes', 1)
puts res11 # 1

res12 = r.hincrby('bike:1:stats', 'owners', 1)
puts res12 # 1

res13 = r.hget('bike:1:stats', 'rides')
puts res13 # 3

res14 = r.hmget('bike:1:stats', 'owners', 'crashes')
puts res14.inspect # ["1", "1"]
# STEP_END

# REMOVE_START
assert_equal(1, res8)
assert_equal(2, res9)
assert_equal(3, res10)
assert_equal(1, res11)
assert_equal(1, res12)
assert_equal('3', res13)
assert_equal(['1', '1'], res14)
# REMOVE_END

# STEP_START hexpire
# Recreate the sensor:sensor1 hash so this example runs on its own.
r.del('sensor:sensor1')
r.hset('sensor:sensor1', { 'air_quality' => 256, 'battery_level' => 89 })

# Set a TTL of 60 seconds on two fields of the hash.
res15 = r.hexpire('sensor:sensor1', 60, 'air_quality', 'battery_level')
puts res15.inspect # [1, 1]

# Retrieve the remaining TTL for those fields.
res16 = r.httl('sensor:sensor1', 'air_quality', 'battery_level')
puts res16.length # 2 (each value is close to 60)
# STEP_END

# REMOVE_START
assert_equal([1, 1], res15)
raise 'Unexpected TTL' unless res16.length == 2 && res16.all? { |ttl| ttl > 0 && ttl <= 60 }
# REMOVE_END

# STEP_START hpexpire
# Recreate the sensor:sensor1 hash so this example runs on its own.
r.del('sensor:sensor1')
r.hset('sensor:sensor1', { 'air_quality' => 256, 'battery_level' => 89 })

# Set the TTL of the 'air_quality' field in milliseconds.
res17 = r.hpexpire('sensor:sensor1', 60000, 'air_quality')
puts res17.inspect # [1]

# Retrieve the remaining TTL in milliseconds.
res18 = r.hpttl('sensor:sensor1', 'air_quality')
puts res18.length # 1 (the value is close to 60000)
# STEP_END

# REMOVE_START
assert_equal([1], res17)
raise 'Unexpected PTTL' unless res18.length == 1 && res18.all? { |pttl| pttl > 0 && pttl <= 60000 }
r.close
# REMOVE_END
