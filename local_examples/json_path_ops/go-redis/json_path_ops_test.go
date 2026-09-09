// EXAMPLE: json_path_ops
// HIDE_START
package example_commands_test

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_json_path_ops_filter_negation() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_negation
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`[{"a":1,"b":1},{"b":2},{"a":1},{"c":3}]`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$[?!@.a]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"b":2},{"c":3}]

	res3, err := rdb.JSONGet(ctx, "doc", `$[?!(@.a==1)]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [{"b":2},{"c":3}]

	res4, err := rdb.JSONGet(ctx, "doc", `$[?!@.a && @.b]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [{"b":2}]
	// STEP_END

	// Output:
	// OK
	// [{"b":2},{"c":3}]
	// [{"b":2},{"c":3}]
	// [{"b":2}]
}

func ExampleClient_json_path_ops_filter_literal_eq() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_literal_eq
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"arrs":[[1],[2],[1,2],[1,[2]]],"objs":[{"x":1},{"x":2},{"y":1}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.arrs[?(@ == [1])]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [[1]]

	res3, err := rdb.JSONGet(ctx, "doc", `$.arrs[?(@ == [1,[2]])]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [[1,[2]]]

	res4, err := rdb.JSONGet(ctx, "doc", `$.objs[?(@ == {"x":1})]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [{"x":1}]
	// STEP_END

	// Output:
	// OK
	// [[1]]
	// [[1,[2]]]
	// [{"x":1}]
}

func ExampleClient_json_path_ops_filter_arithmetic() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_arithmetic
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`[{"a":2,"b":3},{"a":5,"b":2}]`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$[?@.a + 1 == 3]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"a":2,"b":3}]

	res3, err := rdb.JSONGet(ctx, "doc", `$[?@.a + @.b * 2 == 8]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [{"a":2,"b":3}]

	res4, err := rdb.JSONGet(ctx, "doc", `$[?(@.a + @.b) * 2 == 10]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [{"a":2,"b":3}]
	// STEP_END

	// Output:
	// OK
	// [{"a":2,"b":3}]
	// [{"a":2,"b":3}]
	// [{"a":2,"b":3}]
}

func ExampleClient_json_path_ops_filter_membership() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_membership
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[1,2,3,4],"allow":[2,3]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?@ in [2,4]]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [2,4]

	res3, err := rdb.JSONGet(ctx, "doc", `$.a[?@ nin [2,4]]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1,3]

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?@ in $.allow]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [2,3]
	// STEP_END

	// Output:
	// OK
	// [2,4]
	// [1,3]
	// [2,3]
}

func ExampleClient_json_path_ops_filter_set_relations() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_set_relations
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[1,2],[1,5],[]]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?@ subsetof [1,2,3]]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [[1,2],[]]

	res3, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[1,9],[8,9],[]]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> OK

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?@ anyof [1,2,3]]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [[1,9]]

	res5, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[4,5],[1,9],[]]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> OK

	res6, err := rdb.JSONGet(ctx, "doc", `$.a[?@ noneof [1,2,3]]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> [[4,5],[]]
	// STEP_END

	// Output:
	// OK
	// [[1,2],[]]
	// OK
	// [[1,9]]
	// OK
	// [[4,5],[]]
}

func ExampleClient_json_path_ops_filter_size_empty() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_size_empty
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[4,5],[1],[7,8,9]]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?@ sizeof 2]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [[4,5]]

	res3, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[],[1],"",[2,3],{},{"k":1}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> OK

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?@ empty true]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [[],"",{}]

	res5, err := rdb.JSONGet(ctx, "doc", `$.a[?@ empty false]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [[1],[2,3],{"k":1}]
	// STEP_END

	// Output:
	// OK
	// [[4,5]]
	// OK
	// [[],"",{}]
	// [[1],[2,3],{"k":1}]
}

func ExampleClient_json_path_ops_filter_getkeys() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START filter_getkeys
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"obj":{"x":1,"y":2},"books":[{"t":"a"},{"t":"b"}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.obj~`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> ["x","y"]

	res3, err := rdb.JSONGet(ctx, "doc", `$~`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> ["obj","books"]

	res4, err := rdb.JSONGet(ctx, "doc", `$.books~`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> []
	// STEP_END

	// Output:
	// OK
	// ["x","y"]
	// ["obj","books"]
	// []
}

func ExampleClient_json_path_ops_func_length() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_length
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[[1,2,3],[1],"abcd","x"]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?length(@) > 2]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [[1,2,3],"abcd"]
	// STEP_END

	// Output:
	// OK
	// [[1,2,3],"abcd"]
}

func ExampleClient_json_path_ops_func_count() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_count
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`[{"a":1,"b":2,"c":3},{"a":1}]`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$[?count(@.*) == 3]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"a":1,"b":2,"c":3}]
	// STEP_END

	// Output:
	// OK
	// [{"a":1,"b":2,"c":3}]
}

func ExampleClient_json_path_ops_func_value() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_value
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`[{"a":1},{"a":2}]`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$[?value(@.a) == 1]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"a":1}]
	// STEP_END

	// Output:
	// OK
	// [{"a":1}]
}

