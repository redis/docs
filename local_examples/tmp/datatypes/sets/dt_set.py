# EXAMPLE: sets_tutorial
# BINDER_ID python-dt-set
# HIDE_START
"""
Code samples for Set doc pages:
    https://redis.io/docs/latest/develop/data-types/sets/
"""

import redis

r = redis.Redis(decode_responses=True)
# HIDE_END
# REMOVE_START
r.delete("bikes:racing:france")
r.delete("bikes:racing:usa")
# REMOVE_END

# STEP_START sadd
res1 = r.sadd("bikes:racing:france", "bike:1")
print(res1)  # >>> 1

res2 = r.sadd("bikes:racing:france", "bike:1")
print(res2)  # >>> 0

res3 = r.sadd("bikes:racing:france", "bike:2", "bike:3")
print(res3)  # >>> 2

res4 = r.sadd("bikes:racing:usa", "bike:1", "bike:4")
print(res4)  # >>> 2
# STEP_END

# REMOVE_START
assert res1 == 1
assert res2 == 0
assert res3 == 2
assert res4 == 2
# REMOVE_END

# STEP_START sismember
# HIDE_START
r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
r.sadd("bikes:racing:usa", "bike:1", "bike:4")
# HIDE_END
res5 = r.sismember("bikes:racing:usa", "bike:1")
print(res5)  # >>> 1

res6 = r.sismember("bikes:racing:usa", "bike:2")
print(res6)  # >>> 0
# STEP_END

# REMOVE_START
assert res5 == 1
assert res6 == 0
# REMOVE_END

# STEP_START sinter
# HIDE_START
r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
r.sadd("bikes:racing:usa", "bike:1", "bike:4")
# HIDE_END
res7 = r.sinter("bikes:racing:france", "bikes:racing:usa")
print(res7)  # >>> {'bike:1'}
# STEP_END

# REMOVE_START
assert res7 == {"bike:1"}
# REMOVE_END

# STEP_START scard
# HIDE_START
r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
# HIDE_END
res8 = r.scard("bikes:racing:france")
print(res8)  # >>> 3
# STEP_END

# REMOVE_START
assert res8 == 3
# REMOVE_END

# STEP_START sadd_smembers
r.delete("bikes:racing:france")

res9 = r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
print(res9)  # >>> 3

res10 = r.smembers("bikes:racing:france")
print(res10)  # >>> {'bike:1', 'bike:2', 'bike:3'}
# STEP_END

# REMOVE_START
assert res9 == 3
assert res10 == {'bike:1', 'bike:2', 'bike:3'}
# REMOVE_END

# STEP_START smismember
# Recreate the set so this example runs on its own.
r.delete("bikes:racing:france")
r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")

res11 = r.sismember("bikes:racing:france", "bike:1")
print(res11)  # >>> 1

res12 = r.smismember("bikes:racing:france", "bike:2", "bike:3", "bike:4")
print(res12)  # >>> [1, 1, 0]
# STEP_END

# REMOVE_START
assert res11 == 1
assert res12 == [1, 1, 0]
# REMOVE_END

# STEP_START sdiff
r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
r.sadd("bikes:racing:usa", "bike:1", "bike:4")

res13 = r.sdiff("bikes:racing:france", "bikes:racing:usa")
print(res13)  # >>> {'bike:2', 'bike:3'}
# STEP_END

# REMOVE_START
assert res13 == {'bike:2', 'bike:3'}
# REMOVE_END

# STEP_START multisets
r.delete("bikes:racing:france")
r.delete("bikes:racing:usa")
r.delete("bikes:racing:italy")

r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
r.sadd("bikes:racing:usa", "bike:1", "bike:4")
r.sadd("bikes:racing:italy", "bike:1", "bike:2", "bike:3", "bike:4")

res13 = r.sinter("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy")
print(res13)  # >>> {'bike:1'}

res14 = r.sunion("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy")
print(res14)  # >>> {'bike:1', 'bike:2', 'bike:3', 'bike:4'}

res15 = r.sdiff("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy")
print(res15)  # >>> set()

res16 = r.sdiff("bikes:racing:usa", "bikes:racing:france")
print(res16)  # >>> {'bike:4'}

res17 = r.sdiff("bikes:racing:france", "bikes:racing:usa")
print(res17)  # >>> {'bike:2', 'bike:3'}
# STEP_END

# REMOVE_START
assert res13 == {'bike:1'}
assert res14 == {'bike:1', 'bike:2', 'bike:3', 'bike:4'}
assert res15 == set()
assert res16 == {'bike:4'}
assert res17 == {'bike:2', 'bike:3'}
# REMOVE_END

# STEP_START srem
r.delete("bikes:racing:france")

r.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3", "bike:4", "bike:5")

res18 = r.srem("bikes:racing:france", "bike:1")
print(res18)  # >>> 1

res19 = r.spop("bikes:racing:france")
print(res19)  # >>> bike:3

res20 = r.smembers("bikes:racing:france")
print(res20)  # >>> {'bike:2', 'bike:4', 'bike:5'}

res21 = r.srandmember("bikes:racing:france")
print(res21)  # >>> bike:4
# STEP_END

# REMOVE_START
assert res18 == 1
# none of the other results are deterministic
# REMOVE_END

# STEP_START member_expiration
r.delete("bikes:reserved")

res22 = r.saddex("bikes:reserved", "bike:1", "bike:2", ex=900)
print(res22)  # >>> 1

res23 = r.sadd("bikes:reserved", "bike:3")
print(res23)  # >>> 1

res24 = r.sttl("bikes:reserved", "bike:1", "bike:2", "bike:3")
print(res24)  # >>> [900, 900, -1]
# STEP_END

# REMOVE_START
assert res22 == 1
assert res23 == 1
assert res24 == [900, 900, -1]
r.delete("bikes:reserved")
# REMOVE_END

# STEP_START member_expiration_ms
r.delete("bikes:reserved")
r.sadd("bikes:reserved", "bike:1", "bike:2")

res25 = r.spexpire("bikes:reserved", 60000, "bike:1")
print(res25)  # >>> [1]

res26 = r.spttl("bikes:reserved", "bike:1", "bike:2")
print(res26)  # >>> [59994, -1] (for example)

res27 = r.spersist("bikes:reserved", "bike:1")
print(res27)  # >>> [1]

res28 = r.spttl("bikes:reserved", "bike:1")
print(res28)  # >>> [-1]
# STEP_END

# REMOVE_START
assert res25 == [1]
assert res27 == [1]
assert res28 == [-1]
r.delete("bikes:reserved")
# REMOVE_END

# STEP_START member_expiration_at
r.delete("bikes:reserved")
r.sadd("bikes:reserved", "bike:1", "bike:2")

# 4102444800 is an example Unix time in the future.
res29 = r.sexpireat("bikes:reserved", 4102444800, "bike:1")
print(res29)  # >>> [1]

res30 = r.sexpiretime("bikes:reserved", "bike:1", "bike:2")
print(res30)  # >>> [4102444800, -1]
# STEP_END

# REMOVE_START
assert res29 == [1]
assert res30 == [4102444800, -1]
r.delete("bikes:reserved")
# REMOVE_END
