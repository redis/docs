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
description: Improve reliability using the failover/failback features of redis-py.
linkTitle: Failover/failback
title: Failover and failback
topics:
- failover
- failback
- resilience
- health checks
- retries
relatedPages:
- /develop/clients/failover
scope: [client-specific, implementation]
weight: 65
bannerText: This feature is currently in preview and may be subject to change.
---

redis-py supports [failover and failback](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
how to configure redis-py for failover and failback. For an overview of the concepts,
see the main [Failover/failback]({{< relref "/develop/clients/failover" >}}) page.

## Failover configuration

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, redis-py should fail over to
`redis-west`.

Supply the weighted endpoints using a list of `DatabaseConfig` objects.
Use the `weight` option to order the endpoints, with the highest
weight being tried first. Then, use the list to create a `MultiDbConfig` object,
which you can pass to the `MultiDBClient` constructor to create the client.
`MultiDBClient` implements the usual Redis commands using an internal
`RedisClient` instance, but will also handle the connection management and failover transparently.

```py
from redis.multidb.client import MultiDBClient
from redis.multidb.config import MultiDbConfig, DatabaseConfig

db_configs = [
    DatabaseConfig(
        client_kwargs={"host": "redis-east.example.com", "port": "14000"},
        weight=1.0
    ),
    DatabaseConfig(
        client_kwargs={"host": "redis-west.example.com", "port": "14000"},
        weight=0.5
    ),
]

cfg = MultiDbConfig(databases_config=db_configs)
client = MultiDBClient(cfg)
```

### Endpoint configuration

The `DatabaseConfig` class provides several options to configure each endpoint, as
described in the table below. Supply the configurations for the whole set of
endpoints by passing a list of `DatabaseConfig` objects to the `MultiDbConfig`
constructor in the `databases_config` parameter.

| Option | Description |
| --- | --- |
| `client_kwargs` | Keyword parameters to pass to the internal client constructor for this endpoint. Use it to specify the host, port, username, password, and other connection parameters (see [Connect to the server]({{< relref "/develop/clients/redis-py/connect" >}}) for more information). This is especially useful if you are using a custom client class (see [Client configuration](#client-configuration) below for more information). |
| `from_url` | Redis URL to connect to this endpoint, as an alternative to passing the host and port in `client_kwargs`. |
| `from_pool` | A `ConnectionPool` to supply the endpoint connection (see [Connect with a connection pool]({{< relref "/develop/clients/redis-py/connect#connect-with-a-connection-pool" >}}) for more information) |
| `weight` | Priority of the endpoint, with higher values being tried first. Default is `1.0`. |
| `grace_period` | Duration in seconds to keep an unhealthy endpoint disabled before attempting a failback. Default is `60` seconds. |
| `health_check_url` | URL for health checks that use the database's REST API (see [`LagAwareHealthCheck`](#lag-aware-health-check) for more information). |

### Client configuration

`MultiDbConfig` provides the `client_class` option to specify the class of the internal client to use for each endpoint. The default is the basic `redis.Redis` client, but
you could, for example, replace this with `redis.asyncio.client.Redis` for an asynchronous basic client, or with `redis.cluster.RedisCluster`/`redis.asyncio.cluster.RedisCluster` for a cluster client. Use the `client_kwargs` option of `DatabaseConfig` to supply any extra parameters required by the client class (see [Endpoint configuration](#endpoint-configuration) above for more information).

```py
cfg = MultiDbConfig(
    ...
    client_class=redis.asyncio.client.Redis,
    ...
)
```

### Retry configuration

`MultiDbConfig` provides the `command_retry` option to configure retries for failed commands. This follows the usual approach to configuring retries used with a standard
`RedisClient` connection (see [Retries]({{< relref "/develop/clients/redis-py/produsage#retries" >}}) for more information).

```py
cfg = MultiDbConfig(
    ...
    # Retry failed commands up to three times using exponential backoff
    # with jitter between attempts.
    command_retry=Retry(
        retries=3,
        backoff=ExponentialWithJitterBackoff(base=1, cap=10),
    ),
    ...
)
```

### Health check configuration

Each health check consists of one or more separate "probes", each of which is a simple
test (such as a [`PING`]({{< relref "/commands/ping" >}}) command) to determine if the database is available. The results of the separate probes are combined
using a configurable policy to determine if the database is healthy. `MultiDbConfig` provides the following options to configure the health check behavior:

| Option | Description |
| --- | --- |
| `health_check_interval` | Time interval between successive health checks (each of which may consist of multiple probes). Default is `5` seconds. |
| `health_check_probes` | Number of separate probes performed during each health check. Default is `3`. |
| `health_check_probes_delay` | Delay between probes during a health check. Default is `0.5` seconds. |
| `health_check_policy` | `HealthCheckPolicies` enum value to specify the policy for determining database health from the separate probes of a health check. The options are `HealthCheckPolicies.ALL` (all probes must succeed), `HealthCheckPolicies.ANY` (at least one probe must succeed), and `HealthCheckPolicies.MAJORITY` (more than half the probes must succeed). The default policy is `HealthCheckPolicies.MAJORITY`. |
| `health_check` | Custom list of `HealthCheck` objects to specify how to perform each probe during a health check. This defaults to just the simple [`PingHealthCheck`](#pinghealthcheck-default). |

### Circuit breaker configuration

`MultiDbConfig` gives you several options to configure the circuit breaker:

| Option | Description |
| --- | --- |
| `failures_detection_window` | Duration in seconds to keep failures and successes in the sliding window. Default is `2` seconds. |
| `min_num_failures` | Minimum number of failures that must occur to trigger a failover. Default is `1000`. |
| `failure_rate_threshold` | Fraction of failed commands required to trigger a failover. Default is `0.1` (10%). |

### General failover configuration

There are also a few other options you can pass to the `MultiDbConfig` constructor to control the failover behavior:

| Option | Description |
| --- | --- |
| `failover_attempts` | Number of attempts to fail over to a new endpoint before giving up. Default is `10`. |
| `failover_delay` | Time interval between successive failover attempts. Default is `12` seconds. |
| `auto_fallback_interval` | Time interval between automatic failback attempts. Default is `30` seconds. |
| `event_dispatcher` | `EventDispatcher` object to use for emitting events. Supply this to register custom event listeners (see [Failover callbacks](#failover-callbacks) below for more information). |

### Failover callbacks

You may want to take some custom action when a failover occurs. For example, you could log a warning, increment a metric, or externally persist the cluster connection state.

You can implement a custom event listener using a class that implements `EventListenerInterface`. This includes a `listen()` method that is called when
the event occurs. You should specifically listen for the `ActiveDatabaseChanged`
event, which is emitted when a failover happens.

The example below shows how to implement a simple listener class and register an instance
of it using an `EventDispatcher` object. You can then pass the `EventDispatcher` to the
`MultiDbConfig` constructor to enable the custom behavior.

```py
import logging

from redis.multidb.client import MultiDBClient
from redis.multidb.config import MultiDbConfig

from redis.event import EventListenerInterface, EventDispatcher
from redis.multidb.event import ActiveDatabaseChanged
 ...

class LogFailoverEventListener(EventListenerInterface):
    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def listen(self, event: ActiveDatabaseChanged):
        self.logger.warning(
            f"Failover happened. Active database switched from {event.old_database} to {event.new_database}"
        )

event_dispatcher = EventDispatcher()
listener = LogFailoverEventListener(logging.getLogger(__name__))

# Register custom listener
event_dispatcher.register_listeners(
    {
        ActiveDatabaseChanged: [listener],
    }
)

config = MultiDbConfig(
    event_dispatcher=event_dispatcher,
    ...
)

client = MultiDBClient(config)
```

## Health check strategies

There are several strategies available for health checks that you can configure using the
`MultiClusterClientConfig` builder. The sections below explain these strategies
in more detail.

### `PingHealthCheck` (default)

The default strategy, `PingHealthCheck`, periodically sends a Redis
[`PING`]({{< relref "/commands/ping" >}}) command
and checks that it gives the expected response. Any unexpected response
or exception indicates an unhealthy server. Although `PingHealthCheck` is
very simple, it is a good basic approach for most Redis deployments.

### `LagAwareHealthCheck` (Redis Enterprise only) {#lag-aware-health-check}

`LagAwareHealthCheck` is designed specifically for
Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active" >}})
deployments. It determines the health of the server by using the
[REST API]({{< relref "/operate/rs/references/rest-api" >}}) to check the
synchronization lag between a specific database and the others in the Active-Active
setup. If the lag is within a specified tolerance, the server is considered healthy.

`LagAwareHealthCheck` uses the `health_check_url` value for the endpoint
to connect to the database's REST API, so you must specify this in
the `DatabaseConfig` for each endpoint:

```py
db_configs = [
    DatabaseConfig(
        client_kwargs={"host": "redis-east.example.com", "port": "14000"},
        weight=1.0,
        health_check_url="https://health.redis-east.example.com"
    ),
    DatabaseConfig(
        client_kwargs={"host": "redis-west.example.com", "port": "14000"},
        weight=0.5,
        health_check_url="https://health.redis-west.example.com"
    ),
]
```

You must also add a `LagAwareHealthCheck` instance to the `health_check` list in
the `MultiDbConfig` constructor:

```py
cfg = MultiDbConfig(
    databases_config=db_configs,
    health_check=[LagAwareHealthCheck(
        rest_api_port=9443,
        lag_aware_tolerance=100,  # ms
        verify_tls=True,
        # auth_basic=("user", "pass"),
        # ca_file="/path/ca.pem",
        # client_cert_file="/path/cert.pem",
        # client_key_file="/path/key.pem",
    )],
    ...
)

client = MultiDBClient(cfg)
```

The `LagAwareHealthCheck` constructor accepts the following options:

| Option | Description |
| --- | --- |
| `rest_api_port` | Port number for Redis Enterprise REST API (default is 9443). |
| `lag_aware_tolerance` | Tolerable synchronization lag between databases in milliseconds (default is 100ms). |
| `timeout` | REST API request timeout in seconds (default is 30 seconds). |
| `auth_basic` | Tuple of (username, password) for basic authentication. |
| `verify_tls` | Whether to verify TLS certificates (defaults to `True`). |
| `ca_file` | Path to CA certificate file for TLS verification. |
| `ca_path` | Path to CA certificates directory for TLS verification. |
| `ca_data` | CA certificate data as string or bytes. |
| `client_cert_file` | Path to client certificate file for mutual TLS. |
| `client_key_file` | Path to client private key file for mutual TLS. |
| `client_key_password` | Password for encrypted client private key |

### Custom health check strategy

You can supply your own custom health check strategy by
deriving a new class from the `AbstractHealthCheck` class.
For example, you might use this to integrate with external monitoring tools or
to implement checks that are specific to your application. Add an
instance of your custom class to the `health_check` list in
the `MultiDbConfig` constructor, as with [`LagAwareHealthCheck`](#lag-aware-health-check).

The example below
shows a simple custom strategy that sends a Redis [`ECHO`]({{< relref "/commands/echo" >}})
command and checks for the expected response.

```py
from redis.multidb.healthcheck import AbstractHealthCheck
from redis.retry import Retry
from redis.utils import dummy_fail

class EchoHealthCheck(AbstractHealthCheck):
    def __init__(self, retry: Retry):
        super().__init__(retry=retry)
    def check_health(self, database) -> bool:
        return self._retry.call_with_retry(
            lambda: self._returns_echo(database),
            lambda _: dummy_fail()
        )
    def _returns_echo(self, database) -> bool:
        expected_message = ["Yodel-Ay-Ee-Oooo!", b"Yodel-Ay-Ee-Oooo!"]
        actual_message = database.client.execute_command("ECHO", "Yodel-Ay-Ee-Oooo!")
        return actual_message in expected_message

cfg = MultiDbConfig(
    ...
    health_check=[EchoHealthCheck(retry=Retry(retries=3))],
    ...
)

client = MultiDBClient(cfg)
```

## Managing databases at runtime

Although you will typically configure all databases during the
initial connection, you can also modify the configuration at runtime.
You can add and remove database endpoints, update their weights,
and manually set the active database rather than waiting for the
failback mechanism:

```py
from redis.multidb.client import MultiDBClient
from redis.multidb.config import MultiDbConfig, DatabaseConfig
from redis.multidb.database import Database
from redis.multidb.circuit import PBCircuitBreakerAdapter
import pybreaker
from redis import Redis

cfg = MultiDbConfig(
    databases_config = [
        DatabaseConfig(
            client_kwargs={"host": "redis-east.example.com", "port": "14000"},
            weight=1.0
        ),
        DatabaseConfig(
            client_kwargs={"host": "redis-west.example.com", "port": "14000"},
            weight=0.5
        ),
    ]
)
client = MultiDBClient(cfg)

# Add a database programmatically.
other = Database(
    client=Redis.from_url("redis://redis-south.example.com/0"),
    circuit=PBCircuitBreakerAdapter(pybreaker.CircuitBreaker(reset_timeout=5.0)),
    weight=0.5,
    health_check_url=None,
)
client.add_database(other)

# Update the new database's weight.
client.update_database_weight(other, 0.9)

# Manually set it as the active database.
client.set_active_database(other)

# Remove the database from the failover set.
client.remove_database(other)
```

## Troubleshooting

This section lists some common problems and their solutions.

### Excessive or constant health check failures

If all health checks fail, you should first rule out authentication
problems with the Redis server and also make sure there are no persistent
network connectivity problems. If you are using
[`LagAwareHealthCheck`](#lag-aware-health-check), check that the `health_check_url`
is set correctly for each endpoint. You can also try increasing the timeout
for health checks and the interval between them. See
[Health check configuration](#health-check-configuration) and
[Endpoint configuration](#endpoint-configuration) for more information about these options.

### Slow failback after recovery

If failback is too slow after a server recovers, you can try
reducing the `health_check_interval` period and also reducing the `grace_period`
before failback is attempted (see [Health check configuration](#health-check-configuration)
for more information about these options).
