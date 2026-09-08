# EXAMPLE: json_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('bike', 'crashes', 'newbike', 'riders', 'bike:1', 'bikes:inventory')
# REMOVE_END

# STEP_START set_get
res1 = r.json_set('bike', '$', 'Hyperion')
puts res1 # >>> OK

res2 = r.json_get('bike', '$')
p res2 # >>> ["Hyperion"]

res3 = r.json_type('bike', '$')
p res3 # >>> ["string"]

# With raw: true, json_set accepts an already-encoded JSON string (skipping
# serialization) and json_get returns the unparsed JSON string rather than a
# Ruby object — useful when you store or forward plain JSON.
res_raw1 = r.json_set('bike', '$', '"Hyperion"', raw: true)
puts res_raw1 # >>> OK

res_raw2 = r.json_get('bike', '$', raw: true)
puts res_raw2 # >>> ["Hyperion"]  (a JSON string, not a Ruby array)
# STEP_END

# REMOVE_START
assert_equal(['Hyperion'], res2)
assert_equal('["Hyperion"]', res_raw2)
# REMOVE_END

# STEP_START str
res4 = r.json_strlen('bike', '$')
p res4 # >>> [8]

res5 = r.json_strappend('bike', '$', ' (Enduro bikes)')
p res5 # >>> [23]

res6 = r.json_get('bike', '$')
p res6 # >>> ["Hyperion (Enduro bikes)"]
# STEP_END

# REMOVE_START
assert_equal(['Hyperion (Enduro bikes)'], res6)
# REMOVE_END

# STEP_START num
res7 = r.json_set('crashes', '$', 0)
puts res7 # >>> OK

res8 = r.json_numincrby('crashes', '$', 1)
p res8 # >>> [1]

res9 = r.json_numincrby('crashes', '$', 1.5)
p res9 # >>> [2.5]

res10 = r.json_numincrby('crashes', '$', -0.75)
p res10 # >>> [1.75]
# STEP_END

# REMOVE_START
assert_equal([1.75], res10)
# REMOVE_END

# STEP_START arr
res11 = r.json_set('newbike', '$', ['Deimos', { 'crashes' => 0 }, nil])
puts res11 # >>> OK

res12 = r.json_get('newbike', '$')
p res12 # >>> [["Deimos", {"crashes"=>0}, nil]]

res13 = r.json_get('newbike', '$[1].crashes')
p res13 # >>> [0]

res14 = r.json_del('newbike', '$.[-1]')
p res14 # >>> 1

res15 = r.json_get('newbike', '$')
p res15 # >>> [["Deimos", {"crashes"=>0}]]

# The same raw: true option returns the array as unparsed JSON text.
res_raw3 = r.json_get('newbike', '$', raw: true)
puts res_raw3 # >>> [["Deimos",{"crashes":0}]]  (a JSON string)
# STEP_END

# REMOVE_START
assert_equal([['Deimos', { 'crashes' => 0 }]], res15)
assert_equal('[["Deimos",{"crashes":0}]]', res_raw3)
# REMOVE_END

# STEP_START arr2
res16 = r.json_set('riders', '$', [])
puts res16 # >>> OK

res17 = r.json_arrappend('riders', '$', 'Norem')
p res17 # >>> [1]

res18 = r.json_get('riders', '$')
p res18 # >>> [["Norem"]]

res19 = r.json_arrinsert('riders', '$', 1, 'Prickett', 'Royce', 'Castilla')
p res19 # >>> [4]

res20 = r.json_get('riders', '$')
p res20 # >>> [["Norem", "Prickett", "Royce", "Castilla"]]

res21 = r.json_arrtrim('riders', '$', 1, 1)
p res21 # >>> [1]

res22 = r.json_get('riders', '$')
p res22 # >>> [["Prickett"]]

res23 = r.json_arrpop('riders', '$')
p res23 # >>> ["Prickett"]

res24 = r.json_arrpop('riders', '$')
p res24 # >>> [nil]

# json_arrappend also takes a pre-encoded JSON value with raw: true.
res_raw4 = r.json_arrappend('riders', '$', '"Castilla"', raw: true)
p res_raw4 # >>> [1]
# STEP_END

# REMOVE_START
assert_equal([nil], res24)
assert_equal([1], res_raw4)
# REMOVE_END

# STEP_START obj
res25 = r.json_set('bike:1', '$', { 'model' => 'Deimos', 'brand' => 'Ergonom', 'price' => 4972 })
puts res25 # >>> OK

res26 = r.json_objlen('bike:1', '$')
p res26 # >>> [3]

res27 = r.json_objkeys('bike:1', '$')
p res27 # >>> [["model", "brand", "price"]]

