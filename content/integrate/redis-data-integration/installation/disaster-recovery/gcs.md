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
two Redis Data Integration (RDI) sites. Both sites must use the same bucket and object name.
Use a different object name for each independent disaster recovery (DR) setup.

Before you begin, [prepare both sites and their values files](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#prepare-both-sites).
The commands use the Google Cloud command-line interface (CLI), authenticated as an identity
that can create buckets and grant access. The RDI operator needs separate runtime permissions.

## Create the bucket

Create a dual-region or multi-region bucket. A single-region bucket does not protect the
lease against the loss of that region. Choose a location using
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

## Grant the operator access

The operator's Google Cloud identity needs `storage.buckets.get` and permission to create,
read, update, and overwrite the lease object. The bucket-scoped
`roles/storage.objectUser` and `roles/storage.legacyBucketReader` roles provide these
permissions. See [Cloud Storage roles](https://cloud.google.com/storage/docs/access-control/iam-roles).

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
Engine (GKE), you can use
[Workload Identity Federation](https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity).
You can also pass a service account credentials file when installing RDI.

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
    standbyMode: false
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
   helm upgrade --install rdi "rdi-<version>.tgz" \
     --kube-context "<site-a-kube-context>" --namespace rdi --create-namespace \
     --values rdi-values-site-a.yaml

   helm upgrade --install rdi "rdi-<version>.tgz" \
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

   Check for authentication, permission, bucket, or connectivity errors.

Continue with [Deploy pipelines and secrets](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#deploy-pipelines-and-secrets)
to configure RDI CLI contexts and confirm that one instance is the leader and the other is a
follower. Both instances use the lease, so healthy leadership and operator logs help verify
runtime access.

In RDI 2.2.0, the lease is stored in the object's custom metadata. RDI migrates an existing
lease object to this format during an upgrade. Review
[Upgrade or downgrade a DR setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#upgrade-or-downgrade-a-dr-setup)
before changing versions.
