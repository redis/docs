---
description: Database replication with RIOT
linkTitle: Replication
title: Replication
type: integration
weight: 8
---

## Replication

Most Redis migration tools available today are offline in nature.
Migrating data from AWS ElastiCache to Redis Enterprise Cloud, for example, means backing up your Elasticache data to an AWS S3 bucket and importing it into Redis Enterprise Cloud using its UI.

Redis has a replication command called [REPLICAOF](https://redis.io/commands/replicaof) but it is not always available (see [ElastiCache restrictions](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/RestrictedCommands.html)).
Instead, RIOT implements [client-side replication]({{< relref "/integrate/riot/architecture" >}}) using **dump & restore** or **type-based read & write**. Both snapshot and live replication modes are supported.

{{< warning >}}
Please note that RIOT is neither recommended nor officially supported by Redis, Inc.
{{< /warning >}}

### Usage

```
riot <source> replicate <target> --mode <snapshot|live|compare> [OPTIONS]
```

For the full usage, run:

```
riot replicate --help
```

**Snapshot replication example**

```
riot -h source -p 6379 replicate -h target -p 6380 --batch 10
```

**Live replication example**

```
riot -h source -p 6379 replicate -h target -p 6380 --mode live
```

#### Target Redis options

Connection options for the target database are the same as the source Redis connection options:

Use the following options to configure connections to Redis.

* **`-h`, `--hostname`**\
Server hostname
* **`-p`, `--port`**\
Server port
* **`-u`, `--uri`**\
Server URI. For syntax see [Redis URI Syntax](https://github.com/lettuce-io/lettuce-core/wiki/Redis-URI-and-connection-details#uri-syntax).
* **`-c`, `--cluster`**\
Enable cluster mode
* **`-n`, `--db`**\
Database number
* **`--timeout`**\
Redis command timeout
* **`--client`**\
Client name used to connect to Redis
* **`--user`**\
ACL style 'AUTH username pass'. Needs password
* **`-a`, `--pass`**\
Password to use when connecting to the server
* **`--tls`**\
Establish a secure TLS connection
* **`--tls-verify`**\
TLS peer-verify mode: FULL (default), NONE, CA
* **`--cacert`**\
X.509 CA certificate file to verify with
* **`--cert`**\
X.509 cert chain file to authenticate (PEM)
* **`--key`**\
PKCS#8 private key file to authenticate (PEM)
* **`--key-pwd`**\
Private key password
* **`--no-auto-reconnect`**\
Disable auto-reconnect on connection loss

#### Replication Options

* **`--event-order`**\
Keyspace notification ordering strategy.
* `fifo`: Keeps order of notifications as they are received.
* `priority`: Orders notifications based on the underlying data-structure: `string` > `hash` > `json` > `list` > `set` > `zset` > `stream` > `timeseries`.
* **`--event-queue`**\
Capacity of the keyspace notification queue (default: `10000`).
* **`--flush-interval`**\
Max duration between flushes (default: `50`).
* **`--idle-timeout`**\
Min duration of inactivity to consider transfer complete (default: no timeout).
* **`--key-process`**\
SpEL expression to transform each key.
* **`--mode`**\
Replication mode.
* `snapshot`: Initial replication using key scan.
* `live`: Initial and continuous replication using key scan and keyspace notifications in parallel. See [Live Replication]({{< relref "/integrate/riot/replication#live-replication" >}}) for details.
* `liveonly`: Continuous replication using keyspace notifications (only changed keys are replicated).
* `compare`: Compare source and target keys
* **`--no-verify`**\
Disable verifying target against source dataset after replication.
* **`--show-diffs`**\
Print details of key mismatches during dataset verification.
* **`--target-pool`**\
Max connections for target Redis pool (default: `8`).
* **`--target-read-from`**\
Which target Redis cluster nodes to read data from.
* **`--ttl-tolerance`**\
Max TTL difference to use for dataset verification (default: `100`).
* **`--type`**\
Replication strategy (default: `dump`).
* `dump`: [Dump & Restore]({{< relref "/integrate/riot/replication#dump--restore" >}}).
* `ds`: [Type-based Replication]({{< relref "/integrate/riot/replication#type-based-replication" >}}).

#### Source reader options

* **`--scan-count`**\
    How many keys to read at once on each call to [SCAN](https://redis.io/commands/scan#the-count-option)
* **`--scan-match`**\
    Pattern of keys to scan for (default: `*` i.e. all keys)
* **`--scan-type`**\
    Type of keys to scan for (default: all types)  
* **`--key-include`**\
    Regular expressions for keys to whitelist.
    For example `mykey:.*` will only consider keys starting with `mykey:`.
* **`--key-exclude`**\
    Regular expressions for keys to blacklist.
    For example `mykey:.*` will not consider keys starting with `mykey:`.
* **`--key-slots`**\
    Ranges of key slots to consider for processing.
    For example `0:8000` will only consider keys that fall within the range `0` to `8000`.
* **`--read-threads`**\
    How many value reader threads to use in parallel
* **`--read-batch`**\
    Number of values each reader thread should read in a pipelined call
* **`--read-queue`**\
    Max number of items that reader threads can put in the shared queue.
    When the queue is full, reader threads wait for space to become available.
    Queue size should be at least `#threads * batch`, e.g. `--read-threads 4 --read-batch 500` => `--read-queue 2000`
* **`--read-pool`**\
    Size of the connection pool shared by reader threads.
    Can be smaller than the number of threads
* **`--read-from`**\
   Which Redis cluster nodes to read from: `master`, `master_preferred`, `upstream`, `upstream_preferred`, `replica_preferred`, `replica`, `lowest_latency`, `any`, `any_replica`. See {link_lettuce_readfrom} for more details.
* **`--mem-limit`**\
    Maximum memory usage in megabytes for a key to be read (default: 0). Use 0 to disable memory usage checks.
* **`--mem-samples`**\
    Number of memory usage samples for a key (default: 5).

#### Data structure options

* **`--merge-policy`**\
Policy to merge collection data structures (default: `overwrite`).
* `merge`: merge properties from collection data structures (e.g. `hash`, `set`, ...)
* `overwrite`: delete before writing data structures
* **`--stream-id`**\
Policy for stream message IDs (default: `propagate`).
* `propagate`: Pass along stream message IDs from source to target
* `drop`: Drop message IDs (target will generate its own message IDs)

#### Performance tuning

RIOT offers some options to identify potential bottlenecks.
In addition to the [batch]({{< relref "/integrate/riot/architecture#batching" >}}) and [threads]( {{< relref "/integrate/riot/architecture#multi-threading" >}}) options, you have the `--dry-run` option which disables writing to the target Redis database so that you can tune the reader (see Source Reader section above) in isolation.
Add that option to your existing `replicate` command-line to compare replication speeds with and without writing to the target Redis database:

```
riot <source> replicate <target> --dry-run
```

#### Verification

Once replication is complete RIOT will perform a verification step by iterating over keys in the source database and comparing values and TTLs between source and target databases.

The verification step happens automatically after the scan is complete (snapshot replication), or for live replication when keyspace notifications have become idle (see the [Usage](#usage) section).

Verification can also be run on-demand using the `compare` mode:
```
riot <source> replicate --mode compare <target>
```

The output looks like this:

```
123 missing, 54 type, 7 value, 19 ttl
```

* **missing**\
Number of keys only present in source database
* **type**\
Number of keys with mismatched data structure types
* **value**\
Number of keys with mismatched values
* **ttl**\
Number of keys with mismatched TTL, that is, the difference is greater than the tolerance (can be specified with `--ttl-tolerance`)

To show which keys are different use the `--show-diffs` option:

```
riot <source> replicate <target> --show-diffs
```

#### Progress

Each process (scan iterator and/or event listener in case of live replication) has a corresponding status bar that shows the process name and its progress:

* **Scanning**\
    Percentage of keys that have been replicated => replicated / total.
    The total number of keys is calculated when the process starts and it can change by the time it is finished (for example if keys are deleted or added during the replication).
    The progress bar is only a rough indicator.
* **Listening**\
    Progress is indefinite as total number of keys is unknown.

### Live replication

In live replication mode, RIOT listens for changes happening on the source database using keyspace notifications.
Each time a key is modified, RIOT reads the corresponding value and propagates that change to the target database.

Live replication relies on keyspace notifications. 
Make sure the source database has keyspace notifications enabled using `notify-keyspace-events = KA` in `redis.conf` or via `CONFIG SET`.
For more details see [Redis Keyspace Notifications](https://redis.io/docs/manual/keyspace-notifications).


{{< warning >}}
The live replication mechanism does not guarantee data consistency.
Redis sends keyspace notifications over pub/sub which does not provide guaranteed delivery.
It is possible that RIOT can miss some notifications; for example, in case of network failures.

Also, depending on the type, size, and rate of change of data structures on the source it is possible that RIOT cannot keep up with the change stream.
For example if a big set is repeatedly updated, RIOT will need to read the whole set on each update and transfer it over to the target database.
With a big-enough set, RIOT could fall behind and the internal queue could fill up, leading to dropped updates.
Some preliminary sizing using Redis statistics and `bigkeys`/`memkeys` (or `--mem-limit` in [source reader options](#source-reader-options)) is recommended for these migrations.
If you need assistance please contact your Redis account team.
{{< /warning >}}

### Dump and restore

The default replication mechanism in RIOT is dump and restore:

{{< image filename="/integrate/riot/images/dump-and-restore.svg" alt="dump-and-restore" >}}

1. Scan for keys in the source Redis database.
If live replication is enabled the reader also subscribes to keyspace notifications to generate a continuous stream of keys.
2. Reader threads iterate over the keys to read corresponding values (DUMP) and TTLs.
3. Reader threads enqueue key/value/TTL tuples into the reader queue, from which the writer dequeues key/value/TTL tuples and writes them to the target Redis database by calling RESTORE and EXPIRE.

### Type-based replication

In some cases dump and restore cannot be used. For example:

* The target Redis database does not support the RESTORE command ([Redis Enterprise CRDB](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/))
* Incompatible DUMP formats between source and target ([Redis 7.0](https://raw.githubusercontent.com/redis/redis/7.0/00-RELEASENOTES))

For these, RIOT includes another replication strategy called type-based replication, where each data type has a corresponding pair of read/write commands:

|Type|Read|Write|
|----|----|----|
|Hash|HGETALL|HSET|
|List|LRANGE|RPUSH|
|Set|SMEMBERS|SADD|
|Sorted Set|ZRANGE|ZADD|
|Stream|XRANGE|XADD|
|String|GET|SET|

To select this replication mechanism use the `--type ds` option:

**Live type-based replication example**

```
riot -h source -p 6379 replicate --type ds -h target -p 6380 --mode live
```

{{< warning >}}
This replication strategy is more intensive in terms of CPU, memory, and network for the machines running RIOT.
Adjust number of threads, batch, and queue sizes accordingly.
{{< /warning >}}

## Migrating from ElastiCache

This recipe contains step-by-step instructions to migrate an ElastiCache (EC) database to [Redis Enterprise](https://redis.com/redis-enterprise-software/overview/) (RE).

The following scenarios are covered:

* One-time (snapshot) migration
* Online (live) migration

{{% alert title="Important" %}}
It is recommended that you read the replication section (top of this document) to familiarize yourself with its usage and architecture.
{{% /alert %}}

### Setup

#### Prerequisites

For this recipe, you will require the following resources:
 
* AWS ElastiCache: _Primary Endpoint_ in case of Single Master and _Configuration Endpoint_ in case of Clustered EC.
Refer to [this link](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Endpoints.html) to learn more.
* Redis Enterprise: hosted on Cloud or On-Prem.
* An Amazon EC2 instance.

{{% alert title="Important" %}}
Keyspace Notifications

For a live migration you need to enable keyspace notifications on your ElastiCache instance (see [AWS Knowledge Center](https://aws.amazon.com/premiumsupport/knowledge-center/elasticache-redis-keyspace-notifications)).
{{% /alert %}}

#### Migration host

To run the migration tool you will need an EC2 instance.

You can either create a new EC2 instance or leverage an existing one if available.
In the example below you first create an instance on AWS Cloud Platform.
The most common scenario is to access an ElastiCache cluster from an Amazon EC2 instance in the same Amazon Virtual Private Cloud (Amazon VPC).
Ubuntu 16.04 LTS is used for this setup, but you can choose the Ubuntu or Debian distribution of your choice.
 
SSH to this EC2 instance from your computer:

```
ssh -i “public key” <AWS EC2 Instance>
```

Install `redis-cli` on this new instance by running this command:

```
sudo apt update
sudo apt install -y redis-tools
```

Use `redis-cli` to check connectivity with the ElastiCache database:

```
redis-cli -h <ec primary endpoint> -p 6379
```

Ensure that the above command allows you to connect to the remote ElastiCache database successfully.

#### Install RIOT

Install RIOT on the EC2 instance you set up previously.
Follow the [Linux installation]({{< relref "/integrate/riot/install#linux-via-homebrew" >}}) steps.

### Performing migration

You're now set to begin the migration process.
The options you will use depend on your source and target databases, as well as the replication mode (snapshot or live).

#### EC Single Master -> RE
```
riot -h <source EC host> -p <source EC port> replicate -h <target RE host> -p <target RE port> --pass <RE password>
```

#### Live EC Single Master -> RE
```
riot -h <source EC host> -p <source EC port> replicate --mode live -h <target RE host> -p <target RE port> --pass <RE password>
```

{{% alert title="Important" %}}
In case ElastiCache is configured with [AUTH TOKEN enabled](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/auth.html), you need to pass `--tls` as well as the `--pass` options:

```console
riot -h <source EC host> -p <source EC port> --tls --pass <token> replicate -h <target RE host> -p <target RE port> --pass <RE password>
```
{{% /alert %}}

#### EC Cluster -> RE

```
riot -h <source EC host> -p <source EC port> --cluster replicate -h <target RE host> -p <target RE port> --pass <RE password>
```

{{< note >}}
`--cluster` is an important parameter used only for ElastiCache whenever cluster-mode is enabled.
Do note that the source database is specified first and the target database is specified after the replicate command, and it is applicable for all the scenarios.
{{< /note >}}

#### EC Single Master -> RE (with specific db index)

```
riot -h <source EC host> -p <source EC port> --db <index> replicate -h <target RE host> -p <target RE port> --pass <RE password>
```

#### EC Single Master -> RE with OSS Cluster
```
riot -h <source EC host> -p <source EC port> replicate -h <target RE host> -p <target RE port> --pass <RE password> --cluster
```

#### Live EC Cluster -> RE with OSS Cluster

```
riot -h <source EC host> -p <source EC port> --cluster replicate --mode live -h <target RE host> -p <target RE port> --pass <RE password> --cluster
```

### Important Considerations

* As stated earlier, this tool is not officially supported by Redis, Inc.
* It is recommended to test migration in UAT before production use.
* Once migration is completed, ensure that application traffic gets redirected to the Redis Enterprise endpoint successfully.
* It is recommended to perform the migration process during periods of low traffic to avoid data loss.
