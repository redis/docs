# EXAMPLE: sets_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

def assert_same_members(expected, actual)
  assert_equal(expected.sort, actual.sort)
end

r.del('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy')
# REMOVE_END

# STEP_START sadd
res1 = r.sadd('bikes:racing:france', ['bike:1'])
puts res1 # 1

res2 = r.sadd('bikes:racing:france', ['bike:1'])
puts res2 # 0

res3 = r.sadd('bikes:racing:france', ['bike:2', 'bike:3'])
puts res3 # 2

res4 = r.sadd('bikes:racing:usa', ['bike:1', 'bike:4'])
puts res4 # 2
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(0, res2)
assert_equal(2, res3)
assert_equal(2, res4)
# REMOVE_END

# STEP_START sismember
# HIDE_START
r.del('bikes:racing:france', 'bikes:racing:usa')
r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
r.sadd('bikes:racing:usa', ['bike:1', 'bike:4'])
# HIDE_END
res5 = r.sismember('bikes:racing:usa', 'bike:1')
puts res5 # true

res6 = r.sismember('bikes:racing:usa', 'bike:2')
puts res6 # false
# STEP_END

# REMOVE_START
assert_equal(true, res5)
assert_equal(false, res6)
# REMOVE_END

# STEP_START sinter
# HIDE_START
r.del('bikes:racing:france', 'bikes:racing:usa')
r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
r.sadd('bikes:racing:usa', ['bike:1', 'bike:4'])
# HIDE_END
res7 = r.sinter('bikes:racing:france', 'bikes:racing:usa')
puts res7.inspect # ["bike:1"]
# STEP_END

# REMOVE_START
assert_equal(['bike:1'], res7)
# REMOVE_END

# STEP_START scard
# HIDE_START
r.del('bikes:racing:france')
r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
# HIDE_END
res8 = r.scard('bikes:racing:france')
puts res8 # 3
# STEP_END

# REMOVE_START
assert_equal(3, res8)
# REMOVE_END

# STEP_START sadd_smembers
r.del('bikes:racing:france')

res9 = r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
puts res9 # 3

res10 = r.smembers('bikes:racing:france')
puts res10.sort.inspect # ["bike:1", "bike:2", "bike:3"]
# STEP_END

# REMOVE_START
assert_equal(3, res9)
assert_same_members(['bike:1', 'bike:2', 'bike:3'], res10)
# REMOVE_END

# STEP_START smismember
res11 = r.sismember('bikes:racing:france', 'bike:1')
puts res11 # true

res12 = r.smismember('bikes:racing:france', 'bike:2', 'bike:3', 'bike:4')
puts res12.inspect # [true, true, false]
# STEP_END

# REMOVE_START
assert_equal(true, res11)
assert_equal([true, true, false], res12)
# REMOVE_END

# STEP_START sdiff
r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
r.sadd('bikes:racing:usa', ['bike:1', 'bike:4'])

res13 = r.sdiff('bikes:racing:france', 'bikes:racing:usa')
puts res13.sort.inspect # ["bike:2", "bike:3"]
# STEP_END

# REMOVE_START
assert_same_members(['bike:2', 'bike:3'], res13)
# REMOVE_END

# STEP_START multisets
r.del('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy')

r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3'])
r.sadd('bikes:racing:usa', ['bike:1', 'bike:4'])
r.sadd('bikes:racing:italy', ['bike:1', 'bike:2', 'bike:3', 'bike:4'])

res14 = r.sinter('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy')
puts res14.inspect # ["bike:1"]

res15 = r.sunion('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy')
puts res15.sort.inspect # ["bike:1", "bike:2", "bike:3", "bike:4"]

res16 = r.sdiff('bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy')
puts res16.inspect # []

res17 = r.sdiff('bikes:racing:france', 'bikes:racing:usa')
puts res17.sort.inspect # ["bike:2", "bike:3"]

res18 = r.sdiff('bikes:racing:usa', 'bikes:racing:france')
puts res18.inspect # ["bike:4"]
# STEP_END

# REMOVE_START
assert_equal(['bike:1'], res14)
assert_same_members(['bike:1', 'bike:2', 'bike:3', 'bike:4'], res15)
assert_equal([], res16)
assert_same_members(['bike:2', 'bike:3'], res17)
assert_equal(['bike:4'], res18)
# REMOVE_END

# STEP_START srem
r.del('bikes:racing:france')

r.sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5'])

res19 = r.srem('bikes:racing:france', ['bike:1'])
puts res19 # 1

res20 = r.spop('bikes:racing:france')
puts res20 # bike:3, for example

res21 = r.smembers('bikes:racing:france')
puts res21.sort.inspect # Remaining members, in no particular order

res22 = r.srandmember('bikes:racing:france')
puts res22 # bike:4, for example
# STEP_END

# REMOVE_START
assert_equal(1, res19)
raise 'Expected SPOP to return one member' unless res20
raise 'Expected three members after SREM and SPOP' unless res21.length == 3
raise 'Expected popped member to be removed' if res21.include?(res20)
raise 'Expected random member to come from the set' unless res21.include?(res22)
r.close
# REMOVE_END
