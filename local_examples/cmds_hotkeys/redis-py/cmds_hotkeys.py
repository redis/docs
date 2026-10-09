# EXAMPLE: cmds_hotkeys
# HIDE_START
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.hotkeys_stop()
r.hotkeys_reset()
r.delete("product:1", "product:2", "product:3")
r.mset({"product:1": "Laptop", "product:2": "Phone", "product:3": "Tablet"})
# REMOVE_END

# STEP_START hotkeys
from redis.commands.core import HotkeysMetricsTypes

# Track the 10 hottest keys by CPU time and network bytes.
res1 = r.hotkeys_start(
    metrics=[HotkeysMetricsTypes.CPU, HotkeysMetricsTypes.NET], count=10
)
print(res1)  # >>> OK

# Generate some traffic. In production, this is your application's workload.
for _ in range(100):
    r.get("product:1")

for _ in range(10):
    r.get("product:2")

r.get("product:3")

res2 = r.hotkeys_get()[0]
print(res2["tracking-active"])  # >>> 1

by_net = res2["by-net-bytes"]
print(list(zip(by_net[::2], by_net[1::2])))
# >>> [('product:1', 4000), ('product:2', 390), ('product:3', 40)]

res3 = r.hotkeys_stop()
print(res3)  # >>> OK

res4 = r.hotkeys_reset()
print(res4)  # >>> OK
# STEP_END

# REMOVE_START
assert res1 == "OK"
assert res2["tracking-active"] == 1
assert by_net == ["product:1", 4000, "product:2", 390, "product:3", 40]
assert res3 == "OK"
assert res4 == "OK"
assert r.hotkeys_get() is None
r.delete("product:1", "product:2", "product:3")
# REMOVE_END
