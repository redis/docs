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

Use an object in a Google Cloud Storage (GCS) bucket to coordinate a leader election between
Redis Data Integration (RDI) sites. All sites must use the same bucket and object name.
To use one bucket for several disaster recovery (DR) setups, see
[Share a lease store between DR setups](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#share-a-lease-store-between-dr-setups).

Before you begin, [create the RDI database at both sites](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).
The commands use the Google Cloud command-line interface (CLI), authenticated as an identity
that can create buckets and grant access. The RDI operator needs separate runtime permissions.

## Create the bucket

Create a dual-region or multi-region bucket, so that the lease survives the loss of a region.
Choose a location using
[Cloud Storage bucket locations](https://cloud.google.com/storage/docs/locations).

```bash
gcloud storage buckets create "gs://<lease-bucket>" \
  --project "<google-cloud-project>" \
  --location "<dual-or-multi-region-location>" \
  --uniform-bucket-level-access
```

The bucket name must be globally unique. For `--location`, use a predefined dual-region
location such as `NAM4` or a multi-region location such as `US`. See
[`gcloud storage buckets create`](https://cloud.google.com/sdk/gcloud/reference/storage/buckets/create)
for custom dual-region locations.

RDI creates the lease object; do not create it yourself.

See [Protect the lease](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#protect-the-lease)
for the warning about deleting a lease, including through lifecycle rules.

## Grant the operator access

The operator's Google Cloud identity needs to create, read, update, and overwrite the lease
object. The bucket-scoped `roles/storage.objectUser` role provides these permissions. The
`roles/storage.legacyBucketReader` role lets RDI check the bucket's location at startup. See
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

Choose one of these identity options for each operator.

### Workload Identity Federation

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

## Configure both instances

Merge the following settings into the `operator.leaderElection` section of each site's
values file. Keep the local RDI database connection and other installation settings from
[Configure each site's values file](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#configure-each-sites-values-file).

In `rdi-values-site-a.yaml`:

```yaml
operator:
  leaderElection:
    enabled: true
    instanceID: site-a
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
    leaseType: gcs
    gcsLease:
      bucketName: <lease-bucket>
      objectName: <lease-object>
```

Use identical `bucketName` and `objectName` values at both sites. The distinct `instanceID`
values identify the two RDI instances.

## Install RDI

1. Inspect the bucket location and access policy:

   ```bash
   gcloud storage buckets describe "gs://<lease-bucket>" --format=json
   gcloud storage buckets get-iam-policy "gs://<lease-bucket>" --format=json
   ```

   Confirm the dual-region or multi-region location and the roles for each operator identity.

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

   > [!NOTE]
   > If you use a service account key file, you must pass
   > it to the `helm upgrade` commands shown above using an extra `--set-file` option
   >
   > ```text
   > --set-file operator.leaderElection.gcsLease.credentials="<creds-file>"
   > ```
   > RDI 2.2.1 and later accept only service account key files, not Workload Identity Federation
   > credential configuration files.
   >
   > After creating the lease resource and granting access, return to
   > [Prepare both sites](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites)
   > to complete the source, target, and network preparation.


Continue with [Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets)
to configure RDI CLI contexts. One leader, one follower, and no access errors in the operator
logs confirm that both operators can access the bucket.

In RDI 2.2.0, the lease is stored in the object's custom metadata. RDI migrates an existing
lease object to this format during an upgrade. Review
[Upgrade or downgrade a DR setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#upgrade-or-downgrade-a-dr-setup)
before changing versions.
