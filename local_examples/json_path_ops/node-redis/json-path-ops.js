// EXAMPLE: json_path_ops
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect().catch(console.error);
// HIDE_END

// REMOVE_START
await client.del('doc');
// REMOVE_END

// STEP_START filter_negation
const res1 = await client.json.set('doc', '$', [{ a: 1, b: 1 }, { b: 2 }, { a: 1 }, { c: 3 }]);
console.log(res1); // >>> OK

const res2 = await client.json.get('doc', { path: '$[?!@.a]' });
console.log(res2); // >>> [ { b: 2 }, { c: 3 } ]

const res3 = await client.json.get('doc', { path: '$[?!(@.a==1)]' });
console.log(res3); // >>> [ { b: 2 }, { c: 3 } ]

const res4 = await client.json.get('doc', { path: '$[?!@.a && @.b]' });
console.log(res4); // >>> [ { b: 2 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res2, [{ b: 2 }, { c: 3 }]);
assert.deepEqual(res3, [{ b: 2 }, { c: 3 }]);
assert.deepEqual(res4, [{ b: 2 }]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_literal_eq
const res5 = await client.json.set('doc', '$', {
  arrs: [[1], [2], [1, 2], [1, [2]]],
  objs: [{ x: 1 }, { x: 2 }, { y: 1 }]
});
console.log(res5); // >>> OK

const res6 = await client.json.get('doc', { path: '$.arrs[?(@ == [1])]' });
console.log(res6); // >>> [ [ 1 ] ]

const res7 = await client.json.get('doc', { path: '$.arrs[?(@ == [1,[2]])]' });
console.log(res7); // >>> [ [ 1, [ 2 ] ] ]

const res8 = await client.json.get('doc', { path: '$.objs[?(@ == {"x":1})]' });
console.log(res8); // >>> [ { x: 1 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res6, [[1]]);
assert.deepEqual(res7, [[1, [2]]]);
assert.deepEqual(res8, [{ x: 1 }]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_arithmetic
const res9 = await client.json.set('doc', '$', [{ a: 2, b: 3 }, { a: 5, b: 2 }]);
console.log(res9); // >>> OK

const res10 = await client.json.get('doc', { path: '$[?@.a + 1 == 3]' });
console.log(res10); // >>> [ { a: 2, b: 3 } ]

const res11 = await client.json.get('doc', { path: '$[?@.a + @.b * 2 == 8]' });
console.log(res11); // >>> [ { a: 2, b: 3 } ]

const res12 = await client.json.get('doc', { path: '$[?(@.a + @.b) * 2 == 10]' });
console.log(res12); // >>> [ { a: 2, b: 3 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res10, [{ a: 2, b: 3 }]);
assert.deepEqual(res11, [{ a: 2, b: 3 }]);
assert.deepEqual(res12, [{ a: 2, b: 3 }]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_membership
const res13 = await client.json.set('doc', '$', { a: [1, 2, 3, 4], allow: [2, 3] });
console.log(res13); // >>> OK

const res14 = await client.json.get('doc', { path: '$.a[?@ in [2,4]]' });
console.log(res14); // >>> [ 2, 4 ]

const res15 = await client.json.get('doc', { path: '$.a[?@ nin [2,4]]' });
console.log(res15); // >>> [ 1, 3 ]

const res16 = await client.json.get('doc', { path: '$.a[?@ in $.allow]' });
console.log(res16); // >>> [ 2, 3 ]
// STEP_END

// REMOVE_START
assert.deepEqual(res14, [2, 4]);
assert.deepEqual(res15, [1, 3]);
assert.deepEqual(res16, [2, 3]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_set_relations
const res17 = await client.json.set('doc', '$', { a: [[1, 2], [1, 5], []] });
console.log(res17); // >>> OK

const res18 = await client.json.get('doc', { path: '$.a[?@ subsetof [1,2,3]]' });
console.log(res18); // >>> [ [ 1, 2 ], [] ]

const res19 = await client.json.set('doc', '$', { a: [[1, 9], [8, 9], []] });
console.log(res19); // >>> OK

const res20 = await client.json.get('doc', { path: '$.a[?@ anyof [1,2,3]]' });
console.log(res20); // >>> [ [ 1, 9 ] ]

const res21 = await client.json.set('doc', '$', { a: [[4, 5], [1, 9], []] });
console.log(res21); // >>> OK

const res22 = await client.json.get('doc', { path: '$.a[?@ noneof [1,2,3]]' });
console.log(res22); // >>> [ [ 4, 5 ], [] ]
// STEP_END

// REMOVE_START
assert.deepEqual(res18, [[1, 2], []]);
assert.deepEqual(res20, [[1, 9]]);
assert.deepEqual(res22, [[4, 5], []]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_size_empty
const res23 = await client.json.set('doc', '$', { a: [[4, 5], [1], [7, 8, 9]] });
console.log(res23); // >>> OK

const res24 = await client.json.get('doc', { path: '$.a[?@ sizeof 2]' });
console.log(res24); // >>> [ [ 4, 5 ] ]

const res25 = await client.json.set('doc', '$', { a: [[], [1], '', [2, 3], {}, { k: 1 }] });
console.log(res25); // >>> OK

const res26 = await client.json.get('doc', { path: '$.a[?@ empty true]' });
console.log(res26); // >>> [ [], '', {} ]

const res27 = await client.json.get('doc', { path: '$.a[?@ empty false]' });
console.log(res27); // >>> [ [ 1 ], [ 2, 3 ], { k: 1 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res24, [[4, 5]]);
assert.deepEqual(res26, [[], '', {}]);
assert.deepEqual(res27, [[1], [2, 3], { k: 1 }]);
await client.del('doc');
// REMOVE_END

// STEP_START filter_getkeys
const res28 = await client.json.set('doc', '$', {
  obj: { x: 1, y: 2 },
  books: [{ t: 'a' }, { t: 'b' }]
});
console.log(res28); // >>> OK

const res29 = await client.json.get('doc', { path: '$.obj~' });
console.log(res29); // >>> [ 'x', 'y' ]

const res30 = await client.json.get('doc', { path: '$~' });
console.log(res30); // >>> [ 'obj', 'books' ]

const res31 = await client.json.get('doc', { path: '$.books~' });
console.log(res31); // >>> []
// STEP_END

// REMOVE_START
assert.deepEqual(res29, ['x', 'y']);
assert.deepEqual(res30, ['obj', 'books']);
assert.deepEqual(res31, []);
await client.del('doc');
// REMOVE_END

// STEP_START func_length
const res32 = await client.json.set('doc', '$', { a: [[1, 2, 3], [1], 'abcd', 'x'] });
console.log(res32); // >>> OK

const res33 = await client.json.get('doc', { path: '$.a[?length(@) > 2]' });
console.log(res33); // >>> [ [ 1, 2, 3 ], 'abcd' ]
// STEP_END

// REMOVE_START
assert.deepEqual(res33, [[1, 2, 3], 'abcd']);
await client.del('doc');
// REMOVE_END

// STEP_START func_count
const res34 = await client.json.set('doc', '$', [{ a: 1, b: 2, c: 3 }, { a: 1 }]);
console.log(res34); // >>> OK

const res35 = await client.json.get('doc', { path: '$[?count(@.*) == 3]' });
console.log(res35); // >>> [ { a: 1, b: 2, c: 3 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res35, [{ a: 1, b: 2, c: 3 }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_value
const res36 = await client.json.set('doc', '$', [{ a: 1 }, { a: 2 }]);
console.log(res36); // >>> OK

const res37 = await client.json.get('doc', { path: '$[?value(@.a) == 1]' });
console.log(res37); // >>> [ { a: 1 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res37, [{ a: 1 }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_keys
const res38 = await client.json.set('doc', '$', { obj: { x: 1, y: 2 } });
console.log(res38); // >>> OK

const res39 = await client.json.get('doc', { path: '$.obj.keys()' });
console.log(res39); // >>> [ 'x', 'y' ]

const res40 = await client.json.get('doc', { path: '$.obj.keys().count()' });
console.log(res40); // >>> [ 2 ]
// STEP_END

// REMOVE_START
assert.deepEqual(res39, ['x', 'y']);
assert.deepEqual(res40, [2]);
await client.del('doc');
// REMOVE_END

// STEP_START func_match_search
const res41 = await client.json.set('doc', '$', { a: ['abc', 'xabc', 'a', 'b'] });
console.log(res41); // >>> OK

const res42 = await client.json.get('doc', { path: '$.a[?match(@, "a.*")]' });
console.log(res42); // >>> [ 'abc', 'a' ]

const res43 = await client.json.set('doc', '$', { a: ['abc', 'xyz', 'b'] });
console.log(res43); // >>> OK

const res44 = await client.json.get('doc', { path: '$.a[?search(@, "b")]' });
console.log(res44); // >>> [ 'abc', 'b' ]
// STEP_END

// REMOVE_START
assert.deepEqual(res42, ['abc', 'a']);
assert.deepEqual(res44, ['abc', 'b']);
await client.del('doc');
// REMOVE_END

// STEP_START func_concat
const res45 = await client.json.set('doc', '$', { a: [{ x: 'a', y: 'b' }, { x: 'a', y: 'c' }] });
console.log(res45); // >>> OK

const res46 = await client.json.get('doc', { path: '$.a[?concat(@.x, @.y) == "ab"]' });
console.log(res46); // >>> [ { x: 'a', y: 'b' } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res46, [{ x: 'a', y: 'b' }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_math
const res47 = await client.json.set('doc', '$', { a: [2.1, 3.9, 1.0] });
console.log(res47); // >>> OK

const res48 = await client.json.get('doc', { path: '$.a[?ceiling(@) == 3]' });
console.log(res48); // >>> [ 2.1 ]

const res49 = await client.json.set('doc', '$', { a: [2.1, 2.9, 3.5] });
console.log(res49); // >>> OK

const res50 = await client.json.get('doc', { path: '$.a[?floor(@) == 2]' });
console.log(res50); // >>> [ 2.1, 2.9 ]

const res51 = await client.json.set('doc', '$', { a: [{ n: -5 }, { n: 5 }, { n: -3 }] });
console.log(res51); // >>> OK

const res52 = await client.json.get('doc', { path: '$.a[?abs(@.n) == 5]' });
console.log(res52); // >>> [ { n: -5 }, { n: 5 } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res48, [2.1]);
assert.deepEqual(res50, [2.1, 2.9]);
assert.deepEqual(res52, [{ n: -5 }, { n: 5 }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_array_access
const res53 = await client.json.set('doc', '$', { a: [{ n: [1, 2] }, { n: [9, 8] }] });
console.log(res53); // >>> OK

const res54 = await client.json.get('doc', { path: '$.a[?first(@.n) == 1]' });
console.log(res54); // >>> [ { n: [ 1, 2 ] } ]

const res55 = await client.json.get('doc', { path: '$.a[?last(@.n) == 8]' });
console.log(res55); // >>> [ { n: [ 9, 8 ] } ]

const res56 = await client.json.get('doc', { path: '$.a[?index(@.n, -1) == 2]' });
console.log(res56); // >>> [ { n: [ 1, 2 ] } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res54, [{ n: [1, 2] }]);
assert.deepEqual(res55, [{ n: [9, 8] }]);
assert.deepEqual(res56, [{ n: [1, 2] }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_aggregate
const res57 = await client.json.set('doc', '$', { a: [{ n: [3, 1, 2] }, { n: [5, 6] }] });
console.log(res57); // >>> OK

const res58 = await client.json.get('doc', { path: '$.a[?sum(@.n) == 6]' });
console.log(res58); // >>> [ { n: [ 3, 1, 2 ] } ]

const res59 = await client.json.get('doc', { path: '$.a[?avg(@.n) == 2]' });
console.log(res59); // >>> [ { n: [ 3, 1, 2 ] } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res58, [{ n: [3, 1, 2] }]);
assert.deepEqual(res59, [{ n: [3, 1, 2] }]);
await client.del('doc');
// REMOVE_END

// STEP_START func_append
const res60 = await client.json.set('doc', '$', { arr: [1, 2, 3] });
console.log(res60); // >>> OK

const res61 = await client.json.get('doc', { path: '$.arr.append(9)' });
console.log(res61); // >>> [ 1, 2, 3, 9 ]

const res62 = await client.json.set('doc', '$', {
  books: [{ t: 'a', price: 30 }, { t: 'b', price: 5 }]
});
console.log(res62); // >>> OK

const res63 = await client.json.get('doc', { path: '$.books[?(@.price >= 10)].append({"t":"X"})' });
console.log(res63); // >>> [ { t: 'a', price: 30 }, { t: 'X' } ]
// STEP_END

// REMOVE_START
assert.deepEqual(res61, [1, 2, 3, 9]);
assert.deepEqual(res63, [{ t: 'a', price: 30 }, { t: 'X' }]);
await client.del('doc');
// REMOVE_END


// HIDE_START
await client.close();
// HIDE_END
