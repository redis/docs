# EXAMPLE: arrays_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('events:1')
# REMOVE_END

# STEP_START arset_arget
res1 = r.arset('events:1', 0, 'login', 'click', 'purchase')
puts res1 # 3

res2 = r.arget('events:1', 0)
puts res2 # login

res3 = r.arget('events:1', 999)
puts res3.inspect # nil
# STEP_END

# REMOVE_START
assert_equal(3, res1)
assert_equal('login', res2)
assert_equal(nil, res3)
r.del('events:1')
# REMOVE_END

# REMOVE_START
r.del('metrics')
# REMOVE_END

# STEP_START armset_armget
res4 = r.armset('metrics', { 0 => '10', 5 => '20', 100 => '30' })
puts res4 # 3

res5 = r.armget('metrics', 0, 5, 100, 999)
puts res5.inspect # ["10", "20", "30", nil]
# STEP_END

# REMOVE_START
assert_equal(3, res4)
assert_equal(['10', '20', '30', nil], res5)
r.del('metrics')
# REMOVE_END

# REMOVE_START
r.del('sparse')
# REMOVE_END

# STEP_START len_count
res6 = r.arset('sparse', 0, 'a')
puts res6 # 1

res7 = r.arset('sparse', 1000000, 'b')
puts res7 # 1

res8 = r.arlen('sparse')
puts res8 # 1000001

res9 = r.arcount('sparse')
puts res9 # 2
# STEP_END

# REMOVE_START
assert_equal(1, res6)
assert_equal(1, res7)
assert_equal(1000001, res8)
assert_equal(2, res9)
r.del('sparse')
# REMOVE_END

# REMOVE_START
r.del('seq')
# REMOVE_END

# STEP_START argetrange
res10 = r.armset('seq', { 0 => 'a', 1 => 'b', 3 => 'd' })
puts res10 # 3

res11 = r.argetrange('seq', 0, 3)
puts res11.inspect # ["a", "b", nil, "d"]
# STEP_END

# REMOVE_START
assert_equal(3, res10)
assert_equal(['a', 'b', nil, 'd'], res11)
r.del('seq')
# REMOVE_END

# REMOVE_START
r.del('seq')
# REMOVE_END

# STEP_START arscan
res12 = r.armset('seq', { 0 => 'a', 1 => 'b', 3 => 'd' })
puts res12 # 3

res13 = r.arscan('seq', 0, 3)
res13.each { |index, value| puts "#{index} -> #{value}" }
# 0 -> a
# 1 -> b
# 3 -> d
# STEP_END

# REMOVE_START
assert_equal(3, res12)
assert_equal([[0, 'a'], [1, 'b'], [3, 'd']], res13)
r.del('seq')
# REMOVE_END

# REMOVE_START
r.del('log')
# REMOVE_END

# STEP_START arinsert
res14 = r.arinsert('log', 'event1')
puts res14 # 0

res15 = r.arinsert('log', 'event2')
puts res15 # 1

res16 = r.arnext('log')
puts res16 # 2

res17 = r.arseek('log', 10)
puts res17 # true

res18 = r.arinsert('log', 'event3')
puts res18 # 10
# STEP_END

# REMOVE_START
assert_equal(0, res14)
assert_equal(1, res15)
assert_equal(2, res16)
assert_equal(true, res17)
assert_equal(10, res18)
r.del('log')
# REMOVE_END

# REMOVE_START
r.del('readings')
# REMOVE_END

# STEP_START arring
res19 = r.arring('readings', 3, 'v0')
puts res19 # 0

res20 = r.arring('readings', 3, 'v1')
puts res20 # 1

res21 = r.arring('readings', 3, 'v2')
puts res21 # 2

res22 = r.arring('readings', 3, 'v3')
puts res22 # 0

res23 = r.arget('readings', 0)
puts res23 # v3
# STEP_END

# REMOVE_START
assert_equal(0, res19)
assert_equal(1, res20)
assert_equal(2, res21)
assert_equal(0, res22)
assert_equal('v3', res23)
r.del('readings')
# REMOVE_END

# REMOVE_START
r.del('readings')
# REMOVE_END

# STEP_START arlastitems
r.arring('readings', 3, 'v0')
r.arring('readings', 3, 'v1')
r.arring('readings', 3, 'v2')
r.arring('readings', 3, 'v3')

res24 = r.arlastitems('readings', 3)
puts res24.inspect # ["v1", "v2", "v3"]

res25 = r.arlastitems('readings', 3, rev: true)
puts res25.inspect # ["v3", "v2", "v1"]
# STEP_END

# REMOVE_START
assert_equal(%w[v1 v2 v3], res24)
assert_equal(%w[v3 v2 v1], res25)
r.del('readings')
# REMOVE_END

# REMOVE_START
r.del('scores')
# REMOVE_END

# STEP_START arop
res26 = r.armset('scores', { 0 => '10', 1 => '20', 2 => '30' })
puts res26 # 3

res27 = r.arop('scores', 0, 2, :sum)
puts res27 # 60.0

res28 = r.arop('scores', 0, 2, :max)
puts res28 # 30.0

res29 = r.arop('scores', 0, 2, :match, value: '10')
puts res29 # 1
# STEP_END

# REMOVE_START
assert_equal(3, res26)
assert_equal(60.0, res27)
assert_equal(30.0, res28)
assert_equal(1, res29)
r.del('scores')
# REMOVE_END

# REMOVE_START
r.del('log')
# REMOVE_END

# STEP_START argrep
res30 = r.armset('log', {
  0 => 'boot: ok',
  1 => 'warn: disk',
  2 => 'ERROR: cpu',
  3 => 'info: ready',
  4 => 'error: net'
})
puts res30 # 5

res31 = r.argrep('log', 0, 4, match: 'error', nocase: true)
puts res31.inspect # [2, 4]

res32 = r.argrep('log', 0, 4, glob: ['warn:*', 'error:*'], logic: :or, with_values: true)
puts res32.inspect # [[1, "warn: disk"], [4, "error: net"]]
# STEP_END

# REMOVE_START
assert_equal(5, res30)
assert_equal([2, 4], res31)
assert_equal([[1, 'warn: disk'], [4, 'error: net']], res32)
r.del('log')
# REMOVE_END

# REMOVE_START
r.del('scores')
# REMOVE_END

# STEP_START ardel
res33 = r.armset('scores', { 0 => '10', 1 => '20', 2 => '30' })
puts res33 # 3

res34 = r.ardel('scores', 1)
puts res34 # 1

res35 = r.ardelrange('scores', 0, 2)
puts res35 # 2
# STEP_END

# REMOVE_START
assert_equal(3, res33)
assert_equal(1, res34)
assert_equal(2, res35)
r.del('scores')
r.close
# REMOVE_END
