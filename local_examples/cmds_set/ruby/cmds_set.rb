# EXAMPLE: cmds_set
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START sadd
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['Hello', 'World'])
puts res1 # >>> 2

res2 = r.sadd('myset', ['World'])
puts res2 # >>> 0

res3 = r.smembers('myset')
puts res3.inspect # >>> ["Hello", "World"]
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal(0, res2)
assert_equal(['Hello', 'World'], res3.sort)
r.del('myset')
# REMOVE_END

# STEP_START smembers
# REMOVE_START
r.del('myset')
# REMOVE_END
res4 = r.sadd('myset', ['Hello', 'World'])
puts res4 # >>> 2

res5 = r.smembers('myset')
puts res5.inspect # >>> ["Hello", "World"]
# STEP_END

# REMOVE_START
assert_equal(2, res4)
assert_equal(['Hello', 'World'], res5.sort)
r.del('myset')
r.close
# REMOVE_END
