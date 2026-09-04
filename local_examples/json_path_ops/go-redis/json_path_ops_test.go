// EXAMPLE: json_path_ops
// HIDE_START
package example_commands_test

import (
	"context"
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
