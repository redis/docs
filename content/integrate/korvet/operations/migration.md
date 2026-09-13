---
Title: Migrating
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Upgrade an existing Korvet 0.12.5 deployment to the current version.
linkTitle: Migrating
weight: 90
---

This page describes how to upgrade an existing Korvet 0.12.5 deployment to the current version.
The upgrade involves three kinds of changes:

- Renamed configuration options (`KORVET_SERVER_*` is now `KORVET_BROKER_*`).
- A new Redis key layout for metadata and stream storage.
- A one-time, offline data migration performed with the `korvet migrate` command.

{{< warning >}}
Only 0.12.5 is supported as a full migration source. The `migrate` command detects the source layout and refuses to run against any other version, with one exception: against a deployment that already uses the current layout it converts leftover per-partition committed-offset keys, as described in [Upgrading from 0.13–0.16](#upgrading-from-013016).
{{< /warning >}}

## Upgrading from 0.13–0.16

Two breaking changes apply when upgrading a deployment that already uses the current key layout (Korvet 0.13 through 0.16):

- **The Redis database must provide the Search capability**, alongside JSON. The broker creates a search index over committed-offset group hashes at startup and fails to start with a clear error if Search is missing. On Redis Enterprise, enable the Search module on the database before upgrading.
- **Committed offsets moved from one String per group and partition (`{namespace}:broker:commit:{topic:partition:group}`) to one Hash per group (`{namespace}:broker:commit:{group}`).** The broker does not read the old keys; run `korvet migrate --execute` once (with the broker offline) to convert them. The conversion is idempotent and re-running it converges. If the broker finds leftover old-format keys at startup it logs a prominent warning directing to the migrate command, and consumer groups appear to have no committed offsets until the conversion has run.

```console
$ korvet migrate -u redis://localhost:6379 --execute
Detected Korvet Redis layout: <current version>
Target Korvet version: <current version>
Migration executed.
MIGRATE committed offsets korvet:broker:commit: (6 offsets)
```

Committed-offset keys whose topic no longer exists cannot be converted unambiguously and are skipped with a `SKIP` line; they are ignored by the broker and can be deleted manually.

## Configuration Changes

The configuration model was reorganized between 0.12.5 and the current version.
The most visible change is that the Kafka listener moved from `korvet.server.*` to `korvet.broker.*` (environment variables: `KORVET_SERVER_*` to `KORVET_BROKER_*`), but several other areas were renamed, restructured, or removed.
Review every `korvet.*` property and environment variable in your deployment against the tables below; see [Configuration]({{< relref "/integrate/korvet/reference/configuration" >}}) for the full current reference with defaults.

The tables list properties in their dotted form. The environment-variable form follows Spring Boot's relaxed binding in both versions: uppercase the property name and replace `.` and `-` with `_`. For example, `korvet.broker.max-request-bytes` is set with `KORVET_BROKER_MAX_REQUEST_BYTES`, and the same rule yields the 0.12.5 name on the left-hand side of each row. Sections below call out the cases where the resulting environment variable is not a mechanical rename.

### Broker Listener (`korvet.server.*` -> `korvet.broker.*`)

| 0.12.5 | Current | Notes |
|---|---|---|
| `korvet.server.keyspace` | `korvet.namespace` | Moved to the root `korvet` prefix. Default `korvet` unchanged. Env var: `KORVET_SERVER_KEYSPACE` -> `KORVET_NAMESPACE`. |
| `korvet.server.broker-id` | `korvet.broker.id` | |
| `korvet.server.host` | `korvet.broker.host` | |
| `korvet.server.port` | `korvet.broker.port` | |
| `korvet.server.advertised-host` | `korvet.broker.advertised-host` | |
| `korvet.server.advertised-port` | `korvet.broker.advertised-port` | |
| `korvet.server.boss-threads` | `korvet.broker.boss-threads` | |
| `korvet.server.worker-threads` | `korvet.broker.worker-threads` | |
| `korvet.server.max-request-size` | `korvet.broker.max-request-bytes` | Renamed. |
| `korvet.server.partition-max-bytes` | `korvet.broker.fetch-partition-max-bytes` | Renamed. |
| `korvet.server.fetch-max-wait` | `korvet.broker.fetch-max-wait` | |
| `korvet.server.max-pending-bytes` | `korvet.broker.max-pending-bytes` | |
| `korvet.server.resume-pending-bytes` | `korvet.broker.resume-pending-bytes` | |
| `korvet.server.rebalance-delay` | `korvet.broker.rebalance-delay` | |
| `korvet.server.tls` | `korvet.broker.tls` | |
| `korvet.server.cert-file` | `korvet.broker.cert-file` | |
| `korvet.server.key-file` | `korvet.broker.key-file` | |
| `korvet.server.key-password` | `korvet.broker.key-password` | |
| `korvet.server.trust-cert-file` | `korvet.broker.trust-cert-file` | |
| `korvet.server.client-auth-required` | `korvet.broker.client-auth-required` | |
| `korvet.server.bucket-index-search-limit` | *removed* | No longer user-configurable. |

For environment variables, the mapping is mechanical: `KORVET_SERVER_MAX_REQUEST_SIZE` becomes `KORVET_BROKER_MAX_REQUEST_BYTES`, `KORVET_SERVER_ADVERTISED_HOST` becomes `KORVET_BROKER_ADVERTISED_HOST`, and so on.

### Redis Connection (`korvet.redis.*`)

| 0.12.5 | Current | Notes |
|---|---|---|
| `korvet.redis.uri`, `host`, `port`, `username`, `password`, `cluster` | unchanged | |
| `korvet.redis.timeout` | `korvet.redis.timeout` | Now has an explicit default of `1m`. |
| `korvet.redis.io-thread-pool-size` | `korvet.redis.io-threads` | Renamed. |
| `korvet.redis.pool-size` | `korvet.redis.pool.size` | Now nested under `pool`. |
| `korvet.redis.pool-max-wait` | `korvet.redis.pool.max-wait` | Now nested under `pool`. Default changed from `10s` to `3s`. |
| `korvet.redis.metadata-pool-size` | *removed* | The per-purpose connection pools (metadata, archival source, committed offsets) were consolidated into the single `korvet.redis.pool`. A separate Redis client for message storage can be configured with `korvet.storage.local.redis.*` instead. |
| `korvet.redis.archival-source-pool-size` | *removed* | |
| `korvet.redis.committed-offset-pool-size` | *removed* | |
| `korvet.redis.archival-source-pool-max-wait` | *removed* | |
| `korvet.redis.committed-offset-pool-max-wait` | *removed* | |
| `korvet.redis.metrics.*` | unchanged | |

Note that because `.` and `-` both map to `_`, the environment variables for the pool settings are unchanged despite the nesting: `KORVET_REDIS_POOL_SIZE` and `KORVET_REDIS_POOL_MAX_WAIT` keep working. The renamed I/O thread setting becomes `KORVET_REDIS_IO_THREAD_POOL_SIZE` -> `KORVET_REDIS_IO_THREADS`.

### Topic Configuration (`korvet.topics.*`)

In 0.12.5, `korvet.topics.*` was a single, flat set of defaults applied to all topics.
It is now a **list** of glob patterns evaluated first-match-wins, with the same flat per-topic setting names inside each list entry.
A flat 0.12.5 default block translates to one catch-all `name: "*"` entry:

```yaml
# 0.12.5
korvet:
  topics:
    auto-create: true
    partitions: 3
    retention-time: 7d
    retention-bytes: -1

# Current
korvet:
  topics:
    - name: "*"
      auto-create: true
      partitions: 3
      retention-time: 7d
      retention-bytes: -1
```

| 0.12.5 | Current | Notes |
|---|---|---|
| `korvet.topics.auto-create` | `korvet.topics[*].auto-create` | Now per-pattern. |
| `korvet.topics.partitions` | `korvet.topics[*].partitions` | |
| `korvet.topics.compression` | `korvet.topics[*].compression` | |
| `korvet.topics.offset-sequence-bits` | `korvet.topics[*].offset-sequence-bits` | |
| `korvet.topics.retention-time` | `korvet.topics[*].retention-time` | Now per-pattern. |
| `korvet.topics.retention-bytes` | `korvet.topics[*].retention-bytes` | Now per-pattern. |
| `korvet.topics.local-retention-time` | `korvet.topics[*].local-retention-time` | Now per-pattern. |
| `korvet.topics.local-retention-bytes` | `korvet.topics[*].local-retention-bytes` | Now per-pattern. |
| `korvet.topics.remote-storage-enabled` | `korvet.topics[*].remote-storage-enabled` | |
| `korvet.topics.bucket-duration` | `korvet.topics[*].segment-time` | Buckets were replaced by segments; a `segment-bytes` size threshold is also available. |
| `korvet.topics.storage-compression` | *removed* | At-rest value compression is now configured server-wide with `korvet.storage.local.compression.codec` (default `none`). This codec must match the `--storage-compression` option used during migration (see below). |
| `korvet.topics.value-type` | *removed* | The legacy RAW/JSON/AUTO value layout no longer exists; all records use the new envelope format. |
| `korvet.topics.average-message-bytes` | *removed* | No longer user-configurable; average message size is measured at runtime. |
| `korvet.topics.approximate-trimming` | *removed* | |

In environment-variable form, the list entries are addressed by index, and each entry needs a `NAME`. The flat 0.12.5 variables translate to a `_0_` catch-all entry:

```console
# 0.12.5
export KORVET_TOPICS_AUTO_CREATE=true
export KORVET_TOPICS_PARTITIONS=3
export KORVET_TOPICS_RETENTION_TIME=7d
export KORVET_TOPICS_RETENTION_BYTES=-1

# Current
export KORVET_TOPICS_0_NAME='*'
export KORVET_TOPICS_0_AUTO_CREATE=true
export KORVET_TOPICS_0_PARTITIONS=3
export KORVET_TOPICS_0_RETENTION_TIME=7d
export KORVET_TOPICS_0_RETENTION_BYTES=-1
```

### Storage (`korvet.storage.*`)

In 0.12.5 the only storage configuration was the remote (cold) tier under `korvet.storage.remote.*`, backed by Delta Lake.
The current version splits storage configuration into three areas:

- `korvet.storage.local.*` — *new*: the Redis (hot) tier, including the at-rest compression codec and an optional dedicated Redis client for message storage (see [New Configuration Areas](#new-configuration-areas)).
- `korvet.storage.worker.*` — *new*: the background worker that handles retention and segment tiering, replacing the 0.12.5 archiver.
- `korvet.storage.remote.*` — the cold tier, which moved from Delta Lake to Apache Iceberg:

| 0.12.5 | Current | Notes |
|---|---|---|
| `korvet.storage.remote.path` | `korvet.storage.remote.path` | Unchanged, but now points at an Iceberg warehouse. |
| `korvet.storage.remote.s3.region`, `endpoint`, `access-key-id`, `secret-access-key` | unchanged | A new `path-style-access` option is available for S3-compatible stores such as MinIO. |
| `korvet.storage.remote.s3.credentials.type` | *removed* | Credential resolution is now automatic. |
| `korvet.storage.remote.archiver.*` | *removed* | Archiver internals are no longer exposed; the storage worker (`korvet.storage.worker.*`) manages tiering. |
| `korvet.storage.remote.writer.*` | *removed* | Replaced by Iceberg writer settings `korvet.storage.remote.iceberg.target-file-size` and `row-group-size`. |
| `korvet.storage.remote.index.*` | *removed* | The cold index is no longer user-configurable. |

### New Configuration Areas

These did not exist in 0.12.5; defaults are generally sensible, but review them as part of the upgrade:

- `korvet.broker.enabled`, `korvet.broker.response-queue-timeout`, `korvet.broker.produce-timeout`, `korvet.broker.rebalance-threads` — new listener tuning options.
- `korvet.broker.sasl.*` — SASL authentication (PLAIN, SCRAM-SHA-256).
- `korvet.broker.metrics.*` — consumer-offset gauge publishing.
- `korvet.redis.circuit-breaker.*` — circuit breaker for stream operations (enabled by default).
- `korvet.storage.local.compression.codec` — server-wide at-rest compression codec (default `none`).
- `korvet.storage.local.redis.*` — optional separate Redis client/pool for message storage.
- `korvet.storage.worker.*` — background worker for retention and segment management.
- `korvet.schema-registry.*` — embedded schema registry.
- `korvet.admin.*` — Admin API bootstrap credentials. The defaults are `admin`/`admin`; **change these in production**.

## Redis Key Layout Changes

The current version uses a different Redis key layout than 0.12.5, for both metadata and message storage.
This is why a data migration is required: a current server cannot read 0.12.5 keys directly.

### Metadata Keys

| Area | 0.12.5 | Current |
|---|---|---|
| Topic registry | `{namespace}:topics` (Set) + one `{namespace}:topic:{topic}` Hash per topic + `{namespace}:topic-ids` Hash | `{namespace}:topics` (single JSON document containing all topics and their config) |
| Broker registry | `{namespace}:brokers` (Set) + one `{namespace}:broker:{id}` Hash per broker | `{namespace}:broker:nodes` (single JSON document) |
| Credentials | `{namespace}:credentials:{username}` (Hash, fields `passwordHash`, `serverKey`, `tenantId`) | `{namespace}:broker:credentials:{username}` (Hash, fields renamed to `password_hash`, `server_key`, `tenant_id`) |
| Committed offsets | `{namespace}:commit:{namespace}:stream:{topic}:{partition}:{group}` (String) | `{namespace}:broker:commit:{group}` (one Hash per consumer group: a `group` field holding the group ID plus one `{topic}:{partition}` field per committed offset), listed through the `{namespace}:broker:commit-idx` search index |

### Stream Storage Keys

Messages are still stored in Redis Streams, but both the key names and the per-entry field layout changed.

**Keys:**

- 0.12.5: `{namespace}:stream:{topic}:{partition}`
- Current: `{namespace}:storage:local:{topic}:{partition}`

**Stream entry fields:**

In 0.12.5, each record was stored as multiple stream fields: the record key under `__key`, the value either under `__value` (raw) or flattened into one field per top-level JSON attribute, and each header under `__header.<name>`.

The current format stores each record as a fixed envelope:

| Field | Content |
|---|---|
| `value` | Record value bytes, stored with the configured at-rest codec (`none` by default, i.e. uncompressed) |
| `key` | Record key bytes, verbatim |
| `headers` | All record headers encoded into one self-delimiting blob |
| `timestamp` | Kafka record timestamp as a decimal string |

Stream entry IDs (and therefore Kafka offsets) are preserved by the migration.

{{< note >}}
0.12.5 did not store the producer's record timestamp, so migrated records carry no timestamp (`-1`) rather than a fabricated one.
{{< /note >}}

## The `korvet migrate` Command

The `migrate` command reads a 0.12.5 keyspace and rewrites it in place into the current layout.
It migrates, in order:

1. **Topic registry** — converts the topic Set and per-topic Hashes into the new JSON document, and pins each topic's `storageCompressionType` to the codec used during migration.
2. **Broker registry** — converts the broker Set and per-broker Hashes into the `broker:nodes` JSON document.
3. **Credentials** — moves each credential Hash to the new key and renames its fields.
4. **Committed offsets** — rewrites each per-partition committed-offset String into the owning group's Hash, preserving values.
5. **Local streams** — rewrites every `{topic}:{partition}` stream into the new location, converting each entry from the legacy field layout to the new envelope format (decompressing legacy values where needed and re-compressing with the chosen codec), preserving stream entry IDs.

By default the command is a **dry run**: it prints what it would migrate without writing anything.
Pass `--execute` to apply the migration.
Successfully migrated source keys are deleted unless `--keep-source` is given.

### Options

| Option | Default | Description |
|---|---|---|
| `-u`, `--uri` | *(required)* | Redis connection URI of the deployment to migrate. |
| `--namespace` | `korvet` | Korvet keyspace/namespace used by the legacy deployment. |
| `--execute` | off | Apply the migration. Without this option the command only prints a dry run. |
| `--replace` | off | Replace existing destination keys. Without it, the command skips any area whose destination key already exists (useful when re-running after a partial migration). |
| `--keep-source` | off | Keep legacy source keys after successful migration. By default, migrated source keys are deleted. |
| `--storage-compression` | `none` | At-rest codec to write migrated stream values with. Must match the target server's `korvet.storage.local.compression.codec`. Values: `none`, `gzip`, `snappy`, `lz4`, `zstd`. |
| `--transfers` | `1` | Number of streams (topic-partitions) to migrate in parallel. Each transfer rewrites one stream, in order, on its own Redis connection. Increase this to speed up migrations with many topic-partitions. |

The command also accepts the standard Redis connection options (TLS, credentials, timeouts) shared by all `korvet` commands; run `korvet migrate --help` for the full list.

### Output and Exit Code

The command prints the detected source layout, the target version, and one line per migrated (`MIGRATE`), skipped (`SKIP`), or failed (`ERROR`) item:

```console
$ korvet migrate -u redis://localhost:6379 --execute
Detected Korvet Redis layout: 0.12.5
Target Korvet version: 0.19
Migration executed.
MIGRATE topic registry korvet:topics (3 topics)
MIGRATE broker registry korvet:broker:nodes (1 brokers)
MIGRATE credentials korvet:broker:credentials: (2 credentials)
MIGRATE committed offsets korvet:broker:commit: (6 offsets)
MIGRATE local streams korvet:storage:local: (9 streams)
```

The exit code is `0` on success (including dry runs) and `1` if any error was reported.

## Step-by-Step Migration

The migration must be performed offline: no 0.12.5 broker may be writing to Redis while data is being rewritten, and the new broker must not start until the migration has completed.

1. **Stop producers and consumers.** Drain or pause all Kafka clients so no data is lost while the broker is down.

2. **Shut down the 0.12.5 broker(s).** Stop every Korvet server process or container that uses this Redis database.

3. **Back up the Redis database.** Take an RDB snapshot (or use your usual backup mechanism) so you can roll back if needed:

    ```console
    redis-cli -u redis://localhost:6379 BGSAVE
    ```

4. **Run a dry run.** Inspect what will be migrated without changing anything:

    ```console
    korvet migrate -u redis://localhost:6379
    ```

    Review the `MIGRATE`/`SKIP` lines. If you used a custom namespace, pass `--namespace <name>`.

5. **Execute the migration:**

    ```console
    korvet migrate -u redis://localhost:6379 --execute
    ```

    For large deployments with many topic-partitions, parallelize stream migration:

    ```console
    korvet migrate -u redis://localhost:6379 --execute --transfers 8
    ```

    If you want to keep the legacy keys around until you have verified the new deployment, add `--keep-source` (note that this temporarily doubles the memory used by stream data).

    Verify that the command exits with code `0` and reports no `ERROR` lines. If it fails partway, fix the cause and re-run with `--execute --replace` to overwrite partially written destinations.

6. **Update the broker configuration.** Apply all renames from [Configuration Changes](#configuration-changes) above: `korvet.server.*` to `korvet.broker.*` (including `korvet.server.keyspace` to `korvet.namespace`), the `korvet.redis` pool restructure, and the flat `korvet.topics.*` block to a pattern list. Remove any settings listed as removed. If you passed a non-default `--storage-compression`, set `korvet.storage.local.compression.codec` to the same value.

7. **Start the new broker version.** Deploy and start the current Korvet release against the same Redis database.

8. **Verify.** Check that the broker starts cleanly, then validate with a Kafka client: list topics, consume existing messages from an old topic, produce and consume a new message, and confirm consumer groups resume from their committed offsets.

9. **Resume traffic.** Re-enable producers and consumers. Once you are satisfied, you can delete the legacy keys if you used `--keep-source`, and remove the backup per your retention policy.

## Rollback

If verification fails, stop the new broker, restore the Redis backup taken in step 3, and restart the 0.12.5 deployment.
Because the migration runs offline, no new data is produced between backup and verification, so the restore is lossless.
