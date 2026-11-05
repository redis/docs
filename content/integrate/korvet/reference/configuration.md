---
Title: Configuration Reference
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Complete configuration reference for Korvet.
linkTitle: Configuration
weight: 10
---

Complete configuration reference for Korvet.

All `korvet` properties have sensible defaults. You can override them via
`application.yml`, environment variables (e.g. `KORVET_BROKER_PORT`), or
command-line arguments (e.g. `--korvet.broker.port=9092`). Unknown `korvet`
properties fail startup (strict binding) — a typo is caught immediately rather
than silently ignored.

## General

Top-level Korvet runtime settings: namespace and the entry points into each sub-system.

#### `korvet.namespace` {#korvet-namespace}

**Env var:** `KORVET_NAMESPACE` · **Type:** string · **Default:** `korvet`

Logical namespace applied to all storage and registry state this Korvet instance owns. Must not contain whitespace or the `:` delimiter — colons are appended internally to compose sub-namespaces.

## Admin

HTTP Admin API bootstrap credentials.

#### `korvet.admin.bootstrap` {#korvet-admin-bootstrap}

**Env var:** `KORVET_ADMIN_BOOTSTRAP` · **Type:** boolean · **Default:** `true`

Create the default admin credential at startup when it does not already exist.

#### `korvet.admin.first-run-setup-enabled` {#korvet-admin-first-run-setup-enabled}

**Env var:** `KORVET_ADMIN_FIRST_RUN_SETUP_ENABLED` · **Type:** boolean · **Default:** `true`

Enable the unauthenticated first-run setup endpoint that creates the first admin user while the admin user store is empty.

#### `korvet.admin.password` {#korvet-admin-password}

**Env var:** `KORVET_ADMIN_PASSWORD` · **Type:** string · **Default:** `admin`

Password for the bootstrapped admin credential. Change this before exposing the Admin API.

#### `korvet.admin.security-enabled` {#korvet-admin-security-enabled}

**Env var:** `KORVET_ADMIN_SECURITY_ENABLED` · **Type:** boolean · **Default:** `true`

When false, the Admin API and UI are served without authentication: the security filter chains permit every request and the SPA skips its login screen. Intended for local, single-user contexts such as `korvet demo`. Defaults to true.

#### `korvet.admin.username` {#korvet-admin-username}

**Env var:** `KORVET_ADMIN_USERNAME` · **Type:** string · **Default:** `admin`

Username for the bootstrapped admin credential.

### Jwt

JWT session settings for the Admin API cookie auth.

#### `korvet.admin.jwt.expiry` {#korvet-admin-jwt-expiry}

**Env var:** `KORVET_ADMIN_JWT_EXPIRY` · **Type:** duration · **Default:** `8h`

Lifetime of an admin session JWT. Defaults to 8 hours.

#### `korvet.admin.jwt.secret` {#korvet-admin-jwt-secret}

**Env var:** `KORVET_ADMIN_JWT_SECRET` · **Type:** string

HMAC-SHA256 signing secret for admin session JWTs. Must be at least 32 characters. If not set, a random key is generated at startup (all sessions are invalidated on restart).

## Broker

Kafka-wire broker listener and group coordinator: bind address, TLS, request limits, backpressure, and rebalance tuning.

#### `korvet.broker.advertised-host` {#korvet-broker-advertised-host}

**Env var:** `KORVET_BROKER_ADVERTISED_HOST` · **Type:** string

Hostname advertised to clients via the Kafka metadata response. Leave unset (null) to fall back to `host`, or to `localhost` when `host` binds to all interfaces (`0.0.0.0`); blank/whitespace values are rejected.

#### `korvet.broker.advertised-port` {#korvet-broker-advertised-port}

**Env var:** `KORVET_BROKER_ADVERTISED_PORT` · **Type:** integer

Port advertised to clients via the Kafka metadata response. Defaults to `port` when unset.

