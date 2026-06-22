// EXAMPLE: go_scan_buffer
// HIDE_START
package example_commands_test

// HIDE_END
// STEP_START import
import (
	"context"
	"fmt"
	"strings"

	"github.com/redis/go-redis/v9"
)

// STEP_END

func ExampleClient_scanBuffer() {
	// STEP_START connect
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password
		DB:       0,  // use default DB
		Protocol: 2,
	})
	defer rdb.Close()
	// STEP_END

	// REMOVE_START
	keys := []string{"scanbuf:bike:1", "scanbuf:stock", "scanbuf:payload"}
	if err := rdb.Del(ctx, keys...).Err(); err != nil {
		panic(err)
	}
	defer rdb.Del(ctx, keys...)
	// REMOVE_END

	// STEP_START scan_hash
	type Bike struct {
		Model string `redis:"model"`
		Brand string `redis:"brand"`
		Price int    `redis:"price"`
	}

	if err := rdb.HSet(ctx, "scanbuf:bike:1",
		"model", "Deimos",
		"brand", "Ergonom",
		"price", 4972,
	).Err(); err != nil {
		panic(err)
	}

	var bike Bike
	if err := rdb.HGetAll(ctx, "scanbuf:bike:1").Scan(&bike); err != nil {
		panic(err)
	}

	fmt.Printf("Model: %s, brand: %s, price: $%d\n",
		bike.Model, bike.Brand, bike.Price)
	// >>> Model: Deimos, brand: Ergonom, price: $4972
	// STEP_END

	// REMOVE_START
	if bike != (Bike{Model: "Deimos", Brand: "Ergonom", Price: 4972}) {
		panic(fmt.Sprintf("unexpected bike: %+v", bike))
	}
	// REMOVE_END

	// STEP_START scan_hash_subset
	type BikeStock struct {
		Model string `redis:"model"`
		Stock int    `redis:"stock"`
		Price int    `redis:"price"`
	}

	var partial BikeStock
	if err := rdb.HMGet(ctx, "scanbuf:bike:1", "model", "stock").Scan(&partial); err != nil {
		panic(err)
	}

	fmt.Printf("Model: %s, stock: %d, price: $%d\n",
		partial.Model, partial.Stock, partial.Price)
	// >>> Model: Deimos, stock: 0, price: $0
	// STEP_END

	// REMOVE_START
	if partial != (BikeStock{Model: "Deimos"}) {
		panic(fmt.Sprintf("unexpected partial bike: %+v", partial))
	}
	// REMOVE_END

	// STEP_START scan_list
	if err := rdb.RPush(ctx, "scanbuf:stock", 3, 4, 5).Err(); err != nil {
		panic(err)
	}

	var stockCounts []int
	if err := rdb.LRange(ctx, "scanbuf:stock", 0, -1).ScanSlice(&stockCounts); err != nil {
		panic(err)
	}

	fmt.Println("Stock counts:", stockCounts)
	// >>> Stock counts: [3 4 5]
	// STEP_END

	// REMOVE_START
	if fmt.Sprint(stockCounts) != "[3 4 5]" {
		panic(fmt.Sprintf("unexpected stock counts: %v", stockCounts))
	}
	// REMOVE_END

	// STEP_START buffer_round_trip
	payload := []byte("compact bike data")

	if err := rdb.SetFromBuffer(ctx, "scanbuf:payload", payload).Err(); err != nil {
		panic(err)
	}
	fmt.Println("OK") // >>> OK

	buf := make([]byte, len(payload))
	cmd := rdb.GetToBuffer(ctx, "scanbuf:payload", buf)
	n, err := cmd.Result()
	if err != nil {
		panic(err)
	}

	fmt.Printf("Read %d bytes: %s\n", n, string(cmd.Bytes()))
	// >>> Read 17 bytes: compact bike data
	// STEP_END

	// REMOVE_START
	if n != len(payload) || string(cmd.Bytes()) != string(payload) {
		panic("unexpected buffer round trip")
	}
	// REMOVE_END

	// STEP_START buffer_too_small
	smallBuf := make([]byte, 4)
	smallCmd := rdb.GetToBuffer(ctx, "scanbuf:payload", smallBuf)

	if err := smallCmd.Err(); err != nil {
		if strings.Contains(err.Error(), "buffer too small") {
			fmt.Println("Buffer too small")
		} else {
			panic(err)
		}
	}
	// >>> Buffer too small
	// STEP_END

	// REMOVE_START
	if smallCmd.Err() == nil {
		panic("expected a buffer-too-small error")
	}
	// REMOVE_END

	// Output:
	// Model: Deimos, brand: Ergonom, price: $4972
	// Model: Deimos, stock: 0, price: $0
	// Stock counts: [3 4 5]
	// OK
	// Read 17 bytes: compact bike data
	// Buffer too small
}
