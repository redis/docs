// EXAMPLE: sets_tutorial
// BINDER_ID go-dt-set
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"
)

// HIDE_END
func ExampleClient_sadd() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bikes:racing:france")
	rdb.Del(ctx, "bikes:racing:usa")
	rdb.Del(ctx, "bikes:racing:italy")
	// REMOVE_END

	// STEP_START sadd
	res1, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 1

	res2, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> 0

	res3, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> 2

	res4, err := rdb.SAdd(ctx, "bikes:racing:usa", "bike:1", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> 2
	// STEP_END

	// Output:
	// 1
	// 0
	// 2
	// 2
}

func ExampleClient_sismember() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bikes:racing:france")
	rdb.Del(ctx, "bikes:racing:usa")
	// REMOVE_END

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	_, err = rdb.SAdd(ctx, "bikes:racing:usa", "bike:1", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	// STEP_START sismember
	res5, err := rdb.SIsMember(ctx, "bikes:racing:usa", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> true

	res6, err := rdb.SIsMember(ctx, "bikes:racing:usa", "bike:2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> false
	// STEP_END

	// Output:
	// true
	// false
}

func ExampleClient_sinter() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bikes:racing:france")
	rdb.Del(ctx, "bikes:racing:usa")
	// REMOVE_END

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	_, err = rdb.SAdd(ctx, "bikes:racing:usa", "bike:1", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	// STEP_START sinter
	res7, err := rdb.SInter(ctx, "bikes:racing:france", "bikes:racing:usa").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res7) // >>> [bike:1]
	// STEP_END

	// Output:
	// [bike:1]
}

func ExampleClient_scard() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bikes:racing:france")
	// REMOVE_END

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	// STEP_START scard
	res8, err := rdb.SCard(ctx, "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res8) // >>> 3
	// STEP_END

	// Output:
	// 3
}

func ExampleClient_saddsmembers() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START sadd_smembers
	rdb.Del(ctx, "bikes:racing:france")

	res9, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res9) // >>> 3

	res10, err := rdb.SMembers(ctx, "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	// Sort the strings in the slice to make sure the output is lexicographical
	sort.Strings(res10)

	fmt.Println(res10) // >>> [bike:1 bike:2 bike:3]
	// STEP_END

	// Output:
	// 3
	// [bike:1 bike:2 bike:3]
}

func ExampleClient_smismember() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.Del(ctx, "bikes:racing:france")
	// REMOVE_END

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	// STEP_START smismember
	res11, err := rdb.SIsMember(ctx, "bikes:racing:france", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res11) // >>> true

	res12, err := rdb.SMIsMember(ctx, "bikes:racing:france", "bike:2", "bike:3", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res12) // >>> [true true false]
	// STEP_END

	// Output:
	// true
	// [true true false]
}

func ExampleClient_sdiff() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	// start with fresh database
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "bikes:racing:france")
	rdb.Del(ctx, "bikes:racing:usa")
	// REMOVE_END

	// STEP_START sdiff
	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	_, err = rdb.SAdd(ctx, "bikes:racing:usa", "bike:1", "bike:4").Result()

	res13, err := rdb.SDiff(ctx, "bikes:racing:france", "bikes:racing:usa").Result()

	if err != nil {
		panic(err)
	}

	// Sort the strings in the slice to make sure the output is lexicographical
	sort.Strings(res13)

	fmt.Println(res13) // >>> [bike:2 bike:3]
	// STEP_END

	// Output:
	// [bike:2 bike:3]
}

