// EXAMPLE: local_list_demo
// HIDE_START
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    ctx := context.Background()
// HIDE_END

    // STEP_START lpush_lrange
    err := rdb.LPush(ctx, "mylist", "world").Err()
    if err != nil {
        panic(err)
    }
    
    err = rdb.LPush(ctx, "mylist", "hello").Err()
    if err != nil {
        panic(err)
    }
    
    vals, err := rdb.LRange(ctx, "mylist", 0, -1).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println(vals)
    // >>> [hello world]
    // REMOVE_START
    rdb.Del(ctx, "mylist")
    // REMOVE_END
    // STEP_END

// HIDE_START
}
// HIDE_END
