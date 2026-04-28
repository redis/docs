# EXAMPLE: stream_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
r.del('race:france', 'race:italy', 'race:usa', 'mystream')
# REMOVE_END

# STEP_START xadd
res1 = r.xadd('race:france', {
  'rider' => 'Castilla',
  'speed' => 30.2,
  'position' => 1,
  'location_id' => 1
})
puts res1 # 1692632086370-0, for example

res2 = r.xadd('race:france', {
  'rider' => 'Norem',
  'speed' => 28.8,
  'position' => 3,
  'location_id' => 1
})
puts res2 # 1692632094485-0, for example

res3 = r.xadd('race:france', {
  'rider' => 'Prickett',
  'speed' => 29.7,
  'position' => 2,
  'location_id' => 1
})
puts res3 # 1692632102976-0, for example
# STEP_END

# REMOVE_START
raise 'Expected three stream IDs' unless [res1, res2, res3].all? { |id| id.match?(/\A\d+-\d+\z/) }
raise 'Expected three entries' unless r.xlen('race:france') == 3
# REMOVE_END

# STEP_START xrange
# HIDE_START
r.del('race:france')
r.xadd('race:france', {
  'rider' => 'Castilla',
  'speed' => '30.2',
  'position' => '1',
  'location_id' => '1'
}, id: '1692632086370-0')
r.xadd('race:france', {
  'rider' => 'Norem',
  'speed' => '28.8',
  'position' => '3',
  'location_id' => '1'
}, id: '1692632094485-0')
r.xadd('race:france', {
  'rider' => 'Prickett',
  'speed' => '29.7',
  'position' => '2',
  'location_id' => '1'
}, id: '1692632102976-0')
r.xadd('race:france', {
  'rider' => 'Castilla',
  'speed' => '29.9',
  'position' => '1',
  'location_id' => '2'
}, id: '1692632147973-0')
# HIDE_END
res4 = r.xrange('race:france', '1692632086370-0', '+', count: 2)
puts res4.inspect
# [["1692632086370-0", {"rider"=>"Castilla", "speed"=>"30.2", "position"=>"1", "location_id"=>"1"}],
#  ["1692632094485-0", {"rider"=>"Norem", "speed"=>"28.8", "position"=>"3", "location_id"=>"1"}]]
# STEP_END

# REMOVE_START
raise 'Expected two entries' unless res4.length == 2
raise 'Expected first fixed ID' unless res4[0][0] == '1692632086370-0'
raise 'Expected second fixed ID' unless res4[1][0] == '1692632094485-0'
# REMOVE_END

# STEP_START xread_block
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla'}, id: '1692632086370-0')
# HIDE_END
res5 = r.xread(['race:france'], ['$'], count: 100, block: 300)
puts res5.inspect # {}
# STEP_END

# REMOVE_START
raise 'Expected empty result when XREAD times out' unless res5.empty?
# REMOVE_END

# STEP_START xadd_2
res6 = r.xadd('race:france', {
  'rider' => 'Castilla',
  'speed' => 29.9,
  'position' => 1,
  'location_id' => 2
})
puts res6 # 1692632147973-0, for example
# STEP_END

# REMOVE_START
raise 'Expected a stream ID' unless res6.match?(/\A\d+-\d+\z/)
# REMOVE_END

# STEP_START xlen
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla'}, id: '1692632086370-0')
r.xadd('race:france', {'rider' => 'Norem'}, id: '1692632094485-0')
r.xadd('race:france', {'rider' => 'Prickett'}, id: '1692632102976-0')
r.xadd('race:france', {'rider' => 'Castilla'}, id: '1692632147973-0')
# HIDE_END
res7 = r.xlen('race:france')
puts res7 # 4
# STEP_END

# REMOVE_START
raise 'Expected four stream entries' unless res7 == 4
# REMOVE_END

# STEP_START xadd_id
# HIDE_START
r.del('race:usa')
# HIDE_END
res8 = r.xadd('race:usa', {'racer' => 'Castilla'}, id: '0-1')
puts res8 # 0-1

res9 = r.xadd('race:usa', {'racer' => 'Norem'}, id: '0-2')
puts res9 # 0-2
# STEP_END

