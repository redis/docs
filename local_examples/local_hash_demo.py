# EXAMPLE: local_hash_demo
# HIDE_START
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END

# STEP_START hset_hget
res = r.hset("user:1000", "name", "John Smith")
print(res)
# >>> 1
res = r.hset("user:1000", mapping={"email": "john@example.com", "age": "30"})
print(res)
# >>> 2
res = r.hget("user:1000", "name")
print(res)
# >>> John Smith
res = r.hgetall("user:1000")
print(res)
# >>> {'name': 'John Smith', 'email': 'john@example.com', 'age': '30'}
# REMOVE_START
assert res["name"] == "John Smith"
r.delete("user:1000")
# REMOVE_END
# STEP_END
