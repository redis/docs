# EXAMPLE: json_path_ops
# HIDE_START
import redis

r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("doc")
# REMOVE_END

# STEP_START filter_negation
res1 = r.json().set("doc", "$", [{"a": 1, "b": 1}, {"b": 2}, {"a": 1}, {"c": 3}])
print(res1)
# >>> True

res2 = r.json().get("doc", "$[?!@.a]")
print(res2)
# >>> [{'b': 2}, {'c': 3}]

res3 = r.json().get("doc", "$[?!(@.a==1)]")
print(res3)
# >>> [{'b': 2}, {'c': 3}]

res4 = r.json().get("doc", "$[?!@.a && @.b]")
print(res4)
# >>> [{'b': 2}]
# STEP_END

# REMOVE_START
assert res2 == [{"b": 2}, {"c": 3}]
assert res3 == [{"b": 2}, {"c": 3}]
assert res4 == [{"b": 2}]
r.delete("doc")
# REMOVE_END

# STEP_START filter_literal_eq
res1 = r.json().set(
    "doc",
    "$",
    {"arrs": [[1], [2], [1, 2], [1, [2]]], "objs": [{"x": 1}, {"x": 2}, {"y": 1}]},
)
print(res1)
# >>> True

res2 = r.json().get("doc", "$.arrs[?(@ == [1])]")
print(res2)
# >>> [[1]]

res3 = r.json().get("doc", "$.arrs[?(@ == [1,[2]])]")
print(res3)
# >>> [[1, [2]]]

res4 = r.json().get("doc", '$.objs[?(@ == {"x":1})]')
print(res4)
# >>> [{'x': 1}]
# STEP_END

# REMOVE_START
assert res2 == [[1]]
assert res3 == [[1, [2]]]
assert res4 == [{"x": 1}]
r.delete("doc")
# REMOVE_END

# STEP_START filter_arithmetic
res1 = r.json().set("doc", "$", [{"a": 2, "b": 3}, {"a": 5, "b": 2}])
print(res1)
# >>> True

res2 = r.json().get("doc", "$[?@.a + 1 == 3]")
print(res2)
# >>> [{'a': 2, 'b': 3}]

res3 = r.json().get("doc", "$[?@.a + @.b * 2 == 8]")
print(res3)
# >>> [{'a': 2, 'b': 3}]

res4 = r.json().get("doc", "$[?(@.a + @.b) * 2 == 10]")
print(res4)
# >>> [{'a': 2, 'b': 3}]
# STEP_END

# REMOVE_START
assert res2 == [{"a": 2, "b": 3}]
assert res3 == [{"a": 2, "b": 3}]
assert res4 == [{"a": 2, "b": 3}]
r.delete("doc")
# REMOVE_END

# STEP_START filter_membership
res1 = r.json().set("doc", "$", {"a": [1, 2, 3, 4], "allow": [2, 3]})
print(res1)
# >>> True

res2 = r.json().get("doc", "$.a[?@ in [2,4]]")
print(res2)
# >>> [2, 4]

res3 = r.json().get("doc", "$.a[?@ nin [2,4]]")
print(res3)
# >>> [1, 3]

res4 = r.json().get("doc", "$.a[?@ in $.allow]")
print(res4)
# >>> [2, 3]
# STEP_END

# REMOVE_START
assert res2 == [2, 4]
assert res3 == [1, 3]
assert res4 == [2, 3]
r.delete("doc")
# REMOVE_END

# STEP_START filter_set_relations
res1 = r.json().set("doc", "$", {"a": [[1, 2], [1, 5], []]})
print(res1)
# >>> True

res2 = r.json().get("doc", "$.a[?@ subsetof [1,2,3]]")
print(res2)
# >>> [[1, 2], []]

res3 = r.json().set("doc", "$", {"a": [[1, 9], [8, 9], []]})
print(res3)
# >>> True

res4 = r.json().get("doc", "$.a[?@ anyof [1,2,3]]")
print(res4)
# >>> [[1, 9]]

res5 = r.json().set("doc", "$", {"a": [[4, 5], [1, 9], []]})
print(res5)
# >>> True

res6 = r.json().get("doc", "$.a[?@ noneof [1,2,3]]")
print(res6)
# >>> [[4, 5], []]
# STEP_END

# REMOVE_START
assert res2 == [[1, 2], []]
assert res4 == [[1, 9]]
assert res6 == [[4, 5], []]
r.delete("doc")
# REMOVE_END

# STEP_START filter_size_empty
res1 = r.json().set("doc", "$", {"a": [[4, 5], [1], [7, 8, 9]]})
print(res1)
# >>> True

res2 = r.json().get("doc", "$.a[?@ sizeof 2]")
print(res2)
# >>> [[4, 5]]

res3 = r.json().set("doc", "$", {"a": [[], [1], "", [2, 3], {}, {"k": 1}]})
print(res3)
# >>> True

res4 = r.json().get("doc", "$.a[?@ empty true]")
print(res4)
# >>> [[], '', {}]

res5 = r.json().get("doc", "$.a[?@ empty false]")
print(res5)
# >>> [[1], [2, 3], {'k': 1}]
# STEP_END

# REMOVE_START
assert res2 == [[4, 5]]
assert res4 == [[], "", {}]
assert res5 == [[1], [2, 3], {"k": 1}]
r.delete("doc")
# REMOVE_END

# STEP_START filter_getkeys
res1 = r.json().set("doc", "$", {"obj": {"x": 1, "y": 2}, "books": [{"t": "a"}, {"t": "b"}]})
print(res1)
# >>> True

res2 = r.json().get("doc", "$.obj~")
print(res2)
# >>> ['x', 'y']

res3 = r.json().get("doc", "$~")
print(res3)
# >>> ['obj', 'books']

res4 = r.json().get("doc", "$.books~")
print(res4)
# >>> []
# STEP_END

# REMOVE_START
assert res2 == ["x", "y"]
assert res3 == ["obj", "books"]
assert res4 == []
r.delete("doc")
# REMOVE_END
