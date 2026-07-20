# EXAMPLE: set_and_get
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
r.del('bike:1')
# REMOVE_END

res1 = r.set('bike:1', 'Process 134')
puts res1 # >>> OK

res2 = r.get('bike:1')
puts res2 # >>> Process 134

# REMOVE_START
assert_equal('OK', res1)
assert_equal('Process 134', res2)
r.del('bike:1')
r.close
# REMOVE_END
