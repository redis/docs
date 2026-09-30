// EXAMPLE: cmds_cnxmgmt
// HIDE_START
package example_commands_test

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func ExampleClient_cnxmgmt_auth() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password docs
		DB:       0,  // use default DB
	})

	// AUTH is connection-scoped, so run it on a dedicated connection from
	// Conn() rather than on the pooled client.
	conn := rdb.Conn()
	defer conn.Close()
	// HIDE_END

	// STEP_START auth1
	authResult1, err := conn.Auth(ctx, "temp_pass").Result()

	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(authResult1) // >>> OK

	authResult2, err := conn.AuthACL(ctx, "default", "temp_pass").Result()

	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(authResult2) // >>> OK
	// STEP_END

	// STEP_START auth2
	authResult3, err := conn.AuthACL(ctx, "test-user", "strong_password").Result()

	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(authResult3) // >>> OK
	// STEP_END
	// HIDE_START
}

// HIDE_END