# raw: true returns the object as unparsed JSON text.
res_raw5 = r.json_get('bike:1', '$', raw: true)
puts res_raw5 # >>> [{"model":"Deimos","brand":"Ergonom","price":4972}]  (a JSON string)
# STEP_END

# REMOVE_START
assert_equal([%w[model brand price]], res27)
assert_equal('[{"model":"Deimos","brand":"Ergonom","price":4972}]', res_raw5)
# REMOVE_END

# STEP_START set_bikes
# HIDE_START
inventory_json = {
  'inventory' => {
    'mountain_bikes' => [
      {
        'id' => 'bike:1',
        'model' => 'Phoebe',
        'description' => 'This is a mid-travel trail slayer that is a fantastic ' \
          'daily driver or one bike quiver. The Shimano Claris 8-speed groupset ' \
          'gives plenty of gear range to tackle hills and there’s room for ' \
          'mudguards and a rack too.  This is the bike for the rider who wants ' \
          'trail manners with low fuss ownership.',
        'price' => 1920,
        'specs' => { 'material' => 'carbon', 'weight' => 13.1 },
        'colors' => %w[black silver]
      },
      {
        'id' => 'bike:2',
        'model' => 'Quaoar',
        'description' => 'Redesigned for the 2020 model year, this bike ' \
          "impressed our testers and is the best all-around trail bike we've " \
          'ever tested. The Shimano gear system effectively does away with an ' \
          'external cassette, so is super low maintenance in terms of wear ' \
          "and tear. All in all it's an impressive package for the price, " \
          'making it very competitive.',
        'price' => 2072,
        'specs' => { 'material' => 'aluminium', 'weight' => 7.9 },
        'colors' => %w[black white]
      },
      {
        'id' => 'bike:3',
        'model' => 'Weywot',
        'description' => 'This bike gives kids aged six years and older ' \
          'a durable and uberlight mountain bike for their first experience ' \
          'on tracks and easy cruising through forests and fields. A set of ' \
          'powerful Shimano hydraulic disc brakes provide ample stopping ' \
          "ability. If you're after a budget option, this is one of the best " \
          'bikes you could get.',
        'price' => 3264,
        'specs' => { 'material' => 'alloy', 'weight' => 13.8 }
      }
    ],
    'commuter_bikes' => [
      {
        'id' => 'bike:4',
        'model' => 'Salacia',
        'description' => 'This bike is a great option for anyone who just ' \
          'wants a bike to get about on With a slick-shifting Claris gears ' \
          'from Shimano’s, this is a bike which doesn’t break the ' \
          "bank and delivers craved performance.  It's for the rider " \
          'who wants both efficiency and capability.',
        'price' => 1475,
        'specs' => { 'material' => 'aluminium', 'weight' => 16.6 },
        'colors' => %w[black silver]
      },
      {
        'id' => 'bike:5',
        'model' => 'Mimas',
        'description' => 'A real joy to ride, this bike got very high ' \
          'scores in last years Bike of the year report. The carefully ' \
          'crafted 50-34 tooth chainset and 11-32 tooth cassette give an ' \
          'easy-on-the-legs bottom gear for climbing, and the high-quality ' \
          'Vittoria Zaffiro tires give balance and grip.It includes ' \
          'a low-step frame , our memory foam seat, bump-resistant shocks and ' \
          'conveniently placed thumb throttle. Put it all together and you ' \
          'get a bike that helps redefine what can be done for this price.',
        'price' => 3941,
        'specs' => { 'material' => 'alloy', 'weight' => 11.6 }
      }
    ]
  }
}
# HIDE_END

res1 = r.json_set('bikes:inventory', '$', inventory_json)
puts res1 # >>> OK
# STEP_END

# STEP_START get_bikes
res2 = r.json_get('bikes:inventory', '$.inventory.*')
p res2
# >>> [[{"id"=>"bike:1", "model"=>"Phoebe",
# >>>    "description"=>"This is a mid-travel trail slayer...
# STEP_END

# STEP_START get_mtnbikes
res3 = r.json_get('bikes:inventory', '$.inventory.mountain_bikes[*].model')
p res3 # >>> ["Phoebe", "Quaoar", "Weywot"]

res4 = r.json_get('bikes:inventory', '$.inventory["mountain_bikes"][*].model')
p res4 # >>> ["Phoebe", "Quaoar", "Weywot"]

res5 = r.json_get('bikes:inventory', '$..mountain_bikes[*].model')
p res5 # >>> ["Phoebe", "Quaoar", "Weywot"]
# STEP_END

# REMOVE_START
assert_equal(%w[Phoebe Quaoar Weywot], res3)
assert_equal(%w[Phoebe Quaoar Weywot], res4)
assert_equal(%w[Phoebe Quaoar Weywot], res5)
# REMOVE_END