# REMOVE_START
raise 'Expected 0-1' unless res8 == '0-1'
raise 'Expected 0-2' unless res9 == '0-2'
# REMOVE_END

# STEP_START xadd_bad_id
begin
  r.xadd('race:usa', {'racer' => 'Prickett'}, id: '0-1')
rescue Redis::CommandError => e
  puts e.message
  # ERR The ID specified in XADD is equal or smaller than the target stream top item
end
# STEP_END

# REMOVE_START
begin
  r.xadd('race:usa', {'racer' => 'Prickett'}, id: '0-1')
  raise 'Expected XADD to reject a non-increasing ID'
rescue Redis::CommandError => e
  raise 'Expected WRONGID error' unless e.message.include?('equal or smaller')
end
# REMOVE_END

# STEP_START xadd_7
# HIDE_START
r.del('race:usa')
r.xadd('race:usa', {'racer' => 'Castilla'}, id: '0-1')
r.xadd('race:usa', {'racer' => 'Norem'}, id: '0-2')
# HIDE_END
res10 = r.xadd('race:usa', {'racer' => 'Prickett'}, id: '0-*')
puts res10 # 0-3
# STEP_END

# REMOVE_START
raise 'Expected Redis to generate the sequence number' unless res10 == '0-3'
# REMOVE_END

# STEP_START xrange_all
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '30.2', 'position' => '1', 'location_id' => '1'}, id: '1692632086370-0')
r.xadd('race:france', {'rider' => 'Norem', 'speed' => '28.8', 'position' => '3', 'location_id' => '1'}, id: '1692632094485-0')
r.xadd('race:france', {'rider' => 'Prickett', 'speed' => '29.7', 'position' => '2', 'location_id' => '1'}, id: '1692632102976-0')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '29.9', 'position' => '1', 'location_id' => '2'}, id: '1692632147973-0')
# HIDE_END
res11 = r.xrange('race:france', '-', '+')
puts res11.inspect
# [["1692632086370-0", {"rider"=>"Castilla", "speed"=>"30.2", "position"=>"1", "location_id"=>"1"}],
#  ["1692632094485-0", {"rider"=>"Norem", "speed"=>"28.8", "position"=>"3", "location_id"=>"1"}],
#  ["1692632102976-0", {"rider"=>"Prickett", "speed"=>"29.7", "position"=>"2", "location_id"=>"1"}],
#  ["1692632147973-0", {"rider"=>"Castilla", "speed"=>"29.9", "position"=>"1", "location_id"=>"2"}]]
# STEP_END

# REMOVE_START
raise 'Expected all four entries' unless res11.length == 4
# REMOVE_END

# STEP_START xrange_time
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '30.2', 'position' => '1', 'location_id' => '1'}, id: '1692632086370-0')
r.xadd('race:france', {'rider' => 'Norem', 'speed' => '28.8', 'position' => '3', 'location_id' => '1'}, id: '1692632094485-0')
# HIDE_END
res12 = r.xrange('race:france', '1692632086369', '1692632086371')
puts res12.inspect
# [["1692632086370-0", {"rider"=>"Castilla", "speed"=>"30.2", "position"=>"1", "location_id"=>"1"}]]
# STEP_END

# REMOVE_START
raise 'Expected one entry in time range' unless res12.length == 1
raise 'Expected Castilla entry' unless res12[0][1]['rider'] == 'Castilla'
# REMOVE_END

# STEP_START xrange_step_1
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '30.2', 'position' => '1', 'location_id' => '1'}, id: '1692632086370-0')
r.xadd('race:france', {'rider' => 'Norem', 'speed' => '28.8', 'position' => '3', 'location_id' => '1'}, id: '1692632094485-0')
r.xadd('race:france', {'rider' => 'Prickett', 'speed' => '29.7', 'position' => '2', 'location_id' => '1'}, id: '1692632102976-0')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '29.9', 'position' => '1', 'location_id' => '2'}, id: '1692632147973-0')
# HIDE_END
res13 = r.xrange('race:france', '-', '+', count: 2)
puts res13.inspect
# [["1692632086370-0", {"rider"=>"Castilla", "speed"=>"30.2", "position"=>"1", "location_id"=>"1"}],
#  ["1692632094485-0", {"rider"=>"Norem", "speed"=>"28.8", "position"=>"3", "location_id"=>"1"}]]
# STEP_END

