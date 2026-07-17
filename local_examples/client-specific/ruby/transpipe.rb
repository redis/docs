# EXAMPLE: pipe_trans_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
r.del('seat:0', 'seat:1', 'seat:2', 'seat:3', 'seat:4',
      'counter:1', 'counter:2', 'counter:3', 'shellpath')
# REMOVE_END

# STEP_START basic_pipe
r.pipelined do |pipe|
  (0..4).each { |i| pipe.set("seat:#{i}", "##{i}") }
end

seats = r.pipelined do |pipe|
  pipe.get('seat:0')
  pipe.get('seat:3')
  pipe.get('seat:4')
end

puts seats[0] # >>> #0
puts seats[1] # >>> #3
puts seats[2] # >>> #4
# STEP_END

# REMOVE_START
raise "Assertion failed: #{seats}" unless seats == ['#0', '#3', '#4']
# REMOVE_END

# STEP_START basic_trans
trans_results = r.multi do |tx|
  tx.incrby('counter:1', 1)
  tx.incrby('counter:2', 2)
  tx.incrby('counter:3', 3)
end

puts trans_results[0] # >>> 1
puts trans_results[1] # >>> 2
puts trans_results[2] # >>> 3
# STEP_END

# REMOVE_START
raise "Assertion failed: #{trans_results}" unless trans_results == [1, 2, 3]
# REMOVE_END

# STEP_START trans_watch
r.set('shellpath', '/usr/syscmds/')

r.watch('shellpath') do |client|
  current_path = client.get('shellpath')
  new_path = current_path + ':/usr/mycmds/'

  client.multi do |tx|
    tx.set('shellpath', new_path)
  end
end

puts r.get('shellpath')
# >>> /usr/syscmds/:/usr/mycmds/
# STEP_END

# REMOVE_START
raise 'Assertion failed' unless r.get('shellpath') == '/usr/syscmds/:/usr/mycmds/'
# REMOVE_END
