# EXAMPLE: vecset_tutorial
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

def assert(condition)
  raise 'Assertion failed' unless condition
end

r.del(
  'points', 'quantSetQ8', 'quantSetNoQ',
  'quantSetBin', 'setNotReduced', 'setReduced'
)
# REMOVE_END

# STEP_START vadd
res1 = r.vadd('points', [1.0, 1.0], 'pt:A')
puts res1 # >>> true

res2 = r.vadd('points', [-1.0, -1.0], 'pt:B')
puts res2 # >>> true

res3 = r.vadd('points', [-1.0, 1.0], 'pt:C')
puts res3 # >>> true

res4 = r.vadd('points', [1.0, -1.0], 'pt:D')
puts res4 # >>> true

res5 = r.vadd('points', [1.0, 0], 'pt:E')
puts res5 # >>> true

res6 = r.type('points')
puts res6 # >>> vectorset
# STEP_END
# REMOVE_START
assert_equal(true, res1)
assert_equal(true, res2)
assert_equal(true, res3)
assert_equal(true, res4)
assert_equal(true, res5)

assert_equal('vectorset', res6)
# REMOVE_END

# STEP_START vcardvdim
res7 = r.vcard('points')
puts res7 # >>> 5

res8 = r.vdim('points')
puts res8 # >>> 2
# STEP_END
# REMOVE_START
assert_equal(5, res7)
assert_equal(2, res8)
# REMOVE_END

# STEP_START vemb
res9 = r.vemb('points', 'pt:A')
p res9 # >>> [0.9999999403953552, 0.9999999403953552]

res10 = r.vemb('points', 'pt:B')
p res10 # >>> [-0.9999999403953552, -0.9999999403953552]

res11 = r.vemb('points', 'pt:C')
p res11 # >>> [-0.9999999403953552, 0.9999999403953552]

res12 = r.vemb('points', 'pt:D')
p res12 # >>> [0.9999999403953552, -0.9999999403953552]

res13 = r.vemb('points', 'pt:E')
p res13 # >>> [1.0, 0.0]
# STEP_END
# REMOVE_START
assert(1 - res9[0] < 0.001)
assert(1 - res9[1] < 0.001)
assert(1 + res10[0] < 0.001)
assert(1 + res10[1] < 0.001)
assert(1 + res11[0] < 0.001)
assert(1 - res11[1] < 0.001)
assert(1 - res12[0] < 0.001)
assert(1 + res12[1] < 0.001)
assert_equal([1.0, 0.0], res13)
# REMOVE_END

# STEP_START attr
res14 = r.vsetattr('points', 'pt:A', {
  'name' => 'Point A',
  'description' => 'First point added'
})
puts res14 # >>> true

res15 = r.vgetattr('points', 'pt:A')
puts res15
# >>> {"name"=>"Point A", "description"=>"First point added"}

res16 = r.vsetattr('points', 'pt:A', '')
puts res16 # >>> true

res17 = r.vgetattr('points', 'pt:A')
puts res17.inspect # >>> nil
# STEP_END
# REMOVE_START
assert_equal(true, res14)
assert_equal({ 'name' => 'Point A', 'description' => 'First point added' }, res15)
assert_equal(true, res16)
assert_equal(nil, res17)
# REMOVE_END

# STEP_START vrem
res18 = r.vadd('points', [0, 0], 'pt:F')
puts res18 # >>> true

res19 = r.vcard('points')
puts res19 # >>> 6

res20 = r.vrem('points', 'pt:F')
puts res20 # >>> true

res21 = r.vcard('points')
puts res21 # >>> 5
# STEP_END
# REMOVE_START
assert_equal(true, res18)
assert_equal(6, res19)
assert_equal(true, res20)
assert_equal(5, res21)
# REMOVE_END

# STEP_START vsim_basic
res22 = r.vsim('points', vector: [0.9, 0.1])
p res22
# >>> ["pt:E", "pt:A", "pt:D", "pt:C", "pt:B"]
# STEP_END
# REMOVE_START
assert_equal(['pt:E', 'pt:A', 'pt:D', 'pt:C', 'pt:B'], res22)
# REMOVE_END

