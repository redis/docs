# EXAMPLE: cmds_stream
# HIDE_START
"""
Code samples for XADD command:
    https://redis.io/docs/latest/commands/xadd/
"""

import redis

r = redis.Redis(decode_responses=True)
# HIDE_END
# REMOVE_START
r.delete("mystream")
# REMOVE_END

# STEP_START xadd1
res1 = r.xadd("mystream", {"name": "Sara", "surname": "OConnor"})
print(res1)  # >>> 1726055713866-0

res2 = r.xadd("mystream", {"field1": "value1", "field2": "value2", "field3": "value3"})
print(res2)  # >>> 1726055713866-1

res3 = r.xlen("mystream")
print(res3)  # >>> 2

res4 = r.xrange("mystream", "-", "+")
print(res4)
# >>> [
#   ('1726055713866-0', {'name': 'Sara', 'surname': 'OConnor'}),
#   ('1726055713866-1', {'field1': 'value1', 'field2': 'value2', 'field3': 'value3'})
# ]
# STEP_END

# REMOVE_START
assert res3 == 2
assert len(res4) == 2
r.delete("mystream")
# REMOVE_END

# STEP_START xadd2
res5 = r.xadd("mystream", {"field": "value"}, idmp=("producer1", b"msg1"))
print(res5)  # >>> 1726055713867-0

# Attempting to add the same message again with IDMP returns the original entry ID
res6 = r.xadd("mystream", {"field": "different_value"}, idmp=("producer1", b"msg1"))
print(res6)  # >>> 1726055713867-0 (same ID as res5, message was deduplicated)

res7 = r.xadd("mystream", {"field": "value"}, idmpauto="producer2")
print(res7)  # >>> 1726055713867-1

# Auto-generated idempotent ID prevents duplicates for same producer+content
res8 = r.xadd("mystream", {"field": "value"}, idmpauto="producer2")
print(res8)  # >>> 1726055713867-1 (same ID as res7, duplicate detected)

# Configure idempotent message processing settings
res9 = r.xcfgset("mystream", idmp_duration=300, idmp_maxsize=1000)
print(res9)  # >>> True
# STEP_END

# REMOVE_START
# Note: IDMP is a Redis 8.6 feature - assertions may need adjustment based on server version
assert res5 is not None
r.delete("mystream")
# REMOVE_END