# STEP_START get_models
res6 = r.json_get('bikes:inventory', '$..model')
p res6 # >>> ["Phoebe", "Quaoar", "Weywot", "Salacia", "Mimas"]
# STEP_END

# REMOVE_START
assert_equal(%w[Phoebe Quaoar Weywot Salacia Mimas], res6)
# REMOVE_END

# STEP_START get2mtnbikes
res7 = r.json_get('bikes:inventory', '$..mountain_bikes[0:2].model')
p res7 # >>> ["Phoebe", "Quaoar"]
# STEP_END

# REMOVE_START
assert_equal(%w[Phoebe Quaoar], res7)
# REMOVE_END

# STEP_START filter1
res8 = r.json_get(
  'bikes:inventory',
  '$..mountain_bikes[?(@.price < 3000 && @.specs.weight < 10)]'
)
p res8
# >>> [{"id"=>"bike:2", "model"=>"Quaoar",
# >>>   "description"=>"Redesigned for the 2020 model year...
# STEP_END

# REMOVE_START
assert_equal(
  [
    {
      'id' => 'bike:2',
      'model' => 'Quaoar',
      'description' => 'Redesigned for the 2020 model year, this bike impressed ' \
        "our testers and is the best all-around trail bike we've ever tested. " \
        'The Shimano gear system effectively does away with an external cassette, ' \
        "so is super low maintenance in terms of wear and tear. All in all it's " \
        'an impressive package for the price, making it very competitive.',
      'price' => 2072,
      'specs' => { 'material' => 'aluminium', 'weight' => 7.9 },
      'colors' => %w[black white]
    }
  ],
  res8
)
# REMOVE_END

# STEP_START filter2
res9 = r.json_get('bikes:inventory', "$..[?(@.specs.material == 'alloy')].model")
p res9 # >>> ["Weywot", "Mimas"]
# STEP_END

# REMOVE_START
assert_equal(%w[Weywot Mimas], res9)
# REMOVE_END

# STEP_START filter3
res10 = r.json_get('bikes:inventory', "$..[?(@.specs.material =~ '(?i)al')].model")
p res10 # >>> ["Quaoar", "Weywot", "Salacia", "Mimas"]
# STEP_END

# REMOVE_START
assert_equal(%w[Quaoar Weywot Salacia Mimas], res10)
# REMOVE_END

# STEP_START filter4
res11 = r.json_set(
  'bikes:inventory', '$.inventory.mountain_bikes[0].regex_pat', '(?i)al'
)
res12 = r.json_set(
  'bikes:inventory', '$.inventory.mountain_bikes[1].regex_pat', '(?i)al'
)
res13 = r.json_set(
  'bikes:inventory', '$.inventory.mountain_bikes[2].regex_pat', '(?i)al'
)

res14 = r.json_get(
  'bikes:inventory',
  '$.inventory.mountain_bikes[?(@.specs.material =~ @.regex_pat)].model'
)
p res14 # >>> ["Quaoar", "Weywot"]
# STEP_END

# REMOVE_START
assert_equal(%w[Quaoar Weywot], res14)
# REMOVE_END

# STEP_START update_bikes
res15 = r.json_get('bikes:inventory', '$..price')
p res15 # >>> [1920, 2072, 3264, 1475, 3941]

res16 = r.json_numincrby('bikes:inventory', '$..price', -100)
p res16 # >>> [1820, 1972, 3164, 1375, 3841]

res17 = r.json_numincrby('bikes:inventory', '$..price', 100)
p res17 # >>> [1920, 2072, 3264, 1475, 3941]
# STEP_END

# REMOVE_START
assert_equal([1920, 2072, 3264, 1475, 3941], res15)
assert_equal([1820, 1972, 3164, 1375, 3841], res16)
assert_equal([1920, 2072, 3264, 1475, 3941], res17)
# REMOVE_END

# STEP_START update_filters1
res18 = r.json_set('bikes:inventory', '$.inventory.*[?(@.price<2000)].price', 1500)
res19 = r.json_get('bikes:inventory', '$..price')
p res19 # >>> [1500, 2072, 3264, 1500, 3941]
# STEP_END

# REMOVE_START
assert_equal([1500, 2072, 3264, 1500, 3941], res19)
# REMOVE_END

# STEP_START update_filters2
res20 = r.json_arrappend(
  'bikes:inventory', '$.inventory.*[?(@.price<2000)].colors', 'pink'
)
p res20 # >>> [3, 3]

res21 = r.json_get('bikes:inventory', '$..[*].colors')
p res21
# >>> [["black", "silver", "pink"], ["black", "white"], ["black", "silver", "pink"]]
# STEP_END

# REMOVE_START
assert_equal(
  [%w[black silver pink], %w[black white], %w[black silver pink]],
  res21
)
# REMOVE_END