# REMOVE_START
raise 'Expected first page of two entries' unless res13.map(&:first) == ['1692632086370-0', '1692632094485-0']
# REMOVE_END

# STEP_START xrange_step_2
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '30.2', 'position' => '1', 'location_id' => '1'}, id: '1692632086370-0')
r.xadd('race:france', {'rider' => 'Norem', 'speed' => '28.8', 'position' => '3', 'location_id' => '1'}, id: '1692632094485-0')
r.xadd('race:france', {'rider' => 'Prickett', 'speed' => '29.7', 'position' => '2', 'location_id' => '1'}, id: '1692632102976-0')
r.xadd('race:france', {'rider' => 'Castilla', 'speed' => '29.9', 'position' => '1', 'location_id' => '2'}, id: '1692632147973-0')
# HIDE_END
res14 = r.xrange('race:france', '(1692632094485-0', '+', count: 2)
puts res14.inspect
# [["1692632102976-0", {"rider"=>"Prickett", "speed"=>"29.7", "position"=>"2", "location_id"=>"1"}],
#  ["1692632147973-0", {"rider"=>"Castilla", "speed"=>"29.9", "position"=>"1", "location_id"=>"2"}]]
# STEP_END

# REMOVE_START
raise 'Expected second page of two entries' unless res14.map(&:first) == ['1692632102976-0', '1692632147973-0']
# REMOVE_END

# STEP_START xrange_empty
res15 = r.xrange('race:france', '(1692632147973-0', '+', count: 2)
puts res15.inspect # []
# STEP_END

# REMOVE_START
raise 'Expected no more entries' unless res15.empty?
# REMOVE_END

# STEP_START xrevrange
res16 = r.xrevrange('race:france', '+', '-', count: 1)
puts res16.inspect
# [["1692632147973-0", {"rider"=>"Castilla", "speed"=>"29.9", "position"=>"1", "location_id"=>"2"}]]
# STEP_END

# REMOVE_START
raise 'Expected newest entry' unless res16.length == 1 && res16[0][0] == '1692632147973-0'
# REMOVE_END

# STEP_START xread
res17 = r.xread(['race:france'], ['0'], count: 2)
puts res17.inspect
# {"race:france"=>[["1692632086370-0", {"rider"=>"Castilla", "speed"=>"30.2", "position"=>"1", "location_id"=>"1"}],
#                  ["1692632094485-0", {"rider"=>"Norem", "speed"=>"28.8", "position"=>"3", "location_id"=>"1"}]]}
# STEP_END

# REMOVE_START
raise 'Expected two XREAD entries' unless res17['race:france'].length == 2
# REMOVE_END

# STEP_START xgroup_create
# HIDE_START
r.del('race:france')
r.xadd('race:france', {'rider' => 'Castilla'}, id: '1692632086370-0')
# HIDE_END
res18 = r.xgroup(:create, 'race:france', 'france_riders', '$')
puts res18 # OK
# STEP_END

# REMOVE_START
raise 'Expected OK' unless res18 == 'OK'
# REMOVE_END

# STEP_START xgroup_create_mkstream
# HIDE_START
r.del('race:italy')
# HIDE_END
res19 = r.xgroup(:create, 'race:italy', 'italy_riders', '$', mkstream: true)
puts res19 # OK
# STEP_END

# REMOVE_START
raise 'Expected OK' unless res19 == 'OK'
# REMOVE_END

# STEP_START xgroup_read
# HIDE_START
r.del('race:italy')
r.xgroup(:create, 'race:italy', 'italy_riders', '$', mkstream: true)
# HIDE_END
r.xadd('race:italy', {'rider' => 'Castilla'}, id: '1692632639151-0')
r.xadd('race:italy', {'rider' => 'Royce'}, id: '1692632647899-0')
r.xadd('race:italy', {'rider' => 'Sam-Bodden'}, id: '1692632662819-0')
r.xadd('race:italy', {'rider' => 'Prickett'}, id: '1692632670501-0')
r.xadd('race:italy', {'rider' => 'Norem'}, id: '1692632678249-0')

res20 = r.xreadgroup('italy_riders', 'Alice', ['race:italy'], ['>'], count: 1)
puts res20.inspect
# {"race:italy"=>[["1692632639151-0", {"rider"=>"Castilla"}]]}
# STEP_END

