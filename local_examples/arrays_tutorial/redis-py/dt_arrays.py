# EXAMPLE: arrays_tutorial
# HIDE_START
import redis
from redis.commands.core import (
    ArrayAggregateOperations,
    ArrayPredicateType,
    ArrayPredicateCombinator,
)

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("events:1")
# REMOVE_END

# STEP_START arset_arget
res1 = r.arset("events:1", 0, "login", "click", "purchase")
print(res1)
# >>> 3

res2 = r.arget("events:1", 0)
print(res2)
# >>> login

res3 = r.arget("events:1", 999)
print(res3)
# >>> None
# STEP_END

# REMOVE_START
assert res1 == 3
assert res2 == "login"
assert res3 is None
r.delete("events:1")
# REMOVE_END

# REMOVE_START
r.delete("metrics")
# REMOVE_END

# STEP_START armset_armget
res4 = r.armset("metrics", {0: "10", 5: "20", 100: "30"})
print(res4)
# >>> 3

res5 = r.armget("metrics", 0, 5, 100, 999)
print(res5)
# >>> ['10', '20', '30', None]
# STEP_END

# REMOVE_START
assert res4 == 3
assert res5 == ["10", "20", "30", None]
r.delete("metrics")
# REMOVE_END

# REMOVE_START
r.delete("sparse")
# REMOVE_END

# STEP_START len_count
res6 = r.arset("sparse", 0, "a")
print(res6)
# >>> 1

res7 = r.arset("sparse", 1000000, "b")
print(res7)
# >>> 1

res8 = r.arlen("sparse")
print(res8)
# >>> 1000001

res9 = r.arcount("sparse")
print(res9)
# >>> 2
# STEP_END

# REMOVE_START
assert res6 == 1
assert res7 == 1
assert res8 == 1000001
assert res9 == 2
r.delete("sparse")
# REMOVE_END

# REMOVE_START
r.delete("seq")
# REMOVE_END

# STEP_START argetrange
res10 = r.armset("seq", {0: "a", 1: "b", 3: "d"})
print(res10)
# >>> 3

res11 = r.argetrange("seq", 0, 3)
print(res11)
# >>> ['a', 'b', None, 'd']
# STEP_END

# REMOVE_START
assert res10 == 3
assert res11 == ["a", "b", None, "d"]
r.delete("seq")
# REMOVE_END

# REMOVE_START
r.delete("seq")
# REMOVE_END

# STEP_START arscan
res12 = r.armset("seq", {0: "a", 1: "b", 3: "d"})
print(res12)
# >>> 3

res13 = r.arscan("seq", 0, 3)
for index, value in res13:
    print(f"{index} -> {value}")
# >>> 0 -> a
# >>> 1 -> b
# >>> 3 -> d
# STEP_END

# REMOVE_START
assert res12 == 3
assert res13 == [[0, "a"], [1, "b"], [3, "d"]]
r.delete("seq")
# REMOVE_END

# REMOVE_START
r.delete("log")
# REMOVE_END

# STEP_START arinsert
res14 = r.arinsert("log", "event1")
print(res14)
# >>> 0

res15 = r.arinsert("log", "event2")
print(res15)
# >>> 1

res16 = r.arnext("log")
print(res16)
# >>> 2

res17 = r.arseek("log", 10)
print(res17)
# >>> 1

res18 = r.arinsert("log", "event3")
print(res18)
# >>> 10
# STEP_END

# REMOVE_START
assert res14 == 0
assert res15 == 1
assert res16 == 2
assert res17 == 1
assert res18 == 10
r.delete("log")
# REMOVE_END

# REMOVE_START
r.delete("readings")
# REMOVE_END

# STEP_START arring
res19 = r.arring("readings", 3, "v0")
print(res19)
# >>> 0

res20 = r.arring("readings", 3, "v1")
print(res20)
# >>> 1

res21 = r.arring("readings", 3, "v2")
print(res21)
# >>> 2

res22 = r.arring("readings", 3, "v3")
print(res22)
# >>> 0

res23 = r.arget("readings", 0)
print(res23)
# >>> v3
# STEP_END

# REMOVE_START
assert res19 == 0
assert res20 == 1
assert res21 == 2
assert res22 == 0
assert res23 == "v3"
r.delete("readings")
# REMOVE_END

# REMOVE_START
r.delete("readings")
# REMOVE_END

# STEP_START arlastitems
r.arring("readings", 3, "v0")
r.arring("readings", 3, "v1")
r.arring("readings", 3, "v2")
r.arring("readings", 3, "v3")

res24 = r.arlastitems("readings", 3)
print(res24)
# >>> ['v1', 'v2', 'v3']

res25 = r.arlastitems("readings", 3, rev=True)
print(res25)
# >>> ['v3', 'v2', 'v1']
# STEP_END

# REMOVE_START
assert res24 == ["v1", "v2", "v3"]
assert res25 == ["v3", "v2", "v1"]
r.delete("readings")
# REMOVE_END

# REMOVE_START
r.delete("scores")
# REMOVE_END

# STEP_START arop
res26 = r.armset("scores", {0: "10", 1: "20", 2: "30"})
print(res26)
# >>> 3

res27 = r.arop("scores", 0, 2, ArrayAggregateOperations.SUM)
print(res27)
# >>> 60

res28 = r.arop("scores", 0, 2, ArrayAggregateOperations.MAX)
print(res28)
# >>> 30

res29 = r.arop("scores", 0, 2, ArrayAggregateOperations.MATCH, value="10")
print(res29)
# >>> 1
# STEP_END

# REMOVE_START
assert res26 == 3
assert res27 == "60"
assert res28 == "30"
assert res29 == 1
r.delete("scores")
# REMOVE_END

# REMOVE_START
r.delete("log")
# REMOVE_END

# STEP_START argrep
res30 = r.armset(
    "log",
    {
        0: "boot: ok",
        1: "warn: disk",
        2: "ERROR: cpu",
        3: "info: ready",
        4: "error: net",
    },
)
print(res30)
# >>> 5

res31 = r.argrep(
    "log",
    0,
    4,
    [(ArrayPredicateType.MATCH, "error")],
    nocase=True,
)
print(res31)
# >>> [2, 4]

res32 = r.argrep(
    "log",
    0,
    4,
    [
        (ArrayPredicateType.GLOB, "warn:*"),
        (ArrayPredicateType.GLOB, "error:*"),
    ],
    combinator=ArrayPredicateCombinator.OR,
    withvalues=True,
)
print(res32)
# >>> [[1, 'warn: disk'], [4, 'error: net']]
# STEP_END

# REMOVE_START
assert res30 == 5
assert res31 == [2, 4]
assert res32 == [[1, "warn: disk"], [4, "error: net"]]
r.delete("log")
# REMOVE_END

# REMOVE_START
r.delete("scores")
# REMOVE_END

# STEP_START ardel
res33 = r.armset("scores", {0: "10", 1: "20", 2: "30"})
print(res33)
# >>> 3

res34 = r.ardel("scores", 1)
print(res34)
# >>> 1

res35 = r.ardelrange("scores", (0, 2))
print(res35)
# >>> 2
# STEP_END

# REMOVE_START
assert res33 == 3
assert res34 == 1
assert res35 == 2
r.delete("scores")
# REMOVE_END
