// EXAMPLE: cmds_generic
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_del_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// make sure we are working with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "key1", "key2", "key3")
	// REMOVE_END

	// STEP_START del
	delResult1, err := rdb.Set(ctx, "key1", "Hello", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(delResult1) // >>> OK

	delResult2, err := rdb.Set(ctx, "key2", "World", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(delResult2) // >>> OK

	delResult3, err := rdb.Del(ctx, "key1", "key2", "key3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(delResult3) // >>> 2
	// STEP_END

	// Output:
	// OK
	// OK
	// 2
}

func ExampleClient_exists_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// make sure we are working with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "key1", "key2", "nosuchkey")
	// REMOVE_END

	// STEP_START exists
	existsResult1, err := rdb.Set(ctx, "key1", "Hello", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(existsResult1) // >>> OK

	existsResult2, err := rdb.Exists(ctx, "key1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(existsResult2) // >>> 1

	existsResult3, err := rdb.Exists(ctx, "nosuchkey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(existsResult3) // >>> 0

	existsResult4, err := rdb.Set(ctx, "key2", "World", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(existsResult4) // >>> OK

	existsResult5, err := rdb.Exists(ctx, "key1", "key2", "nosuchkey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(existsResult5) // >>> 2
	// STEP_END

	// Output:
	// OK
	// 1
	// 0
	// OK
	// 2
}

func ExampleClient_expire_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "mykey")
	// REMOVE_END

	// STEP_START expire
	expireResult1, err := rdb.Set(ctx, "mykey", "Hello", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult1) // >>> OK

	expireResult2, err := rdb.Expire(ctx, "mykey", 10*time.Second).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult2) // >>> true

	expireResult3, err := rdb.TTL(ctx, "mykey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(math.Round(expireResult3.Seconds())) // >>> 10

	expireResult4, err := rdb.Set(ctx, "mykey", "Hello World", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult4) // >>> OK

	expireResult5, err := rdb.TTL(ctx, "mykey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult5) // >>> -1ns

	expireResult6, err := rdb.ExpireXX(ctx, "mykey", 10*time.Second).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult6) // >>> false

	expireResult7, err := rdb.TTL(ctx, "mykey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult7) // >>> -1ns

	expireResult8, err := rdb.ExpireNX(ctx, "mykey", 10*time.Second).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(expireResult8) // >>> true

	expireResult9, err := rdb.TTL(ctx, "mykey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(math.Round(expireResult9.Seconds())) // >>> 10
	// STEP_END

	// Output:
	// OK
	// true
	// 10
	// OK
	// -1ns
	// false
	// -1ns
	// true
	// 10
}

func ExampleClient_keys_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START keys
	keysResult1, err := rdb.MSet(ctx, "firstname", "Jack", "lastname", "Stuntman", "age", "35").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(keysResult1) // >>> OK

	keysResult2, err := rdb.Keys(ctx, "*name*").Result()

	if err != nil {
		panic(err)
	}

	sort.Strings(keysResult2)
	fmt.Println(keysResult2) // >>> [firstname lastname]

	keysResult3, err := rdb.Keys(ctx, "a??").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(keysResult3) // >>> [age]

	keysResult4, err := rdb.Keys(ctx, "*").Result()

	if err != nil {
		panic(err)
	}

	sort.Strings(keysResult4)
	fmt.Println(keysResult4) // >>> [age firstname lastname]
	// STEP_END

	// Output:
	// OK
	// [firstname lastname]
	// [age]
	// [age firstname lastname]
}

func ExampleClient_ttl_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "mykey")
	// REMOVE_END

	// STEP_START ttl
	ttlResult1, err := rdb.Set(ctx, "mykey", "Hello", 10*time.Second).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ttlResult1) // >>> OK

	ttlResult2, err := rdb.TTL(ctx, "mykey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(math.Round(ttlResult2.Seconds())) // >>> 10
	// STEP_END

	// Output:
	// OK
	// 10
}

func ExampleClient_scan1_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START scan1
	scan1Result1, err := rdb.SAdd(ctx, "myset", "1", "2", "3", "foo", "foobar", "feelsgood").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan1Result1) // >>> 6

	scan1Result2, _, err := rdb.SScan(ctx, "myset", 0, "f*", 0).Result()

	if err != nil {
		panic(err)
	}

	sort.Strings(scan1Result2)
	fmt.Println(scan1Result2) // >>> [feelsgood foo foobar]
	// STEP_END

	// Output:
	// 6
	// [feelsgood foo foobar]
}

func ExampleClient_scan2_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)

	for i := 1; i <= 1000; i++ {
		rdb.Set(ctx, fmt.Sprintf("key:%d", i), i, 0)
	}
	// REMOVE_END

	// STEP_START scan2
	// MATCH is applied after elements are fetched, so with the default COUNT most
	// iterations return few keys or none at all.
	var scan2Cursor uint64
	var scan2Keys []string
	var err error
	scan2Total := 0

	for i := 0; i < 4; i++ {
		scan2Keys, scan2Cursor, err = rdb.Scan(ctx, scan2Cursor, "*11*", 0).Result()

		if err != nil {
			panic(err)
		}
		scan2Total += len(scan2Keys)
	}

	// A larger COUNT forces more scanning in a single iteration, so the remaining
	// matches arrive together. This continues from the cursor reached above.
	scan2Keys, _, err = rdb.Scan(ctx, scan2Cursor, "*11*", 1000).Result()

	if err != nil {
		panic(err)
	}
	scan2Total += len(scan2Keys)

	// The per-call split isn't guaranteed, but the cumulative total is.
	fmt.Println(scan2Total) // >>> 19
	// STEP_END

	// REMOVE_START
	rdb.FlushDB(ctx)
	// REMOVE_END

	// Output:
	// 19
}

