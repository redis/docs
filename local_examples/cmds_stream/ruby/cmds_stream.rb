# EXAMPLE: cmds_stream
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END

# STEP_START xadd1
# REMOVE_START
r.del('mystream')
# REMOVE_END
res1 = r.xadd('mystream', { 'name' => 'Sara', 'surname' => 'OConnor' })
puts res1 # >>> 1726055713866-0

res2 = r.xadd('mystream', { 'field1' => 'value1', 'field2' => 'value2', 'field3' => 'value3' })
puts res2 # >>> 1726055713866-1

res3 = r.xlen('mystream')
puts res3 # >>> 2

res4 = r.xrange('mystream', '-', '+')
puts res4.inspect
# >>> [
#   ["1726055713866-0", {"name"=>"Sara", "surname"=>"OConnor"}],
#   ["1726055713866-1", {"field1"=>"value1", "field2"=>"value2", "field3"=>"value3"}]
# ]
# STEP_END

# REMOVE_START
assert_equal(2, res3)
assert_equal(2, res4.length)
assert_equal({ 'name' => 'Sara', 'surname' => 'OConnor' }, res4[0][1])
assert_equal({ 'field1' => 'value1', 'field2' => 'value2', 'field3' => 'value3' }, res4[1][1])
r.del('mystream')
r.close
# REMOVE_END
