# =============================================================================
# CANONICAL redis-rb (RUBY) TEST FILE TEMPLATE
# =============================================================================
# This file demonstrates the structure and conventions used for redis-rb
# documentation test files. These tests serve dual purposes:
# 1. Executable Ruby scripts that validate code snippets
# 2. Source for documentation code examples (processed via special markers)
#
# MARKER REFERENCE:
# - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
# - BINDER_ID <id>      - Optional identifier for online code runners
# - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
# - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
# - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
#
# RUN: ruby sample_test.rb        (needs the `redis` gem and a scratch Redis)
# =============================================================================

# EXAMPLE: sample_example

# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
# redis-rb examples have no test framework: define the assertion locally and let it
# raise. A raise gives ruby a non-zero exit status, which is what the harness reads.
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('mykey', 'myhash', 'mylist')
# REMOVE_END

# STEP_START string_ops
res1 = r.set('mykey', 'Hello')
puts res1 # >>> OK

res2 = r.get('mykey')
puts res2 # >>> Hello
# STEP_END

# REMOVE_START
assert_equal('OK', res1)
assert_equal('Hello', res2)
r.del('mykey')
# REMOVE_END

# STEP_START hash_ops
res3 = r.hset('myhash', 'field1', 'value1')
puts res3 # >>> 1

# A hash is set from a Ruby Hash, not a flat argument list.
res4 = r.hset('myhash', { 'field2' => 'value2', 'field3' => 'value3' })
puts res4 # >>> 2

res5 = r.hget('myhash', 'field1')
puts res5 # >>> value1

# inspect is needed for collections: puts on a Hash prints its to_s, which is not
# the form the docs should show.
res6 = r.hgetall('myhash')
puts res6.inspect
# >>> {"field1"=>"value1", "field2"=>"value2", "field3"=>"value3"}
# STEP_END

# REMOVE_START
assert_equal(1, res3)
assert_equal(2, res4)
assert_equal('value1', res5)
assert_equal({ 'field1' => 'value1', 'field2' => 'value2', 'field3' => 'value3' }, res6)
r.del('myhash')
# REMOVE_END

# STEP_START numeric_ops
# Values come back as strings; only the reply of an increment is an Integer.
r.hset('bike:1:stats', 'rides', 0)
res7 = r.hincrby('bike:1:stats', 'rides', 1)
puts res7 # >>> 1

res8 = r.hincrby('bike:1:stats', 'rides', 1)
puts res8 # >>> 2
# STEP_END

# REMOVE_START
assert_equal(1, res7)
assert_equal(2, res8)
r.del('bike:1:stats')
# REMOVE_END

# HIDE_START
r.close
# HIDE_END
