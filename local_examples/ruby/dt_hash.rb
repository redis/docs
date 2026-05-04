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
res5 = r.hmget('bike:1', 'model', 'price', 'no-such-field')
puts res5.inspect # ["Deimos", "4972", nil]
# STEP_END

# REMOVE_START
assert_equal(['Deimos', '4972', nil], res5)
# REMOVE_END

# STEP_START hincrby
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
r.close
# REMOVE_END
