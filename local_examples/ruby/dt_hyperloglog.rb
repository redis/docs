# EXAMPLE: hll_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('bikes', 'commuter_bikes', 'all_bikes')
# REMOVE_END

# STEP_START pfadd
res1 = r.pfadd('bikes', ['Hyperion', 'Deimos', 'Phoebe', 'Quaoar'])
puts res1 # true

res2 = r.pfcount('bikes')
puts res2 # 4

res3 = r.pfadd('commuter_bikes', ['Salacia', 'Mimas', 'Quaoar'])
puts res3 # true

res4 = r.pfmerge('all_bikes', 'bikes', 'commuter_bikes')
puts res4 # true

res5 = r.pfcount('all_bikes')
puts res5 # 6
# STEP_END

# REMOVE_START
assert_equal(true, res1)
assert_equal(4, res2)
assert_equal(true, res3)
assert_equal(true, res4)
assert_equal(6, res5)
r.del('bikes', 'commuter_bikes', 'all_bikes')
r.close
# REMOVE_END
