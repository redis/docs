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
summary: Set up and operate RDI across two sites.
type: integration
weight: 110
---

Redis Data Integration (RDI) can run across two sites so that one site takes over when the
active site fails. Each site runs an RDI instance against its local instance of an Active-Active
RDI database. An external lease selects one leader to run the pipelines.

RDI 2.2.0 supports Google Cloud Storage (GCS) and Amazon DynamoDB leases for
[Kubernetes installations](/content/integrate/redis-data-integration/installation/install-k8s.md).
This disaster recovery (DR) setup differs from a
[high availability (HA) pair](/content/integrate/redis-data-integration/installation/install-vm.md#installing-with-high-availability)
that shares one RDI database for leader election.

## Understand the topology

![Two sites connect to the same source server and external lease. The leader runs pipelines, while the follower waits to take over. Each site uses its local RDI database endpoint, with Active-Active replication between the endpoints.](/images/rdi/disaster-recovery.svg)

The target in this example also uses Active-Active replication. Configure target availability
separately; an Active-Active target is not a requirement for RDI leader election. The RDI and
target databases are shown outside the Kubernetes installations in this example.

The lease selects the active RDI instance. It does not replicate pipeline data or manage the
availability of the source and target databases. Source or target connection failures do not
by themselves trigger a change of leader.

## Prepare both sites

- Install the same RDI version in two separate Kubernetes clusters.
- [Create the RDI database](/content/integrate/redis-data-integration/installation/install-k8s.md#create-the-rdi-database)
  with Active-Active replication between the sites. Each RDI instance connects to its local
  database instance.
- Both RDI instances must capture from the same source database server, not from separate
  replicas. See [Active-Active RDI databases](/content/integrate/redis-data-integration/faq.md#can-i-use-active-active-for-the-rdi-database).
- Give both instances access to the source, their target database, and the same external lease.
  The lease must remain available when either RDI site fails.
- [Prepare the source databases](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/_index.md)
  for change data capture (CDC). Retain enough source change history to cover capture lag,
  snapshots, and the longest interruption you plan to recover from. A saved offset does not
  preserve source history that the database has already removed.

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
RDI defaults to `cluster-1`; it does not generate a unique ID. Use a different ID at each site
and keep it across upgrades. Instances that share an ID can both consider themselves the
leader. Their runtime settings also share that ID.

These snippets show the site-specific settings. Complete the other installation settings,
including Transport Layer Security (TLS), application programming interface (API) access,
and the API signing key, using
[The `values.yaml` file](/content/integrate/redis-data-integration/installation/install-k8s.md#the-valuesyaml-file).

## Configure a lease

Choose one provider and follow its guide to create the lease resource, grant access, add the
lease settings to both values files, and install RDI:

- [Configure a GCS lease](/content/integrate/redis-data-integration/installation/disaster-recovery/gcs.md):
  use an object in a dual-region or multi-region bucket.
- [Configure a DynamoDB lease](/content/integrate/redis-data-integration/installation/disaster-recovery/dynamodb.md):
  use an item in a global table with multi-Region strong consistency.

Both sites must use the same lease resource and key. Independent DR setups must use different
lease objects or item keys, even when they share a bucket or table.

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

   One must report `Leader Election Mode: leader` and the other
   `Leader Election Mode: follower`. Either site can acquire the lease first.

1. [Set the secrets for every pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-pipelines.md#set-secrets-for-each-pipeline)
   on both instances. RDI does not replicate secrets between them. You can set secrets before
   a pipeline exists. Include the source and target credentials and any certificates.

   For different target endpoints, set a
   [generic secret](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
   at each site:

   ```bash
   redis-di --context site-a set-secret HOST "<site-a-target-host>" \
     --db target --pipeline "<pipeline>" --wait=false
   redis-di --context site-b set-secret HOST "<site-b-target-host>" \
     --db target --pipeline "<pipeline>" --wait=false
   ```

   Reference `${TARGET_DB_HOST}` in the target's `connection.host` in `config.yaml`. The same
   pipeline configuration then resolves to the local target endpoint at each site.

1. Create an empty pipeline on the leader, then deploy its configuration. For a leader at
   site A:

   ```bash
   redis-di --context site-a deploy "<pipeline>" --empty
   redis-di --context site-a deploy "<pipeline>" --dir "<pipeline-directory>"
   ```

   RDI saves the pipeline configuration in the RDI database and restores it when another
   instance becomes the leader. Do not deploy a separate configuration on the follower.

1. Run `redis-di --context site-a describe "<pipeline>"` for each pipeline on the leader.
   Check that its components run without errors and that source changes reach the target.

## Choose a failover mode

A follower waits for the lease while taking part in leader election. An instance in
`standby_mode` does not take part. Choose how you want the follower to participate:

| Mode | Configuration | Who starts the takeover? |
| :-- | :-- | :-- |
| Automatic | Both instances participate in leader election. | The follower acquires the lease after the leader releases it or the lease expires. |
| Manual | Keep the follower's `standby_mode` set to `true`. | You enable participation on the destination instance. |

For automatic failover, enable participation at both sites:

```bash
redis-di --context site-a set-setting standby_mode false
redis-di --context site-b set-setting standby_mode false
```

To keep failover under manual control when site A is the leader, leave site A participating
and put site B in standby:

```bash
redis-di --context site-b set-setting standby_mode true
```

Do not leave both instances in standby: neither can run the pipelines. Runtime settings
override `operator.leaderElection.standbyMode`. Deleting `standby_mode` restores that Helm
value; it enables participation only when the Helm value is `false`. See
[Instance settings](/content/integrate/redis-data-integration/reference/instance-settings.md#standby_mode).

## Check automatic failover

When the active instance fails or loses access to its lease or RDI database, the other
instance can take over after the lease is released or expires. Recovery also needs time to
start the pipeline components. Database replication lag can affect the state available at
the other site. With the default configuration, the lease expires 60 seconds after its last
renewal. Pipeline startup and catch-up add to recovery time; lease expiry is not a guarantee
of end-to-end recovery time.

The new leader resumes using the state in its local RDI database instance. Active-Active
replication is asynchronous, so that state can lag behind the failed site's state. Recovery
may replay changes. Verify the target data as well as pipeline health.

After a failover, [check the new leader and its pipelines](#verify-a-takeover). When the old
site recovers, it remains a follower while the other site holds the lease. Recovery of the
old site does not move leadership back automatically.

## Move leadership manually

Use this procedure for maintenance or a manually controlled takeover. It assumes site A is
the leader and site B is the destination.

1. Check that site B can reach the source, target, RDI database, and lease store, and has the
   secrets for every pipeline. Check replication health for the RDI database before a planned
   move.
1. On both reachable instances, record the current runtime setting:

   ```bash
   redis-di --context site-a get-setting standby_mode
   redis-di --context site-b get-setting standby_mode
   ```

   Also record the Helm value if a runtime setting is `<none>`.

1. If site A is reachable, make it release leadership:

   ```bash
   redis-di --context site-a set-setting standby_mode true
   ```

1. Enable participation at site B:

   ```bash
   redis-di --context site-b set-setting standby_mode false
   ```

   If site A is unreachable, site B must wait for the existing lease to expire. Do not delete
   the lease to force a takeover.

1. [Verify the takeover](#verify-a-takeover) before starting maintenance or returning traffic
   to a recovered site.
1. If site A was unreachable, set its `standby_mode` to `true` when it becomes reachable to
   keep subsequent failover under manual control.

After maintenance, choose the intended operating mode. For automatic failover, set
`standby_mode` to `false` on both sites. For manual failover, keep only the follower in standby.
To restore the previous policy, restore the recorded settings. Use `delete-setting` for a
recorded value of `<none>` so that the Helm value applies again.

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

Scrape the operator at both sites and monitor each active pipeline. Use the metric definitions
and endpoint instructions in [Observability](/content/integrate/redis-data-integration/observability.md).

| Check | What to investigate |
| :-- | :-- |
| `rdi_operator_is_leader`, labeled by `instance_id` | Expect one leader. If both instances report `0` beyond your recovery window, check standby settings, lease access, and RDI database connectivity. If both report `1`, investigate duplicate instance IDs or different lease resources immediately. |
| Missing operator metrics | Check scrape access and instance availability. Missing samples do not mean the instance reports `0`. |
| Collector `Connected` and `MilliSecondsBehindSource` | Investigate source connectivity and growing capture lag. A source outage alone does not trigger RDI failover. |
| Collector `SnapshotRunning`, `SnapshotCompleted`, and `SnapshotAborted` | Investigate an unexpected snapshot or failed recovery. Check whether the required source history is still available. |
| Processor progress, backlog, and rejected records | If source changes continue but delivery stops, inspect pipeline errors, target connectivity, and processing metrics for the selected processor. |

If neither site can access the lease store, restore lease connectivity before expecting
ingestion to resume. If one site is the leader but its pipelines are unhealthy, inspect the
pipeline and source or target errors; changing leadership does not establish that those
dependencies are healthy.

## Upgrade or downgrade a DR setup

Follow the [RDI upgrade instructions](/content/integrate/redis-data-integration/installation/upgrade.md).
Upgrade the leader first. Check leadership, pipeline health, and data delivery before
upgrading the follower. Finish upgrading both instances before creating a pipeline other
than `default`.

Downgrading from RDI 2.0.0 or later to a version earlier than 2.0.0 is not supported. Do not
downgrade after creating a pipeline other than `default`.

Versions before 2.2.0 cannot acquire a GCS lease after RDI 2.2.0 migrates it to object metadata.
If you return to RDI 2.0.0 with a GCS lease, plan downtime:

1. Stop the pipelines and all RDI operator replicas at both sites. Stopping a pipeline alone
   does not stop the operator from recreating the lease object.
1. While all operators are stopped, delete the lease object:

   ```bash
   gcloud storage rm "gs://<lease-bucket>/<lease-object>"
   ```

1. Downgrade both instances, keeping every 2.2.0 operator stopped. Only start operators
   running the earlier version, so that they recreate the lease in its earlier format.
1. Check that only one instance is the leader, then start the pipelines on it and verify
   pipeline health and data delivery.

## Uninstall a DR setup

Deleting pipelines on the active instance removes their components and cleans up their data
in the RDI database. Deleting pipelines on a follower keeps that data for the active
instance. Some data can remain if cleanup fails.

### Remove one instance

1. If the instance is the leader, follow
   [Move leadership manually](#move-leadership-manually)
   to put it in standby and let the other instance take over.
1. Check that the other instance reports `Leader Election Mode: leader`, its pipelines run
   without errors, and data reaches the target.
1. Follow [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi)
   on the follower you want to remove. Wait for pipeline deletion to finish before removing
   the operator with Helm. Do not flush the RDI database while another instance uses it.

### Remove both instances

1. Uninstall the follower first, then the active instance, using the commands in
   [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi).
1. On the active instance, wait for pipeline deletion to finish before running `helm uninstall`.
   Deleting the pipelines triggers their database cleanup.
1. After both instances are removed, optionally remove any remaining data as described in
   [Uninstall RDI](/content/integrate/redis-data-integration/installation/install-k8s.md#uninstall-rdi).
