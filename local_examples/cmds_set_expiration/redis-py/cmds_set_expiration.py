# EXAMPLE: cmds_set_expiration
# HIDE_START
import time

import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END

# STEP_START saddex
# REMOVE_START
r.delete("myset")
# REMOVE_END
from redis.commands.core import SetDataPersistOptions

res1 = r.saddex("myset", "member1", "member2", ex=300)
print(res1)  # >>> 1

res2 = r.sttl("myset", "member1", "member2")
print(res2)  # >>> [300, 300]

res3 = r.saddex(
    "myset", "member2", "member3",
    ex=60, data_persist_option=SetDataPersistOptions.MNX,
)
print(res3)  # >>> 0

res4 = r.saddex("myset", "member1", "member3", keepttl=True)
print(res4)  # >>> 1

res5 = r.sttl("myset", "member1", "member2", "member3")
print(res5)  # >>> [300, 300, -1]

# REMOVE_START
assert res1 == 1
assert res2 == [300, 300]
assert res3 == 0
assert res4 == 1
assert res5 == [300, 300, -1]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START sexpire
# REMOVE_START
r.delete("myset", "no-key")
# REMOVE_END
res1 = r.sexpire("no-key", 20, "member1", "member2", nx=True)
print(res1)  # >>> [-2, -2]

res2 = r.sadd("myset", "member1", "member2")
print(res2)  # >>> 2

res3 = r.sexpire("myset", 10, "member1", "member2", "member3")
print(res3)  # >>> [1, 1, -2]

res4 = r.sexpire("myset", 20, "member1", nx=True)
print(res4)  # >>> [0]

res5 = r.sexpire("myset", 20, "member1", gt=True)
print(res5)  # >>> [1]

res6 = r.sttl("myset", "member1", "member2")
print(res6)  # >>> [20, 10]

# REMOVE_START
assert res1 == [-2, -2]
assert res2 == 2
assert res3 == [1, 1, -2]
assert res4 == [0]
assert res5 == [1]
assert res6 == [20, 10]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START spexpire
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.spexpire("myset", 2000, "member1", "member2")
print(res2)  # >>> [1, 1]

res3 = r.spexpire("myset", 500, "member1", lt=True)
print(res3)  # >>> [1]

res4 = r.spttl("myset", "member1", "member2")
print(res4)  # >>> [491, 1982] (for example)

# REMOVE_START
assert res1 == 2
assert res2 == [1, 1]
assert res3 == [1]
assert 0 < res4[0] <= 500
assert 500 < res4[1] <= 2000
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START sexpireat
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.sexpireat("myset", 4102444800, "member1")
print(res2)  # >>> [1]

res3 = r.sexpiretime("myset", "member1", "member2")
print(res3)  # >>> [4102444800, -1]

# A timestamp in the past deletes the member immediately.
res4 = r.sexpireat("myset", 1, "member2")
print(res4)  # >>> [2]

res5 = r.smembers("myset")
print(res5)  # >>> {'member1'}

# REMOVE_START
assert res1 == 2
assert res2 == [1]
assert res3 == [4102444800, -1]
assert res4 == [2]
assert res5 == {"member1"}
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START spexpireat
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.spexpireat("myset", 4102444800000, "member1")
print(res2)  # >>> [1]

res3 = r.spexpireat("myset", 4102444800000, "member2", xx=True)
print(res3)  # >>> [0]

res4 = r.spexpiretime("myset", "member1", "member2")
print(res4)  # >>> [4102444800000, -1]

# REMOVE_START
assert res1 == 2
assert res2 == [1]
assert res3 == [0]
assert res4 == [4102444800000, -1]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START sexpiretime
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.sexpire("myset", 300, "member1")
print(res2)  # >>> [1]

res3 = r.sexpiretime("myset", "member1", "member2", "member3")
print(res3)  # >>> [1792684428, -1, -2] (for example)

# REMOVE_START
assert res1 == 2
assert res2 == [1]
assert abs(res3[0] - (time.time() + 300)) < 5
assert res3[1:] == [-1, -2]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START spexpiretime
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.spexpire("myset", 300000, "member1")
print(res2)  # >>> [1]

res3 = r.spexpiretime("myset", "member1", "member2", "member3")
print(res3)  # >>> [1792684427589, -1, -2] (for example)

# REMOVE_START
assert res1 == 2
assert res2 == [1]
assert abs(res3[0] - (time.time() * 1000 + 300000)) < 5000
assert res3[1:] == [-1, -2]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START sttl
# REMOVE_START
r.delete("myset", "no-key")
# REMOVE_END
res1 = r.sttl("no-key", "member1", "member2")
print(res1)  # >>> [-2, -2]

res2 = r.sadd("myset", "member1", "member2")
print(res2)  # >>> 2

res3 = r.sexpire("myset", 300, "member1", "member3")
print(res3)  # >>> [1, -2]

res4 = r.sttl("myset", "member1", "member2", "member3")
print(res4)  # >>> [300, -1, -2]

# REMOVE_START
assert res1 == [-2, -2]
assert res2 == 2
assert res3 == [1, -2]
assert res4 == [300, -1, -2]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START spttl
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.spexpire("myset", 300000, "member1")
print(res2)  # >>> [1]

res3 = r.spttl("myset", "member1", "member2", "member3")
print(res3)  # >>> [299993, -1, -2] (for example)

# REMOVE_START
assert res1 == 2
assert res2 == [1]
assert 295000 < res3[0] <= 300000
assert res3[1:] == [-1, -2]
r.delete("myset")
# REMOVE_END
# STEP_END

# STEP_START spersist
# REMOVE_START
r.delete("myset")
# REMOVE_END
res1 = r.sadd("myset", "member1", "member2")
print(res1)  # >>> 2

res2 = r.sexpire("myset", 300, "member1", "member2")
print(res2)  # >>> [1, 1]

res3 = r.spersist("myset", "member2")
print(res3)  # >>> [1]

res4 = r.sttl("myset", "member1", "member2")
print(res4)  # >>> [300, -1]

res5 = r.spersist("myset", "member2", "member3")
print(res5)  # >>> [-1, -2]

# REMOVE_START
assert res1 == 2
assert res2 == [1, 1]
assert res3 == [1]
assert res4 == [300, -1]
assert res5 == [-1, -2]
r.delete("myset")
# REMOVE_END
# STEP_END
