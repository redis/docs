---
Title: Disaster recovery (DR)
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Configure disaster recovery for Redis Data Integration with GCS or DynamoDB leader election.
group: di
hideListLinks: false
linkTitle: Disaster recovery (DR)
summary: Set up and operate RDI across two or more sites.
type: integration
weight: 110
---

Redis Data Integration (RDI) can run across two or more sites so that another site takes over
when the active site fails. Each site runs its own RDI installation, an *instance*, in a
separate Kubernetes cluster. An external lease selects one instance, the *leader*, to run the
pipelines. The other instances are *followers* and wait to take over. The examples in this
guide use two sites, A and B.

RDI keeps its state, such as pipeline configurations and saved source positions, in the RDI
database. In a disaster recovery (DR) setup, the RDI database is an Active-Active database with
a database instance at each site, so this state replicates between the sites. Each RDI instance
connects to the database instance at its own site.

RDI supports leases in Google Cloud Storage (GCS), available since RDI 1.15.0, and in Amazon
DynamoDB, new in RDI 2.2.0, for
[Kubernetes installations](/content/integrate/redis-data-integration/installation/install-k8s.md).
RDI 2.2.0 doesn't support DR for VM installations or for other lease stores.

DR differs from a
[high availability (HA) pair](/content/integrate/redis-data-integration/installation/install-vm.md#installing-with-high-availability),
where two instances share one RDI database and use it for leader election. Use an HA pair to
survive the failure of one RDI instance, and DR to survive the loss of a site.

## Understand the topology

![Site A has the source primary and the RDI leader, which captures from it. Source changes replicate to a source replica at site B, where RDI pipelines are in standby. After a takeover, site B's RDI captures from the source at site B. Both sites share an external lease. RDI database endpoints and example target endpoints use Active-Active replication.](/images/rdi/disaster-recovery.svg)

Each RDI instance is in one of three states:

| State | Takes part in leader election | Runs the pipelines | Typical use |
| :-- | :-- | :-- | :-- |
| Leader | Yes, and holds the lease | Yes | The active site. |
| Follower | Yes | No. Takes over when the lease is released or expires. | Automatic failover. |
| Standby | No. Its `standby_mode` setting is `true`. | No | Manual failover, or a site under maintenance. |

`redis-di info` reports `Leader Election Mode: follower` for both followers and standby
instances. Check `standby_mode` with `redis-di get-setting standby_mode` to tell them apart.
The pipelines of any instance that isn't the leader report the `standby` status.

Each site's RDI instance captures from the closest source database that supports snapshots
and change data capture (CDC). That database is the active source database or a replica of it.
Which kinds of replica RDI can capture from, and when, depends on the source database. See
[Source databases and data after a failover](#source-databases-and-data-after-a-failover).
Manage source replication, promotion, and endpoint routing separately from RDI failover.

The target in this example also uses Active-Active replication. Configure target availability
separately; an Active-Active target is not a requirement for RDI leader election.

The lease selects the active RDI instance. It does not replicate pipeline data or manage the
availability of the source and target databases. Source or target failures, including a source
failover, do not trigger a change of leader.

## Source databases and data after a failover

The new leader continues capture only if the source database it connects to can serve RDI's
saved position. The new leader resumes from the state in its local RDI database instance: the
collector's saved source position and any change records not yet processed.

The saved position uses the source database's own terms, such as an Oracle system change number
(SCN) or a PostgreSQL log sequence number (LSN). A position value doesn't identify the database
history it came from, so RDI doesn't always detect a database with a different history. Capture
can then fail, or start from the wrong place.

The following table gives the general requirement for each source. Replication and failover
details vary by source database, version, and managed service.

<!-- TODO: Confirm the SQL Server and MongoDB rows with engineering (RDSC-6013). -->

| Source | Saved position | The source database at the new leader's site must |
| :-- | :-- | :-- |
| Oracle | SCN | Have the same SCN history, such as a physical standby in Oracle Data Guard, and keep the redo and archive logs from the saved SCN. A logical copy, such as one that Oracle GoldenGate maintains, has its own SCNs. |
| MySQL and MariaDB | Global transaction identifier (GTID) set, or binary log (binlog) file and position | Use GTIDs and contain every transaction in the saved GTID set, with binlogs kept from that point. A replica must also write replicated changes to its own binlog. Binlog file names and positions differ between servers. |
| PostgreSQL | LSN of the replication slot | Be a promoted physical standby with a synchronized copy of RDI's replication slot. PostgreSQL 17 can synchronize failover slots; versions 14 to 16 need the `pg_failover_slots` extension. RDI can't use the slot copy until the standby is promoted. A logical replica always needs a new snapshot. |
| SQL Server | LSN | Be the same database with the same transaction log, such as a replica in an Always On availability group. CDC capture must run on the new primary. |
| MongoDB | Change stream resume token | Belong to the same replica set or sharded cluster, with the saved position still in the oplog. A separate cluster that another tool copies has its own oplog. |
| Google Cloud Spanner | Change stream position | Spanner is one multi-region database, so both sites capture from it through the same endpoint. The saved position must still be within the change stream's retention period. |

After a takeover, one of the following applies:

- **Capture continues from the saved position.** If the source database still has the change
  history from that position, no changes are lost. Active-Active replication is asynchronous,
  so the saved state can lag behind the failed site's state. RDI can then apply some changes to
  the target again. If the source replicates asynchronously, a promoted source can lack changes
  that RDI already delivered. The target keeps them, and RDI can't detect this.
- **Capture can't continue.** For example, the source database has no compatible change history
  or capture state for the saved position.
  [Reset the pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#reset-a-pipeline)
  to take a new snapshot. The snapshot restores inserts and updates. Rows deleted from the
  source between the failed site's last processed change and the start of the snapshot remain
  in the target. RDI can't detect them, so delete them from the target yourself.

Before you rely on DR, check that the source database at each site can serve RDI's saved
position. A replicated copy of the source alone does not guarantee this. Retain enough source
change history to cover capture lag, snapshots, and the longest outage you plan to recover from.

## Prepare both sites

- Install the same RDI version in separate Kubernetes clusters.
- Create the RDI database as an
  [Active-Active database](/content/operate/rs/databases/active-active/create.md) with an
  instance at each site. It must also meet the
  [RDI database requirements](/content/integrate/redis-data-integration/installation/install-k8s.md#create-the-rdi-database).
- Give each instance access to its site's source database, its target database, and the same
  external lease. The lease must remain available when any site fails.
- [Prepare the source database](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/_index.md)
  at each site for CDC, and check the requirements in
  [Source databases and data after a failover](#source-databases-and-data-after-a-failover).
- Keep the clocks at both sites synchronized. Each site checks lease expiry against its own clock.

This guide sets up new installations. An existing RDI database can't be changed into an
Active-Active database. To add DR to an existing installation, export each pipeline with
[`redis-di export`](/content/integrate/redis-data-integration/reference/cli/redis-di-export.md),
set up both sites as described here, and deploy the pipelines. They take a new snapshot.

### Configure each site's values file

Create `rdi-values-site-a.yaml` and `rdi-values-site-b.yaml` from the chart's values, following
[Install the RDI Helm chart](/content/integrate/redis-data-integration/installation/install-k8s.md#install-the-rdi-helm-chart).
Set the connection to the local RDI database and the instance identifier (ID) in each file.
For site A:

```yaml
connection:
  host: <site-a-rdi-db-host>
  port: <site-a-rdi-db-port>
  username: <site-a-rdi-db-user>
  password: <site-a-rdi-db-password>

api:
  jwtKey: <site-a-api-signing-key>

operator:
  leaderElection:
    enabled: true
    instanceID: site-a
    standbyMode: false
```

For site B:

```yaml
connection:
  host: <site-b-rdi-db-host>
  port: <site-b-rdi-db-port>
  username: <site-b-rdi-db-user>
  password: <site-b-rdi-db-password>

api:
  jwtKey: <site-b-api-signing-key>

operator:
  leaderElection:
    enabled: true
    instanceID: site-b
    standbyMode: false
```

`operator.leaderElection.instanceID` is a Helm value, set before installing each instance.
Keep it across upgrades.

> [!WARNING]
> Use a different `instanceID` at each site. RDI defaults to `cluster-1` and doesn't detect
> duplicate IDs. Instances that share an ID both act as the leader, and they share runtime
> settings such as `standby_mode`.

These snippets show the site-specific settings. Complete the other installation settings,
including Transport Layer Security (TLS) and application programming interface (API) access,
using
[The `values.yaml` file](/content/integrate/redis-data-integration/installation/install-k8s.md#the-valuesyaml-file).

## Choose a failover mode

The failover mode decides whether site B waits as a follower or in standby. See the instance
states in [Understand the topology](#understand-the-topology). Choose the mode before you
install:

| Mode | `standbyMode` in the values files | Who starts the takeover? | Use it when |
| :-- | :-- | :-- | :-- |
| Automatic | `false` at both sites | The follower, after the leader releases the lease or the lease expires. | The source database at site B can serve the saved position as soon as site B takes over. For example, both sites capture from one Spanner database. |
| Manual | `false` at site A, `true` at site B | You, by enabling participation on the destination instance. | The source database at site B needs a step first, such as promotion or a check of its change history. For example, a PostgreSQL standby must be promoted before RDI can use its slot copy. |

With manual failover, prepare the source first. Promote the source database at site B or
confirm that it can serve the saved position, then enable site B. If the position can't carry
over, reset the pipeline after site B takes over. See
[Source databases and data after a failover](#source-databases-and-data-after-a-failover).

The values files in this guide use automatic failover. After installation, change the mode
with the `standby_mode`
[instance setting](/content/integrate/redis-data-integration/reference/instance-settings.md#standby_mode),
which overrides the Helm value. See [Move leadership manually](#move-leadership-manually).

## Configure a lease

Choose one provider and follow its guide to create the lease resource, grant access, add the
lease settings to both values files, and install RDI:

- [Configure a GCS lease](/content/integrate/redis-data-integration/installation/disaster-recovery/gcs.md):
  use an object in a dual-region or multi-region bucket.
- [Configure a DynamoDB lease](/content/integrate/redis-data-integration/installation/disaster-recovery/dynamodb.md):
  use an item in a global table with multi-Region strong consistency (MRSC). An MRSC table
  spans three Amazon Web Services (AWS) Regions, for example two replicas and a witness.

All sites must use the same lease resource and key. With more than two sites, sites can share a
replica Region of the DynamoDB table.

> [!WARNING]
> Set `operator.leaderElection.leaseType` to `gcs` or `dynamodb`, as the provider guides show.
> The default `redsync` lease keeps the lock in the RDI database. Active-Active replication
> can't arbitrate it, so every site can become the leader.

### Share a lease store between DR setups

A DR setup uses one lease for all its pipelines. Separate DR setups, such as a production
setup and a test setup, can share one GCS bucket or DynamoDB table. Give each setup its own
lease with `gcsLease.objectName` or `dynamoDBLease.keyName`, and use the same value at every
site of that setup. For example, in the DynamoDB values files of the production setup:

```yaml
operator:
  leaderElection:
    instanceID: prod-site-a
    dynamoDBLease:
      tableName: <lease-table>
      keyName: rdi-prod-lease
```

And in the values files of the test setup:

```yaml
operator:
  leaderElection:
    instanceID: test-site-a
    dynamoDBLease:
      tableName: <lease-table>
      keyName: rdi-test-lease
```

Set `keyName` explicitly for every setup, because it defaults to `rdi-lease`. Setups that use
the same lease compete for it, so only one of them runs its pipelines. Each setup still needs
its own Kubernetes clusters and Active-Active RDI database.

Every identity with access to the bucket or table can write every lease in it. To stop one
setup from taking another's lease, restrict each identity to its own lease with an Identity and
Access Management (IAM) condition, or use a separate bucket or table.

### Lease timing

The lease timings are Helm values under `operator.leaderElection`:

| Helm value | Default | What it controls |
| :-- | :-- | :-- |
| `ttl` | `60s` | How long the lease stays valid after the leader last renewed it. |
| `refreshInterval` | `10s` | How often each instance tries to acquire or renew the lease and reads its runtime settings. |
| `timeout` | `30s` | Total time for one attempt to acquire, renew, or release the lease, including retries. |
| `retryPolicy` | `attempts: 3`, `initialInterval: 1s`, `backoffFactor: 2.0` | Retries within `timeout`. |
| `checkTimeout` | `15s` | Total time to read the runtime settings from the RDI database. |
| `checkRetryPolicy` | `attempts: 3`, `initialInterval: 1s`, `backoffFactor: 2.0` | Retries within `checkTimeout`. |

- A leader that enters standby, or that can't read its RDI database, releases the lease
  immediately. Another instance acquires it on its next attempt, within `refreshInterval`.
- A leader that fails, or that can't reach the lease store, doesn't release the lease. Another
  instance can acquire it after `ttl`.
- If you change the timings, keep `timeout` less than `ttl` minus `checkTimeout` minus
  `refreshInterval`. A leader that can't renew the lease then stops leading before the lease
  expires. RDI doesn't check this.

RDI doesn't fence a leader that loses its lease. It stops leading shortly before the lease
expires, but removing its pipeline components can take longer, so both sites can briefly run
pipelines.

With the default settings, expect another site to take over within about 2 minutes. Pipeline
startup and catch-up add to the recovery time.

## Deploy pipelines and secrets

Configure a separate RDI command-line interface (CLI)
[context](/content/integrate/redis-data-integration/reference/cli/_index.md#contexts) for each
instance. The examples use `site-a` and `site-b` as context names:

```bash
redis-di set-context site-a --api-url "https://<site-a-rdi-api-host>" \
  --user "<rdi-user>" --cacert "<site-a-ca-file>"
redis-di set-context site-b --api-url "https://<site-b-rdi-api-host>" \
  --user "<rdi-user>" --cacert "<site-b-ca-file>"
```

1. Check leadership on both instances:

   ```bash
   redis-di --context site-a info
   redis-di --context site-b info
   ```

   One reports `Leader Election Mode: leader` and the other
   `Leader Election Mode: follower`. The examples assume that site A is the leader.

1. [Set the secrets for every pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-pipelines.md#set-secrets-for-each-pipeline)
   on both instances. RDI does not replicate secrets between them. You can set secrets before
   a pipeline exists. Include the source and target credentials and any certificates.

   When the sites use different source or target endpoints, set the endpoints as
   [generic secrets](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
   at each site. For a source named `mysql`:

   ```bash
   redis-di --context site-a set-secret HOST "<site-a-source-host>" \
     --db mysql --pipeline "<pipeline>"
   redis-di --context site-a set-secret HOST "<site-a-target-host>" \
     --db target --pipeline "<pipeline>"
   redis-di --context site-b set-secret HOST "<site-b-source-host>" \
     --db mysql --pipeline "<pipeline>"
   redis-di --context site-b set-secret HOST "<site-b-target-host>" \
     --db target --pipeline "<pipeline>"
   ```

   Reference `${MYSQL_DB_HOST}` in the source's `connection.host` and `${TARGET_DB_HOST}` in
   the target's `connection.host` in `config.yaml`. The same pipeline configuration then
   resolves to the local endpoints at each site.

1. For a new pipeline, create it empty on the leader, then deploy its configuration. For a
   leader at site A:

   ```bash
   redis-di --context site-a deploy "<pipeline>" --empty
   redis-di --context site-a deploy "<pipeline>" --dir "<pipeline-directory>"
   ```

   Don't run `deploy --empty` on an existing pipeline. It clears the pipeline's configuration
   and its saved source positions.

   RDI saves the pipeline configuration in the RDI database and restores it when another
   instance becomes the leader. Do not deploy a separate configuration on the follower.

1. Run `redis-di --context site-a describe "<pipeline>"` for each pipeline on the leader.
   Check that its components run without errors and that source changes reach the target.

## How automatic failover works

When the leader fails, or loses access to its lease or its RDI database, another instance takes
over after the lease is released or expires. See [Lease timing](#lease-timing). The new leader
starts the pipeline components and resumes from the state in its local RDI database instance.
See [Source databases and data after a failover](#source-databases-and-data-after-a-failover).

After a failover, [check the new leader and its pipelines](#verify-a-takeover). When the old
site recovers, it remains a follower while the other site holds the lease. Recovery of the
old site does not move leadership back automatically.

## Move leadership manually

Use this procedure for maintenance or a manually controlled takeover. It assumes site A is
the leader and site B is the destination.

1. Check that site B is ready to take over:

   - Site B reports `Leader Election Mode: follower`. An instance in standby also reports
     `follower`, so check its `standby_mode` setting as well:

     ```bash
     redis-di --context site-b info
     redis-di --context site-b get-setting standby_mode
     ```

   - Site B has the secrets of every pipeline. Compare the `KEY` and `DB` columns at both
     sites; RDI doesn't show secret values:

     ```bash
     redis-di --context site-a list-secrets --pipeline "<pipeline>"
     redis-di --context site-b list-secrets --pipeline "<pipeline>"
     ```

   - If site B takes part in leader election, its `rdi_operator_is_leader` metric reports `0`
     and its operator logs show none of the errors in
     [Operator log messages](#operator-log-messages).
   - Active-Active replication of the RDI database is healthy.

   RDI can't test source or target connectivity from a follower. To check the full path, move
   leadership to site B and back during a maintenance window.

1. On both reachable instances, record the current runtime setting:

   ```bash
   redis-di --context site-a get-setting standby_mode
   redis-di --context site-b get-setting standby_mode
   ```

   If a runtime setting is `<none>`, also record the Helm value:

   ```bash
   helm get values rdi --all --namespace rdi --kube-context "<site-kube-context>" \
     | grep standbyMode
   ```

1. If site B is in standby, enable it. It waits as a follower while site A holds the lease:

   ```bash
   redis-di --context site-b set-setting standby_mode false
   ```

1. If site A is reachable, put it in standby. Site A releases the lease, and site B acquires it
   within `refreshInterval`:

   ```bash
   redis-di --context site-a set-setting standby_mode true
   ```

   If site A is unreachable, site B acquires the lease after it expires. Do not delete the lease
   to force a takeover. Any instance that takes part in leader election recreates it on its
   next attempt, so two sites can briefly lead.

1. [Verify the takeover](#verify-a-takeover) before starting maintenance or returning traffic
   to a recovered site.
1. If site A was unreachable and you use manual failover, set its `standby_mode` to `true` when
   it becomes reachable.

After maintenance, set `standby_mode` for the operating mode you want:

| Mode | Site A `standby_mode` | Site B `standby_mode` |
| :-- | :-- | :-- |
| Automatic | `false` | `false` |
| Manual, site A leads | `false` | `true` |
| Manual, site B leads | `true` | `false` |

To restore the previous settings instead, use the values you recorded. Run
`redis-di delete-setting standby_mode` for a recorded value of `<none>`, so that the Helm value
applies again. Don't leave every instance in standby: then no instance runs the pipelines.

To move leadership back to site A, repeat the procedure with the sites exchanged. Enabling
participation on site A alone does not move a lease that site B still holds.

### Verify a takeover

1. Run `redis-di --context site-a info` and `redis-di --context site-b info` on the reachable
   instances. Confirm that the destination reports `Leader Election Mode: leader` and any
   reachable former leader reports `Leader Election Mode: follower`.
1. On the new leader, describe each expected active pipeline. For a new leader at site B:

   ```bash
   redis-di --context site-b describe "<pipeline>"
   ```

   Check its components and errors.
1. Make a test change in the source and confirm that the expected result reaches the target.
   Check the target endpoint used by applications, including any replication lag between
   target sites. Leadership alone does not confirm pipeline health or data delivery.

## Monitor a DR setup

Scrape the operator at both sites and monitor the pipelines of the leader. Use the metric
definitions and endpoint instructions in
[Observability](/content/integrate/redis-data-integration/observability.md). Before a planned
move, use the readiness checks in [Move leadership manually](#move-leadership-manually).

### Alert on DR health

Alert on these checks at all times. They show whether one site leads and whether another site
can take over.

| Check | What to investigate |
| :-- | :-- |
| `rdi_operator_is_leader`, labeled by `instance_id` | Expect one leader. If both instances report `0` for more than 2 minutes, check standby settings, lease access, and RDI database connectivity. If both report `1`, investigate duplicate instance IDs or different lease resources immediately. |
| Missing operator metrics | Check scrape access and instance availability. Missing samples do not mean the instance reports `0`. |
| Operator logs | RDI has no metric for lease errors. Alert on the `ERROR` messages in [Operator log messages](#operator-log-messages). |

If neither site can access the lease store, restore lease connectivity before expecting
ingestion to resume.

### Check recovery after a takeover

Watch these checks on the leader, and closely after a takeover. They show whether the new
leader resumed from the saved position and is catching up.

| Check | What to investigate |
| :-- | :-- |
| Collector `Connected` and `MilliSecondsBehindSource` | Investigate source connectivity and growing capture lag. A source outage alone does not trigger RDI failover. |
| Collector `SnapshotRunning`, `SnapshotCompleted`, and `SnapshotAborted` | Investigate an unexpected snapshot or failed recovery. Check whether the source database has the required change history. |
| Processor progress, backlog, and rejected records | If source changes continue but delivery stops, inspect pipeline errors, target connectivity, and processing metrics for the selected processor. |

If the leader's pipelines are unhealthy, inspect the pipeline and source or target errors.
Changing leadership does not establish that those dependencies are healthy.

### Operator log messages

The operator writes JSON log lines. Read them at each site with:

```bash
kubectl --context "<site-kube-context>" --namespace rdi logs deployment/rdi-operator
```

The `message` field identifies the leader election event:

| Message | Level | Meaning |
| :-- | :-- | :-- |
| `Acquired leadership` | `INFO` | This instance is now the leader. |
| `Lost leadership` | `INFO` | This instance stopped leading. |
| `Entering standby mode, will not participate in leader election` | `INFO` | `standby_mode` is now `true`. |
| `Leaving standby mode, will participate in leader election` | `INFO` | `standby_mode` is now `false`. |
| `Migrating legacy lease object` | `INFO` | RDI 2.2.0 is migrating a GCS lease to the new format. |
| `Lease bucket is a single-region bucket, the lease will not survive the loss of its region` | `INFO` | The GCS bucket can't protect the lease against a regional outage. |
| `Lease table is a single-region table, the lease will not survive the loss of its region` | `INFO` | The DynamoDB table has no other replicas. |
| `Could not acquire leadership lease` | `ERROR` | The lease store rejected or didn't answer a request. Check credentials, permissions, and network access. |
| `Could not extend leadership lease` | `ERROR` | The leader can't renew the lease. Another instance takes over after `ttl`. |
| `Could not read settings` | `ERROR` | The instance can't read its RDI database. A leader releases the lease. |
| `invalid GCS lease bucket` or `invalid DynamoDB lease table` | `ERROR` | The lease resource failed the startup check, and the operator exits. |

A follower that waits for the lease logs nothing at the default level. Authentication and
permission errors include the error text from the cloud provider.

## Upgrade or downgrade a DR setup

Follow the [RDI upgrade instructions](/content/integrate/redis-data-integration/installation/upgrade.md).
Upgrade the leader first. Check leadership, pipeline health, and data delivery before
upgrading the follower. Finish upgrading both instances before creating a pipeline other
than `default`.

> [!WARNING]
> With a GCS lease, the upgraded leader migrates the lease to a format that versions before
> 2.2.0 can't read. Until you upgrade the follower, it can't take over. Upgrade the follower as
> soon as you've checked the leader.

Downgrading from RDI 2.0.0 or later to a version earlier than 2.0.0 is not supported. Do not
downgrade after creating a pipeline other than `default`. Versions before 2.2.0 don't support
DynamoDB leases, so you can't downgrade a DR setup that uses one below 2.2.0.

If you return to RDI 2.0.0 with a GCS lease, plan downtime:

1. Put both instances in standby, and check that neither reports `Leader Election Mode: leader`:

   ```bash
   redis-di --context site-a set-setting standby_mode true
   redis-di --context site-b set-setting standby_mode true
   ```

   An instance in standby makes no lease requests, so neither recreates the lease object.

1. Delete the lease object:

   ```bash
   gcloud storage rm "gs://<lease-bucket>/<lease-object>"
   ```

1. Downgrade both instances with Helm. Versions before 2.2.0 don't read runtime settings and
   use `operator.leaderElection.standbyMode` instead. The first instance that takes part in
   leader election recreates the lease in its earlier format.
1. Check that only one instance is the leader, and verify pipeline health and data delivery.

The `standby_mode` settings remain in the RDI database. If you upgrade to 2.2.0 again, run
`redis-di delete-setting standby_mode` on each instance as soon as it runs 2.2.0, or set the
mode you want.

## Uninstall a DR setup

Delete a follower's pipelines with `kubectl delete pipelines`. The RDI API rejects pipeline
changes on a follower. On a follower, deleting pipelines keeps their data in the RDI database
for the active instance. On the active instance, deleting pipelines removes their components
and cleans up their data in the RDI database. Some data can remain if cleanup fails.

Delete the pipelines before you run `helm uninstall`. Pipeline resources left behind keep
their finalizers, which stops Kubernetes from deleting the RDI custom resource definitions
(CRDs) and the namespace.

### Remove one instance

1. If the instance is the leader, follow
   [Move leadership manually](#move-leadership-manually)
   to put it in standby and let the other instance take over.
1. Check that the other instance reports `Leader Election Mode: leader`, its pipelines run
   without errors, and data reaches the target.
1. On the instance you want to remove, delete its pipelines and wait until none remain:

   ```bash
   kubectl --context "<site-kube-context>" --namespace rdi delete pipelines --all
   kubectl --context "<site-kube-context>" --namespace rdi get pipelines
   ```

   Continue when `get` returns no resources.
1. Run the remaining commands in
   [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi)
   on that instance. Do not flush the RDI database while another instance uses it.

### Remove both instances

1. Remove the follower first, as described in [Remove one instance](#remove-one-instance).
1. On the active instance, delete its pipelines and wait until none remain, using the same
   `kubectl` commands. This cleans up their data in the RDI database. Then run the remaining
   commands in
   [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi).
1. After both instances are removed, optionally remove any remaining data as described in
   [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi).
