# EXAMPLE: cmds_list
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START lpush
# REMOVE_START
r.del('mylist')
# REMOVE_END
res1 = r.lpush('mylist', 'world')
puts res1 # >>> 1

res2 = r.lpush('mylist', 'hello')
puts res2 # >>> 2

res3 = r.lrange('mylist', 0, -1)
puts res3.inspect # >>> ["hello", "world"]
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(2, res2)
assert_equal(['hello', 'world'], res3)
r.del('mylist')
# REMOVE_END

# STEP_START lrange
# REMOVE_START
r.del('mylist')
# REMOVE_END
res4 = r.rpush('mylist', 'one')
puts res4 # >>> 1

res5 = r.rpush('mylist', 'two')
puts res5 # >>> 2

res6 = r.rpush('mylist', 'three')
puts res6 # >>> 3

res7 = r.lrange('mylist', 0, 0)
puts res7.inspect # >>> ["one"]

res8 = r.lrange('mylist', -3, 2)
puts res8.inspect # >>> ["one", "two", "three"]

res9 = r.lrange('mylist', -100, 100)
puts res9.inspect # >>> ["one", "two", "three"]

res10 = r.lrange('mylist', 5, 10)
puts res10.inspect # >>> []
# STEP_END

# REMOVE_START
assert_equal(['one'], res7)
assert_equal(['one', 'two', 'three'], res8)
assert_equal(['one', 'two', 'three'], res9)
assert_equal([], res10)
r.del('mylist')
# REMOVE_END

# STEP_START llen
# REMOVE_START
r.del('mylist')
# REMOVE_END
res11 = r.lpush('mylist', 'World')
puts res11 # >>> 1

res12 = r.lpush('mylist', 'Hello')
puts res12 # >>> 2

res13 = r.llen('mylist')
puts res13 # >>> 2
# STEP_END

# REMOVE_START
assert_equal(2, res13)
r.del('mylist')
# REMOVE_END

# STEP_START rpush
# REMOVE_START
r.del('mylist')
# REMOVE_END
res14 = r.rpush('mylist', 'hello')
puts res14 # >>> 1

res15 = r.rpush('mylist', 'world')
puts res15 # >>> 2

res16 = r.lrange('mylist', 0, -1)
puts res16.inspect # >>> ["hello", "world"]
# STEP_END

# REMOVE_START
assert_equal(['hello', 'world'], res16)
r.del('mylist')
# REMOVE_END

# STEP_START lpop
# REMOVE_START
r.del('mylist')
# REMOVE_END
res17 = r.rpush('mylist', ['one', 'two', 'three', 'four', 'five'])
puts res17 # >>> 5

res18 = r.lpop('mylist')
puts res18 # >>> one

res19 = r.lpop('mylist', 2)
puts res19.inspect # >>> ["two", "three"]

res20 = r.lrange('mylist', 0, -1)
puts res20.inspect # >>> ["four", "five"]
# STEP_END

# REMOVE_START
assert_equal('one', res18)
assert_equal(['two', 'three'], res19)
assert_equal(['four', 'five'], res20)
r.del('mylist')
# REMOVE_END

# STEP_START rpop
# REMOVE_START
r.del('mylist')
# REMOVE_END
res21 = r.rpush('mylist', ['one', 'two', 'three', 'four', 'five'])
puts res21 # >>> 5

res22 = r.rpop('mylist')
puts res22 # >>> five

res23 = r.rpop('mylist', 2)
puts res23.inspect # >>> ["four", "three"]

res24 = r.lrange('mylist', 0, -1)
puts res24.inspect # >>> ["one", "two"]
# STEP_END

# REMOVE_START
assert_equal('five', res22)
assert_equal(['four', 'three'], res23)
assert_equal(['one', 'two'], res24)
r.del('mylist')
r.close
# REMOVE_END
