# Runs one command, or one MULTI/EXEC block, through redis-rb and prints what it returns or raises.
# Arguments: port user password mode payload...  (see _common.py for the format)
require 'redis'

port, user, pass, mode, *payload = ARGV
def toks(p) = p.split("\x01", -1).map { |s| s.start_with?('hex:') ? [s[4..]].pack('H*') : s }
def one(s) = s.to_s.gsub(/[\r\n]+/, ' ')

begin
  opts = { host: '127.0.0.1', port: port.to_i, timeout: 5.0 }
  opts[:username] = user unless user.empty?
  opts[:password] = pass unless pass.empty?
  r = Redis.new(**opts)
  if mode == 'cmd'
    puts "OK\t#{one(r.call(*toks(payload[0])).inspect)}"
  else
    res = r.multi { |tx| payload.each { |p| tx.call(*toks(p)) } }
    puts "OK\t#{one(res.inspect)}"
  end
rescue Exception => e
  cause = e.cause ? " [cause #{e.cause.class}: #{one(e.cause.message)}]" : ''
  puts "EXC\t#{e.class}\t#{one(e.message)}#{cause}"
end
