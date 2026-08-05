# =============================================================================
# CANONICAL REDIS-PY TEST FILE TEMPLATE
# =============================================================================
# This file demonstrates the structure and conventions used for redis-py
# documentation test files. These tests serve dual purposes:
# 1. Executable tests that validate code snippets
# 2. Source for documentation code examples (processed via special markers)
#
# MARKER REFERENCE:
# - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
# - BINDER_ID <id>      - Optional identifier for online code runners
# - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
# - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
# - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
#
# RUN: python sample_test.py
# =============================================================================

# EXAMPLE: sample_example
# BINDER_ID python-sample

# HIDE_START
import redis

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# HIDE_END

# REMOVE_START
# Clean up any existing data before tests
r.delete("mykey", "myhash", "bike:1")
# REMOVE_END

# STEP_START string_ops
# Basic string SET/GET operations
res1 = r.set("mykey", "Hello")
print(res1)
# >>> True

res2 = r.get("mykey")
print(res2)
# >>> Hello
# STEP_END

# REMOVE_START
assert res1 == True
assert res2 == "Hello"
r.delete("mykey")
# REMOVE_END

# STEP_START hash_ops
# Hash operations: HSET, HGET, HGETALL
res3 = r.hset("myhash", "field1", "value1")
print(res3)
# >>> 1

res4 = r.hset("myhash", mapping={"field2": "value2", "field3": "value3"})
print(res4)
# >>> 2

res5 = r.hget("myhash", "field1")
print(res5)
# >>> value1

res6 = r.hgetall("myhash")
print(res6)
# >>> {'field1': 'value1', 'field2': 'value2', 'field3': 'value3'}
# STEP_END

# REMOVE_START
assert res3 == 1
assert res4 == 2
assert res5 == "value1"
assert res6 == {"field1": "value1", "field2": "value2", "field3": "value3"}
r.delete("myhash")
# REMOVE_END

# STEP_START hash_tutorial
# Tutorial-style example with bike data
bike1 = {
    "model": "Deimos",
    "brand": "Ergonom",
    "type": "Enduro bikes",
    "price": "4972"
}

res7 = r.hset("bike:1", mapping=bike1)
print(res7)
# >>> 4

res8 = r.hget("bike:1", "model")
print(res8)
# >>> Deimos

res9 = r.hget("bike:1", "price")
print(res9)
# >>> 4972

res10 = r.hgetall("bike:1")
print(res10)
# >>> {'model': 'Deimos', 'brand': 'Ergonom', 'type': 'Enduro bikes', 'price': '4972'}
# STEP_END

# REMOVE_START
assert res7 == 4
assert res8 == "Deimos"
assert res9 == "4972"
assert res10 == {"model": "Deimos", "brand": "Ergonom", "type": "Enduro bikes", "price": "4972"}
r.delete("bike:1")
# REMOVE_END

# STEP_START hincrby
# Numeric operations on hash fields
r.hset("bike:1:stats", "rides", 0)
res11 = r.hincrby("bike:1:stats", "rides", 1)
print(res11)
# >>> 1

res12 = r.hincrby("bike:1:stats", "rides", 1)
print(res12)
# >>> 2

res13 = r.hincrby("bike:1:stats", "crashes", 1)
print(res13)
# >>> 1
# STEP_END

# REMOVE_START
assert res11 == 1
assert res12 == 2
assert res13 == 1
r.delete("bike:1:stats")
# REMOVE_END

