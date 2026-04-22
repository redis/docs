# EXAMPLE: pipe_trans_tutorial
require "redis"

r = Redis.new

(0..7).each do |i|
  r.del("seat:#{i}")
end

(1..3).each do |i|
  r.del("counter:#{i}")
end

r.del("shellpath")

# STEP_START basic_pipe
r.pipelined do |pipe|
  pipe.set("seat:0", "#0")
  pipe.set("seat:1", "#1")
  pipe.set("seat:2", "#2")
  pipe.set("seat:3", "#3")
  pipe.set("seat:4", "#4")
end

seats = r.pipelined do |pipe|
  pipe.get("seat:0")
  pipe.get("seat:1")
  pipe.get("seat:2")
  pipe.get("seat:3")
  pipe.get("seat:4")
end

puts seats.join(", ")
# >>> #0, #1, #2, #3, #4
# STEP_END

# STEP_START basic_trans
results = r.multi do |tx|
  tx.incr("counter:1")
  tx.incrby("counter:2", 2)
  tx.incrby("counter:3", 3)
end

puts results.join(", ")
# >>> 1, 2, 3
# STEP_END

# STEP_START trans_watch
r.set("shellpath", "/usr/syscmds/")

result = r.watch("shellpath") do |client|
  current_path = client.get("shellpath")

  client.multi do |tx|
    tx.set("shellpath", "#{current_path}:/usr/mycmds/")
  end
end

puts r.get("shellpath") unless result.nil?
# >>> /usr/syscmds/:/usr/mycmds/
# STEP_END
