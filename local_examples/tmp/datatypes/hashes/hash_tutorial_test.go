// EXAMPLE: hash_tutorial
// BINDER_ID go-dt-hash
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_set_get_all() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// make sure we are working with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bike:1")
	// REMOVE_END

	// STEP_START set_get_all
	hashFields := []string{
		"model", "Deimos",
		"brand", "Ergonom",
		"type", "Enduro bikes",
		"price", "4972",
	}

	res1, err := rdb.HSet(ctx, "bike:1", hashFields).Result()

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

	cmdReturn := rdb.HGetAll(ctx, "bike:1")
	res4, err := cmdReturn.Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4)
	// >>> map[brand:Ergonom model:Deimos price:4972 type:Enduro bikes]

	type BikeInfo struct {
		Model string `redis:"model"`
		Brand string `redis:"brand"`
		Type  string `redis:"type"`
		Price int    `redis:"price"`
	}

	var res4a BikeInfo

	if err := cmdReturn.Scan(&res4a); err != nil {
		panic(err)
	}

	fmt.Printf("Model: %v, Brand: %v, Type: %v, Price: $%v\n",
		res4a.Model, res4a.Brand, res4a.Type, res4a.Price)
	// >>> Model: Deimos, Brand: Ergonom, Type: Enduro bikes, Price: $4972
	// STEP_END

	// Output:
	// 4
	// Deimos
	// 4972
	// map[brand:Ergonom model:Deimos price:4972 type:Enduro bikes]
	// Model: Deimos, Brand: Ergonom, Type: Enduro bikes, Price: $4972
}

func ExampleClient_hmget() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START hmget
	// Recreate the bike:1 hash so this example runs on its own.
	rdb.Del(ctx, "bike:1")
	hashFields := []string{
		"model", "Deimos",
		"brand", "Ergonom",
		"type", "Enduro bikes",
		"price", "4972",
	}
	rdb.HSet(ctx, "bike:1", hashFields)

	cmdReturn := rdb.HMGet(ctx, "bike:1", "model", "price")
	res5, err := cmdReturn.Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [Deimos 4972]

	type BikeInfo struct {
		Model string `redis:"model"`
		Brand string `redis:"-"`
		Type  string `redis:"-"`
		Price int    `redis:"price"`
	}

	var res5a BikeInfo

	if err := cmdReturn.Scan(&res5a); err != nil {
		panic(err)
	}

	fmt.Printf("Model: %v, Price: $%v\n", res5a.Model, res5a.Price)
	// >>> Model: Deimos, Price: $4972
	// STEP_END

	// Output:
	// [Deimos 4972]
	// Model: Deimos, Price: $4972
}

func ExampleClient_hincrby() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START hincrby
	// Recreate the bike:1 hash so this example runs on its own.
	rdb.Del(ctx, "bike:1")
	hashFields := []string{
		"model", "Deimos",
		"brand", "Ergonom",
		"type", "Enduro bikes",
		"price", "4972",
	}
	rdb.HSet(ctx, "bike:1", hashFields)

	res6, err := rdb.HIncrBy(ctx, "bike:1", "price", 100).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> 5072

	res7, err := rdb.HIncrBy(ctx, "bike:1", "price", -100).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res7) // >>> 4972
	// STEP_END

	// Output:
	// 5072
	// 4972
}

func ExampleClient_incrby_get_mget() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bike:1:stats")
	// REMOVE_END

	// STEP_START incrby_get_mget
	res8, err := rdb.HIncrBy(ctx, "bike:1:stats", "rides", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res8) // >>> 1

	res9, err := rdb.HIncrBy(ctx, "bike:1:stats", "rides", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res9) // >>> 2

	res10, err := rdb.HIncrBy(ctx, "bike:1:stats", "rides", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res10) // >>> 3

	res11, err := rdb.HIncrBy(ctx, "bike:1:stats", "crashes", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res11) // >>> 1

	res12, err := rdb.HIncrBy(ctx, "bike:1:stats", "owners", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res12) // >>> 1

	res13, err := rdb.HGet(ctx, "bike:1:stats", "rides").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res13) // >>> 3

	res14, err := rdb.HMGet(ctx, "bike:1:stats", "crashes", "owners").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res14) // >>> [1 1]
	// STEP_END

	// Output:
	// 1
	// 2
	// 3
	// 1
	// 1
	// 3
	// [1 1]
}

func ExampleClient_hexpire() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START hexpire
	// Recreate the sensor:sensor1 hash so this example runs on its own.
	rdb.Del(ctx, "sensor:sensor1")
	rdb.HSet(ctx, "sensor:sensor1", "air_quality", 256, "battery_level", 89)

	// Set a TTL of 60 seconds on two fields of the hash.
	res18, err := rdb.HExpire(ctx, "sensor:sensor1", 60*time.Second,
		"air_quality", "battery_level").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res18) // >>> [1 1]

	// Retrieve the remaining TTL for those fields (returns one value per field).
	res19, err := rdb.HTTL(ctx, "sensor:sensor1", "air_quality", "battery_level").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(len(res19)) // >>> 2
	// STEP_END

	// Output:
	// [1 1]
	// 2
}

func ExampleClient_hpexpire() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START hpexpire
	// Recreate the sensor:sensor1 hash so this example runs on its own.
	rdb.Del(ctx, "sensor:sensor1")
	rdb.HSet(ctx, "sensor:sensor1", "air_quality", 256, "battery_level", 89)

	// Set the TTL of the 'air_quality' field in milliseconds.
	res20, err := rdb.HPExpire(ctx, "sensor:sensor1", 60000*time.Millisecond,
		"air_quality").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res20) // >>> [1]

	// Retrieve the remaining TTL in milliseconds (returns one value per field).
	res21, err := rdb.HPTTL(ctx, "sensor:sensor1", "air_quality").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(len(res21)) // >>> 1
	// STEP_END

	// Output:
	// [1]
	// 1
}

func ExampleClient_hexpireat() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START hexpireat
	// Recreate the sensor:sensor1 hash so this example runs on its own.
	rdb.Del(ctx, "sensor:sensor1")
	rdb.HSet(ctx, "sensor:sensor1", "air_quality", 256, "battery_level", 89)

	// Set the expiration of 'air_quality' to a time 24 hours from now.
	res22, err := rdb.HExpireAt(ctx, "sensor:sensor1", time.Now().Add(24*time.Hour),
		"air_quality").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res22) // >>> [1]

	// Retrieve the expiration time as a Unix timestamp (returns one value per field).
	res23, err := rdb.HExpireTime(ctx, "sensor:sensor1", "air_quality").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(len(res23)) // >>> 1
	// STEP_END

	// Output:
	// [1]
	// 1
}