# REMOVE_START
raise 'Expected Alice to receive Castilla' unless res20['race:italy'][0][0] == '1692632639151-0'
# REMOVE_END

# STEP_START xgroup_read_id
res21 = r.xreadgroup('italy_riders', 'Alice', ['race:italy'], ['0'], count: 1)
puts res21.inspect
# {"race:italy"=>[["1692632639151-0", {"rider"=>"Castilla"}]]}
# STEP_END

# REMOVE_START
raise 'Expected pending Castilla message' unless res21['race:italy'][0][0] == '1692632639151-0'
# REMOVE_END

# STEP_START xack
res22 = r.xack('race:italy', 'italy_riders', '1692632639151-0')
puts res22 # 1

res23 = r.xreadgroup('italy_riders', 'Alice', ['race:italy'], ['0'])
puts res23.inspect
# {"race:italy"=>[]}
# STEP_END

# REMOVE_START
raise 'Expected one acknowledged message' unless res22 == 1
raise 'Expected no pending messages for Alice' unless res23['race:italy'].empty?
# REMOVE_END

# STEP_START xgroup_read_bob
res24 = r.xreadgroup('italy_riders', 'Bob', ['race:italy'], ['>'], count: 2)
puts res24.inspect
# {"race:italy"=>[["1692632647899-0", {"rider"=>"Royce"}],
#                 ["1692632662819-0", {"rider"=>"Sam-Bodden"}]]}
# STEP_END

# REMOVE_START
raise 'Expected Bob to receive two messages' unless res24['race:italy'].map(&:first) == ['1692632647899-0', '1692632662819-0']
# REMOVE_END

# STEP_START xpending
res25 = r.xpending('race:italy', 'italy_riders')
puts res25.inspect
# {"size"=>2, "min_entry_id"=>"1692632647899-0", "max_entry_id"=>"1692632662819-0", "consumers"=>{"Bob"=>"2"}}
# STEP_END

# REMOVE_START
raise 'Expected two pending messages' unless res25['size'] == 2
raise 'Expected Bob pending messages' unless res25['consumers']['Bob'] == '2'
# REMOVE_END

# STEP_START xpending_plus_minus
res26 = r.xpending('race:italy', 'italy_riders', '-', '+', 10)
puts res26.inspect
# STEP_END

# REMOVE_START
raise 'Expected pending details' unless res26.map { |entry| entry['entry_id'] } == ['1692632647899-0', '1692632662819-0']
raise 'Expected Bob ownership' unless res26.all? { |entry| entry['consumer'] == 'Bob' }
# REMOVE_END

# STEP_START xrange_pending
res27 = r.xrange('race:italy', '1692632647899-0', '1692632647899-0')
puts res27.inspect
# [["1692632647899-0", {"rider"=>"Royce"}]]
# STEP_END

# REMOVE_START
raise 'Expected Royce pending entry' unless res27[0][1]['rider'] == 'Royce'
# REMOVE_END

# STEP_START xclaim
res28 = r.xclaim('race:italy', 'italy_riders', 'Alice', 0, '1692632647899-0')
puts res28.inspect
# [["1692632647899-0", {"rider"=>"Royce"}]]
# STEP_END

# REMOVE_START
raise 'Expected Alice to claim Royce' unless res28[0][0] == '1692632647899-0'
# REMOVE_END

# STEP_START xautoclaim
res29 = r.xautoclaim('race:italy', 'italy_riders', 'Alice', 0, '0-0', count: 1)
puts res29.inspect
# {"next"=>"1692632662819-0", "entries"=>[["1692632647899-0", {"rider"=>"Royce"}]]}
# STEP_END

# REMOVE_START
raise 'Expected autoclaim result' unless res29['entries'].length == 1
# REMOVE_END

# STEP_START xautoclaim_cursor
res30 = r.xautoclaim('race:italy', 'italy_riders', 'Lora', 0, res29['next'], count: 1)
puts res30.inspect
# {"next"=>"0-0", "entries"=>[["1692632662819-0", {"rider"=>"Sam-Bodden"}]]}
# STEP_END

