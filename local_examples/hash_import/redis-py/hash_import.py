# EXAMPLE: hash_import
# HIDE_START
"""
Code samples for the HIMPORT section of the Hash doc page:
    https://redis.io/docs/latest/develop/data-types/hashes/
"""
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete(*[f"user:{i}" for i in range(1, 1001)])
# REMOVE_END

# STEP_START himport_basic
# Declare the field names once.
r.himport_prepare("user", ["name", "email", "age"])

# Create each hash by sending only its values.
res1 = r.himport_set("user:1", "user", ["Alice", "alice@example.com", "34"])
print(res1)
# >>> True

r.himport_set("user:2", "user", ["Bob", "bob@example.com", "41"])
r.himport_set("user:3", "user", ["Carol", "carol@example.com", "29"])

# The result is an ordinary hash.
res2 = r.hgetall("user:2")
print(res2)
# >>> {'age': '41', 'name': 'Bob', 'email': 'bob@example.com'}
# STEP_END

# REMOVE_START
assert res1 is True
assert res2 == {"name": "Bob", "email": "bob@example.com", "age": "41"}
# REMOVE_END

# STEP_START himport_pipeline
r.himport_prepare("user", ["name", "email", "age"])

# Queue many imports and send them in one round trip.
with r.pipeline(transaction=False) as pipe:
    for i in range(1, 1001):
        pipe.himport_set(
            f"user:{i}", "user", [f"user{i}", f"user{i}@example.com", str(20 + i % 50)]
        )
    res3 = pipe.execute()

print(len(res3), all(res3))
# >>> 1000 True

res4 = r.hget("user:1000", "email")
print(res4)
# >>> user1000@example.com
# STEP_END

# REMOVE_START
assert len(res3) == 1000 and all(res3)
assert res4 == "user1000@example.com"
r.delete(*[f"user:{i}" for i in range(1, 1001)])
r.himport_discard("user")
# REMOVE_END
