// EXAMPLE: cmds_set_expiration
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_saddex() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START saddex
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAddEXWithArgs(ctx, "myset", &redis.SAddEXOptions{
		ExpirationType: redis.SAddEXExpirationEX,
		ExpirationVal:  300,
	}, "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 1

	res2, err := rdb.STTL(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [300 300]

	res3, err := rdb.SAddEXWithArgs(ctx, "myset", &redis.SAddEXOptions{
		Condition:      redis.SAddEXMNX,
		ExpirationType: redis.SAddEXExpirationEX,
		ExpirationVal:  60,
	}, "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> 0

	res4, err := rdb.SAddEXWithArgs(ctx, "myset", &redis.SAddEXOptions{
		ExpirationType: redis.SAddEXExpirationKEEPTTL,
	}, "member1", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> 1

	res5, err := rdb.STTL(ctx, "myset", "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [300 300 -1]

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Output:
	// 1
	// [300 300]
	// 0
	// 1
	// [300 300 -1]
}

func ExampleClient_sexpire() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START sexpire
	// REMOVE_START
	rdb.Del(ctx, "myset", "no-key")
	// REMOVE_END

	res1, err := rdb.SExpireWithArgs(ctx, "no-key", 20*time.Second, redis.SExpireNX, "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> [-2 -2]

	res2, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> 2

	res3, err := rdb.SExpire(ctx, "myset", 10*time.Second, "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1 1 -2]

	res4, err := rdb.SExpireWithArgs(ctx, "myset", 20*time.Second, redis.SExpireNX, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [0]

	res5, err := rdb.SExpireWithArgs(ctx, "myset", 20*time.Second, redis.SExpireGT, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [1]

	res6, err := rdb.STTL(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res6) // >>> [20 10]

	// REMOVE_START
	rdb.Del(ctx, "myset", "no-key")
	// REMOVE_END
	// STEP_END

	// Output:
	// [-2 -2]
	// 2
	// [1 1 -2]
	// [0]
	// [1]
	// [20 10]
}

func ExampleClient_spexpire() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START spexpire
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SPExpire(ctx, "myset", 2000*time.Millisecond, "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1 1]

	res3, err := rdb.SPExpireWithArgs(ctx, "myset", 500*time.Millisecond, redis.SExpireLT, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1]

	res4, err := rdb.SPTTL(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [491 1982] (for example)

	// REMOVE_START
	if !(res1 == 2) {
		panic(fmt.Sprintf("res1 = %v", res1))
	}
	if !(len(res2) == 2 && res2[0] == 1 && res2[1] == 1) {
		panic(fmt.Sprintf("res2 = %v", res2))
	}
	if !(len(res3) == 1 && res3[0] == 1) {
		panic(fmt.Sprintf("res3 = %v", res3))
	}
	if !(len(res4) == 2 && res4[0] > 0 && res4[0] <= 500 && res4[1] > 500 && res4[1] <= 2000) {
		panic(fmt.Sprintf("res4 = %v", res4))
	}
	// REMOVE_END

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_sexpireat() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START sexpireat
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SExpireAt(ctx, "myset", time.Unix(4102444800, 0), "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1]

	res3, err := rdb.SExpireTime(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [4102444800 -1]

	// A timestamp in the past deletes the member immediately.
	res4, err := rdb.SExpireAt(ctx, "myset", time.Unix(1, 0), "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [2]

	res5, err := rdb.SMembers(ctx, "myset").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [member1]

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Output:
	// 2
	// [1]
	// [4102444800 -1]
	// [2]
	// [member1]
}

func ExampleClient_spexpireat() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START spexpireat
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SPExpireAt(ctx, "myset", time.UnixMilli(4102444800000), "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1]

	res3, err := rdb.SPExpireAtWithArgs(ctx, "myset", time.UnixMilli(4102444800000), redis.SExpireXX, "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [0]

	res4, err := rdb.SPExpireTime(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [4102444800000 -1]

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Output:
	// 2
	// [1]
	// [0]
	// [4102444800000 -1]
}

func ExampleClient_sexpiretime() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START sexpiretime
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SExpire(ctx, "myset", 300*time.Second, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1]

	res3, err := rdb.SExpireTime(ctx, "myset", "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1792684428 -1 -2] (for example)

	// REMOVE_START
	if !(res1 == 2) {
		panic(fmt.Sprintf("res1 = %v", res1))
	}
	if !(len(res2) == 1 && res2[0] == 1) {
		panic(fmt.Sprintf("res2 = %v", res2))
	}
	if !(len(res3) == 3 && res3[0] >= time.Now().Unix()+295 && res3[0] <= time.Now().Unix()+305 && res3[1] == -1 && res3[2] == -2) {
		panic(fmt.Sprintf("res3 = %v", res3))
	}
	// REMOVE_END

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_spexpiretime() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START spexpiretime
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SPExpire(ctx, "myset", 300000*time.Millisecond, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1]

	res3, err := rdb.SPExpireTime(ctx, "myset", "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1792684427589 -1 -2] (for example)

	// REMOVE_START
	if !(res1 == 2) {
		panic(fmt.Sprintf("res1 = %v", res1))
	}
	if !(len(res2) == 1 && res2[0] == 1) {
		panic(fmt.Sprintf("res2 = %v", res2))
	}
	if !(len(res3) == 3 && res3[0] >= time.Now().UnixMilli()+295000 && res3[0] <= time.Now().UnixMilli()+305000 && res3[1] == -1 && res3[2] == -2) {
		panic(fmt.Sprintf("res3 = %v", res3))
	}
	// REMOVE_END

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_sttl() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START sttl
	// REMOVE_START
	rdb.Del(ctx, "myset", "no-key")
	// REMOVE_END

	res1, err := rdb.STTL(ctx, "no-key", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> [-2 -2]

	res2, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> 2

	res3, err := rdb.SExpire(ctx, "myset", 300*time.Second, "member1", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1 -2]

	res4, err := rdb.STTL(ctx, "myset", "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [300 -1 -2]

	// REMOVE_START
	rdb.Del(ctx, "myset", "no-key")
	// REMOVE_END
	// STEP_END

	// Output:
	// [-2 -2]
	// 2
	// [1 -2]
	// [300 -1 -2]
}

func ExampleClient_spttl() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START spttl
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SPExpire(ctx, "myset", 300000*time.Millisecond, "member1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1]

	res3, err := rdb.SPTTL(ctx, "myset", "member1", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [299993 -1 -2] (for example)

	// REMOVE_START
	if !(res1 == 2) {
		panic(fmt.Sprintf("res1 = %v", res1))
	}
	if !(len(res2) == 1 && res2[0] == 1) {
		panic(fmt.Sprintf("res2 = %v", res2))
	}
	if !(len(res3) == 3 && res3[0] > 295000 && res3[0] <= 300000 && res3[1] == -1 && res3[2] == -2) {
		panic(fmt.Sprintf("res3 = %v", res3))
	}
	// REMOVE_END

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Testable examples not available because the test output
	// is not deterministic.
}

func ExampleClient_spersist() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// STEP_START spersist
	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END

	res1, err := rdb.SAdd(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res1) // >>> 2

	res2, err := rdb.SExpire(ctx, "myset", 300*time.Second, "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res2) // >>> [1 1]

	res3, err := rdb.SPersist(ctx, "myset", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res3) // >>> [1]

	res4, err := rdb.STTL(ctx, "myset", "member1", "member2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res4) // >>> [300 -1]

	res5, err := rdb.SPersist(ctx, "myset", "member2", "member3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(res5) // >>> [-1 -2]

	// REMOVE_START
	rdb.Del(ctx, "myset")
	// REMOVE_END
	// STEP_END

	// Output:
	// 2
	// [1 1]
	// [1]
	// [300 -1]
	// [-1 -2]
}