# REMOVE_START
raise 'Expected cursor autoclaim result' unless res30.key?('entries')
# REMOVE_END

# STEP_START xinfo
res31 = r.xinfo(:stream, 'race:italy')
puts res31.inspect
# STEP_END

# REMOVE_START
raise 'Expected five stream entries' unless res31['length'] == 5
raise 'Expected one consumer group' unless res31['groups'] == 1
# REMOVE_END

# STEP_START xinfo_groups
res32 = r.xinfo(:groups, 'race:italy')
puts res32.inspect
# STEP_END

# REMOVE_START
raise 'Expected italy_riders group' unless res32[0]['name'] == 'italy_riders'
# REMOVE_END

# STEP_START xinfo_consumers
res33 = r.xinfo(:consumers, 'race:italy', 'italy_riders')
puts res33.inspect
# STEP_END

# REMOVE_START
consumer_names = res33.map { |consumer| consumer['name'] }
raise 'Expected Alice consumer' unless consumer_names.include?('Alice')
raise 'Expected Bob consumer' unless consumer_names.include?('Bob')
# REMOVE_END

# STEP_START maxlen
# HIDE_START
r.del('race:italy')
r.xadd('race:italy', {'rider' => 'Castilla'}, id: '1692632639151-0')
r.xadd('race:italy', {'rider' => 'Royce'}, id: '1692632647899-0')
r.xadd('race:italy', {'rider' => 'Sam-Bodden'}, id: '1692632662819-0')
r.xadd('race:italy', {'rider' => 'Prickett'}, id: '1692632670501-0')
r.xadd('race:italy', {'rider' => 'Norem'}, id: '1692632678249-0')
# HIDE_END
r.xadd('race:italy', {'rider' => 'Jones'}, id: '1692633189161-0', maxlen: 2)
r.xadd('race:italy', {'rider' => 'Wood'}, id: '1692633198206-0', maxlen: 2)
r.xadd('race:italy', {'rider' => 'Henshaw'}, id: '1692633208557-0', maxlen: 2)

res34 = r.xlen('race:italy')
puts res34 # 2

res35 = r.xrange('race:italy', '-', '+')
puts res35.inspect
# [["1692633198206-0", {"rider"=>"Wood"}], ["1692633208557-0", {"rider"=>"Henshaw"}]]
# STEP_END

# REMOVE_START
raise 'Expected stream trimmed to two entries' unless res34 == 2
raise 'Expected Wood and Henshaw' unless res35.map { |entry| entry[1]['rider'] } == ['Wood', 'Henshaw']
# REMOVE_END

# STEP_START xtrim
res36 = r.xtrim('race:italy', 10, approximate: false)
puts res36 # 0
# STEP_END

# REMOVE_START
raise 'Expected no entries trimmed' unless res36 == 0
# REMOVE_END

# STEP_START xtrim2
# HIDE_START
r.del('mystream')
1.upto(10) do |n|
  r.xadd('mystream', {'field' => 'value'}, id: "#{n}-0")
end
# HIDE_END
res37 = r.xtrim('mystream', 10, approximate: true)
puts res37 # 0
# STEP_END

# REMOVE_START
raise 'Expected no entries trimmed' unless res37 == 0
# REMOVE_END

# STEP_START xdel
# HIDE_START
r.del('race:italy')
r.xadd('race:italy', {'rider' => 'Wood'}, id: '1692633198206-0')
r.xadd('race:italy', {'rider' => 'Henshaw'}, id: '1692633208557-0')
# HIDE_END
res38 = r.xrange('race:italy', '-', '+', count: 2)
puts res38.inspect
# [["1692633198206-0", {"rider"=>"Wood"}], ["1692633208557-0", {"rider"=>"Henshaw"}]]

res39 = r.xdel('race:italy', '1692633208557-0')
puts res39 # 1

res40 = r.xrange('race:italy', '-', '+', count: 2)
puts res40.inspect
# [["1692633198206-0", {"rider"=>"Wood"}]]
# STEP_END

# REMOVE_START
raise 'Expected two entries before deletion' unless res38.length == 2
raise 'Expected one deleted entry' unless res39 == 1
raise 'Expected only Wood after deletion' unless res40.length == 1 && res40[0][1]['rider'] == 'Wood'
r.close
# REMOVE_END
