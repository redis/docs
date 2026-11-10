# EXAMPLE: bitmap_tutorial
# HIDE_START
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("members")
# REMOVE_END

# STEP_START bitrangeintarray
r.config_set("bitmap-default-roaring", "yes")

for offset in (1, 7, 9, 30):
    r.setbit("members", offset, 1)

res1 = r.bitrangeintarray("members", 0, -1)
print(res1)  # >>> [1, 7, 9, 30]

res2 = r.bitrangeintarray("members", 28, 31, mode="BIT", zeros=True)
print(res2)  # >>> [28, 29, 31]

res3 = r.bitrangeintarray("members", 0, -1, mode="BIT", limit=2)
print(res3)  # >>> [1, 7]

res4 = r.bitrangeintarray("members", 8, -1, mode="BIT", limit=2)
print(res4)  # >>> [9, 30]

res5 = r.bitrangeintarray("members", 0, -1, mode="BYTE", limit=1)
print(res5)  # >>> [1, 7]

res6 = r.bitrangeintarray("members", 1, -1, mode="BYTE", limit=1)
print(res6)  # >>> [9]
# STEP_END

# REMOVE_START
assert res1 == [1, 7, 9, 30]
assert res2 == [28, 29, 31]
assert res3 == [1, 7]
assert res4 == [9, 30]
assert res5 == [1, 7]
assert res6 == [9]
r.delete("members")
r.config_set("bitmap-default-roaring", "no")
# REMOVE_END
