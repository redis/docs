---
Title: Use an external collector
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Send change events to RDI from your own collector for a proof of concept.
group: di
linkTitle: External collectors
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

External collectors are primarily intended for proof of concept (PoC) projects.
We do not recommend this approach for production deployments. Use a collector
managed by Redis Data Integration (RDI) when one is available for your source.

An external collector is a program that you provide and manage. It writes change
events to Redis streams in the RDI database. RDI processes these events, applies
your transformation jobs, and writes the results to the target Redis database.
RDI does not create or manage collector resources for a source with `type: external`.

This guide covers self-managed RDI 2.0 on
[virtual machines (VMs)](/content/integrate/redis-data-integration/installation/install-vm.md)
and [Kubernetes](/content/integrate/redis-data-integration/installation/install-k8s.md),
using the Flink processor. It uses a new source named `custom`.

## When to use an external collector

Use an external collector to evaluate a source without an RDI-managed connector,
reuse an existing event feed in a PoC, or demonstrate transformations with sample
changes. You can choose one of these approaches:

- **Write a custom program:** Convert source changes to the event format described
  in [Write compatible events](#write-compatible-events). The Python example in
  this guide uses this approach.
- **Run a collector separately:** Configure a collector with a compatible Redis
  stream sink to produce the same stream names and event format. RDI does not
  configure the collector or its sink for you.
- **Adapt an existing event feed:** Run an adapter that reads your existing event
  system and writes compatible events to the RDI database. The adapter must handle
  acknowledgement, retries, and source positions.

All three approaches require the same input contract. Setting `type: external`
does not make RDI read directly from an arbitrary broker, endpoint, or Redis key.

## Why we do not recommend this for production

Compared with an RDI-managed collector, an external collector adds responsibilities
that you must implement and maintain:

- **Separate lifecycle management:** RDI does not deploy, restart, upgrade, or fail
  over your collector. You must operate it separately and coordinate it with the
  pipeline.
- **Recovery requires your implementation:** You must manage source positions,
  reconnects, replay, and full snapshots. An RDI reset cannot instruct your external
  collector to rebuild the target.
- **More ways to lose or misapply changes:** Your collector must handle durable
  capture, retries, duplicate delivery, and event ordering. Writing a valid event
  into a Redis stream does not establish these guarantees for the full integration.
- **Backpressure requires coordination:** When processing stops or the target slows
  down, incoming events can accumulate in the RDI database. Your writer needs its
  own buffering, throttling, and recovery behavior.
- **Less integrated visibility and control:** RDI cannot report the external
  collector's health or provide its managed collector logs and metrics. You need
  separate monitoring to detect capture failures and missing events.
- **Event compatibility is your responsibility:** Your integration must preserve
  keys, operation codes, source metadata, before/after images, and data type
  representation. Schema changes and upgrades require compatibility testing.
- **Higher operating cost:** The custom integration needs ongoing engineering,
  testing, incident handling, and maintenance alongside RDI.

A successful PoC demonstrates the tested data path. It does not qualify the
integration's production reliability.

## Write compatible events

Write events to the **RDI database**, which buffers changes for processing. This is
separate from the **target Redis database**, which contains the transformed data.
Connect to the RDI database's Redis endpoint, not the RDI management application
programming interface (API) endpoint.

For the new source in this example, use the stream
`data:{rdi}:custom.public.products`. The general naming pattern is
`data:{rdi}:<source-name>.<qualified-table-name>`. See
[Name your sources](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#name-your-sources)
for source naming rules and table qualification by database type. Keep the `{rdi}`
hash tag in the stream name.

Each stream entry has two fields, `key` and `value`. Each field contains a
string encoded as JavaScript Object Notation (JSON) in the Debezium change event
format. Do not write individual row columns as stream fields.

| Field | Content | Example requirements |
| :-- | :-- | :-- |
| `key` | JSON object containing the row's primary key. | Use a stable key, such as `{"id": 2}`, for all changes to the same row. |
| `value.op` | Operation code: `r` (snapshot/read), `c` (create), `u` (update), or `d` (delete). | Use `d` for a deletion rather than an empty value or a tombstone. |
| `value.source` | Source metadata used to route records to jobs. | Set `name: custom`, `db: inventory`, `schema: public`, and `table: products` for this example. |
| `value.before` | Row before the change, or `null` for a read or create. | Supply the old row for updates and deletes in this example. |
| `value.after` | Row after the change, or `null` for a delete. | Supply the complete row for reads, creates, and updates in this example. |

Match `value.source.name` to the source name in `config.yaml` and the job's
`server_name`. The stream name and event metadata must describe the same source and
table. Metadata does not configure a connection to the original database.

The PoC writer uses these row images for each operation:

| Operation | `key` | `before` | `after` |
| :-- | :-- | :-- | :-- |
| Read (`r`) | `{"id": 1}` | `null` | `{"id": 1, "name": "Sample", "quantity": 10}` |
| Create (`c`) | `{"id": 2}` | `null` | `{"id": 2, "name": "Widget", "quantity": 20}` |
| Update (`u`) | `{"id": 2}` | `{"id": 2, "name": "Widget", "quantity": 20}` | `{"id": 2, "name": "Widget", "quantity": 25}` |
| Delete (`d`) | `{"id": 2}` | `{"id": 2, "name": "Widget", "quantity": 25}` | `null` |

For example, a create entry contains these JSON strings:

```json
{"id": 2}
```

```json
{
  "op": "c",
  "source": {
    "name": "custom",
    "db": "inventory",
    "schema": "public",
    "table": "products"
  },
  "before": null,
  "after": {"id": 2, "name": "Widget", "quantity": 20}
}
```

The Flink processor also accepts Debezium JSON with a `schema` and `payload`
wrapper in each field. Schema metadata controls conversions for logical types,
such as decimals and timestamps. The schema-free example uses JSON numbers and
strings without those conversions. See
[Supported data types](/content/integrate/redis-data-integration/data-pipelines/supported-types.md)
before adapting values from an existing collector.

The `row_format` property in a job controls the data available to transformations;
it does not change the input stream contract. Sending an `r` event writes a
snapshot row, but does not ask RDI to take a source snapshot or prove that a full
snapshot is complete.

> [!NOTE]
> Sources retained from older installations can have different stream names and
> use `rdi` as their event source name. See
> [Existing names are kept after an upgrade](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#existing-names-are-kept-after-an-upgrade).
> The classic processor also accepts a legacy layout with the JSON key itself as
> the stream field name. Use separate `key` and `value` fields with the Flink
> processor.

## Set up a PoC

Before you start, [install RDI 2.0](/content/integrate/redis-data-integration/installation/_index.md)
and connect the [`redis-di` command-line interface (CLI)](/content/integrate/redis-data-integration/reference/cli/redis-di.md)
to its management API. Use an isolated installation and target database for this
example. You also need Python 3, `redis-cli`, and network access to the RDI database
from the writer.

1. Obtain the RDI database's Redis host, port, and credentials from your
   installation configuration. Give the writer permission to run `XADD` on the
   example stream. Store its credentials outside `config.yaml`: RDI does not
   manage them as source secrets for an external collector.

1. Create a pipeline directory with a `jobs` subdirectory. Save this as
   `config.yaml`, replacing the target placeholders:

   ```yaml
   sources:
     custom:
       type: external

   targets:
     target:
       connection:
         type: redis
         host: <target-redis-host>
         port: <target-redis-port>
         user: ${TARGET_DB_USERNAME}
         password: ${TARGET_DB_PASSWORD}

   processors:
     type: flink
     target_data_type: hash
     error_handling: dlq
   ```

   Keep only `type: external` in this source entry. Configure source selection,
   capture, logging, and snapshots in your writer. For a target connection using
   Transport Layer Security (TLS), add the certificate secret references described
   in [Targets](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#targets).

1. Save this job as `jobs/products.yaml`. It adds an `origin` field and writes
   hashes with keys such as `product:2`:

   ```yaml
   name: external-products
   source:
     server_name: custom
     db: inventory
     schema: public
     table: products
   transform:
     - uses: add_field
       with:
         field: origin
         expression: "'external-poc'"
         language: jmespath
   output:
     - uses: redis.write
       with:
         data_type: hash
         key:
           expression: "concat(['product:', to_string(id)])"
           language: jmespath
   ```

   This job uses the default payload-only row format: transformations read `after`
   for reads, creates, and updates, and `before` for deletes. Include `id` in both
   row images so the job can compute the same target key for a deletion.

1. Set the target's `USERNAME` and `PASSWORD` secrets with `--db target`, then
   [deploy the pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md).
   Configure any target TLS secrets before deployment.

   ```bash
   redis-di deploy --dir '<pipeline-directory>'
   ```

1. Install the Python client:

   ```bash
   python3 -m pip install redis
   ```

1. Set the writer's environment variables. Replace the placeholders before
   running these commands:

   ```bash
   export RDI_REDIS_HOST='<rdi-database-host>'
   export RDI_REDIS_PORT='<rdi-database-port>'
   export RDI_REDIS_USERNAME='<writer-username>'
   export RDI_REDIS_PASSWORD='<writer-password>'
   export RDI_REDIS_TLS=true
   export RDI_REDIS_CA_CERT='<path-to-ca-certificate>'
   ```

   Set `RDI_REDIS_TLS=false` only if your isolated RDI database does not use TLS.
   For mutual TLS (mTLS), also set `RDI_REDIS_CLIENT_CERT` and
   `RDI_REDIS_CLIENT_KEY` to the certificate and private key paths.

1. Save this PoC writer as `write_external_events.py`. It emits one event per run
   and prints the assigned stream entry ID. It does not implement durable capture,
   retries, source checkpoints, or backpressure:

   ```python
   import argparse
   import json
   import os

   import redis


   def main():
       parser = argparse.ArgumentParser()
       parser.add_argument("operation", choices=["read", "create", "update", "delete"])
       args = parser.parse_args()

       created = {"id": 2, "name": "Widget", "quantity": 20}
       updated = {**created, "quantity": 25}
       events = {
           "read": ("r", None, {"id": 1, "name": "Sample", "quantity": 10}),
           "create": ("c", None, created),
           "update": ("u", created, updated),
           "delete": ("d", updated, None),
       }
       op, before, after = events[args.operation]
       row = before if op == "d" else after
       value = {
           "op": op,
           "source": {
               "name": "custom",
               "db": "inventory",
               "schema": "public",
               "table": "products",
           },
           "before": before,
           "after": after,
       }

       options = {
           "host": os.environ["RDI_REDIS_HOST"],
           "port": int(os.environ["RDI_REDIS_PORT"]),
           "username": os.getenv("RDI_REDIS_USERNAME") or None,
           "password": os.environ["RDI_REDIS_PASSWORD"],
           "decode_responses": True,
           "socket_connect_timeout": 5,
           "socket_timeout": 5,
       }
       if os.environ["RDI_REDIS_TLS"].lower() == "true":
           options.update(
               ssl=True,
               ssl_cert_reqs="required",
               ssl_check_hostname=True,
               ssl_ca_certs=os.environ["RDI_REDIS_CA_CERT"],
           )
           cert = os.getenv("RDI_REDIS_CLIENT_CERT")
           key = os.getenv("RDI_REDIS_CLIENT_KEY")
           if bool(cert) != bool(key):
               parser.error("Set both RDI_REDIS_CLIENT_CERT and RDI_REDIS_CLIENT_KEY")
           if cert:
               options.update(ssl_certfile=cert, ssl_keyfile=key)

       with redis.Redis(**options) as client:
           entry_id = client.xadd(
               "data:{rdi}:custom.public.products",
               {"key": json.dumps({"id": row["id"]}), "value": json.dumps(value)},
           )
           print(entry_id)


   if __name__ == "__main__":
       main()
   ```

## Verify the target results

Connect `redis-cli` to the **target database** using its host, port, and credentials.
For a TLS connection, also pass `--tls --cacert '<path-to-target-ca-certificate>'`.
The commands use `--askpass` to prompt for the target password.

1. Send a snapshot/read event:

   ```bash
   python3 write_external_events.py read
   redis-cli -h '<target-redis-host>' -p '<target-redis-port>' --user '<target-username>' --askpass HGETALL product:1
   ```

   Wait for the hash to contain `name: Sample`, `quantity: 10`, and
   `origin: external-poc`.

1. Send a create event:

   ```bash
   python3 write_external_events.py create
   redis-cli -h '<target-redis-host>' -p '<target-redis-port>' --user '<target-username>' --askpass HGETALL product:2
   ```

   Wait for `quantity: 20` and `origin: external-poc`. The `origin` field confirms
   that the transformation job ran.

1. Send an update event:

   ```bash
   python3 write_external_events.py update
   redis-cli -h '<target-redis-host>' -p '<target-redis-port>' --user '<target-username>' --askpass HGET product:2 quantity
   ```

   Wait for the value `25`.

1. Send a delete event:

   ```bash
   python3 write_external_events.py delete
   redis-cli -h '<target-redis-host>' -p '<target-redis-port>' --user '<target-username>' --askpass EXISTS product:2
   ```

   Wait for the result `0`. The snapshot row at `product:1` remains.

An entry ID confirms that Redis accepted the input. Verify target data separately.
Use [Rejected records](/content/integrate/redis-data-integration/data-pipelines/rejected-records.md)
to investigate processing failures.

## Operate an external source

| Operation or feature | RDI-managed collector | External collector |
| :-- | :-- | :-- |
| `redis-di scaffold` | Generates configuration for a supported database type. | No external collector template; author the configuration and jobs manually. |
| `redis-di start`, `stop`, or `reset` with `--source` | Controls the selected source. | Rejects the request because RDI has no collector to control. |
| Whole-pipeline `redis-di start` or `stop` | Starts or stops the managed data plane. | Controls the processor but cannot start or stop your writer. |
| Whole-pipeline `redis-di reset` | Clears RDI state and lets managed collectors take new snapshots. | Resets managed processing state; you must coordinate input stream cleanup, replay, and snapshots yourself. |
| Source connection checks and schema, table, or column discovery | Available for source types with the Collector API. | No managed source connection or database metadata discovery. |
| Database-backed dataset selection and previews | Use the managed source connection. | No source database connection for these features; provide sample events and verify target results. |
| Collector logs, connection status, and capture metrics | Produced by the managed collector. | Monitor your writer separately. |
| Processor status, metrics, and dead-letter queues | Describe processing inside RDI. | Still describe processing inside RDI; they do not prove the writer is capturing every source change. |

RDI can validate pipeline and job syntax, but it cannot test your external writer
or its connection to the original source. Successful configuration validation
does not confirm that the writer produces compatible events or captures every
change.

Before stopping the pipeline, pause your writer or arrange durable buffering
outside the RDI database. A stopped processor does not prevent the writer from
adding events. Coordinate writer resumption with pipeline startup.

Before a whole-pipeline reset, stop the writer and decide how you will recreate the
source data. After the reset, replay a consistent snapshot and resume changes from
the corresponding source position. RDI does not maintain that position for your
external collector. A pipeline reset does not delete existing target records, so
also account for target rows that are no longer present in the source.

Stop the writer before removing or renaming its source. RDI cleans up the state
owned by its managed components, but an external source has no managed collector
that owns its input streams. Do not rely on reset or source removal to delete
externally written input streams. Plan their cleanup separately before replaying
events or changing the stream names, event metadata, and job selectors. See
[Multiple sources](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md)
for source removal and naming behavior.
