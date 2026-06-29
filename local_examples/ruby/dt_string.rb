# EXAMPLE: set_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# STEP_START set_get
res1 = r.set('bike:1', 'Deimos')
puts res1 # OK

res2 = r.get('bike:1')
puts res2 # Deimos
# STEP_END

# REMOVE_START
raise "Expected 'OK'" unless res1 == 'OK'
raise "Expected 'Deimos'" unless res2 == 'Deimos'
# REMOVE_END

# STEP_START setnx_xx
res3 = r.set('bike:1', 'bike', nx: true)
puts res3 # false

puts r.get('bike:1') # Deimos

res4 = r.set('bike:1', 'bike', xx: true)
puts res4 # true
# STEP_END

# REMOVE_START
raise 'Expected SET NX to fail' unless res3 == false
raise 'Expected SET XX to succeed' unless res4 == true
raise "Expected 'bike'" unless r.get('bike:1') == 'bike'
# REMOVE_END

# STEP_START mset
res5 = r.mset('bike:1', 'Deimos', 'bike:2', 'Ares', 'bike:3', 'Vanth')
puts res5 # OK

res6 = r.mget('bike:1', 'bike:2', 'bike:3')
puts res6.inspect # ["Deimos", "Ares", "Vanth"]
# STEP_END

# REMOVE_START
raise "Expected 'OK'" unless res5 == 'OK'
raise 'Expected all bike names' unless res6 == ['Deimos', 'Ares', 'Vanth']
# REMOVE_END

# STEP_START incr
r.set('total_crashes', 0)

res7 = r.incr('total_crashes')
puts res7 # 1

res8 = r.incrby('total_crashes', 10)
puts res8 # 11
# STEP_END

# REMOVE_START
raise 'Expected 1' unless res7 == 1
raise 'Expected 11' unless res8 == 11
r.close
# REMOVE_END