#### `korvet.broker.boss-threads` {#korvet-broker-boss-threads}

**Env var:** `KORVET_BROKER_BOSS_THREADS` · **Type:** integer · **Default:** `1`

Netty boss (accept) thread count.

#### `korvet.broker.cert-file` {#korvet-broker-cert-file}

**Env var:** `KORVET_BROKER_CERT_FILE` · **Type:** file path

PEM-encoded server certificate (or chain). Required when `tls=true`.

#### `korvet.broker.client-auth-required` {#korvet-broker-client-auth-required}

**Env var:** `KORVET_BROKER_CLIENT_AUTH_REQUIRED` · **Type:** boolean · **Default:** `false`

Require clients to present a certificate (mTLS).

#### `korvet.broker.enabled` {#korvet-broker-enabled}

**Env var:** `KORVET_BROKER_ENABLED` · **Type:** boolean · **Default:** `true`

Enable the broker listener.

#### `korvet.broker.fetch-max-wait` {#korvet-broker-fetch-max-wait}

**Env var:** `KORVET_BROKER_FETCH_MAX_WAIT` · **Type:** duration · **Default:** `500ms`

Maximum time a fetch request will block waiting for `fetch.min.bytes` to be satisfied.

#### `korvet.broker.fetch-partition-max-bytes` {#korvet-broker-fetch-partition-max-bytes}

**Env var:** `KORVET_BROKER_FETCH_PARTITION_MAX_BYTES` · **Type:** data size · **Default:** `1MB`

Default upper bound on per-partition bytes returned by a fetch.

#### `korvet.broker.host` {#korvet-broker-host}

**Env var:** `KORVET_BROKER_HOST` · **Type:** string · **Default:** `0.0.0.0`

Listener host (interface to bind to).

#### `korvet.broker.id` {#korvet-broker-id}

**Env var:** `KORVET_BROKER_ID` · **Type:** integer · **Default:** `0`

Numeric broker id advertised to Kafka clients. Must be unique across a multi-node deployment.

#### `korvet.broker.key-file` {#korvet-broker-key-file}

**Env var:** `KORVET_BROKER_KEY_FILE` · **Type:** file path

PEM-encoded server private key. Required when `tls=true`.

#### `korvet.broker.key-password` {#korvet-broker-key-password}

**Env var:** `KORVET_BROKER_KEY_PASSWORD` · **Type:** secret

Passphrase protecting `keyFile`, if encrypted.

#### `korvet.broker.max-pending-bytes` {#korvet-broker-max-pending-bytes}

**Env var:** `KORVET_BROKER_MAX_PENDING_BYTES` · **Type:** data size · **Default:** `100MB`

Backpressure threshold: pause reads from the wire once this many bytes are pending outbound.

#### `korvet.broker.max-request-bytes` {#korvet-broker-max-request-bytes}

**Env var:** `KORVET_BROKER_MAX_REQUEST_BYTES` · **Type:** data size · **Default:** `100MB`

Maximum size of a single inbound Kafka request. Requests larger than this are rejected.

#### `korvet.broker.port` {#korvet-broker-port}

**Env var:** `KORVET_BROKER_PORT` · **Type:** integer · **Default:** `9092`

Listener TCP port.

#### `korvet.broker.produce-timeout` {#korvet-broker-produce-timeout}

**Env var:** `KORVET_BROKER_PRODUCE_TIMEOUT` · **Type:** duration · **Default:** `5s`

Server-side cap on how long a single partition's storage write may run before it is surfaced as `REQUEST_TIMED_OUT`. Because produce responses are sent in request order per connection, a stalled write would otherwise hold the head of the in-order response queue (and every pipelined request behind it) for the client's full `timeoutMs` — collapsing throughput on the connection. The effective bound per partition is the smaller of this value and the client-supplied request timeout. Set to zero to disable the server-side cap.

