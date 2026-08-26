---
Title: Resilience & Chaos Testing
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: How Korvet behaves under infrastructure failures, with the automated chaos
  test suite that validates this behaviour and an operator runbook.
linkTitle: Resilience & Chaos Testing
weight: 70
---

How Korvet behaves under infrastructure failures, the automated chaos
test suite that validates this behaviour, and a runbook for operators responding to
common failure scenarios.

## Resilience model

Korvet is a stateless broker: all durable state (topics, messages, consumer offsets,
producer IDs) lives in Redis. A Korvet process holds only in-flight request state and
cached metadata. Two consequences follow:

- **Broker restarts are cheap and lossless.** A restarted broker rebuilds its view from
  Redis, so any record that was acknowledged before the restart remains readable.
- **Korvet's availability tracks Redis.** When Redis is unreachable, Korvet cannot durably
  write or read, so it fails affected requests rather than acknowledging data it cannot
  persist. This is by design: an acknowledgement always means the data is in Redis.

## Failure modes

| Failure | Broker behaviour | Recovery |
|---|---|---|
| Redis connection dropped | In-flight and new produce/fetch requests fail; the broker does not acknowledge writes it cannot persist. No partial or phantom acknowledgements. | Lettuce auto-reconnects when Redis returns. The next request succeeds with no operator action. Acknowledged data is intact. |
| Network latency to Redis | Request latency increases roughly in proportion to the added round-trip cost; throughput drops. No errors while latency stays under client timeouts. | Latency returns to normal when the network recovers. No operator action. |
| Network partition from Redis | Equivalent to a connection drop for the duration of the partition: affected requests fail. | Broker reconnects automatically when the partition heals and resumes serving traffic. |
| Broker (pod) restart | Connected clients see their connection drop and reconnect to the broker (or another broker behind the load balancer), retrying in-flight requests. | Restarted broker serves all data acknowledged before the restart. No data loss. |
| Remote storage (S3) outage during tiering | Local (Redis) tier is unaffected: produce and recent-data fetch continue. Offload of cold segments retries with backoff; reads of already-offloaded segments fail until S3 returns. | Offload resumes when S3 recovers; no data is lost because segments are only deleted from the local tier after a successful offload. |

## Automated chaos test suite

`ChaosEngineeringIntegrationTest` (module `korvet-test`) injects failures into the network
path between the broker and Redis using
[Toxiproxy](https://github.com/Shopify/toxiproxy). Redis runs on a private Docker network and
all broker traffic is routed through Toxiproxy, so a test can sever the connection, add
latency, or simulate a partition while the broker keeps running. Redis state is never
destroyed, which lets every scenario assert that acknowledged data survives the failure.

| Scenario | Assertion |
|---|---|
| Redis connection cut during produce | Sends during the outage fail fast (graceful degradation); every acknowledged record stays readable; sends after recovery succeed. |
| Redis connection cut during consume | The consumer does not crash — polls return no records during the outage — and reads every record after recovery. |
| Latency injection | Added round-trip latency is observable on a produce cycle; the broker returns to normal once the latency is removed. |
| Network partition then heal | The broker reconnects after the partition heals and serves a full produce/consume cycle. |
| Broker restart | Data acknowledged before the restart is still readable from a freshly started broker. |

The chaos tests are tagged `@Tag("chaos")`. Because they sleep through simulated outages they
are slower than regular integration tests, so they are excluded from the default
`integrationTest` suite and run in a dedicated `chaosTest` task (and its own CI workflow).

Run the suite:

```bash
./gradlew chaosTest
```

The suite requires a Docker daemon (Testcontainers pulls the Redis and Toxiproxy images).

### Scenarios validated outside this suite

Two scenarios from the resilience story need an environment Testcontainers cannot provide and
are exercised by end-to-end suites instead:

- **S3 503 errors during tiering** — covered by the remote-storage integration tests against a
  MinIO/S3 endpoint (`korvet-storage-tiered-iceberg`). The offload path retries on transient
  5xx responses and only removes a local segment after a confirmed offload.
- **Kubernetes pod eviction** — covered by deploying to a cluster and deleting the broker pod
  while a client produces. Because state is in Redis, the client reconnects (to the rescheduled
  pod or another replica) and no acknowledged data is lost.

## Runbook

### Redis is unreachable

**Symptoms**: produce/fetch requests fail or time out; broker logs show Lettuce reconnect
attempts; `redis_client` metrics show connection errors.

1. Confirm Redis health directly: `redis-cli -h <host> -p <port> ping`.
2. Check network reachability from the broker host to Redis (firewall, security groups, DNS).
3. If Redis is up and reachable, the broker reconnects automatically — no restart needed.
   Verify recovery by producing a test record.
4. If Redis is down, restore it. Korvet resumes serving as soon as the connection is
   re-established. Acknowledged data is intact.

### Elevated produce/fetch latency

**Symptoms**: client-observed latency rises; broker-to-Redis round-trip metrics increase.

1. Inspect network latency between the broker and Redis.
2. Check Redis-side load (slow commands, CPU, memory pressure).
3. Latency clears on its own once the network or Redis recovers; no Korvet action is required.
   If it persists, scale Redis or move the broker closer to Redis (same AZ/region).

### Network partition between broker and Redis

**Symptoms**: sustained request failures with no Redis-side errors; broker cannot reach Redis.

1. Treat as "Redis is unreachable" above — the failure mode and recovery are identical.
2. The broker reconnects automatically when the partition heals; confirm with a test produce.

### Broker (pod) restart

**Symptoms**: clients briefly disconnect and reconnect; in-flight requests retry.

1. No data action required — durable state is in Redis.
2. After restart, verify the broker is healthy (`/actuator/health`) and serving by producing
   and consuming a test record.
3. For zero-disruption restarts, run multiple replicas behind a load balancer so clients
   fail over while one pod restarts (see [Kubernetes]({{< relref "/integrate/korvet/operations/kubernetes" >}})).

### Remote storage (S3) outage

**Symptoms**: cold-segment offload stalls; reads of already-offloaded (cold) data fail; recent
data still produces and consumes normally.

1. Confirm the S3 endpoint/credentials and bucket reachability.
2. Recent data on the local (Redis) tier is unaffected — produce and recent reads continue.
3. Offload resumes automatically when S3 recovers. No data is lost: segments are removed from
   the local tier only after a successful offload.
4. Watch the storage-worker metrics for offload backlog draining once S3 is healthy.