func ExampleClient_scan3_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START scan3
	scan3Result1, err := rdb.GeoAdd(ctx, "geokey", &redis.GeoLocation{
		Longitude: 0, Latitude: 0, Name: "value",
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan3Result1) // >>> 1

	scan3Result2, err := rdb.ZAdd(ctx, "zkey", redis.Z{Score: 1000, Member: "value"}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan3Result2) // >>> 1

	scan3Result3, err := rdb.Type(ctx, "geokey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan3Result3) // >>> zset

	scan3Result4, err := rdb.Type(ctx, "zkey").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan3Result4) // >>> zset

	// A single call isn't guaranteed to find every match, so loop until the cursor
	// returns to 0, accumulating matches from every call.
	var scan3Cursor uint64
	var scan3Keys []string
	var scan3Batch []string

	for {
		scan3Batch, scan3Cursor, err = rdb.ScanType(ctx, scan3Cursor, "", 0, "zset").Result()

		if err != nil {
			panic(err)
		}
		scan3Keys = append(scan3Keys, scan3Batch...)

		if scan3Cursor == 0 {
			break
		}
	}

	sort.Strings(scan3Keys)
	fmt.Println(scan3Keys) // >>> [geokey zkey]
	// STEP_END

	// Output:
	// 1
	// 1
	// zset
	// zset
	// [geokey zkey]
}

func ExampleClient_scan4_cmd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	// REMOVE_END

	// STEP_START scan4
	scan4Result1, err := rdb.HSet(ctx, "myhash", "a", 1, "b", 2).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(scan4Result1) // >>> 2

	scan4Result2, _, err := rdb.HScan(ctx, "myhash", 0, "", 0).Result()

	if err != nil {
		panic(err)
	}

	// HSCAN returns field and value interleaved. Redis does not promise an order, so
	// collect the pairs into a map: fmt prints map keys sorted, whatever order they arrived in.
	scan4Fields := map[string]string{}

	for i := 0; i < len(scan4Result2); i += 2 {
		scan4Fields[scan4Result2[i]] = scan4Result2[i+1]
	}

	fmt.Println(scan4Fields) // >>> map[a:1 b:2]

	scan4Result3, _, err := rdb.HScanNoValues(ctx, "myhash", 0, "", 0).Result()

	if err != nil {
		panic(err)
	}

	sort.Strings(scan4Result3)
	fmt.Println(scan4Result3) // >>> [a b]
	// STEP_END

	// Output:
	// 2
	// map[a:1 b:2]
	// [a b]
}
