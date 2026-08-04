# EXAMPLE: cmds_cnxmgmt
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# STEP_START auth1
res1 = r.auth('temp_pass')
puts res1 # >>> OK

res2 = r.auth('default', 'temp_pass')
puts res2 # >>> OK
# STEP_END

# STEP_START auth2
res3 = r.auth('test-user', 'strong_password')
puts res3 # >>> OK
# STEP_END

# HIDE_START
r.close
# HIDE_END
