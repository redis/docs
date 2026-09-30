# EXAMPLE: cmds_string
# HIDE_START
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("key1", "key2", "mykey", "nonexisting")
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

# STEP_START incr
incr_result1 = r.set("mykey", "10")
print(incr_result1)
# >>> True

incr_result2 = r.incr("mykey")
print(incr_result2)
# >>> 11

incr_result3 = r.get("mykey")
print(incr_result3)
# >>> 11
# STEP_END

# REMOVE_START
assert incr_result1 is True
assert incr_result2 == 11
assert incr_result3 == "11"
r.delete("mykey")
# REMOVE_END