func ExampleClient_multisets() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START multisets
	rdb.Del(ctx, "bikes:racing:france")
	rdb.Del(ctx, "bikes:racing:usa")
	rdb.Del(ctx, "bikes:racing:italy")

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	_, err = rdb.SAdd(ctx, "bikes:racing:usa", "bike:1", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	_, err = rdb.SAdd(ctx, "bikes:racing:italy", "bike:1", "bike:2", "bike:3", "bike:4").Result()

	if err != nil {
		panic(err)
	}

	res14, err := rdb.SInter(ctx, "bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res14) // >>> [bike:1]

	res15, err := rdb.SUnion(ctx, "bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy").Result()

	if err != nil {
		panic(err)
	}

	// Sort the strings in the slice to make sure the output is lexicographical
	sort.Strings(res15)

	fmt.Println(res15) // >>> [bike:1 bike:2 bike:3 bike:4]

	res16, err := rdb.SDiff(ctx, "bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res16) // >>> []

	res17, err := rdb.SDiff(ctx, "bikes:racing:usa", "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res17) // >>> [bike:4]

	res18, err := rdb.SDiff(ctx, "bikes:racing:france", "bikes:racing:usa").Result()

	if err != nil {
		panic(err)
	}

	// Sort the strings in the slice to make sure the output is lexicographical
	sort.Strings(res18)

	fmt.Println(res18) // >>> [bike:2 bike:3]
	// STEP_END

	// Output:
	// [bike:1]
	// [bike:1 bike:2 bike:3 bike:4]
	// []
	// [bike:4]
	// [bike:2 bike:3]
}

func ExampleClient_srem() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START srem
	rdb.Del(ctx, "bikes:racing:france")

	_, err := rdb.SAdd(ctx, "bikes:racing:france", "bike:1", "bike:2", "bike:3", "bike:4", "bike:5").Result()

	if err != nil {
		panic(err)
	}

	res19, err := rdb.SRem(ctx, "bikes:racing:france", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res19) // >>> 1

	res20, err := rdb.SPop(ctx, "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res20) // >>> <random element>

	res21, err := rdb.SMembers(ctx, "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res21) // >>> <remaining elements>

	res22, err := rdb.SRandMember(ctx, "bikes:racing:france").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res22) // >>> <random element>
	// STEP_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_member_expiration() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START member_expiration
	rdb.Del(ctx, "bikes:reserved")

	res22, err := rdb.SAddEXWithArgs(ctx, "bikes:reserved", &redis.SAddEXOptions{
		ExpirationType: redis.SAddEXExpirationEX,
		ExpirationVal:  900,
	}, "bike:1", "bike:2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res22) // >>> 1

	res23, err := rdb.SAdd(ctx, "bikes:reserved", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res23) // >>> 1

	res24, err := rdb.STTL(ctx, "bikes:reserved", "bike:1", "bike:2", "bike:3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res24) // >>> [900 900 -1]
	// STEP_END

	// REMOVE_START
	rdb.Del(ctx, "bikes:reserved")
	// REMOVE_END

	// Output:
	// 1
	// 1
	// [900 900 -1]
}

func ExampleClient_member_expiration_ms() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START member_expiration_ms
	rdb.Del(ctx, "bikes:reserved")
	rdb.SAdd(ctx, "bikes:reserved", "bike:1", "bike:2")

	res25, err := rdb.SPExpire(ctx, "bikes:reserved", 60000*time.Millisecond, "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res25) // >>> [1]

	res26, err := rdb.SPTTL(ctx, "bikes:reserved", "bike:1", "bike:2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res26) // >>> [59994 -1] (for example)

	res27, err := rdb.SPersist(ctx, "bikes:reserved", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res27) // >>> [1]

	res28, err := rdb.SPTTL(ctx, "bikes:reserved", "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res28) // >>> [-1]
	// STEP_END

	// REMOVE_START
	rdb.Del(ctx, "bikes:reserved")
	// REMOVE_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_member_expiration_at() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START member_expiration_at
	rdb.Del(ctx, "bikes:reserved")
	rdb.SAdd(ctx, "bikes:reserved", "bike:1", "bike:2")

	// 4102444800 is an example Unix time in the future.
	res29, err := rdb.SExpireAt(ctx, "bikes:reserved", time.Unix(4102444800, 0), "bike:1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res29) // >>> [1]

	res30, err := rdb.SExpireTime(ctx, "bikes:reserved", "bike:1", "bike:2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res30) // >>> [4102444800 -1]
	// STEP_END

	// REMOVE_START
	rdb.Del(ctx, "bikes:reserved")
	// REMOVE_END

	// Output:
	// [1]
	// [4102444800 -1]
}
