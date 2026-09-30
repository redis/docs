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
# REMOVE_END

# STEP_START xadd2
res5 = r.call('XADD', 'mystream', 'IDMP', 'producer1', 'msg1', '*', 'field', 'value')
puts res5 # >>> 1726055713867-0

# Attempting to add the same message again with IDMP returns the original entry ID
res6 = r.call('XADD', 'mystream', 'IDMP', 'producer1', 'msg1', '*', 'field', 'different_value')
puts res6 # >>> 1726055713867-0 (same ID as res5, message was deduplicated)

res7 = r.call('XADD', 'mystream', 'IDMPAUTO', 'producer2', '*', 'field', 'value')
puts res7 # >>> 1726055713867-1

# Auto-generated idempotent ID prevents duplicates for same producer+content
res8 = r.call('XADD', 'mystream', 'IDMPAUTO', 'producer2', '*', 'field', 'value')
puts res8 # >>> 1726055713867-1 (same ID as res7, duplicate detected)

# Configure idempotent message processing settings
res9 = r.call('XCFGSET', 'mystream', 'IDMP-DURATION', 300, 'IDMP-MAXSIZE', 1000)
puts res9 # >>> OK
# STEP_END

# REMOVE_START
assert_equal(res5, res6)
assert_equal(res7, res8)
r.del('mystream')
r.close
# REMOVE_END
