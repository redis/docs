# EXAMPLE: list_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('bikes:repairs', 'bikes:finished', 'new_bikes')
# REMOVE_END

# STEP_START queue
res1 = r.lpush('bikes:repairs', 'bike:1')
puts res1 # 1

res2 = r.lpush('bikes:repairs', 'bike:2')
puts res2 # 2

res3 = r.rpop('bikes:repairs')
puts res3 # bike:1

res4 = r.rpop('bikes:repairs')
puts res4 # bike:2
# STEP_END

# REMOVE_START
assert_equal(1, res1)
assert_equal(2, res2)
assert_equal('bike:1', res3)
assert_equal('bike:2', res4)
# REMOVE_END

# STEP_START stack
res5 = r.lpush('bikes:repairs', 'bike:1')
puts res5 # 1

res6 = r.lpush('bikes:repairs', 'bike:2')
puts res6 # 2

res7 = r.lpop('bikes:repairs')
puts res7 # bike:2

res8 = r.lpop('bikes:repairs')
puts res8 # bike:1
# STEP_END

# REMOVE_START
assert_equal(1, res5)
assert_equal(2, res6)
assert_equal('bike:2', res7)
assert_equal('bike:1', res8)
# REMOVE_END

# STEP_START llen
res9 = r.llen('bikes:repairs')
puts res9 # 0
# STEP_END

# REMOVE_START
assert_equal(0, res9)
# REMOVE_END

# STEP_START lmove_lrange
res10 = r.lpush('bikes:repairs', 'bike:1')
puts res10 # 1

res11 = r.lpush('bikes:repairs', 'bike:2')
puts res11 # 2

res12 = r.lmove('bikes:repairs', 'bikes:finished', 'LEFT', 'LEFT')
puts res12 # bike:2

res13 = r.lrange('bikes:repairs', 0, -1)
puts res13.inspect # ["bike:1"]

res14 = r.lrange('bikes:finished', 0, -1)
puts res14.inspect # ["bike:2"]
# STEP_END

# REMOVE_START
assert_equal(1, res10)
assert_equal(2, res11)
assert_equal('bike:2', res12)
assert_equal(['bike:1'], res13)
assert_equal(['bike:2'], res14)
# REMOVE_END

# STEP_START ltrim.1
r.del('bikes:repairs')

res15 = r.rpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5'])
puts res15 # 5

res16 = r.ltrim('bikes:repairs', 0, 2)
puts res16 # OK

res17 = r.lrange('bikes:repairs', 0, -1)
puts res17.inspect # ["bike:1", "bike:2", "bike:3"]
# STEP_END

# REMOVE_START
assert_equal(5, res15)
assert_equal('OK', res16)
assert_equal(['bike:1', 'bike:2', 'bike:3'], res17)
# REMOVE_END

# STEP_START lpush_rpush
r.del('bikes:repairs')

res18 = r.rpush('bikes:repairs', 'bike:1')
puts res18 # 1

res19 = r.rpush('bikes:repairs', 'bike:2')
puts res19 # 2

res20 = r.lpush('bikes:repairs', 'bike:important_bike')
puts res20 # 3

res21 = r.lrange('bikes:repairs', 0, -1)
puts res21.inspect # ["bike:important_bike", "bike:1", "bike:2"]
# STEP_END

# REMOVE_START
assert_equal(1, res18)
assert_equal(2, res19)
assert_equal(3, res20)
assert_equal(['bike:important_bike', 'bike:1', 'bike:2'], res21)
# REMOVE_END

# STEP_START variadic
r.del('bikes:repairs')

res22 = r.rpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3'])
puts res22 # 3

res23 = r.lpush('bikes:repairs', ['bike:important_bike', 'bike:very_important_bike'])
puts res23 # 5

res24 = r.lrange('bikes:repairs', 0, -1)
puts res24.inspect
# ["bike:very_important_bike", "bike:important_bike", "bike:1", "bike:2", "bike:3"]
# STEP_END

# REMOVE_START
assert_equal(3, res22)
assert_equal(5, res23)
assert_equal([
  'bike:very_important_bike',
  'bike:important_bike',
  'bike:1',
  'bike:2',
  'bike:3'
], res24)
# REMOVE_END

# STEP_START lpop_rpop
r.del('bikes:repairs')

res25 = r.rpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3'])
puts res25 # 3

res26 = r.rpop('bikes:repairs')
puts res26 # bike:3

res27 = r.lpop('bikes:repairs')
puts res27 # bike:1

res28 = r.rpop('bikes:repairs')
puts res28 # bike:2

