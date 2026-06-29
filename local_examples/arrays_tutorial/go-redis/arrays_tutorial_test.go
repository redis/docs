// EXAMPLE: arrays_tutorial
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// HIDE_END

func ExampleClient_arrays_arset_arget() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "events:1")
	// REMOVE_END

	// STEP_START arset_arget
	setRes, err := rdb.ARSet(ctx, "events:1", 0, "login", "click", "purchase").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(setRes) // >>> 3

	getRes, err := rdb.ARGet(ctx, "events:1", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(getRes) // >>> login

	missing, err := rdb.ARGet(ctx, "events:1", 999).Result()

	if err == redis.Nil {
		fmt.Println("<nil>") // >>> <nil>
	} else if err != nil {
		panic(err)
	} else {
		fmt.Println(missing)
	}
	// STEP_END

	// Output:
	// 3
	// login
	// <nil>
}

func ExampleClient_arrays_armset_armget() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "metrics")
	// REMOVE_END

	// STEP_START armset_armget
	msetRes, err := rdb.ARMSet(ctx, "metrics",
		redis.AREntry{Index: 0, Value: "10"},
		redis.AREntry{Index: 5, Value: "20"},
		redis.AREntry{Index: 100, Value: "30"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 3

	mgetRes, err := rdb.ARMGet(ctx, "metrics", 0, 5, 100, 999).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(mgetRes) // >>> [10 20 30 <nil>]
	// STEP_END

	// Output:
	// 3
	// [10 20 30 <nil>]
}

func ExampleClient_arrays_len_count() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "sparse")
	// REMOVE_END

	// STEP_START len_count
	set1, err := rdb.ARSet(ctx, "sparse", 0, "a").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(set1) // >>> 1

	set2, err := rdb.ARSet(ctx, "sparse", 1000000, "b").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(set2) // >>> 1

	lenRes, err := rdb.ARLen(ctx, "sparse").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(lenRes) // >>> 1000001

	countRes, err := rdb.ARCount(ctx, "sparse").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(countRes) // >>> 2
	// STEP_END

	// Output:
	// 1
	// 1
	// 1000001
	// 2
}

func ExampleClient_arrays_argetrange() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "seq")
	// REMOVE_END

	// STEP_START argetrange
	msetRes, err := rdb.ARMSet(ctx, "seq",
		redis.AREntry{Index: 0, Value: "a"},
		redis.AREntry{Index: 1, Value: "b"},
		redis.AREntry{Index: 3, Value: "d"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 3

	rangeRes, err := rdb.ARGetRange(ctx, "seq", 0, 3).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(rangeRes) // >>> [a b <nil> d]
	// STEP_END

	// Output:
	// 3
	// [a b <nil> d]
}

func ExampleClient_arrays_arscan() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "seq")
	// REMOVE_END

	// STEP_START arscan
	msetRes, err := rdb.ARMSet(ctx, "seq",
		redis.AREntry{Index: 0, Value: "a"},
		redis.AREntry{Index: 1, Value: "b"},
		redis.AREntry{Index: 3, Value: "d"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 3

	scanRes, err := rdb.ARScan(ctx, "seq", 0, 3, nil).Result()

	if err != nil {
		panic(err)
	}

	for _, entry := range scanRes {
		fmt.Printf("%d -> %s\n", entry.Index, entry.Value)
	}
	// >>> 0 -> a
	// >>> 1 -> b
	// >>> 3 -> d
	// STEP_END

	// Output:
	// 3
	// 0 -> a
	// 1 -> b
	// 3 -> d
}

func ExampleClient_arrays_arinsert() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "log")
	// REMOVE_END

	// STEP_START arinsert
	ins1, err := rdb.ARInsert(ctx, "log", "event1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ins1) // >>> 0

	ins2, err := rdb.ARInsert(ctx, "log", "event2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ins2) // >>> 1

	nextRes, err := rdb.ARNext(ctx, "log").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(nextRes) // >>> 2

	seekRes, err := rdb.ARSeek(ctx, "log", 10).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(seekRes) // >>> 1

	ins3, err := rdb.ARInsert(ctx, "log", "event3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ins3) // >>> 10
	// STEP_END

	// Output:
	// 0
	// 1
	// 2
	// 1
	// 10
}

func ExampleClient_arrays_arring() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "readings")
	// REMOVE_END

	// STEP_START arring
	ring0, err := rdb.ARRing(ctx, "readings", 3, "v0").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ring0) // >>> 0

	ring1, err := rdb.ARRing(ctx, "readings", 3, "v1").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ring1) // >>> 1

	ring2, err := rdb.ARRing(ctx, "readings", 3, "v2").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ring2) // >>> 2

	ring3, err := rdb.ARRing(ctx, "readings", 3, "v3").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(ring3) // >>> 0

	getRes, err := rdb.ARGet(ctx, "readings", 0).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(getRes) // >>> v3
	// STEP_END

	// Output:
	// 0
	// 1
	// 2
	// 0
	// v3
}

