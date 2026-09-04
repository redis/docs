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


// HIDE_START
await client.close();
// HIDE_END
