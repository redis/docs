# EXAMPLE: hash_import

# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

user_keys = (1..1000).map { |i| "user:#{i}" }
r.del(user_keys)
# REMOVE_END

# STEP_START himport_basic
# Declare the field names once.
r.himport_prepare('user', %w[name email age])

# Create each hash by sending only its values.
res1 = r.himport_set('user:1', 'user', ['Alice', 'alice@example.com', '34'])
puts res1 # >>> OK

r.himport_set('user:2', 'user', ['Bob', 'bob@example.com', '41'])
r.himport_set('user:3', 'user', ['Carol', 'carol@example.com', '29'])

# The result is an ordinary hash.
res2 = r.hgetall('user:2')
puts res2.inspect
# >>> {"age" => "41", "name" => "Bob", "email" => "bob@example.com"}
# STEP_END

# REMOVE_START
assert_equal('OK', res1)
assert_equal({ 'name' => 'Bob', 'email' => 'bob@example.com', 'age' => '41' }, res2)
# REMOVE_END

# STEP_START himport_pipeline
# Queue many imports and send them in one round trip. The fieldset is
# declared inside the pipeline so it runs on the same connection.
replies = r.pipelined do |pipe|
  pipe.himport_prepare('user', %w[name email age])
  (1..1000).each do |i|
    pipe.himport_set("user:#{i}", 'user', ["user#{i}", "user#{i}@example.com", (20 + i % 50).to_s])
  end
end

# The first reply is for PREPARE.
res3 = replies.drop(1)
puts "#{res3.length} #{res3.all?('OK')}" # >>> 1000 true

res4 = r.hget('user:1000', 'email')
puts res4 # >>> user1000@example.com
# STEP_END

# REMOVE_START
assert_equal(1000, res3.length)
assert_equal(true, res3.all?('OK'))
assert_equal('user1000@example.com', res4)
r.del(user_keys)
r.himport_discard('user')
# REMOVE_END

# HIDE_START
r.close
# HIDE_END
