# EXAMPLE: cmds_servermgmt
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START flushall
res1 = r.flushall # or r.flushall(async: true)
puts res1 # >>> OK

res2 = r.keys('*')
puts res2.inspect # >>> []
# STEP_END

# REMOVE_START
assert_equal('OK', res1)
assert_equal([], res2)
# REMOVE_END

# STEP_START info
res3 = r.info
puts res3['redis_version']
# >>> 7.4.0
# STEP_END

# REMOVE_START
raise 'info missing redis_version' unless res3.key?('redis_version')
r.close
# REMOVE_END
