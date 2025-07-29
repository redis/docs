# EXAMPLE: local_string_demo
# HIDE_START
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END

# STEP_START set_get
res = r.set("mykey", "Hello Redis!")
print(res)
# >>> True
res = r.get("mykey")
print(res)
# >>> Hello Redis!
# REMOVE_START
assert res == "Hello Redis!"
r.delete("mykey")
# REMOVE_END
# STEP_END

# STEP_START incr
res = r.set("counter", "10")
print(res)
# >>> True
res = r.incr("counter")
print(res)
# >>> 11
res = r.incr("counter", 5)
print(res)
# >>> 16
# REMOVE_START
assert res == 16
r.delete("counter")
# REMOVE_END
# STEP_END
