# EXAMPLE: cmds_sorted_set
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START zadd
# REMOVE_START
r.del('myzset')
# REMOVE_END
res1 = r.zadd('myzset', [[1, 'one']])
puts res1 # >>> 1

res2 = r.zadd('myzset', [[1, 'uno']])
puts res2 # >>> 1

res3 = r.zadd('myzset', [[2, 'two'], [3, 'three']])
puts res3 # >>> 2

res4 = r.zrange('myzset', 0, -1, with_scores: true)
puts res4.inspect
# >>> [["one", 1.0], ["uno", 1.0], ["two", 2.0], ["three", 3.0]]
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(1, res2)
assert_equal(2, res3)
assert_equal([['one', 1.0], ['uno', 1.0], ['two', 2.0], ['three', 3.0]], res4)
r.del('myzset')
# REMOVE_END

# STEP_START zrange1
# REMOVE_START
r.del('myzset')
# REMOVE_END
res5 = r.zadd('myzset', [[1, 'one'], [2, 'two'], [3, 'three']])
puts res5 # >>> 3

res6 = r.zrange('myzset', 0, -1)
puts res6.inspect # >>> ["one", "two", "three"]

res7 = r.zrange('myzset', 2, 3)
puts res7.inspect # >>> ["three"]

res8 = r.zrange('myzset', -2, -1)
puts res8.inspect # >>> ["two", "three"]
# STEP_END

# REMOVE_START
assert_equal(3, res5)
assert_equal(['one', 'two', 'three'], res6)
assert_equal(['three'], res7)
assert_equal(['two', 'three'], res8)
r.del('myzset')
# REMOVE_END

# STEP_START zrange2
# REMOVE_START
r.del('myzset')
# REMOVE_END
r.zadd('myzset', [[1, 'one'], [2, 'two'], [3, 'three']])

res9 = r.zrange('myzset', 0, 1, with_scores: true)
puts res9.inspect # >>> [["one", 1.0], ["two", 2.0]]
# STEP_END

# REMOVE_START
assert_equal([['one', 1.0], ['two', 2.0]], res9)
r.del('myzset')
# REMOVE_END

# STEP_START zrange3
# REMOVE_START
r.del('myzset')
# REMOVE_END
r.zadd('myzset', [[1, 'one'], [2, 'two'], [3, 'three']])

res10 = r.zrange('myzset', '(1', '+inf', by_score: true, limit: [1, 1])
puts res10.inspect # >>> ["three"]
# STEP_END

# REMOVE_START
assert_equal(['three'], res10)
r.del('myzset')
r.close
# REMOVE_END