#### `korvet.broker.rebalance-delay` {#korvet-broker-rebalance-delay}

**Env var:** `KORVET_BROKER_REBALANCE_DELAY` · **Type:** duration · **Default:** `3s`

Grace period before triggering a consumer-group rebalance after a member joins or leaves.

#### `korvet.broker.rebalance-threads` {#korvet-broker-rebalance-threads}

**Env var:** `KORVET_BROKER_REBALANCE_THREADS` · **Type:** integer · **Default:** max(2, available CPU cores)

Scheduler thread-pool size for the group coordinator.

#### `korvet.broker.response-queue-timeout` {#korvet-broker-response-queue-timeout}

**Env var:** `KORVET_BROKER_RESPONSE_QUEUE_TIMEOUT` · **Type:** duration · **Default:** `10s`

Upper bound on how long a single request may hold the head of the per-connection, in-order response queue before it is failed with `REQUEST_TIMED_OUT`. Prevents a request whose handler never completes from stalling every later request on the connection. Fetch requests additionally get their `fetchMaxWait` long-poll budget on top of this.

#### `korvet.broker.resume-pending-bytes` {#korvet-broker-resume-pending-bytes}

**Env var:** `KORVET_BROKER_RESUME_PENDING_BYTES` · **Type:** data size · **Default:** `50MB`

Backpressure release threshold: resume reads once pending bytes drop below this. Must be `<` `maxPendingBytes`.

#### `korvet.broker.tls` {#korvet-broker-tls}

**Env var:** `KORVET_BROKER_TLS` · **Type:** boolean · **Default:** `false`

Enable TLS on the listener. When `true`, `certFile` and `keyFile` are required.

#### `korvet.broker.trust-cert-file` {#korvet-broker-trust-cert-file}

**Env var:** `KORVET_BROKER_TRUST_CERT_FILE` · **Type:** file path

PEM-encoded CA trust store for verifying client certificates (mTLS). Required when `clientAuthRequired=true`.

#### `korvet.broker.worker-threads` {#korvet-broker-worker-threads}

**Env var:** `KORVET_BROKER_WORKER_THREADS` · **Type:** integer · **Default:** `0`

Netty worker (IO) thread count. `0` lets Netty pick a default based on CPU count.

### Acl

#### `korvet.broker.acl.enabled` {#korvet-broker-acl-enabled}

**Env var:** `KORVET_BROKER_ACL_ENABLED` · **Type:** boolean · **Default:** `false`

Enable topic ACL enforcement. Requires SASL authentication to be enabled.

### Metrics

#### `korvet.broker.metrics.offset-cardinality-cap` {#korvet-broker-metrics-offset-cardinality-cap}

**Env var:** `KORVET_BROKER_METRICS_OFFSET_CARDINALITY_CAP` · **Type:** integer · **Default:** `10000`

Maximum number of `(topic, partition)` pairs published as offset gauges. When the live topic-partition count exceeds this cap, the publisher skips the refresh and logs a warning to prevent unbounded time-series cardinality.

#### `korvet.broker.metrics.offset-refresh-interval` {#korvet-broker-metrics-offset-refresh-interval}

**Env var:** `KORVET_BROKER_METRICS_OFFSET_REFRESH_INTERVAL` · **Type:** duration · **Default:** `15s`

Interval between refreshes of per-topic-partition offset gauges (`korvet.broker.max_offset`, `korvet.broker.log_start_offset`).

### Sasl

#### `korvet.broker.sasl.enabled` {#korvet-broker-sasl-enabled}

**Env var:** `KORVET_BROKER_SASL_ENABLED` · **Type:** boolean · **Default:** `false`

Enable SASL authentication on the listener.

#### `korvet.broker.sasl.mechanisms` {#korvet-broker-sasl-mechanisms}

**Env var:** `KORVET_BROKER_SASL_MECHANISMS` · **Type:** list of string · **Default:** `SCRAM-SHA-256`

