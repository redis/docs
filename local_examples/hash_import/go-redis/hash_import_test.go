// EXAMPLE: hash_import
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

// REMOVE_START
func userKeys() []string {
	keys := make([]string, 0, 1000)
	for i := 1; i <= 1000; i++ {
		keys = append(keys, fmt.Sprintf("user:%d", i))
	}
	return keys
}

// REMOVE_END

func ExampleClient_himport_basic() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, userKeys()...)
	// REMOVE_END

	// STEP_START himport_basic
	// Declare the field names once.
	if err := rdb.HImportPrepare(ctx, "user", "name", "email", "age").Err(); err != nil {
		panic(err)
	}

	// Create each hash by sending only its values.
	res1, err := rdb.HImportSet(ctx, "user:1", "user", "Alice", "alice@example.com", "34").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res1) // >>> OK

	if err := rdb.HImportSet(ctx, "user:2", "user", "Bob", "bob@example.com", "41").Err(); err != nil {
		panic(err)
	}
	if err := rdb.HImportSet(ctx, "user:3", "user", "Carol", "carol@example.com", "29").Err(); err != nil {
		panic(err)
	}

	// The result is an ordinary hash.
	res2, err := rdb.HGetAll(ctx, "user:2").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res2) // >>> map[age:41 email:bob@example.com name:Bob]
	// STEP_END

	// REMOVE_START
	if res1 != "OK" {
		panic(fmt.Sprintf("unexpected HIMPORT SET reply: %v", res1))
	}
	if len(res2) != 3 || res2["name"] != "Bob" || res2["email"] != "bob@example.com" || res2["age"] != "41" {
		panic(fmt.Sprintf("unexpected hash: %v", res2))
	}
	rdb.Del(ctx, userKeys()...)
	rdb.HImportDiscard(ctx, "user")
	// REMOVE_END

	// Output:
	// OK
	// map[age:41 email:bob@example.com name:Bob]
}

func ExampleClient_himport_pipeline() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, userKeys()...)
	// REMOVE_END

	// STEP_START himport_pipeline
	if err := rdb.HImportPrepare(ctx, "user", "name", "email", "age").Err(); err != nil {
		panic(err)
	}

	// Queue many imports and send them in one round trip.
	pipe := rdb.Pipeline()
	for i := 1; i <= 1000; i++ {
		pipe.HImportSet(ctx, fmt.Sprintf("user:%d", i), "user",
			fmt.Sprintf("user%d", i), fmt.Sprintf("user%d@example.com", i), fmt.Sprint(20+i%50))
	}
	res3, err := pipe.Exec(ctx)
	if err != nil {
		panic(err)
	}

	allOK := true
	for _, cmd := range res3 {
		if cmd.Err() != nil {
			allOK = false
		}
	}
	fmt.Println(len(res3), allOK) // >>> 1000 true

	res4, err := rdb.HGet(ctx, "user:1000", "email").Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res4) // >>> user1000@example.com
	// STEP_END

	// REMOVE_START
	if len(res3) != 1000 || !allOK {
		panic(fmt.Sprintf("unexpected pipeline result: %d replies, allOK=%v", len(res3), allOK))
	}
	if res4 != "user1000@example.com" {
		panic(fmt.Sprintf("unexpected email: %v", res4))
	}
	rdb.Del(ctx, userKeys()...)
	rdb.HImportDiscard(ctx, "user")
	// REMOVE_END

	// Output:
	// 1000 true
	// user1000@example.com
}
