---
Title: Configure a GCS lease
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Create and configure a Google Cloud Storage lease for RDI disaster recovery.
group: di
hideListLinks: false
linkTitle: GCS lease
summary: Set up a shared lease object and install RDI at both sites.
type: integration
weight: 10
---

Use an object in a Google Cloud Storage (GCS) bucket to coordinate leader election between
Redis Data Integration (RDI) sites. All sites must use the same bucket and object name.
To use one bucket for several disaster recovery (DR) setups, see
[Share a lease store between DR setups](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#share-a-lease-store-between-dr-setups).

Before you begin, [prepare both sites and their values files](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).
The commands use the Google Cloud command-line interface (CLI), authenticated as an identity
that can create buckets and grant access. The RDI operator needs separate runtime permissions.

## Create the bucket

Create a dual-region or multi-region bucket. A single-region bucket does not protect the lease
against the loss of that region. RDI doesn't
reject a single-region bucket; it only logs a message at startup. Choose a location using
[Cloud Storage bucket locations](https://cloud.google.com/storage/docs/locations).

```bash
gcloud storage buckets create "gs://<lease-bucket>" \
  --project "<google-cloud-project>" \
  --location "<dual-or-multi-region-location>" \
  --uniform-bucket-level-access
```

The bucket name must be globally unique. For example, use `NAM4` for a predefined dual-region
location or `US` for a multi-region location. See
[`gcloud storage buckets create`](https://cloud.google.com/sdk/gcloud/reference/storage/buckets/create)
for custom dual-region locations.

RDI creates the lease object; do not create it yourself.

> [!WARNING]
> Don't apply an Object Lifecycle Management rule that deletes the lease object, such as a rule
> that deletes objects by age. RDI creates the lease object once and then only updates it, so
> such a rule eventually deletes it. Another site can then take over, and two sites can briefly
> lead.

## Grant the operator access

The operator's Google Cloud identity needs to create, read, update, and overwrite the lease
object. The bucket-scoped `roles/storage.objectUser` role provides these permissions. The
`roles/storage.legacyBucketReader` role lets RDI check the bucket's location at startup;
without it, RDI skips the check. See
[Cloud Storage roles](https://cloud.google.com/storage/docs/access-control/iam-roles).

Grant both roles to the service account used by the operator:

```bash
gcloud storage buckets add-iam-policy-binding "gs://<lease-bucket>" \
  --member "serviceAccount:<operator-service-account-email>" \
  --role roles/storage.objectUser

gcloud storage buckets add-iam-policy-binding "gs://<lease-bucket>" \
  --member "serviceAccount:<operator-service-account-email>" \
  --role roles/storage.legacyBucketReader
```

If the sites use different identities, run these commands for each one. Grant access on this
bucket rather than the whole project. Allow outbound Hypertext Transfer Protocol Secure
(HTTPS) access from both operators to Cloud Storage.

RDI uses application default credentials when you omit a credentials file. Configure the
identity in the operator's environment, not only in your local shell. On Google Kubernetes
Engine (GKE), use
[Workload Identity Federation](https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity).
The operator runs as the Kubernetes service account `rdi-operator` in the RDI namespace. Set
its annotations with `operator.serviceAccount.annotations` in each values file. For example,
to link it to a Google service account:

```yaml
operator:
  serviceAccount:
    annotations:
      iam.gke.io/gcp-service-account: <operator-service-account-email>
```

You can also pass a service account key file when installing RDI. RDI doesn't accept
Workload Identity Federation credential configuration files. RDI reads the key file only at
startup, so restart the operator after you replace it:

```bash
kubectl --context "<site-kube-context>" --namespace rdi rollout restart deployment/rdi-operator
```

## Configure both instances

Merge the following settings into the `operator.leaderElection` section of each site's
values file. Keep the local RDI database connection and other installation settings from
[Prepare both sites](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).

In `rdi-values-site-a.yaml`:

```yaml
operator:
  leaderElection:
    enabled: true
    instanceID: site-a
    standbyMode: false
    leaseType: gcs
    gcsLease:
      bucketName: <lease-bucket>
      objectName: <lease-object>
```

In `rdi-values-site-b.yaml`:

```yaml
operator:
  leaderElection:
    enabled: true
    instanceID: site-b
    standbyMode: true
    leaseType: gcs
    gcsLease:
      bucketName: <lease-bucket>
      objectName: <lease-object>
```

Use identical `bucketName` and `objectName` values at both sites. The distinct `instanceID`
values identify the two RDI instances.

## Check the bucket and install RDI

1. Inspect the bucket location and access policy:

   ```bash
   gcloud storage buckets describe "gs://<lease-bucket>" --format=json
   gcloud storage buckets get-iam-policy "gs://<lease-bucket>" --format=json
   ```

   Confirm the dual-region or multi-region location and the roles for each operator identity.
   These checks use your CLI identity; they do not confirm the operator's runtime access.

1. With application default credentials configured for both operators, install RDI in each
   Kubernetes cluster:

   ```bash
   helm upgrade --install rdi "rdi-<tag>.tgz" \
     --kube-context "<site-a-kube-context>" --namespace rdi --create-namespace \
     --values rdi-values-site-a.yaml

   helm upgrade --install rdi "rdi-<tag>.tgz" \
     --kube-context "<site-b-kube-context>" --namespace rdi --create-namespace \
     --values rdi-values-site-b.yaml
   ```

   If you use a service account credentials file instead, append this option to each site's
   command, using that site's file:

   ```text
   --set-file operator.leaderElection.gcsLease.credentials="<credentials-file>"
   ```

1. Check the operator at each site:

   ```bash
   kubectl --context "<site-a-kube-context>" --namespace rdi get pods
   kubectl --context "<site-b-kube-context>" --namespace rdi get pods
   kubectl --context "<site-a-kube-context>" --namespace rdi logs deployment/rdi-operator
   kubectl --context "<site-b-kube-context>" --namespace rdi logs deployment/rdi-operator
   ```

   Check for authentication, permission, bucket, or connectivity errors. See
   [Operator log messages](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#operator-log-messages).

Continue with [Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets)
to configure RDI CLI contexts and confirm that one instance is the leader and the other is a
follower. Both instances use the lease, so healthy leadership and operator logs help verify
runtime access.

In RDI 2.2.0, the lease is stored in the object's custom metadata. RDI migrates an existing
lease object to this format during an upgrade. Review
[Upgrade or downgrade a DR setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#upgrade-or-downgrade-a-dr-setup)
before changing versions.

## Move the lease to a dual-region bucket

You can't change a bucket's location. If an existing setup uses a single-region bucket, move
the lease to a new dual-region or multi-region bucket. Keep the follower in standby until both
sites use the new bucket, so that the sites never take part in leader election with different
lease objects.

1. Create the new bucket and grant the operators access, as described in
   [Create the bucket](#create-the-bucket) and [Grant the operator access](#grant-the-operator-access).
1. Record the follower's `standby_mode` setting, then put the follower in standby. For a
   follower at site B:

   ```bash
   redis-di --context site-b get-setting standby_mode
   redis-di --context site-b set-setting standby_mode true
   ```

1. Set `operator.leaderElection.gcsLease.bucketName` to the new bucket in both values files.
1. Upgrade the leader with its values file, then the follower, using the `helm upgrade`
   commands in [Check the bucket and install RDI](#check-the-bucket-and-install-rdi). The
   leader creates the lease object in the new bucket.
1. Restore the follower's recorded `standby_mode` setting. Use `delete-setting` for a recorded
   value of `<none>`.
1. Check that one instance reports `Leader Election Mode: leader`, then delete the old lease
   object:

   ```bash
   gcloud storage rm "gs://<old-lease-bucket>/<lease-object>"
   ```