SASL mechanisms advertised to clients. Must be a non-empty subset of `SUPPORTED`. Defaults to SCRAM-SHA-256 only — PLAIN must be opted in explicitly and requires TLS.

## Redis

Primary Redis client used by the broker, registries, and (unless overridden) storage.

#### `korvet.redis.cluster` {#korvet-redis-cluster}

**Env var:** `KORVET_REDIS_CLUSTER` · **Type:** boolean · **Default:** `false`

Treat the target as a Redis Cluster (uses Lettuce `RedisClusterClient`).

#### `korvet.redis.host` {#korvet-redis-host}

**Env var:** `KORVET_REDIS_HOST` · **Type:** string · **Default:** `localhost`

Redis host. Ignored when `uri` is set.

#### `korvet.redis.io-threads` {#korvet-redis-io-threads}

**Env var:** `KORVET_REDIS_IO_THREADS` · **Type:** integer · **Default:** available CPU cores

Size of the Lettuce IO (event-loop) thread pool.

#### `korvet.redis.password` {#korvet-redis-password}

**Env var:** `KORVET_REDIS_PASSWORD` · **Type:** secret

Password for AUTH.

#### `korvet.redis.port` {#korvet-redis-port}

**Env var:** `KORVET_REDIS_PORT` · **Type:** integer · **Default:** `6379`

Redis port. Ignored when `uri` is set.

#### `korvet.redis.timeout` {#korvet-redis-timeout}

**Env var:** `KORVET_REDIS_TIMEOUT` · **Type:** duration · **Default:** `1m`

Default per-command timeout.

#### `korvet.redis.uri` {#korvet-redis-uri}

**Env var:** `KORVET_REDIS_URI` · **Type:** string

Redis URI (`redis://...` or `rediss://...`). When set, supersedes `host`/`port`/`username`/`password`.

#### `korvet.redis.username` {#korvet-redis-username}

**Env var:** `KORVET_REDIS_USERNAME` · **Type:** string

Username for ACL authentication. Leave unset for password-only AUTH.

### Circuit Breaker

Fail-fast circuit breaker around Redis stream operations on the primary client.

#### `korvet.redis.circuit-breaker.enabled` {#korvet-redis-circuit-breaker-enabled}

**Env var:** `KORVET_REDIS_CIRCUIT_BREAKER_ENABLED` · **Type:** boolean · **Default:** `true`

Enable the stream-operation circuit breaker.

#### `korvet.redis.circuit-breaker.log-interval` {#korvet-redis-circuit-breaker-log-interval}

**Env var:** `KORVET_REDIS_CIRCUIT_BREAKER_LOG_INTERVAL` · **Type:** duration · **Default:** `30s`

Minimum interval between breaker-state log lines (rate-limit for repeated open events).

#### `korvet.redis.circuit-breaker.open-duration` {#korvet-redis-circuit-breaker-open-duration}

**Env var:** `KORVET_REDIS_CIRCUIT_BREAKER_OPEN_DURATION` · **Type:** duration · **Default:** `30s`

How long the breaker stays open before allowing a probe call.

### Metrics

Client-side latency metrics published by Lettuce for the primary Redis client.

#### `korvet.redis.metrics.enabled` {#korvet-redis-metrics-enabled}

**Env var:** `KORVET_REDIS_METRICS_ENABLED` · **Type:** boolean · **Default:** `false`

Enable command-latency metrics collection.

#### `korvet.redis.metrics.histogram` {#korvet-redis-metrics-histogram}

**Env var:** `KORVET_REDIS_METRICS_HISTOGRAM` · **Type:** boolean · **Default:** `false`

Publish per-command histograms in addition to summary statistics.

#### `korvet.redis.metrics.local-distinction` {#korvet-redis-metrics-local-distinction}

**Env var:** `KORVET_REDIS_METRICS_LOCAL_DISTINCTION` · **Type:** boolean · **Default:** `false`

