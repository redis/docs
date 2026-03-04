// =============================================================================
// CANONICAL GO-REDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for go-redis
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// Go uses "Testable Examples" with // Output: comments for verification
// RUN: go test -v sample_test.go
// =============================================================================

// EXAMPLE: sample_example
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_string_ops() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, "mykey")
	// REMOVE_END

	// STEP_START string_ops
	res1, err := rdb.Set(ctx, "mykey", "Hello", 0).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res1) // >>> OK

	res2, err := rdb.Get(ctx, "mykey").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res2) // >>> Hello
	// STEP_END

	// Output:
	// OK
	// Hello
}

func ExampleClient_hash_ops() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, "myhash")
	// REMOVE_END

	// STEP_START hash_ops
	res1, err := rdb.HSet(ctx, "myhash", "field1", "value1").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res1) // >>> 1

	res2, err := rdb.HSet(ctx, "myhash",
		"field2", "value2",
		"field3", "value3",
	).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res2) // >>> 2

	res3, err := rdb.HGet(ctx, "myhash", "field1").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res3) // >>> value1

	res4, err := rdb.HGetAll(ctx, "myhash").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res4["field1"]) // >>> value1
	// STEP_END

	// Output:
	// 1
	// 2
	// value1
	// value1
}

func ExampleClient_hash_tutorial() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, "bike:1", "bike:1:stats")
	// REMOVE_END

	// STEP_START hash_tutorial
	bike1 := map[string]interface{}{
		"model": "Deimos",
		"brand": "Ergonom",
		"type":  "Enduro bikes",
		"price": 4972,
	}

	res1, err := rdb.HSet(ctx, "bike:1", bike1).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res1) // >>> 4

	res2, err := rdb.HGet(ctx, "bike:1", "model").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res2) // >>> Deimos

	res3, err := rdb.HGet(ctx, "bike:1", "price").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res3) // >>> 4972
	// STEP_END

	// Output:
	// 4
	// Deimos
	// 4972
}

