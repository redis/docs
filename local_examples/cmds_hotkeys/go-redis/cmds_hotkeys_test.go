// EXAMPLE: cmds_hotkeys
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_hotkeys() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.HotKeysStop(ctx)
	rdb.HotKeysReset(ctx)
	rdb.Del(ctx, "product:1", "product:2", "product:3")
	rdb.MSet(ctx, "product:1", "Laptop", "product:2", "Phone", "product:3", "Tablet")
	// REMOVE_END

	// STEP_START hotkeys
	// Track the 10 hottest keys by CPU time and network bytes.
	res1, err := rdb.HotKeysStart(ctx, &redis.HotKeysStartArgs{
		Metrics: []redis.HotKeysMetric{redis.HotKeysMetricCPU, redis.HotKeysMetricNET},
		Count:   10,
	}).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res1) // >>> OK

	// Generate some traffic. In production, this is your application's workload.
	for i := 0; i < 100; i++ {
		rdb.Get(ctx, "product:1")
	}

	for i := 0; i < 10; i++ {
		rdb.Get(ctx, "product:2")
	}

	rdb.Get(ctx, "product:3")

	res2, err := rdb.HotKeysGet(ctx).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res2.TrackingActive) // >>> true

	fmt.Println(res2.ByNetBytes)
	// >>> [{product:1 4000} {product:2 390} {product:3 40}]

	res3, err := rdb.HotKeysStop(ctx).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res3) // >>> OK

	res4, err := rdb.HotKeysReset(ctx).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println(res4) // >>> OK
	// STEP_END

	// REMOVE_START
	if _, err := rdb.HotKeysGet(ctx).Result(); err != redis.Nil {
		panic(fmt.Sprintf("expected redis.Nil after reset, got %v", err))
	}
	rdb.Del(ctx, "product:1", "product:2", "product:3")
	// REMOVE_END

	// Output:
	// OK
	// true
	// [{product:1 4000} {product:2 390} {product:3 40}]
	// OK
	// OK
}
