// EXAMPLE: cmds_stream
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_xadd1() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, "mystream")
	// REMOVE_END

	// STEP_START xadd1
	res1, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "mystream",
		Values: map[string]interface{}{
			"name":    "Sara",
			"surname": "OConnor",
		},
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1 != "") // >>> true

	res2, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: "mystream",
		Values: map[string]interface{}{
			"field1": "value1",
			"field2": "value2",
			"field3": "value3",
		},
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2 != "") // >>> true

	res3, err := rdb.XLen(ctx, "mystream").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> 2

	res4, err := rdb.XRange(ctx, "mystream", "-", "+").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(len(res4)) // >>> 2
	// STEP_END

	// Output:
	// true
	// true
	// 2
	// 2
}

func ExampleClient_xadd2() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// REMOVE_START
	rdb.Del(ctx, "mystream")
	// REMOVE_END

	// STEP_START xadd2
	res5, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream:       "mystream",
		Values:       map[string]interface{}{"field": "value"},
		ProducerID:   "producer1",
		IdempotentID: "msg1",
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5 != "") // >>> true

	// Attempting to add the same message again with IDMP returns the original entry ID
	res6, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream:       "mystream",
		Values:       map[string]interface{}{"field": "different_value"},
		ProducerID:   "producer1",
		IdempotentID: "msg1",
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5 == res6) // >>> true (same ID, message was deduplicated)

	res7, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream:         "mystream",
		Values:         map[string]interface{}{"field": "value"},
		ProducerID:     "producer2",
		IdempotentAuto: true,
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res7 != "") // >>> true

	// Auto-generated idempotent ID prevents duplicates for same producer+content
	res8, err := rdb.XAdd(ctx, &redis.XAddArgs{
		Stream:         "mystream",
		Values:         map[string]interface{}{"field": "value"},
		ProducerID:     "producer2",
		IdempotentAuto: true,
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res7 == res8) // >>> true (same ID, duplicate detected)

	// Configure idempotent message processing settings
	res9, err := rdb.XCfgSet(ctx, &redis.XCfgSetArgs{
		Stream:   "mystream",
		Duration: 300,  // 300 seconds
		MaxSize:  1000, // 1000 idempotent IDs
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res9) // >>> OK
	// STEP_END

	// Output:
	// true
	// true
	// true
	// true
	// OK
}