res29 = r.rpop('bikes:repairs')
puts res29.inspect # nil
# STEP_END

# REMOVE_START
assert_equal(3, res25)
assert_equal('bike:3', res26)
assert_equal('bike:1', res27)
assert_equal('bike:2', res28)
assert_equal(nil, res29)
# REMOVE_END

# STEP_START ltrim
r.del('bikes:repairs')

res30 = r.rpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5'])
puts res30 # 5

res31 = r.ltrim('bikes:repairs', 0, 2)
puts res31 # OK

res32 = r.lrange('bikes:repairs', 0, -1)
puts res32.inspect # ["bike:1", "bike:2", "bike:3"]
# STEP_END

# REMOVE_START
assert_equal(5, res30)
assert_equal('OK', res31)
assert_equal(['bike:1', 'bike:2', 'bike:3'], res32)
# REMOVE_END

# STEP_START ltrim_end_of_list
r.del('bikes:repairs')

res33 = r.rpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5'])
puts res33 # 5

res34 = r.ltrim('bikes:repairs', -3, -1)
puts res34 # OK

res35 = r.lrange('bikes:repairs', 0, -1)
puts res35.inspect # ["bike:3", "bike:4", "bike:5"]
# STEP_END

# REMOVE_START
assert_equal(5, res33)
assert_equal('OK', res34)
assert_equal(['bike:3', 'bike:4', 'bike:5'], res35)
# REMOVE_END

# STEP_START brpop
r.del('bikes:repairs')

res36 = r.rpush('bikes:repairs', ['bike:1', 'bike:2'])
puts res36 # 2

res37 = r.brpop('bikes:repairs', timeout: 1)
puts res37.inspect # ["bikes:repairs", "bike:2"]

res38 = r.brpop('bikes:repairs', timeout: 1)
puts res38.inspect # ["bikes:repairs", "bike:1"]

res39 = r.brpop('bikes:repairs', timeout: 1)
puts res39.inspect # nil
# STEP_END

# REMOVE_START
assert_equal(2, res36)
assert_equal(['bikes:repairs', 'bike:2'], res37)
assert_equal(['bikes:repairs', 'bike:1'], res38)
assert_equal(nil, res39)
r.del('bikes:repairs', 'new_bikes')
# REMOVE_END

# STEP_START rule_1
res40 = r.del('new_bikes')
puts res40 # 0

res41 = r.lpush('new_bikes', ['bike:1', 'bike:2', 'bike:3'])
puts res41 # 3
# STEP_END

# REMOVE_START
assert_equal(0, res40)
assert_equal(3, res41)
# REMOVE_END

# STEP_START rule_1.1
r.del('new_bikes')

res42 = r.set('new_bikes', 'bike:1')
puts res42 # OK

res43 = r.type('new_bikes')
puts res43 # string

wrong_type_error = nil
begin
  r.lpush('new_bikes', ['bike:2', 'bike:3'])
rescue Redis::CommandError => e
  wrong_type_error = e
  puts e.message # WRONGTYPE Operation against a key holding the wrong kind of value
end
# STEP_END

# REMOVE_START
assert_equal('OK', res42)
assert_equal('string', res43)
raise 'Expected WRONGTYPE error' unless wrong_type_error&.message&.include?('WRONGTYPE')
r.del('new_bikes')
# REMOVE_END

# STEP_START rule_2
r.del('bikes:repairs')

res44 = r.lpush('bikes:repairs', ['bike:1', 'bike:2', 'bike:3'])
puts res44 # 3

res45 = r.exists('bikes:repairs')
puts res45 # 1

res46 = r.lpop('bikes:repairs')
puts res46 # bike:3

res47 = r.lpop('bikes:repairs')
puts res47 # bike:2

res48 = r.lpop('bikes:repairs')
puts res48 # bike:1

res49 = r.exists('bikes:repairs')
puts res49 # 0
# STEP_END

# REMOVE_START
assert_equal(3, res44)
assert_equal(1, res45)
assert_equal('bike:3', res46)
assert_equal('bike:2', res47)
assert_equal('bike:1', res48)
assert_equal(0, res49)
# REMOVE_END

# STEP_START rule_3
r.del('bikes:repairs')

res50 = r.del('bikes:repairs')
puts res50 # 0

res51 = r.llen('bikes:repairs')
puts res51 # 0

res52 = r.lpop('bikes:repairs')
puts res52.inspect # nil
# STEP_END

# REMOVE_START
assert_equal(0, res50)
assert_equal(0, res51)
assert_equal(nil, res52)
r.close
# REMOVE_END