Split metrics by local (client) socket address — useful in pooled deployments.

#### `korvet.redis.metrics.max-latency` {#korvet-redis-metrics-max-latency}

**Env var:** `KORVET_REDIS_METRICS_MAX_LATENCY` · **Type:** duration · **Default:** `5m`

Upper bound used when bucketing latency samples.

#### `korvet.redis.metrics.min-latency` {#korvet-redis-metrics-min-latency}

**Env var:** `KORVET_REDIS_METRICS_MIN_LATENCY` · **Type:** duration · **Default:** `1ms`

Lower bound used when bucketing latency samples.

### Pool

Connection-pool sizing for the primary Redis client.

#### `korvet.redis.pool.max-wait` {#korvet-redis-pool-max-wait}

**Env var:** `KORVET_REDIS_POOL_MAX_WAIT` · **Type:** duration · **Default:** `3s`

Maximum time a caller will block waiting to borrow a connection from a saturated pool.

#### `korvet.redis.pool.size` {#korvet-redis-pool-size}

**Env var:** `KORVET_REDIS_POOL_SIZE` · **Type:** integer · **Default:** `32`

Maximum number of pooled connections. Each in-flight per-partition produce write holds one connection for its `XADD`, so size this at least to the sum of partitions across all topics produced to concurrently, plus headroom for the metadata reads that share this pool. Too small a pool queues writes until acquisition times out and produces fail.

## Schema Registry

Embedded Confluent-compatible schema-registry HTTP endpoint.

#### `korvet.schema-registry.default-compatibility` {#korvet-schema-registry-default-compatibility}

**Env var:** `KORVET_SCHEMA_REGISTRY_DEFAULT_COMPATIBILITY` · **Type:** none, backward, backward_transitive, forward, forward_transitive, full, full_transitive · **Default:** `backward`

Default compatibility level applied to newly-created subjects.

#### `korvet.schema-registry.enabled` {#korvet-schema-registry-enabled}

**Env var:** `KORVET_SCHEMA_REGISTRY_ENABLED` · **Type:** boolean · **Default:** `true`

Enable the embedded schema-registry HTTP endpoint.

#### `korvet.schema-registry.validate-produce` {#korvet-schema-registry-validate-produce}

**Env var:** `KORVET_SCHEMA_REGISTRY_VALIDATE_PRODUCE` · **Type:** boolean · **Default:** `true`

Reject produce requests whose payload doesn't validate against the subject's latest schema.

## Storage

Storage settings split by tier: a Redis-backed local tier and optional object-store remote tier.

### Local

Redis-backed local tier settings.

#### Compression

#### `korvet.storage.local.compression.codec` {#korvet-storage-local-compression-codec}

**Env var:** `KORVET_STORAGE_LOCAL_COMPRESSION_CODEC` · **Type:** none, gzip, snappy, lz4, zstd · **Default:** `none`

Default compression codec for values at rest in Redis, applied to topics that do not pin their own `storage.compression.type` at creation. `none` stores values uncompressed and directly readable; any other codec compresses the value into its standard frame format. Compression trades codec CPU for lower Redis I/O and memory usage. Use zstd for JSON/log storage efficiency, snappy when CPU cost matters more, and none when payloads must stay directly readable from Redis or are random/already compressed. Values: none, gzip, snappy, lz4, zstd.

#### Redis

Sparse overrides for the local storage Redis client. Each unset field inherits the corresponding value from `korvet.redis`.

#### `korvet.storage.local.redis.cluster` {#korvet-storage-local-redis-cluster}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_CLUSTER` · **Type:** boolean

Treat the storage Redis target as a Redis Cluster.

#### `korvet.storage.local.redis.host` {#korvet-storage-local-redis-host}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_HOST` · **Type:** string

Storage Redis host. Ignored when `uri` is set.

