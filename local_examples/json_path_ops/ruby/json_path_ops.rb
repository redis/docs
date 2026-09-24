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
# REMOVE_END

# STEP_START func_length
res1 = r.json_set('doc', '$', { 'a' => [[1, 2, 3], [1], 'abcd', 'x'] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?length(@) > 2]')
p res2 # >>> [[1, 2, 3], "abcd"]
# STEP_END

# REMOVE_START
assert_equal([[1, 2, 3], 'abcd'], res2)
r.del('doc')
# REMOVE_END

# STEP_START func_count
res1 = r.json_set('doc', '$', [{ 'a' => 1, 'b' => 2, 'c' => 3 }, { 'a' => 1 }])
puts res1 # >>> OK

res2 = r.json_get('doc', '$[?count(@.*) == 3]')
p res2 # >>> [{"a"=>1, "b"=>2, "c"=>3}]
# STEP_END

# REMOVE_START
assert_equal([{ 'a' => 1, 'b' => 2, 'c' => 3 }], res2)
r.del('doc')
# REMOVE_END

# STEP_START func_value
res1 = r.json_set('doc', '$', [{ 'a' => 1 }, { 'a' => 2 }])
puts res1 # >>> OK

res2 = r.json_get('doc', '$[?value(@.a) == 1]')
p res2 # >>> [{"a"=>1}]
# STEP_END

# REMOVE_START
assert_equal([{ 'a' => 1 }], res2)
r.del('doc')
# REMOVE_END

# STEP_START func_keys
res1 = r.json_set('doc', '$', { 'obj' => { 'x' => 1, 'y' => 2 } })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.obj.keys()')
p res2 # >>> ["x", "y"]

res3 = r.json_get('doc', '$.obj.keys().count()')
p res3 # >>> [2]
# STEP_END

# REMOVE_START
assert_equal(%w[x y], res2)
assert_equal([2], res3)
r.del('doc')
# REMOVE_END

# STEP_START func_match_search
res1 = r.json_set('doc', '$', { 'a' => ['abc', 'xabc', 'a', 'b'] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?match(@, "a.*")]')
p res2 # >>> ["abc", "a"]

res3 = r.json_set('doc', '$', { 'a' => ['abc', 'xyz', 'b'] })
puts res3 # >>> OK

res4 = r.json_get('doc', '$.a[?search(@, "b")]')
p res4 # >>> ["abc", "b"]
# STEP_END

# REMOVE_START
assert_equal(%w[abc a], res2)
assert_equal(%w[abc b], res4)
r.del('doc')
# REMOVE_END

# STEP_START func_concat
res1 = r.json_set('doc', '$', { 'a' => [{ 'x' => 'a', 'y' => 'b' }, { 'x' => 'a', 'y' => 'c' }] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?concat(@.x, @.y) == "ab"]')
p res2 # >>> [{"x"=>"a", "y"=>"b"}]
# STEP_END

# REMOVE_START
assert_equal([{ 'x' => 'a', 'y' => 'b' }], res2)
r.del('doc')
# REMOVE_END

# STEP_START func_math
res1 = r.json_set('doc', '$', { 'a' => [2.1, 3.9, 1.0] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?ceiling(@) == 3]')
p res2 # >>> [2.1]

res3 = r.json_set('doc', '$', { 'a' => [2.1, 2.9, 3.5] })
puts res3 # >>> OK

res4 = r.json_get('doc', '$.a[?floor(@) == 2]')
p res4 # >>> [2.1, 2.9]

res5 = r.json_set('doc', '$', { 'a' => [{ 'n' => -5 }, { 'n' => 5 }, { 'n' => -3 }] })
puts res5 # >>> OK

res6 = r.json_get('doc', '$.a[?abs(@.n) == 5]')
p res6 # >>> [{"n"=>-5}, {"n"=>5}]
# STEP_END

# REMOVE_START
assert_equal([2.1], res2)
assert_equal([2.1, 2.9], res4)
assert_equal([{ 'n' => -5 }, { 'n' => 5 }], res6)
r.del('doc')
# REMOVE_END

# STEP_START func_array_access
res1 = r.json_set('doc', '$', { 'a' => [{ 'n' => [1, 2] }, { 'n' => [9, 8] }] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?first(@.n) == 1]')
p res2 # >>> [{"n"=>[1, 2]}]

res3 = r.json_get('doc', '$.a[?last(@.n) == 8]')
p res3 # >>> [{"n"=>[9, 8]}]

res4 = r.json_get('doc', '$.a[?index(@.n, -1) == 2]')
p res4 # >>> [{"n"=>[1, 2]}]
# STEP_END

# REMOVE_START
assert_equal([{ 'n' => [1, 2] }], res2)
assert_equal([{ 'n' => [9, 8] }], res3)
assert_equal([{ 'n' => [1, 2] }], res4)
r.del('doc')
# REMOVE_END

# STEP_START func_aggregate
res1 = r.json_set('doc', '$', { 'a' => [{ 'n' => [3, 1, 2] }, { 'n' => [5, 6] }] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a[?sum(@.n) == 6]')
p res2 # >>> [{"n"=>[3, 1, 2]}]

res3 = r.json_get('doc', '$.a[?avg(@.n) == 2]')
p res3 # >>> [{"n"=>[3, 1, 2]}]
# STEP_END

# REMOVE_START
assert_equal([{ 'n' => [3, 1, 2] }], res2)
assert_equal([{ 'n' => [3, 1, 2] }], res3)
r.del('doc')
# REMOVE_END

# STEP_START func_append
res1 = r.json_set('doc', '$', { 'arr' => [1, 2, 3] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.arr.append(9)')
p res2 # >>> [1, 2, 3, 9]

res3 = r.json_set('doc', '$', { 'books' => [{ 't' => 'a', 'price' => 30 }, { 't' => 'b', 'price' => 5 }] })
puts res3 # >>> OK

res4 = r.json_get('doc', '$.books[?(@.price >= 10)].append({"t":"X"})')
p res4 # >>> [{"t"=>"a", "price"=>30}, {"t"=>"X"}]
# STEP_END

# REMOVE_START
assert_equal([1, 2, 3, 9], res2)
assert_equal([{ 't' => 'a', 'price' => 30 }, { 't' => 'X' }], res4)
r.del('doc')
# REMOVE_END

# STEP_START proj_basic
res1 = r.json_set('doc', '$', { 'a' => 2, 'b' => 4, 'arr' => [1, 2, 3] })
puts res1 # >>> OK

res2 = r.json_get('doc', '$.a + 1')
p res2 # >>> [3]

res3 = r.json_get('doc', '$.a * $.b')
p res3 # >>> [8]

res4 = r.json_get('doc', '($.a + $.b) / 2')
p res4 # >>> [3.0]

res5 = r.json_get('doc', '$.arr.length()')
p res5 # >>> [3]

res6 = r.json_get('doc', '$.a / 0')
p res6 # >>> []
# STEP_END

# REMOVE_START
assert_equal([3], res2)
assert_equal([8], res3)
assert_equal([3.0], res4)
assert_equal([3], res5)
assert_equal([], res6)
# REMOVE_END

# STEP_START proj_multipath
res7 = r.json_set('doc', '$', { 'a' => 2, 'b' => 4, 'arr' => [1, 2, 3] })
puts res7 # >>> OK

# The reply's key order is not guaranteed, so don't rely on it.
res8 = r.json_get('doc', '$.a + 1', '$.b')
p res8
# STEP_END

# REMOVE_START
assert_equal({ '$.a + 1' => [3], '$.b' => [4] }, res8)
r.del('doc')
r.close
# REMOVE_END
