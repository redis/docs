module redis_examples

go 1.24

require github.com/redis/go-redis/v9 v9.22.0

// Vector examples (home_query_vec, home_vecsets; run.sh --with-models). v0.7.8 and later
// need Go 1.27. `go mod tidy` drops this for sets that don't import hugot.
require github.com/knights-analytics/hugot v0.7.7

require (
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	golang.org/x/sys v0.30.0 // indirect
)