#### `korvet.storage.local.redis.io-threads` {#korvet-storage-local-redis-io-threads}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_IO_THREADS` · **Type:** integer

Storage Redis Lettuce IO thread-pool size.

#### `korvet.storage.local.redis.password` {#korvet-storage-local-redis-password}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_PASSWORD` · **Type:** secret

Storage Redis password.

#### `korvet.storage.local.redis.port` {#korvet-storage-local-redis-port}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_PORT` · **Type:** integer

Storage Redis port. Ignored when `uri` is set.

#### `korvet.storage.local.redis.timeout` {#korvet-storage-local-redis-timeout}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_TIMEOUT` · **Type:** duration

Storage Redis per-command timeout.

#### `korvet.storage.local.redis.uri` {#korvet-storage-local-redis-uri}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_URI` · **Type:** string

Storage Redis URI. When set, overrides the primary Redis URI for storage traffic.

#### `korvet.storage.local.redis.username` {#korvet-storage-local-redis-username}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_USERNAME` · **Type:** string

Storage Redis ACL username.

##### Circuit Breaker

Sparse circuit-breaker overrides for the local storage Redis client.

#### `korvet.storage.local.redis.circuit-breaker.enabled` {#korvet-storage-local-redis-circuit-breaker-enabled}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_CIRCUIT_BREAKER_ENABLED` · **Type:** boolean

Enable the storage Redis stream-operation circuit breaker.

#### `korvet.storage.local.redis.circuit-breaker.log-interval` {#korvet-storage-local-redis-circuit-breaker-log-interval}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_CIRCUIT_BREAKER_LOG_INTERVAL` · **Type:** duration

Minimum interval between storage Redis breaker-state log lines.

#### `korvet.storage.local.redis.circuit-breaker.open-duration` {#korvet-storage-local-redis-circuit-breaker-open-duration}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_CIRCUIT_BREAKER_OPEN_DURATION` · **Type:** duration

How long the storage Redis circuit breaker stays open before allowing a probe call.

##### Metrics

Sparse metrics overrides for the local storage Redis client.

#### `korvet.storage.local.redis.metrics.enabled` {#korvet-storage-local-redis-metrics-enabled}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_METRICS_ENABLED` · **Type:** boolean

Enable command-latency metrics for the storage Redis client.

#### `korvet.storage.local.redis.metrics.histogram` {#korvet-storage-local-redis-metrics-histogram}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_METRICS_HISTOGRAM` · **Type:** boolean

Publish per-command histograms for the storage Redis client.

#### `korvet.storage.local.redis.metrics.local-distinction` {#korvet-storage-local-redis-metrics-local-distinction}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_METRICS_LOCAL_DISTINCTION` · **Type:** boolean

Split storage Redis metrics by local socket address.

#### `korvet.storage.local.redis.metrics.max-latency` {#korvet-storage-local-redis-metrics-max-latency}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_METRICS_MAX_LATENCY` · **Type:** duration

Upper bound used when bucketing storage Redis latency samples.

#### `korvet.storage.local.redis.metrics.min-latency` {#korvet-storage-local-redis-metrics-min-latency}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_METRICS_MIN_LATENCY` · **Type:** duration

Lower bound used when bucketing storage Redis latency samples.

##### Pool

Sparse pool overrides for the local storage Redis client.

#### `korvet.storage.local.redis.pool.max-wait` {#korvet-storage-local-redis-pool-max-wait}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_POOL_MAX_WAIT` · **Type:** duration

Maximum time a caller will block waiting to borrow a storage Redis connection.

#### `korvet.storage.local.redis.pool.size` {#korvet-storage-local-redis-pool-size}

**Env var:** `KORVET_STORAGE_LOCAL_REDIS_POOL_SIZE` · **Type:** integer

Maximum number of pooled storage Redis connections.

#### Write

#### `korvet.storage.local.write.connections` {#korvet-storage-local-write-connections}

