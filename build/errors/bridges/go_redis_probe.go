// Runs one command, or one MULTI/EXEC block, through go-redis and prints what it returns or the error it gives.
// Arguments: port user password mode payload...  (see _common.py for the format)
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

func tokens(p string) []interface{} {
	var out []interface{}
	for _, s := range strings.Split(p, "\x01") {
		if strings.HasPrefix(s, "hex:") {
			h := s[4:]
			b := make([]byte, len(h)/2)
			for i := range b {
				fmt.Sscanf(h[2*i:2*i+2], "%02x", &b[i])
			}
			out = append(out, b)
		} else {
			out = append(out, s)
		}
	}
	return out
}

func one(s string) string { return strings.NewReplacer("\r", " ", "\n", " ").Replace(s) }

// The checks that go-redis offers for an error, and which of them say yes.
func checks(err error) string {
	var yes []string
	add := func(name string, ok bool) {
		if ok {
			yes = append(yes, name)
		}
	}
	var e redis.Error
	add("implements redis.Error", errors.As(err, &e))
	add("IsLoadingError", redis.IsLoadingError(err))
	add("IsReadOnlyError", redis.IsReadOnlyError(err))
	add("IsClusterDownError", redis.IsClusterDownError(err))
	add("IsTryAgainError", redis.IsTryAgainError(err))
	add("IsMasterDownError", redis.IsMasterDownError(err))
	add("IsMaxClientsError", redis.IsMaxClientsError(err))
	_, moved := redis.IsMovedError(err)
	add("IsMovedError", moved)
	_, ask := redis.IsAskError(err)
	add("IsAskError", ask)
	add("IsAuthError", redis.IsAuthError(err))
	add("IsPermissionError", redis.IsPermissionError(err))
	add("IsExecAbortError", redis.IsExecAbortError(err))
	add("IsOOMError", redis.IsOOMError(err))
	add("IsNoReplicasError", redis.IsNoReplicasError(err))
	add("== ErrNoScript", errors.Is(err, redis.ErrNoScript))
	add("== ErrCrossSlot", errors.Is(err, redis.ErrCrossSlot))
	return strings.Join(yes, ", ")
}

func main() {
	a := os.Args[1:]
	c := redis.NewClient(&redis.Options{
		Addr: "127.0.0.1:" + a[0], Username: a[1], Password: a[2],
		DialTimeout: 5 * time.Second, ReadTimeout: 5 * time.Second, WriteTimeout: 5 * time.Second,
	})
	defer c.Close()
	ctx := context.Background()
	var res interface{}
	var err error
	if a[3] == "cmd" {
		res, err = c.Do(ctx, tokens(a[4])...).Result()
	} else {
		pipe := c.TxPipeline()
		for _, p := range a[4:] {
			pipe.Do(ctx, tokens(p)...)
		}
		res, err = pipe.Exec(ctx)
	}
	if err != nil {
		fmt.Printf("EXC\t%T\t%s [checks: %s]\n", err, one(err.Error()), checks(err))
		return
	}
	fmt.Printf("OK\t%s\n", one(fmt.Sprint(res)))
}
