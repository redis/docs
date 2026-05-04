# EXAMPLE: ss_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('racer_scores')
# REMOVE_END

# STEP_START zadd
res1 = r.zadd('racer_scores', [[10, 'Norem']])
puts res1 # 1

res2 = r.zadd('racer_scores', [[12, 'Castilla']])
puts res2 # 1

res3 = r.zadd('racer_scores', [
  [8, 'Sam-Bodden'],
  [10, 'Royce'],
  [6, 'Ford'],
  [14, 'Prickett'],
  [12, 'Castilla']
])
puts res3 # 4
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(1, res2)
assert_equal(4, res3)
assert_equal(6, r.zcard('racer_scores'))
# REMOVE_END

# STEP_START zrange
res4 = r.zrange('racer_scores', 0, -1)
puts res4.inspect # ["Ford", "Sam-Bodden", "Norem", "Royce", "Castilla", "Prickett"]

res5 = r.zrevrange('racer_scores', 0, -1)
puts res5.inspect # ["Prickett", "Castilla", "Royce", "Norem", "Sam-Bodden", "Ford"]
# STEP_END

# REMOVE_START
assert_equal(['Ford', 'Sam-Bodden', 'Norem', 'Royce', 'Castilla', 'Prickett'], res4)
assert_equal(['Prickett', 'Castilla', 'Royce', 'Norem', 'Sam-Bodden', 'Ford'], res5)
# REMOVE_END

# STEP_START zrange_withscores
res6 = r.zrange('racer_scores', 0, -1, with_scores: true)
puts res6.inspect
# [["Ford", 6.0], ["Sam-Bodden", 8.0], ["Norem", 10.0], ["Royce", 10.0],
#  ["Castilla", 12.0], ["Prickett", 14.0]]
# STEP_END

# REMOVE_START
assert_equal([
  ['Ford', 6.0],
  ['Sam-Bodden', 8.0],
  ['Norem', 10.0],
  ['Royce', 10.0],
  ['Castilla', 12.0],
  ['Prickett', 14.0]
], res6)
# REMOVE_END

# STEP_START zrangebyscore
res7 = r.zrangebyscore('racer_scores', '-inf', 10)
puts res7.inspect # ["Ford", "Sam-Bodden", "Norem", "Royce"]
# STEP_END

# REMOVE_START
assert_equal(['Ford', 'Sam-Bodden', 'Norem', 'Royce'], res7)
# REMOVE_END

# STEP_START zremrangebyscore
res8 = r.zrem('racer_scores', ['Castilla'])
puts res8 # 1

res9 = r.zremrangebyscore('racer_scores', '-inf', 9)
puts res9 # 2

res10 = r.zrange('racer_scores', 0, -1)
puts res10.inspect # ["Norem", "Royce", "Prickett"]
# STEP_END

# REMOVE_START
assert_equal(1, res8)
assert_equal(2, res9)
assert_equal(['Norem', 'Royce', 'Prickett'], res10)
# REMOVE_END

# STEP_START zrank
res11 = r.zrank('racer_scores', 'Norem')
puts res11 # 0

res12 = r.zrevrank('racer_scores', 'Norem')
puts res12 # 2
# STEP_END

# REMOVE_START
assert_equal(0, res11)
assert_equal(2, res12)
# REMOVE_END

# STEP_START zadd_lex
res13 = r.zadd('racer_scores', [
  [0, 'Norem'],
  [0, 'Sam-Bodden'],
  [0, 'Royce'],
  [0, 'Ford'],
  [0, 'Prickett'],
  [0, 'Castilla']
])
puts res13 # 3

res14 = r.zrange('racer_scores', 0, -1)
puts res14.inspect # ["Castilla", "Ford", "Norem", "Prickett", "Royce", "Sam-Bodden"]

res15 = r.zrangebylex('racer_scores', '[A', '[L')
puts res15.inspect # ["Castilla", "Ford"]
# STEP_END

# REMOVE_START
assert_equal(3, res13)
assert_equal(['Castilla', 'Ford', 'Norem', 'Prickett', 'Royce', 'Sam-Bodden'], res14)
assert_equal(['Castilla', 'Ford'], res15)
# REMOVE_END

# STEP_START leaderboard
res16 = r.zadd('racer_scores', [[100, 'Wood']])
puts res16 # 1

res17 = r.zadd('racer_scores', [[100, 'Henshaw']])
puts res17 # 1

res18 = r.zadd('racer_scores', [[150, 'Henshaw']])
puts res18 # 0

res19 = r.zincrby('racer_scores', 50, 'Wood')
puts res19 # 150.0

res20 = r.zincrby('racer_scores', 50, 'Henshaw')
puts res20 # 200.0
# STEP_END

# REMOVE_START
assert_equal(1, res16)
assert_equal(1, res17)
assert_equal(0, res18)
assert_equal(150.0, res19)
assert_equal(200.0, res20)
r.close
# REMOVE_END
