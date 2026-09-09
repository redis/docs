# EXAMPLE: json_path_ops
# HIDE_START
require 'redis'

r = Redis.new
# HIDE_END

# REMOVE_START
def assert_equal(expected, actual)
  raise "Expected #{expected.inspect}, got #{actual.inspect}" unless actual == expected
end

r.del('doc')
# REMOVE_END

# STEP_START filter_negation
res1 = r.json_set('doc', '$', [{ 'a' => 1, 'b' => 1 }, { 'b' => 2 }, { 'a' => 1 }, { 'c' => 3 }])
puts res1 # >>> OK

res2 = r.json_get('doc', '$[?!@.a]')
p res2 # >>> [{"b"=>2}, {"c"=>3}]

res3 = r.json_get('doc', '$[?!(@.a==1)]')
p res3 # >>> [{"b"=>2}, {"c"=>3}]

res4 = r.json_get('doc', '$[?!@.a && @.b]')
p res4 # >>> [{"b"=>2}]
# STEP_END

# REMOVE_START
assert_equal([{ 'b' => 2 }, { 'c' => 3 }], res2)
assert_equal([{ 'b' => 2 }, { 'c' => 3 }], res3)
assert_equal([{ 'b' => 2 }], res4)
r.del('doc')
# REMOVE_END

# STEP_START filter_literal_eq
res1 = r.json_set(
  'doc', '$',
  { 'arrs' => [[1], [2], [1, 2], [1, [2]]], 'objs' => [{ 'x' => 1 }, { 'x' => 2 }, { 'y' => 1 }] }
)
puts res1 # >>> OK

res2 = r.json_get('doc', '$.arrs[?(@ == [1])]')
p res2 # >>> [[1]]

res3 = r.json_get('doc', '$.arrs[?(@ == [1,[2]])]')
p res3 # >>> [[1, [2]]]

res4 = r.json_get('doc', '$.objs[?(@ == {"x":1})]')
p res4 # >>> [{"x"=>1}]
# STEP_END

# REMOVE_START
assert_equal([[1]], res2)
assert_equal([[1, [2]]], res3)
assert_equal([{ 'x' => 1 }], res4)
r.del('doc')
# REMOVE_END

# STEP_START filter_arithmetic
res1 = r.json_set('doc', '$', [{ 'a' => 2, 'b' => 3 }, { 'a' => 5, 'b' => 2 }])
puts res1 # >>> OK

res2 = r.json_get('doc', '$[?@.a + 1 == 3]')
p res2 # >>> [{"a"=>2, "b"=>3}]

res3 = r.json_get('doc', '$[?@.a + @.b * 2 == 8]')
p res3 # >>> [{"a"=>2, "b"=>3}]

res4 = r.json_get('doc', '$[?(@.a + @.b) * 2 == 10]')
p res4 # >>> [{"a"=>2, "b"=>3}]
# STEP_END

# REMOVE_START
assert_equal([{ 'a' => 2, 'b' => 3 }], res2)
assert_equal([{ 'a' => 2, 'b' => 3 }], res3)
assert_equal([{ 'a' => 2, 'b' => 3 }], res4)
r.del('doc')
# REMOVE_END

# STEP_START filter_membership
res1 = r.json_set('doc', '$', { 'a' => [1, 2, 3, 4], 'allow' => [2, 3] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?@ in [2,4]]')
p res2 # >>> [2, 4]

res3 = r.json_get('doc', '$.a[?@ nin [2,4]]')
p res3 # >>> [1, 3]

res4 = r.json_get('doc', '$.a[?@ in $.allow]')
p res4 # >>> [2, 3]
# STEP_END

# REMOVE_START
assert_equal([2, 4], res2)
assert_equal([1, 3], res3)
assert_equal([2, 3], res4)
r.del('doc')
# REMOVE_END

# STEP_START filter_set_relations
res1 = r.json_set('doc', '$', { 'a' => [[1, 2], [1, 5], []] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?@ subsetof [1,2,3]]')
p res2 # >>> [[1, 2], []]

res3 = r.json_set('doc', '$', { 'a' => [[1, 9], [8, 9], []] })
puts res3 # >>> OK

res4 = r.json_get('doc', '$.a[?@ anyof [1,2,3]]')
p res4 # >>> [[1, 9]]

res5 = r.json_set('doc', '$', { 'a' => [[4, 5], [1, 9], []] })
puts res5 # >>> OK

res6 = r.json_get('doc', '$.a[?@ noneof [1,2,3]]')
p res6 # >>> [[4, 5], []]
# STEP_END

# REMOVE_START
assert_equal([[1, 2], []], res2)
assert_equal([[1, 9]], res4)
assert_equal([[4, 5], []], res6)
r.del('doc')
# REMOVE_END

# STEP_START filter_size_empty
res1 = r.json_set('doc', '$', { 'a' => [[4, 5], [1], [7, 8, 9]] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?@ sizeof 2]')
p res2 # >>> [[4, 5]]

res3 = r.json_set('doc', '$', { 'a' => [[], [1], '', [2, 3], {}, { 'k' => 1 }] })
puts res3 # >>> OK

res4 = r.json_get('doc', '$.a[?@ empty true]')
p res4 # >>> [[], "", {}]

res5 = r.json_get('doc', '$.a[?@ empty false]')
p res5 # >>> [[1], [2, 3], {"k"=>1}]
# STEP_END

# REMOVE_START
assert_equal([[4, 5]], res2)
assert_equal([[], '', {}], res4)
assert_equal([[1], [2, 3], { 'k' => 1 }], res5)
r.del('doc')
# REMOVE_END

# STEP_START filter_getkeys
res1 = r.json_set('doc', '$', { 'obj' => { 'x' => 1, 'y' => 2 }, 'books' => [{ 't' => 'a' }, { 't' => 'b' }] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.obj~')
p res2 # >>> ["x", "y"]

res3 = r.json_get('doc', '$~')
p res3 # >>> ["obj", "books"]

res4 = r.json_get('doc', '$.books~')
p res4 # >>> []
# STEP_END

# REMOVE_START
assert_equal(%w[x y], res2)
assert_equal(%w[obj books], res3)
assert_equal([], res4)
r.del('doc')
r.close
# REMOVE_END
