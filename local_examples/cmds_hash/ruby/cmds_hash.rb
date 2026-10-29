# EXAMPLE: cmds_hash
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('myhash')
# REMOVE_END

# STEP_START hdel
res1 = r.hset('myhash', 'field1', 'foo')
puts res1 # >>> 1

res2 = r.hdel('myhash', 'field1')
puts res2 # >>> 1

res3 = r.hdel('myhash', 'field2')
puts res3 # >>> 0
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(1, res2)
assert_equal(0, res3)
r.del('myhash')
# REMOVE_END

# STEP_START hset
res4 = r.hset('myhash', 'field1', 'Hello')
puts res4 # >>> 1

res5 = r.hget('myhash', 'field1')
puts res5 # >>> Hello

res6 = r.hset('myhash', { 'field2' => 'Hi', 'field3' => 'World' })
puts res6 # >>> 2

res7 = r.hget('myhash', 'field2')
puts res7 # >>> Hi

res8 = r.hget('myhash', 'field3')
puts res8 # >>> World

res9 = r.hgetall('myhash')
puts res9.inspect
# >>> {"field1"=>"Hello", "field2"=>"Hi", "field3"=>"World"}
# STEP_END

# REMOVE_START
assert_equal(1, res4)
assert_equal('Hello', res5)
assert_equal(2, res6)
assert_equal('Hi', res7)
assert_equal('World', res8)
assert_equal({ 'field1' => 'Hello', 'field2' => 'Hi', 'field3' => 'World' }, res9)
r.del('myhash')
# REMOVE_END

# STEP_START hget
res10 = r.hset('myhash', 'field1', 'foo')
puts res10 # >>> 1

res11 = r.hget('myhash', 'field1')
puts res11 # >>> foo

res12 = r.hget('myhash', 'field2')
puts res12.inspect # >>> nil
# STEP_END

# REMOVE_START
assert_equal(1, res10)
assert_equal('foo', res11)
assert_equal(nil, res12)
r.del('myhash')
# REMOVE_END

# STEP_START hmget
r.hset('myhash', { 'field1' => 'Hello', 'field2' => 'World' })

res13 = r.hmget('myhash', 'field1', 'field2', 'nofield')
puts res13.inspect # >>> ["Hello", "World", nil]
# STEP_END

# REMOVE_START
assert_equal(['Hello', 'World', nil], res13)
r.del('myhash')
# REMOVE_END

# STEP_START hgetall
r.hset('myhash', { 'field1' => 'Hello', 'field2' => 'World' })

res14 = r.hgetall('myhash')
puts res14.inspect # >>> {"field1"=>"Hello", "field2"=>"World"}
# STEP_END

# REMOVE_START
assert_equal({ 'field1' => 'Hello', 'field2' => 'World' }, res14)
r.del('myhash')
# REMOVE_END

# STEP_START hvals
r.hset('myhash', { 'field1' => 'Hello', 'field2' => 'World' })

# HVALS follows the hash's field order, which Redis does not promise, so sort.
res15 = r.hvals('myhash').sort
puts res15.inspect # >>> ["Hello", "World"]
# STEP_END

# REMOVE_START
assert_equal(['Hello', 'World'], res15)
r.del('myhash')
# REMOVE_END

# STEP_START hexpire
# Set up a hash with two fields.
r.hset('myhash', { 'field1' => 'Hello', 'field2' => 'World' })

# Set an expiration on both fields.
res16 = r.hexpire('myhash', 10, 'field1', 'field2')
puts res16.inspect # >>> [1, 1]

# Check the TTL of the fields.
res17 = r.httl('myhash', 'field1', 'field2')
puts res17.inspect # >>> [10, 10]

# Try to set an expiration on a field that does not exist.
res18 = r.hexpire('myhash', 10, 'nonexistent')
puts res18.inspect # >>> [-2]
# STEP_END

# REMOVE_START
assert_equal([1, 1], res16)
assert_equal(true, res17.all? { |ttl| ttl > 0 })
assert_equal([-2], res18)
r.del('myhash')
# REMOVE_END

# STEP_START hlen
res19 = r.hset('myhash', 'field1', 'Hello')
puts res19 # >>> 1

res20 = r.hset('myhash', 'field2', 'World')
puts res20 # >>> 1

res21 = r.hlen('myhash')
puts res21 # >>> 2
# STEP_END

# REMOVE_START
assert_equal(1, res19)
assert_equal(1, res20)
assert_equal(2, res21)
r.del('myhash')
r.close
# REMOVE_END
