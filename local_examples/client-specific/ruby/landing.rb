# EXAMPLE: landing
# STEP_START import
require 'redis'
# STEP_END

# STEP_START connect
r = Redis.new
# STEP_END

# STEP_START set_get_string
r.set 'foo', 'bar'
value = r.get('foo')
puts value # >>> bar
# STEP_END

# STEP_START hash_operations
r.hset 'user-session:123', 'name', 'John'
r.hset 'user-session:123', 'surname', 'Smith'
r.hset 'user-session:123', 'company', 'Redis'
r.hset 'user-session:123', 'age', 29

hash_value = r.hgetall('user-session:123')
puts hash_value
# >>> {"name"=>"John", "surname"=>"Smith", "company"=>"Redis", "age"=>"29"}
# STEP_END

# STEP_START close
r.close()
# STEP_END
