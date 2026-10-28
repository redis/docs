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

## Prepare both sites

- Install the same RDI version in two separate Kubernetes clusters.
- Configure the RDI database with Active-Active replication between the sites. Each RDI
  instance connects to its local database instance.
- Both RDI instances must capture from the same source database server, not from separate
  replicas. See [Active-Active RDI databases](/content/integrate/redis-data-integration/faq.md#can-i-use-active-active-for-the-rdi-database).
- Give both instances access to the source, their target database, and the same external lease.
  The lease must remain available when either RDI site fails.
- Set a different `operator.leaderElection.instanceID` at each site. Instances that share an
  ID can both consider themselves the leader. Their runtime settings also share that ID.

The lease selects the active RDI instance. It does not replicate pipeline data or manage the
availability of the source and target databases. Source or target connection failures do not
by themselves trigger a change of leader.

## Configure a GCS lease

Use the same bucket and object name at both sites. Choose a separate object name for each
independent DR setup that shares the bucket.

1. Create a dual-region or multi-region bucket. A single-region bucket does not protect the
   lease against the loss of that region. See [Cloud Storage bucket locations](https://cloud.google.com/storage/docs/locations).

1. Give the RDI operator's Google Cloud identity access to the bucket and its lease object.
   It needs `storage.buckets.get` and permission to create, read, update, and overwrite the
   object. The `roles/storage.objectUser` and `roles/storage.legacyBucketReader` roles on the
   bucket provide these permissions. See [Cloud Storage roles](https://cloud.google.com/storage/docs/access-control/iam-roles).

1. Set the lease configuration in each site's `rdi-values.yaml`:

   ```yaml
   operator:
     leaderElection:
       enabled: true
       instanceID: <unique-site-id>
       leaseType: gcs
       gcsLease:
         bucketName: <lease-bucket>
         objectName: <lease-object>
   ```

RDI uses application default credentials when you omit a credentials file. For example, you
can configure [Workload Identity Federation for Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity)
for the operator. If you use a service account credentials file, pass it when installing RDI
at each site:

```bash
helm upgrade --install rdi rdi-<version>.tgz -f rdi-values.yaml -n rdi --create-namespace \
  --set-file operator.leaderElection.gcsLease.credentials=<credentials-file>
```

RDI creates the lease object; you only need to create the bucket. In RDI 2.2.0, the lease is
stored in the object's custom metadata. When you upgrade, RDI migrates an existing lease
object to this format. See [Upgrade or downgrade a DR setup](#upgrade-or-downgrade-a-dr-setup).

## Configure a DynamoDB lease

Use a DynamoDB global table with multi-Region strong consistency (MRSC). A table using the
default multi-Region eventual consistency mode cannot prevent both sites from acquiring the
lease.

The table must have a single string partition key named `id`, with no sort key. Do not enable
Time to Live (TTL), which MRSC tables do not support. See
[DynamoDB consistency modes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html).

1. Create an MRSC global table across three supported Amazon Web Services (AWS) Regions:
   a replica in each RDI site's Region and a third replica or witness. A witness cannot serve
   reads or writes. Choose the consistency mode when creating the global table. If you
   convert a single-Region table to MRSC, it must be empty. See
   [Create an MRSC global table](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables.tutorial.html).

1. Give the operator's AWS identity the `dynamodb:DescribeTable`, `dynamodb:PutItem`, and
   `dynamodb:DeleteItem` permissions on the replica table in each RDI Region. The operator
   does not need access to the witness. Table creation requires separate permissions.

1. Allow outbound Hypertext Transfer Protocol Secure (HTTPS) access from each operator to the
   DynamoDB endpoint in its Region.

1. Set the configuration in each site's `rdi-values.yaml`. Use the same table and `keyName`
   at both sites, a distinct `instanceID` at each site, and the local replica's Region:

   ```yaml
   operator:
     leaderElection:
       enabled: true
       instanceID: <unique-site-id>
       leaseType: dynamodb
       dynamoDBLease:
         region: <local-aws-region>
         tableName: <lease-table>
         keyName: <lease-item-key>
   ```

Use a different `keyName` for each independent DR setup that shares the table. Its default is
`rdi-lease`.

RDI uses the AWS default credential provider chain when you omit a credentials file. You can
also pass an AWS shared credentials file when installing RDI at each site:

```bash
helm upgrade --install rdi rdi-<version>.tgz -f rdi-values.yaml -n rdi --create-namespace \
  --set-file operator.leaderElection.dynamoDBLease.credentials=<aws-credentials-file>
```

## Deploy pipelines and secrets

Run installation commands with the Kubernetes context for the intended site. Configure a
separate RDI command-line interface (CLI)
[context](/content/integrate/redis-data-integration/reference/cli/_index.md#contexts) for each
instance so that you can manage it independently.

1. Install RDI at both sites with the selected lease configuration.

1. Run `redis-di info` against each instance. One must report `Leader Election Mode: leader`
   and the other `Leader Election Mode: follower`.

1. [Set the secrets for every pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-pipelines.md#set-secrets-for-each-pipeline)
   on both instances. RDI does not replicate secrets between them. You can set secrets before
   a pipeline exists. If the sites use different connection parameters, use
   [generic secrets](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
   so that the same configuration resolves to the appropriate values at each site.

1. Create and deploy pipelines on the leader. RDI saves their configuration in the RDI
   database and restores it when another instance becomes the leader. Do not deploy a
   separate configuration on the follower.

1. Run `redis-di describe <pipeline>` for each pipeline on the leader. Check that its
   components run without errors and that source changes reach the target.

## Check failover and maintenance

When the active instance fails or loses access to its lease or RDI database, the other
instance can take over after the lease is released or expires. Recovery also needs time to
start the pipeline components. Database replication lag can affect the state available at
the other site.

For planned maintenance, follow
[Trigger a failover manually](/content/integrate/redis-data-integration/installation/ha-test.md#trigger-a-failover-manually).
Record the old leader's `standby_mode` value before changing it, and restore that value after
maintenance. Deleting the setting restores the Helm default and does not always enable
participation in leader election.

After a failover:

1. Run `redis-di info` on both reachable instances and confirm that only one is the leader.
1. On the new leader, run `redis-di describe <pipeline>` for each expected active pipeline.
1. Check that data reaches the target before continuing maintenance or returning traffic to
   the recovered site. Leadership alone does not confirm pipeline health.

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
   gcloud storage rm gs://<lease-bucket>/<lease-object>
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
   [Trigger a failover manually](/content/integrate/redis-data-integration/installation/ha-test.md#trigger-a-failover-manually)
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