**Env var:** `KORVET_STORAGE_LOCAL_WRITE_CONNECTIONS` · **Type:** integer · **Default:** `8`

Number of dedicated Redis connections the produce write path is sharded across, routed by stream key. Each Lettuce connection is pinned to a single event loop thread, so this bounds how many cores one broker's write path can use (issue #885).

### Remote

Optional object-store remote tier settings.

#### `korvet.storage.remote.path` {#korvet-storage-remote-path}

**Env var:** `KORVET_STORAGE_REMOTE_PATH` · **Type:** string

Object-store path for the remote Iceberg table (e.g. `s3://bucket/korvet/cold`). Absent/blank disables the remote tier — Korvet runs local-only on Redis Streams.

#### Iceberg

#### `korvet.storage.remote.iceberg.row-group-size` {#korvet-storage-remote-iceberg-row-group-size}

**Env var:** `KORVET_STORAGE_REMOTE_ICEBERG_ROW_GROUP_SIZE` · **Type:** data size · **Default:** `128MB`

Parquet row-group size for Iceberg data files written by the remote segment store. Maps to Iceberg `write.parquet.row-group-size-bytes`.

#### `korvet.storage.remote.iceberg.target-file-size` {#korvet-storage-remote-iceberg-target-file-size}

**Env var:** `KORVET_STORAGE_REMOTE_ICEBERG_TARGET_FILE_SIZE` · **Type:** data size · **Default:** `128MB`

Target size for Iceberg data files written by the remote segment store. Maps to Iceberg `write.target-file-size-bytes`.

#### Metrics

#### `korvet.storage.remote.metrics.common-tags` {#korvet-storage-remote-metrics-common-tags}

**Env var:** `KORVET_STORAGE_REMOTE_METRICS_COMMON_TAGS` · **Type:** map · **Default:** `[:]`

Extra tags attached to remote-tier Iceberg and object-storage SDK meters.

#### `korvet.storage.remote.metrics.enabled` {#korvet-storage-remote-metrics-enabled}

**Env var:** `KORVET_STORAGE_REMOTE_METRICS_ENABLED` · **Type:** boolean · **Default:** `true`

Enable Iceberg and object-storage SDK metrics for the remote tier when a Micrometer `MeterRegistry` is available.

#### S3

S3 connection settings for the remote tier object store. Only consulted when `korvet.storage.remote.path` starts with `s3://`.

#### `korvet.storage.remote.s3.access-key-id` {#korvet-storage-remote-s3-access-key-id}

**Env var:** `KORVET_STORAGE_REMOTE_S3_ACCESS_KEY_ID` · **Type:** string

Access-key id. Maps to Iceberg `s3.access-key-id`.

#### `korvet.storage.remote.s3.endpoint` {#korvet-storage-remote-s3-endpoint}

**Env var:** `KORVET_STORAGE_REMOTE_S3_ENDPOINT` · **Type:** string

Optional endpoint URL for non-AWS S3-compatible stores (e.g. MinIO). Maps to `s3.endpoint`.

#### `korvet.storage.remote.s3.path-style-access` {#korvet-storage-remote-s3-path-style-access}

**Env var:** `KORVET_STORAGE_REMOTE_S3_PATH_STYLE_ACCESS` · **Type:** boolean

Use path-style addressing instead of the default virtual-hosted-style. Maps to `s3.path-style-access`. Required for most non-AWS S3 stores.

#### `korvet.storage.remote.s3.region` {#korvet-storage-remote-s3-region}

**Env var:** `KORVET_STORAGE_REMOTE_S3_REGION` · **Type:** string

AWS region (e.g. `us-east-1`). Maps to Iceberg `client.region`.

#### `korvet.storage.remote.s3.secret-access-key` {#korvet-storage-remote-s3-secret-access-key}

**Env var:** `KORVET_STORAGE_REMOTE_S3_SECRET_ACCESS_KEY` · **Type:** secret