func ExampleClient_arrays_arlastitems() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "readings")
	// REMOVE_END

	// STEP_START arlastitems
	// Set up the ring: insert v0, v1, v2, v3 into a size-3 ring.
	for _, v := range []string{"v0", "v1", "v2", "v3"} {
		if err := rdb.ARRing(ctx, "readings", 3, v).Err(); err != nil {
			panic(err)
		}
	}

	lastRes, err := rdb.ARLastItems(ctx, "readings", 3, false).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(lastRes) // >>> [v1 v2 v3]

	lastRevRes, err := rdb.ARLastItems(ctx, "readings", 3, true).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(lastRevRes) // >>> [v3 v2 v1]
	// STEP_END

	// Output:
	// [v1 v2 v3]
	// [v3 v2 v1]
}

func ExampleClient_arrays_arop() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "scores")
	// REMOVE_END

	// STEP_START arop
	msetRes, err := rdb.ARMSet(ctx, "scores",
		redis.AREntry{Index: 0, Value: "10"},
		redis.AREntry{Index: 1, Value: "20"},
		redis.AREntry{Index: 2, Value: "30"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 3

	sumRes, err := rdb.AROpSum(ctx, "scores", 0, 2).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(sumRes) // >>> 60

	maxRes, err := rdb.AROpMax(ctx, "scores", 0, 2).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(maxRes) // >>> 30

	matchRes, err := rdb.AROpMatch(ctx, "scores", 0, 2, "10").Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(matchRes) // >>> 1
	// STEP_END

	// Output:
	// 3
	// 60
	// 30
	// 1
}

func ExampleClient_arrays_argrep() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "log")
	// REMOVE_END

	// STEP_START argrep
	msetRes, err := rdb.ARMSet(ctx, "log",
		redis.AREntry{Index: 0, Value: "boot: ok"},
		redis.AREntry{Index: 1, Value: "warn: disk"},
		redis.AREntry{Index: 2, Value: "ERROR: cpu"},
		redis.AREntry{Index: 3, Value: "info: ready"},
		redis.AREntry{Index: 4, Value: "error: net"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 5

	// Case-insensitive match for "error".
	grepRes, err := rdb.ARGrep(ctx, "log", "0", "4", &redis.ARGrepArgs{
		Predicates: []redis.ARGrepPredicate{
			{Type: redis.ARGrepMatch, Value: "error"},
		},
		NoCase: true,
	}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(grepRes) // >>> [2 4]

	// Two GLOB predicates combined with the default OR, returning values too.
	grepValsRes, err := rdb.ARGrepWithValues(ctx, "log", "0", "4", &redis.ARGrepArgs{
		Predicates: []redis.ARGrepPredicate{
			{Type: redis.ARGrepGlob, Value: "warn:*"},
			{Type: redis.ARGrepGlob, Value: "error:*"},
		},
	}).Result()

	if err != nil {
		panic(err)
	}

	for _, entry := range grepValsRes {
		fmt.Printf("%d -> %s\n", entry.Index, entry.Value)
	}
	// >>> 1 -> warn: disk
	// >>> 4 -> error: net
	// STEP_END

	// Output:
	// 5
	// [2 4]
	// 1 -> warn: disk
	// 4 -> error: net
}

func ExampleClient_arrays_ardel() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// REMOVE_START
	rdb.FlushDB(ctx)
	rdb.Del(ctx, "scores")
	// REMOVE_END

	// STEP_START ardel
	msetRes, err := rdb.ARMSet(ctx, "scores",
		redis.AREntry{Index: 0, Value: "10"},
		redis.AREntry{Index: 1, Value: "20"},
		redis.AREntry{Index: 2, Value: "30"},
	).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(msetRes) // >>> 3

	delRes, err := rdb.ARDel(ctx, "scores", 1).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(delRes) // >>> 1

	delRangeRes, err := rdb.ARDelRange(ctx, "scores", redis.ARRange{Start: 0, End: 2}).Result()

	if err != nil {
		panic(err)
	}

	fmt.Println(delRangeRes) // >>> 2
	// STEP_END

	// Output:
	// 3
	// 1
	// 2
}