# STEP_START vsim_options
res23 = r.vsim(
  'points', element: 'pt:A',
  with_scores: true,
  count: 4
)
puts res23
# >>> {"pt:A"=>1.0, "pt:E"=>0.8535534143447876, "pt:D"=>0.5, "pt:C"=>0.5}
# STEP_END
# REMOVE_START
assert_equal(1.0, res23['pt:A'])
assert_equal(0.5, res23['pt:D'])
assert_equal(0.5, res23['pt:C'])
assert(res23['pt:E'] - 0.85 < 0.005)
# REMOVE_END

# STEP_START vsim_filter
res24 = r.vsetattr('points', 'pt:A', {
  'size' => 'large',
  'price' => 18.99
})
puts res24 # >>> true

res25 = r.vsetattr('points', 'pt:B', {
  'size' => 'large',
  'price' => 35.99
})
puts res25 # >>> true

res26 = r.vsetattr('points', 'pt:C', {
  'size' => 'large',
  'price' => 25.99
})
puts res26 # >>> true

res27 = r.vsetattr('points', 'pt:D', {
  'size' => 'small',
  'price' => 21.00
})
puts res27 # >>> true

res28 = r.vsetattr('points', 'pt:E', {
  'size' => 'small',
  'price' => 17.75
})
puts res28 # >>> true

# Return elements in order of distance from point A whose
# `size` attribute is `large`.
res29 = r.vsim(
  'points', element: 'pt:A',
  filter: '.size == "large"'
)
p res29 # >>> ["pt:A", "pt:C", "pt:B"]

# Return elements in order of distance from point A whose size is
# `large` and whose price is greater than 20.00.
res30 = r.vsim(
  'points', element: 'pt:A',
  filter: '.size == "large" && .price > 20.00'
)
p res30 # >>> ["pt:C", "pt:B"]
# STEP_END
# REMOVE_START
assert_equal(true, res24)
assert_equal(true, res25)
assert_equal(true, res26)
assert_equal(true, res27)
assert_equal(true, res28)

assert_equal(['pt:A', 'pt:C', 'pt:B'], res29)
assert_equal(['pt:C', 'pt:B'], res30)
# REMOVE_END

# STEP_START add_quant
res31 = r.vadd(
  'quantSetQ8', [1.262185, 1.958231],
  'quantElement',
  quantization: :q8
)
puts res31 # >>> true

res32 = r.vemb('quantSetQ8', 'quantElement')
puts "Q8: #{res32}"
# >>> Q8: [1.2643694877624512, 1.958230972290039]

res33 = r.vadd(
  'quantSetNoQ', [1.262185, 1.958231],
  'quantElement',
  quantization: :noquant
)
puts res33 # >>> true

res34 = r.vemb('quantSetNoQ', 'quantElement')
puts "NOQUANT: #{res34}"
# >>> NOQUANT: [1.262184977531433, 1.958230972290039]

res35 = r.vadd(
  'quantSetBin', [1.262185, 1.958231],
  'quantElement',
  quantization: :bin
)
puts res35 # >>> true

res36 = r.vemb('quantSetBin', 'quantElement')
puts "BIN: #{res36}"
# >>> BIN: [1.0, 1.0]
# STEP_END
# REMOVE_START
assert_equal(true, res31)
# REMOVE_END

# STEP_START add_reduce
# Create a list of 300 arbitrary values.
values = (0...300).map { |x| x / 299.0 }

res37 = r.vadd(
  'setNotReduced',
  values,
  'element'
)
puts res37 # >>> true

res38 = r.vdim('setNotReduced')
puts res38 # >>> 300

res39 = r.vadd(
  'setReduced',
  values,
  'element',
  reduce: 100
)
puts res39 # >>> true

res40 = r.vdim('setReduced')
puts res40 # >>> 100
# STEP_END