Secret access key. Maps to `s3.secret-access-key`.

### Worker

Storage worker: leader-locked periodic task that rolls eligible segments, offloads sealed segments, and enforces local and remote retention.

#### `korvet.storage.worker.enabled` {#korvet-storage-worker-enabled}

**Env var:** `KORVET_STORAGE_WORKER_ENABLED` · **Type:** boolean · **Default:** `true`

Enable the storage worker. The Redis leader lock ensures at most one enabled instance runs at a time across the cluster.

#### `korvet.storage.worker.lease-duration` {#korvet-storage-worker-lease-duration}

**Env var:** `KORVET_STORAGE_WORKER_LEASE_DURATION` · **Type:** duration · **Default:** `2m`

Redis leader-lock lease duration. Must exceed `tickInterval` so a slow tick does not let the lease expire mid-flight.

#### `korvet.storage.worker.tick-interval` {#korvet-storage-worker-tick-interval}

**Env var:** `KORVET_STORAGE_WORKER_TICK_INTERVAL` · **Type:** duration · **Default:** `1m`

Tick cadence for the storage worker loop.

## Ui

#### `korvet.ui.enabled` {#korvet-ui-enabled}

**Env var:** `KORVET_UI_ENABLED` · **Type:** boolean · **Default:** `true`

Whether the embedded SPA is served. Defaults to `true`.

## Topic configuration patterns

The `korvet.topics` list is order-sensitive: each entry is a glob pattern plus
optional field overrides, evaluated top-to-bottom with first-non-null-wins
semantics. Fields not set by any matching pattern fall back to the built-in
defaults. Per-topic admin-set overrides beat patterns.

The per-element fields (`korvet.topics[n].partitions`, `compression`, etc.)
live on `TopicPattern` in korvet-server and are not enumerated in the tables
above. The full list:

- `name` (required) — glob pattern matched against topic names.
- `auto-create` — whether unknown topics matching this pattern may be auto-created.
- `partitions`, `offset-sequence-bits`
- `compression`, `remote-storage-enabled`
- `retention-time`, `retention-bytes` (`*-bytes` accepts data sizes such as `10GB`)
- `local-retention-time`, `local-retention-bytes` (`*-bytes` accepts data sizes such as `512MB`)
- `segment-time`, `segment-bytes` (`*-bytes` accepts data sizes such as `64MB`)

As environment variables, list entries are addressed by index: `korvet.topics[0].retention-time` becomes `KORVET_TOPICS_0_RETENTION_TIME`, `korvet.topics[1].auto-create` becomes `KORVET_TOPICS_1_AUTO_CREATE`, and so on. Each indexed entry needs at least `KORVET_TOPICS_<n>_NAME`.

See [the configuration guide]({{< relref "/integrate/korvet/quick-start/configuration" >}}) for examples.

## Environment variables

Every property can be set via an environment variable using Spring Boot's
relaxed binding: uppercase the property name, replace `.` and `-` with `_`.
For example:

| Property | Environment variable |
|---|---|
| `korvet.broker.max-request-bytes` | `KORVET_BROKER_MAX_REQUEST_BYTES` |
| `korvet.storage.remote.path` | `KORVET_STORAGE_REMOTE_PATH` |
| `korvet.storage.worker.enabled` | `KORVET_STORAGE_WORKER_ENABLED` |

The exact env-var name for every property is listed in the tables above. For the `korvet.topics` pattern list, entries are addressed by index, e.g. `KORVET_TOPICS_0_NAME` and `KORVET_TOPICS_0_PARTITIONS`.

## Related pages

- [Getting Started — Configuration]({{< relref "/integrate/korvet/quick-start/configuration" >}})
- [Remote Storage configuration & S3 tuning]({{< relref "/integrate/korvet/storage/remote-storage" >}})
- [Deployment]({{< relref "/integrate/korvet/operations/deployment" >}})
