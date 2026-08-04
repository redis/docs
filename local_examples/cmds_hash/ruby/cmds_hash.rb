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

# STEP_START hlen
res1 = r.hset('myhash', 'field1', 'Hello')
puts res1 # >>> 1

res2 = r.hset('myhash', 'field2', 'World')
puts res2 # >>> 1

res3 = r.hlen('myhash')
puts res3 # >>> 2
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(1, res2)
assert_equal(2, res3)
r.del('myhash')
r.close
# REMOVE_END
