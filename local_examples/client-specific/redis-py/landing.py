# EXAMPLE: landing
# REMOVE_START
import redis
# REMOVE_END

# STEP_START connect
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
# STEP_END

# STEP_START set_get_string
r.set('foo', 'bar')
# True
r.get('foo')
# bar
# STEP_END

# STEP_START hash_operations
r.hset('user-session:123', mapping={
    'name': 'John',
    "surname": 'Smith',
    "company": 'Redis',
    "age": 29
})
# True

r.hgetall('user-session:123')
# {'surname': 'Smith', 'name': 'John', 'company': 'Redis', 'age': '29'}
# STEP_END

# STEP_START close
r.close()
# STEP_END
