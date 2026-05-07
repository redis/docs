# EXAMPLE: landing
# BINDER_ID ruby-landing
# KERNEL_NAME ruby3
# STEP_START connect
require 'redis'
r = Redis.new
# STEP_END

# STEP_START set_get_string
r.set 'foo', 'bar'
value = r.get('foo')
puts value
# STEP_END

# STEP_START hash_operations
r.hset 'user-session:123', 'name', 'John'
r.hset 'user-session:123', 'surname', 'Smith'
r.hset 'user-session:123', 'company', 'Redis'
r.hset 'user-session:123', 'age', 29

hash_value = r.hgetall('user-session:123')
puts hash_value
# STEP_END

# STEP_START close
r.close()
# STEP_END
