# redis-rb (Ruby) Test File Patterns

This document describes the conventions used in redis-rb documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Ruby scripts** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Staging**: `local_examples/<set>/ruby/*.rb` (also the older flat `local_examples/ruby/*.rb`)
- **Upstream**: `redis-rb` repo, `examples/`
- **Sample template**: `sample_test.rb` (in this directory)

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `# EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `# BINDER_ID <id>` | Optional identifier for online code runners |
| `# HIDE_START` / `# HIDE_END` | Code hidden from docs but still executed |
| `# REMOVE_START` / `# REMOVE_END` | Code completely removed from docs |
| `# STEP_START <name>` / `# STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```ruby
# EXAMPLE: example_name

# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('mykey')
# REMOVE_END

# STEP_START operation_name
res1 = r.set('mykey', 'Hello')
puts res1 # >>> OK
# STEP_END

# REMOVE_START
assert_equal('OK', res1)
r.del('mykey')
# REMOVE_END
```

## Key Patterns

### 1. No test framework — assert locally

Ruby examples do **not** use minitest or RSpec. Define `assert_equal` inside a `REMOVE`
block and let it `raise`. A raise gives `ruby` a non-zero exit status, which is what the
harness reads. Every file that asserts needs its own copy of the helper — there is no shared
base class to inherit it from, unlike the Java, C#, and PHP clients.

```ruby
# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end
# REMOVE_END
```

### 2. Connection

`Redis.new` with no arguments connects to `localhost:6379` db 0. No options hash needed, and
the docs read better without one.

```ruby
r = Redis.new
```

### 3. `inspect` for collections, bare `puts` for scalars

`puts` on a Hash or Array prints an unhelpful form (and `puts []` prints nothing at all). Use
`.inspect` for any collection, and write the `>>>` comment exactly as `inspect` renders it:

```ruby
res = r.hgetall('myhash')
puts res.inspect
# >>> {"field1"=>"value1", "field2"=>"value2"}
```

Note the `=>` hash-rocket form — that is what `inspect` actually emits. Output comments are
published verbatim, so writing the modern `{field1: "value1"}` there would show readers
something Ruby never printed.

### 4. Replies are strings, except counters

Values read back from Redis are strings even when written as integers. The reply of an
increment command **is** an Integer. This is the most common assertion failure:

```ruby
r.hset('bike:1', 'price', 4972)
assert_equal('4972', r.hget('bike:1', 'price'))          # String, not 4972
assert_equal(1, r.hincrby('bike:1:stats', 'rides', 1))   # Integer
```

### 5. Multi-value writes take Ruby collections

`hset` takes a Hash; `zadd` takes an array of `[score, member]` pairs — not flat argument
lists:

```ruby
r.hset('myhash', { 'field1' => 'value1', 'field2' => 'value2' })
r.zadd('myzset', [[1, 'one'], [2, 'two']])
```

### 6. Cleanup

Delete keys in a `REMOVE` block both before and after the steps that use them. Prefer
targeted `r.del(...)` over `flushall` — the harness already flushes between clients, and a
`flushall` inside an example is a hazard if the harness is ever pointed at a real database.

## Running Tests

```bash
# Via the harness (resolves the path, flushes Redis, reports pass/fail)
build/example-test-harness/run.sh cmds_sorted_set ruby

# Directly
ruby local_examples/cmds_sorted_set/ruby/cmds_sorted_set.rb
```

Needs the `redis` gem and a scratch Redis on `localhost:6379`. In fidelity mode the gem is
pinned by `build/example-test-harness/fidelity/Gemfile-ruby`.

`sample_test.rb` in this directory has been run against Redis 8.10 and exits 0; its `>>>`
comments are the real observed output.

## See Also

- `build/example-test-harness/clients.tsv` — filename convention and paths for this client
- `for-ais-only/tcedocs/SPECIFICATION.md` — full marker semantics
- `.claude/skills/tce-examples/SKILL.md` — the workflow these files feed