func ExampleClient_json_path_ops_func_keys() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_keys
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"obj":{"x":1,"y":2}}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.obj.keys()`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> ["x","y"]

	res3, err := rdb.JSONGet(ctx, "doc", `$.obj.keys().count()`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [2]
	// STEP_END

	// Output:
	// OK
	// ["x","y"]
	// [2]
}

func ExampleClient_json_path_ops_func_match_search() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_match_search
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":["abc","xabc","a","b"]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?match(@, "a.*")]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> ["abc","a"]

	res3, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":["abc","xyz","b"]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> OK

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?search(@, "b")]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> ["abc","b"]
	// STEP_END

	// Output:
	// OK
	// ["abc","a"]
	// OK
	// ["abc","b"]
}

func ExampleClient_json_path_ops_func_concat() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_concat
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[{"x":"a","y":"b"},{"x":"a","y":"c"}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?concat(@.x, @.y) == "ab"]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"x":"a","y":"b"}]
	// STEP_END

	// Output:
	// OK
	// [{"x":"a","y":"b"}]
}

func ExampleClient_json_path_ops_func_math() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_math
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[2.1,3.9,1.0]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?ceiling(@) == 3]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [2.1]

	res3, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[2.1,2.9,3.5]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> OK

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?floor(@) == 2]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [2.1,2.9]

	res5, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[{"n":-5},{"n":5},{"n":-3}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> OK

	res6, err := rdb.JSONGet(ctx, "doc", `$.a[?abs(@.n) == 5]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> [{"n":-5},{"n":5}]
	// STEP_END

	// Output:
	// OK
	// [2.1]
	// OK
	// [2.1,2.9]
	// OK
	// [{"n":-5},{"n":5}]
}

func ExampleClient_json_path_ops_func_array_access() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_array_access
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[{"n":[1,2]},{"n":[9,8]}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?first(@.n) == 1]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"n":[1,2]}]

	res3, err := rdb.JSONGet(ctx, "doc", `$.a[?last(@.n) == 8]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [{"n":[9,8]}]

	res4, err := rdb.JSONGet(ctx, "doc", `$.a[?index(@.n, -1) == 2]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [{"n":[1,2]}]
	// STEP_END

	// Output:
	// OK
	// [{"n":[1,2]}]
	// [{"n":[9,8]}]
	// [{"n":[1,2]}]
}

func ExampleClient_json_path_ops_func_aggregate() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_aggregate
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":[{"n":[3,1,2]},{"n":[5,6]}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a[?sum(@.n) == 6]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [{"n":[3,1,2]}]

	res3, err := rdb.JSONGet(ctx, "doc", `$.a[?avg(@.n) == 2]`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [{"n":[3,1,2]}]
	// STEP_END

	// Output:
	// OK
	// [{"n":[3,1,2]}]
	// [{"n":[3,1,2]}]
}

func ExampleClient_json_path_ops_func_append() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START func_append
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"arr":[1,2,3]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.arr.append(9)`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1,2,3,9]

	res3, err := rdb.JSONSet(ctx, "doc", "$",
		`{"books":[{"t":"a","price":30},{"t":"b","price":5}]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> OK

	res4, err := rdb.JSONGet(ctx, "doc", `$.books[?(@.price >= 10)].append({"t":"X"})`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [{"t":"a","price":30},{"t":"X"}]
	// STEP_END

	// Output:
	// OK
	// [1,2,3,9]
	// OK
	// [{"t":"a","price":30},{"t":"X"}]
}

func ExampleClient_json_path_ops_proj_basic() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START proj_basic
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":2,"b":4,"arr":[1,2,3]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	res2, err := rdb.JSONGet(ctx, "doc", `$.a + 1`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [3]

	res3, err := rdb.JSONGet(ctx, "doc", `$.a * $.b`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [8]

	res4, err := rdb.JSONGet(ctx, "doc", `($.a + $.b) / 2`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [3.0]

	res5, err := rdb.JSONGet(ctx, "doc", `$.arr.length()`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [3]

	res6, err := rdb.JSONGet(ctx, "doc", `$.a / 0`).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> []
	// STEP_END

	// Output:
	// OK
	// [3]
	// [8]
	// [3.0]
	// [3]
	// []
}

func ExampleClient_json_path_ops_proj_multipath() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "doc")
	// REMOVE_END

	// STEP_START proj_multipath
	res1, err := rdb.JSONSet(ctx, "doc", "$",
		`{"a":2,"b":4,"arr":[1,2,3]}`,
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> OK

	raw, err := rdb.JSONGet(ctx, "doc", `$.a + 1`, `$.b`).Result()

	if err != nil {
		panic(err)
	}

	// A multi-path JSON.GET reply is a JSON object whose key order is not
	// guaranteed, so decode it into a map rather than printing the raw
	// string. Go's fmt package prints map keys in sorted order, which keeps
	// this example's output deterministic regardless of the order Redis
	// returns the paths in.
	res2 := map[string]interface{}{}

	if err := json.Unmarshal([]byte(raw), &res2); err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> map[$.a + 1:[3] $.b:[4]]
	// STEP_END

	// Output:
	// OK
	// map[$.a + 1:[3] $.b:[4]]
}
