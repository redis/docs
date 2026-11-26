# EXAMPLE: cmds_set_expiration
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

def assert_in_range(range, actual)
  raise "Expected #{actual.inspect} in #{range.inspect}" unless range.cover?(actual)
end
# REMOVE_END

# STEP_START saddex
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.saddex('myset', 'member1', 'member2', ex: 300)
puts res1 # >>> 1

res2 = r.sttl('myset', 'member1', 'member2')
puts res2.inspect # >>> [300, 300]

res3 = r.saddex('myset', 'member2', 'member3', ex: 60, mnx: true)
puts res3 # >>> 0

res4 = r.saddex('myset', 'member1', 'member3', keepttl: true)
puts res4 # >>> 1

res5 = r.sttl('myset', 'member1', 'member2', 'member3')
puts res5.inspect # >>> [300, 300, -1]
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal([300, 300], res2)
assert_equal(0, res3)
assert_equal(1, res4)
assert_equal([300, 300, -1], res5)
r.del('myset')
# REMOVE_END

# STEP_START sexpire
# REMOVE_START
r.del('myset', 'no-key')
# REMOVE_END
res1 = r.sexpire('no-key', 20, 'member1', 'member2', nx: true)
puts res1.inspect # >>> [-2, -2]

res2 = r.sadd('myset', ['member1', 'member2'])
puts res2 # >>> 2

res3 = r.sexpire('myset', 10, 'member1', 'member2', 'member3')
puts res3.inspect # >>> [1, 1, -2]

res4 = r.sexpire('myset', 20, 'member1', nx: true)
puts res4.inspect # >>> [0]

res5 = r.sexpire('myset', 20, 'member1', gt: true)
puts res5.inspect # >>> [1]

res6 = r.sttl('myset', 'member1', 'member2')
puts res6.inspect # >>> [20, 10]
# STEP_END

# REMOVE_START
assert_equal([-2, -2], res1)
assert_equal(2, res2)
assert_equal([1, 1, -2], res3)
assert_equal([0], res4)
assert_equal([1], res5)
assert_equal([20, 10], res6)
r.del('myset')
# REMOVE_END

# STEP_START spexpire
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.spexpire('myset', 2000, 'member1', 'member2')
puts res2.inspect # >>> [1, 1]

res3 = r.spexpire('myset', 500, 'member1', lt: true)
puts res3.inspect # >>> [1]

res4 = r.spttl('myset', 'member1', 'member2')
puts res4.inspect # >>> [491, 1982] (for example)
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1, 1], res2)
assert_equal([1], res3)
assert_in_range(1..500, res4[0])
assert_in_range(501..2000, res4[1])
r.del('myset')
# REMOVE_END

# STEP_START sexpireat
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.sexpireat('myset', 4102444800, 'member1')
puts res2.inspect # >>> [1]

res3 = r.sexpiretime('myset', 'member1', 'member2')
puts res3.inspect # >>> [4102444800, -1]

# A timestamp in the past deletes the member immediately.
res4 = r.sexpireat('myset', 1, 'member2')
puts res4.inspect # >>> [2]

res5 = r.smembers('myset')
puts res5.inspect # >>> ["member1"]
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1], res2)
assert_equal([4102444800, -1], res3)
assert_equal([2], res4)
assert_equal(['member1'], res5)
r.del('myset')
# REMOVE_END

# STEP_START spexpireat
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.spexpireat('myset', 4102444800000, 'member1')
puts res2.inspect # >>> [1]

res3 = r.spexpireat('myset', 4102444800000, 'member2', xx: true)
puts res3.inspect # >>> [0]

res4 = r.spexpiretime('myset', 'member1', 'member2')
puts res4.inspect # >>> [4102444800000, -1]
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1], res2)
assert_equal([0], res3)
assert_equal([4102444800000, -1], res4)
r.del('myset')
# REMOVE_END

# STEP_START sexpiretime
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.sexpire('myset', 300, 'member1')
puts res2.inspect # >>> [1]

res3 = r.sexpiretime('myset', 'member1', 'member2', 'member3')
puts res3.inspect # >>> [1792684428, -1, -2] (for example)
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1], res2)
assert_in_range((Time.now.to_f + 295)..(Time.now.to_f + 305), res3[0])
assert_equal([-1, -2], res3[1..])
r.del('myset')
# REMOVE_END

# STEP_START spexpiretime
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.spexpire('myset', 300000, 'member1')
puts res2.inspect # >>> [1]

res3 = r.spexpiretime('myset', 'member1', 'member2', 'member3')
puts res3.inspect # >>> [1792684427589, -1, -2] (for example)
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1], res2)
now_ms = Time.now.to_f * 1000
assert_in_range((now_ms + 295000)..(now_ms + 305000), res3[0])
assert_equal([-1, -2], res3[1..])
r.del('myset')
# REMOVE_END

# STEP_START sttl
# REMOVE_START
r.del('myset', 'no-key')
# REMOVE_END
res1 = r.sttl('no-key', 'member1', 'member2')
puts res1.inspect # >>> [-2, -2]

res2 = r.sadd('myset', ['member1', 'member2'])
puts res2 # >>> 2

res3 = r.sexpire('myset', 300, 'member1', 'member3')
puts res3.inspect # >>> [1, -2]

res4 = r.sttl('myset', 'member1', 'member2', 'member3')
puts res4.inspect # >>> [300, -1, -2]
# STEP_END

# REMOVE_START
assert_equal([-2, -2], res1)
assert_equal(2, res2)
assert_equal([1, -2], res3)
assert_equal([300, -1, -2], res4)
r.del('myset')
# REMOVE_END

# STEP_START spttl
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.spexpire('myset', 300000, 'member1')
puts res2.inspect # >>> [1]

res3 = r.spttl('myset', 'member1', 'member2', 'member3')
puts res3.inspect # >>> [299993, -1, -2] (for example)
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1], res2)
assert_in_range(295001..300000, res3[0])
assert_equal([-1, -2], res3[1..])
r.del('myset')
# REMOVE_END

# STEP_START spersist
# REMOVE_START
r.del('myset')
# REMOVE_END
res1 = r.sadd('myset', ['member1', 'member2'])
puts res1 # >>> 2

res2 = r.sexpire('myset', 300, 'member1', 'member2')
puts res2.inspect # >>> [1, 1]

res3 = r.spersist('myset', 'member2')
puts res3.inspect # >>> [1]

res4 = r.sttl('myset', 'member1', 'member2')
puts res4.inspect # >>> [300, -1]

res5 = r.spersist('myset', 'member2', 'member3')
puts res5.inspect # >>> [-1, -2]
# STEP_END

# REMOVE_START
assert_equal(2, res1)
assert_equal([1, 1], res2)
assert_equal([1], res3)
assert_equal([300, -1], res4)
assert_equal([-1, -2], res5)
r.del('myset')
r.close
# REMOVE_END
