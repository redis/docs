# EXAMPLE: cmds_string
# HIDE_START
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("key1", "key2", "nonexisting")
# REMOVE_END

# STEP_START mget
r.set("key1", "Hello")
r.set("key2", "World")

mget_result = r.mget("key1", "key2", "nonexisting")
print(mget_result)
# >>> ['Hello', 'World', None]
# STEP_END

# REMOVE_START
assert mget_result == ["Hello", "World", None]
r.delete("key1", "key2", "nonexisting")
# REMOVE_END
