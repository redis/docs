---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Improve reliability using the failover features of go-redis.
linkTitle: Geographic failover
title: Client-side geographic failover
topics:
- failover
- failback
- resilience
- health checks
relatedPages:
- /develop/clients/failover
- /develop/clients/go/observability
scope: [client-specific, implementation]
weight: 55
bannerText: The MultiDB client is experimental, and its API can change in a minor release.
---

go-redis supports [Client-side geographic failover](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
how to configure go-redis for failover. For an overview of the concepts,
see the main [Client-side geographic failover](/content/develop/clients/failover.md) page.

Failover is available in go-redis v9.24.0 and later.

## Failover configuration

The `MultiDBClient` groups several databases into a set of *members* and sends every
command to one *active* member. The example below uses two members, `redis-east` and
`redis-west`, where `redis-east` is the preferred one. If `redis-east` fails,
go-redis fails over to `redis-west`.

Give each member a `Weight` to rank it (see
[Selecting a failover target](/content/develop/clients/failover.md#selecting-a-failover-target)
for how the client uses the ranking). The member with the highest weight is preferred.

```go
import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

// A deadline bounds NewMultiDBClient only (see "Start the client").
startCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

client, err := redis.NewMultiDBClient(startCtx, &redis.MultiDBOptions{
	Clients: []redis.MultiDBClientConfig{
		{Options: &redis.Options{Addr: "<east-host>:<port>"}, Weight: 1.0},
		{Options: &redis.Options{Addr: "<west-host>:<port>"}, Weight: 0.5},
	},
})
if err != nil {
	panic(err)
}
defer client.Close()

err = client.Set(context.Background(), "key", "value", 0).Err() // Served by east until it fails.
```

The returned `MultiDBClient` has the same commands as the client that
`redis.NewClient()` returns, so you can use it in place of your usual client.
It also has methods to inspect and change the set of members at runtime (see
[Control the client at runtime](#control-the-client-at-runtime)).

### Member configuration

Each entry in the `Clients` list supports the following fields:

| Field | Description |
| --- | --- |
| `Options` | The options for a standalone member. These are the same options you pass to `redis.NewClient()` (see [Connect to the server](/content/develop/clients/go/connect.md)). |
| `ClusterOptions` | The options for a cluster member, as for `redis.NewClusterClient()`. Set exactly one of `Options` and `ClusterOptions`. |
| `Weight` | Priority of the member, in the range (0, 1]. Higher values are preferred. `0` means the default of `1.0`, and `-1` disables the member. |
| `HealthChecks` | Health checks for this member only. See [Health checks](#health-checks). |
| `HealthCheckPolicy` | How to combine the results of this member's health checks. |
| `SkipInitialHealthCheck` | Used with `AddDatabase()`: register the member even if its first health check fails. The client ignores it for the members you pass to `NewMultiDBClient`. |

go-redis numbers the members from `0`, in the order you list them. Control methods and
callbacks use these numbers to refer to a member.

### Where to set options

`NewMultiDBClient` takes a `redis.MultiDBOptions` struct. Options that affect the whole
client are fields of that struct. Options for one member are fields of that member's
entry in `Clients`. Connection settings such as timeouts go in the member's `Options`
(or `ClusterOptions`).

The sections that follow show where each option goes.

## Start the client

`NewMultiDBClient` runs a health check on every member and picks the active member
from the healthy ones. Set the `InitialDBState` field of `MultiDBOptions` to choose how
many members must pass before the call succeeds, for example
`InitialDBState: redis.InitialDBStateOneAvailable`:

| Value | Meaning |
| --- | --- |
| `redis.InitialDBStateMajorityAvailable` | Half of the members, rounded up, must be healthy. This is the default. |
| `redis.InitialDBStateAllAvailable` | Every member must be healthy. |
| `redis.InitialDBStateOneAvailable` | At least one member must be healthy. |

If too few members are healthy, `NewMultiDBClient` returns an error that matches
`redis.ErrInsufficientHealthyDatabases`. When no member at all is healthy, the error
also matches `redis.ErrPermanentlyNotAvailable`.

The context you pass controls how long the client keeps trying:

-   With no deadline, `NewMultiDBClient` makes one round of health checks and fails
    immediately if too few members pass.
-   With a deadline, it repeats the health checks until enough members pass or the
    deadline expires. The deadline limits construction only, not later commands.
    If it expires, the error also matches `context.DeadlineExceeded`.

Startup takes about one second even when every member is healthy, because the default
health check sends three probes 500 ms apart.

## Detect failures

The client uses two independent signals to decide that the active member has failed.
Either one triggers a failover.

### Circuit breaker

Each member has its own circuit breaker, which opens after a run of consecutive
failures. After a cooldown it moves to half-open and lets health checks through.
It closes again after a run of successes. Configure it with the `CircuitBreakerConfig`
field of `MultiDBOptions`, which takes a `*redis.MultiDBCircuitBreakerConfig`. The
settings apply to every member.

```go
CircuitBreakerConfig: &redis.MultiDBCircuitBreakerConfig{
	FailureThreshold: 3,
	GracePeriod:      10 * time.Second,
},
```

The struct has these fields. A field you leave at zero takes its default.

| Field | Description | Default |
| --- | --- | --- |
| `FailureThreshold` | Consecutive failures before the circuit opens. | `5` |
| `SuccessThreshold` | Successes in the half-open state before the circuit closes. | `2` |
| `GracePeriod` | Cooldown between opening and the first half-open probe. | `60s` |

Commands and health probes count their failures separately. If either count reaches the
threshold, the circuit will open.

### Failure detector

One failure detector watches the traffic to all members. It trips only when both
conditions hold within a sliding time window: a minimum number of failures and a
minimum failure rate. Configure it with the `FailureDetectorConfig` field of
`MultiDBOptions`, which takes a `*redis.MultiDBFailureDetectorConfig`:

```go
FailureDetectorConfig: &redis.MultiDBFailureDetectorConfig{
	MinNumFailures:       2,
	FailureRateThreshold: 0.5,
	Window:               2 * time.Second,
},
```

The defaults are 1000 failures and a 10% failure rate in a 2 second window. At that
setting the circuit breaker usually trips first.
The client uses the fields as you give them: a field you leave at zero doesn't take
its default (except `Window`, which defaults to 2 seconds). If you set only
`MinNumFailures`, the rate condition is dropped, and if you set only a rate, a single
failed command can trip the detector on an idle client. To change one value, start
from `redis.DefaultMultiDBFailureDetectorConfig()`.

### Retries

The `CommandRetries` field of `MultiDBOptions` sets how many extra attempts a failed
command gets. Each attempt goes to whichever member is active at that moment, so a retry
reaches the new member after a failover. A value of `0` means the default of `2`, and `-1` disables
retries.

```go
CommandRetries: -1, // No retries.
```

> [!WARNING]
> If you leave `MaxRetries` unset in each member's `Options` or `ClusterOptions`, go-redis will turn off the
> member's own retries and rely only on `CommandRetries`. An explicit `MaxRetries` value
> multiplies the number of times every attempt is sent, and the circuit breaker and failure detector
> don't see those extra retries. If this happens, a command can block for much longer before the
> client fails over.

## Fail over and fail back

When the active member's circuit opens or the failure detector trips, the client picks
the healthy member with the highest weight and retries the command there. To replace
this selection with your own, set the `FailoverStrategy` field of `MultiDBOptions` to a
type that implements `redis.MultiDBFailoverStrategy`. The default is
`redis.WeightBasedFailoverStrategy`.

These fields of `MultiDBOptions` control failover and failback:

| Field | Description | Default |
| --- | --- | --- |
| `MaxFailoverAttempts` | Consecutive failed failover attempts before the client returns `redis.ErrPermanentlyNotAvailable`. | `10` |
| `FailoverAttemptDelay` | Minimum delay between failed failover attempts. A burst of failures inside this window counts as one attempt. | `12s` |
| `ProbeTargetBeforeFailover` | Health-check the chosen member before switching to it. | `false` |
| `AutoFallbackInterval` | How often to check whether a higher-weight member has recovered. A negative value disables fallback. | `120s` |

Failback happens in two steps:

1.  The failed member's circuit breaker closes. The amount of time this takes is at least as long as `GracePeriod`, plus
    the time to handle the successful probes in the half-open state.
1.  At the next `AutoFallbackInterval` check, the client switches back to the
    higher-weight member.

With the defaults, failback can take several minutes. Lower `GracePeriod` and
`AutoFallbackInterval` if you want the client to return to the preferred member faster.

### When no member is healthy

If no member can take traffic, commands fail with `redis.ErrTemporarilyNotAvailable`
while the client keeps trying other members. If the number of failed attempts in a row exceeds `MaxFailoverAttempts` then commands will fail with `redis.ErrPermanentlyNotAvailable`.
The client doesn't close in either case. It keeps probing the members and recovers when
one becomes healthy, as soon as the `GracePeriod` has elapsed (this defaults to 60 seconds).

```go
err := client.Set(ctx, "key", "value", 0).Err()
switch {
case errors.Is(err, redis.ErrPermanentlyNotAvailable):
	// Every member has failed repeatedly. Alert and back off.
case errors.Is(err, redis.ErrTemporarilyNotAvailable):
	// A failover is in progress. Retry shortly.
}
```

### Pipelines and transactions

A pipeline executes on the active member as a single, indivisible operation. If the member fails, the client
retries the whole pipeline on the new active member repeatedly, until the number of attempts exceeds `CommandRetries`.
If a transaction pipeline (via `TxPipelined`) is interrupted by a failover, it doesn't automatically get moved to another member. Instead, it returns an error, and you must decide whether to attempt it again.

### Pub/Sub

`Subscribe()` on a `MultiDBClient` keeps delivering messages across a failover and a
failback. The client moves the subscription to the new active member for you.
Messages that are published while the active member is failing aren't delivered.

## Health checks

The client checks every member on a timer, so it can find out that a failed member has
recovered. Set these fields of `MultiDBOptions` to control the checks for every member.
To give one member its own checks, set `HealthChecks` and `HealthCheckPolicy` in that
member's entry in `Clients` instead. A member's own settings replace the client-wide
ones.

| Field | Description | Default |
| --- | --- | --- |
| `HealthCheckInterval` | How often to check each member. | `5s` |
| `HealthCheckTimeout` | Time limit for one check. If it is at least `HealthCheckInterval`, go-redis lowers it to half the interval. | `3s` |
| `HealthChecks` | The checks to run on every member. | One `PING` check |
| `HealthCheckPolicy` | How to combine the probe results. | `HEALTHY_ALL` |

Each check sends several *probes*. A *policy* decides how many probes must pass for
the check to pass. The `multidb` package provides three:

| Policy | A check passes when |
| --- | --- |
| `NewHealthyAllPolicy()` | All probes succeed. This is the default. |
| `NewHealthyMajorityPolicy()` | More than half of the probes succeed. |
| `NewHealthyAnyPolicy()` | At least one probe succeeds. |

When you set several checks, all of them must pass.

### Ping check (default)

The ping check sends a [`PING`](/content/commands/ping.md) command and expects the usual
reply. By default, it sends 3 probes with a 500 ms delay between them. Change this with the `WithProbes()`,
`WithDelay()` and `WithTimeout()` options, and pass the check in the `HealthChecks`
field. The policy goes in `HealthCheckPolicy`:

```go
import "github.com/redis/go-redis/v9/multidb"

// Fields of MultiDBOptions (or of a member's MultiDBClientConfig).
HealthChecks: []redis.MultiDBHealthCheck{
	multidb.NewPingHealthCheck(
		multidb.WithProbes(2),
		multidb.WithDelay(200*time.Millisecond),
	),
},
HealthCheckPolicy: multidb.NewHealthyMajorityPolicy(),
```

### Lag-aware check (Redis Software only)

The lag-aware check uses the Redis Software
[REST API](/content/operate/rs/references/rest-api/_index.md)
to check the replication lag between an Active-Active database and its other instances.
The member is considered healthy if the lag is within the tolerance.

Add the check to the `HealthChecks` list, alongside or instead of the ping check:

```go
HealthChecks: []redis.MultiDBHealthCheck{
	multidb.NewLagAwareHealthCheck(
		multidb.WithLagAwareBaseURL("https://<cluster-fqdn>:9443"),
		multidb.WithLagAwareBasicAuth("<username>", "<password>"),
		multidb.WithLagAwareTolerance(2000), // milliseconds; the default is 5000
	),
},
```

Other options set the REST API port (default `9443`), the HTTP client, and the
Transport Layer Security (TLS) settings, including a custom root certificate
authority and a client certificate.

A lag-aware check can only clear a member to receive traffic again. It never evicts
the member that is currently active. While a member is active, the client still sends
it a plain `PING` so that a dead endpoint is found.

### Custom health checks

To run your own check, implement the `redis.MultiDBHealthCheck` interface and add it to
`HealthChecks`. To create a custom policy, implement `redis.MultiDBHealthCheckPolicy`.

> [!WARNING]
> Health checks, policies, failover strategies, failure detectors, hooks (added with
> `AddHook` or `AddDatabaseHook`) and metrics recorders run inside the client's own
> locks. Don't call the control methods or `Close` from them, because the call can
> deadlock or corrupt the failover accounting. The `OnFailover`,
> `OnActiveDatabaseChanged` and `OnCircuitStateChanged` callbacks are the only exceptions
> that *can* call control methods.

## Failover callbacks

The client calls your functions when its state changes. Set them as fields of
`MultiDBOptions`. Each callback runs on its own queue, so it doesn't block commands.

```go
// Fields of MultiDBOptions.
OnFailover: func(ctx context.Context, from, to int) {
	log.Printf("failing over from member %d to member %d", from, to)
},
OnActiveDatabaseChanged: func(from, to int) {
	log.Printf("active member is now %d (was %d)", to, from)
},
OnCircuitStateChanged: func(id int, from, to string) {
	log.Printf("member %d circuit: %s -> %s", id, from, to)
},
```

`OnActiveDatabaseChanged` also fires when you switch members by hand.

## Control the client at runtime

`MultiDBClient` provides these methods to inspect and change the client while it runs:

| Method | Description |
| --- | --- |
| `ActiveDatabaseID()` | Returns the number of the active member, or `-1` if none is selected. |
| `SetActiveDatabase(ctx, id)` | Switches to a member after a fresh health probe. Returns `redis.ErrTargetUnhealthy` if the probe fails, `redis.ErrDatabaseDisabled` if the weight is `-1`, or `redis.ErrDatabaseNotFound` for an unknown number. |
| `ForceActiveDatabase(ctx, id)` | Switches to a member with no health probe, including a disabled one. |
| `AddDatabase(ctx, cfg)` | Adds a member and returns its number. |
| `RemoveDatabase(ctx, id)` | Removes a member. You can't remove the active member. |
| `SetWeight(id, weight)` | Changes a member's weight. You can't disable the active member or the last enabled member. |
| `SetAutoFallback(enabled)` | Turns automatic fallback on or off. |

Member numbers are stable. If you remove a member, go-redis never reuses its number.

## Observability

The `redisotel-native` package records MultiDB metrics when you enable the
`MetricGroupFlagMultiDB` metric group. See
[Observability](/content/develop/clients/go/observability.md) to set up
OpenTelemetry (OTel) metrics. You enable the group when you initialize the
observability instance, before you create the client:

```go
import redisotel "github.com/redis/go-redis/extra/redisotel-native/v9"

otelInstance := redisotel.GetObservabilityInstance()
config := redisotel.NewConfig().
	WithEnabled(true). // Metrics are off unless you enable them.
	WithMetricGroups(redisotel.MetricGroupFlagMultiDB)

if err := otelInstance.Init(config); err != nil {
	panic(err)
}
```

The `MultiDBClient` then records to this instance with no further setup.

| Metric | Description |
| --- | --- |
| `redis.client.multidb.failovers` | Number of failovers, with the reason as an attribute. |
| `redis.client.multidb.failover.duration` | Time taken by each failover. |
| `redis.client.multidb.active_database.changes` | Number of active-member changes, including fallbacks and manual switches. |
| `redis.client.multidb.circuit_breaker.state_changes` | Number of circuit breaker state changes. |
| `redis.client.multidb.health_checks` | Number of health checks, with the result as an attribute. |
| `redis.client.multidb.health_check.duration` | Time taken by each health check. |

The metrics identify a member by its host name only, so two members on the same host
look the same.

## Troubleshooting

### `NewMultiDBClient` fails with `ErrInsufficientHealthyDatabases`

Fewer members passed the first health check than the `InitialDBState` field of
`MultiDBOptions` requires. Check that the members are reachable from the app. If some
members start late, pass a context with a deadline to `NewMultiDBClient` so the client
keeps retrying, or set `InitialDBState` to `redis.InitialDBStateOneAvailable`.

### A failing command blocks for a long time before failover

Check that you left `MaxRetries` unset in each member's `Options` or `ClusterOptions`.
Also check the `DialTimeout`, `ReadTimeout` and `WriteTimeout` fields in each member's
`Options` or `ClusterOptions`. The circuit breaker trips after a number of failed commands equal to `FailureThreshold` - you should ensure each command fails quickly.

A command on a cluster member takes longer to fail than one on a standalone member.
With 1 second timeouts, a command against an unresponsive three-node cluster takes
about 4 seconds to return an error, so the default threshold of five failed commands takes about 20
seconds to open the circuit. Use shorter timeouts in the member's `ClusterOptions`, or a
lower `FailureThreshold` in `CircuitBreakerConfig` to reduce this time.

### The client doesn't fail back after the preferred member recovers

Failback waits for the circuit's `GracePeriod` (in `CircuitBreakerConfig`) and then for
the next `AutoFallbackInterval` check. Check that `AutoFallbackInterval` isn't negative.
