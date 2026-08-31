---
title: Connect clusters
alwaysopen: false
categories:
- docs
- operate
- radar
description: Add Redis Software, Redis Cloud, Redis Open Source, Amazon ElastiCache, and Google Memorystore sources to Radar.
linkTitle: Connect
weight: 20
---

After installing Radar, connect your clusters to Redis Radar. Add each cluster manually — Radar doesn't discover clusters on its own. After you add a cluster, Radar tests the connection and then keeps collecting that source's state automatically going forward. While Radar lets you view your cluster's status, it doesn't change the any of the cluster settings or configuration.

## What you can connect

| Type | How Radar reaches it | What you supply |
|---|---|---|
| [Redis Software](#connect-a-redis-software-cluster) | The cluster REST API, over HTTPS on port 9443 | A hostname or IP address, plus an account on the cluster |
| [Redis Open Source](#connect-a-redis-open-source-instance) | Direct access to the Redis instance | A hostname and port, plus credentials if the instance requires them |
| [Redis Cloud](#connect-a-redis-cloud-account) | The Redis Cloud API | An account key and a user secret |
| [Amazon ElastiCache](#connect-amazon-elasticache) | The AWS control-plane APIs | Read-only AWS credentials and the regions to scan |
| [Google Memorystore](#connect-google-memorystore) | The Google Cloud APIs | A read-only service account, plus the project and regions to scan |

Radar encrypts every credential before storing it. Credentials are never returned through the API and never written to logs.

{{<image filename="images/radar/add-connection.png" alt="The Add connection dialog, with the connection type selector open">}}

## Self-managed connections

Connect Redis Software clusters and Redis Open Source instances that you run yourself. Radar reaches each one directly, so you supply a host and an account on the cluster or instance. Redis Software and Redis Open Source connections are per cluster or per instance.

### Before you connect

For every connection you need:

- **Credentials for the cluster or instance.** Radar uses the same management interface you do, so it needs an account there. Read access covers monitoring. For a Redis Software cluster, grant write access too if you want to use Radar's license update action; Redis Open Source connections have no write actions.
- **Network access from Radar to the source.** Radar connects outbound. Nothing needs to connect back to Radar, so no inbound rule is required on the Radar host.

### Connect a Redis Software cluster

Radar reads Redis Software clusters through the cluster REST API.

1. Select **Add connection**, from either the top bar or the **Connections** page.
2. Set the **connection type** to **Redis Software**.
3. Enter a **display name**. Use something you can recognize in a fleet-wide list, such as `Production East 1`.
4. Enter the cluster's **hostname or IP address**, for example `cluster.redis.internal` or `10.0.0.1`.
5. Enter the **port**. The default is `9443`, the cluster REST API port.
6. Enter the **username** and **password** of an account on the cluster.
7. Select **Add connection**.

Radar tests the connection before it saves anything. If the test fails, Radar shows the error and does not create the connection, so you can correct the details and select **Retry**.

Radar always reaches the REST API over HTTPS.

{{<image filename="images/radar/add-connection-redis-software.png" alt="The Add connection dialog set to connection type Redis Software">}}

{{< note >}}
Point Radar at the cluster's fully qualified domain name rather than one node's address. A node address works until that node is unavailable, at which point Radar reports the whole cluster as unreachable.
{{< /note >}}

### Connect a Redis Open Source instance

Radar connects straight to the instance, so it needs network access to that endpoint.

1. Select **Add connection**.
2. Set the **connection type** to **Redis Open Source**.
3. Enter a **display name**.
4. Enter the **hostname or IP address** and **port**. The default port is `6379`.
5. Enter a **username** and **password** if the instance requires authentication. Leave both empty if it does not.
6. Select **Use TLS (rediss://)** if the instance requires an encrypted connection.
7. Select **Add connection**.

{{<image filename="images/radar/add-connection-redis-open-source.png" alt="The Add connection dialog set to connection type Redis Open Source">}}

## Cloud connections

Connect a Redis Cloud account, Amazon ElastiCache, or Google Memorystore. These connections use each provider's own API rather than talking to a database directly, so what you supply is API credentials rather than an account on a cluster. One Redis Cloud connection covers every subscription and database in that account, and one ElastiCache or Memorystore connection covers every resource in the regions you select. ElastiCache and Memorystore resources appear on the **Databases** view rather than **Clusters**.

### Before you connect

For every connection you need:

- **API credentials for the provider.** A Redis Cloud account key and user secret, read-only AWS credentials, or a read-only Google Cloud service account. Radar never writes to your Redis Cloud subscription or provider account.
- **The regions to scan, for Amazon ElastiCache and Google Memorystore.** Radar only scans the regions you list.
- **Network access from Radar to the provider's API.** Radar connects outbound only.

### Connect a Redis Cloud account

A Redis Cloud connection uses the Redis Cloud API, so it covers every subscription and database in the account at once.

1. Create a Redis Cloud API key. You need both the **account key** and a **user secret**. See [Redis Cloud API]({{< relref "/operate/rc/api" >}}).
2. In Radar, select **Add connection**.
3. Set the **connection type** to **Redis Cloud**.
4. Enter a **display name**.
5. Enter the **account key** and the **user secret**.
6. Select **Add connection**.

{{<image filename="images/radar/add-connection-redis-cloud.png" alt="The Add connection dialog set to connection type Redis Cloud">}}

### Connect Amazon ElastiCache

One ElastiCache connection covers every ElastiCache resource in the regions you select.

**Amazon ElastiCache** appears in the connection type list only if an administrator enabled the ElastiCache connector, which is off by default.

Before you connect, create an AWS identity with read-only ElastiCache access. The policy needs no write permissions and no cache data-plane permissions:

- `elasticache:DescribeReplicationGroups`
- `elasticache:DescribeCacheClusters`
- `elasticache:DescribeServerlessCaches`
- `cloudwatch:GetMetricData`
- `tag:GetResources`
- `ec2:DescribeRegions`

On a self-managed install, Radar authenticates with a long-lived IAM access key pair:

1. Select **Add connection**.
2. Set the **connection type** to **Amazon ElastiCache**.
3. Enter a **display name**.
4. Enter the **AWS access key ID** and **AWS secret access key**.
5. Enter the **AWS regions** to scan, separated by commas, for example `us-east-1, us-west-2`.
6. Select **Add connection**.

Radar derives the AWS account ID itself, so you do not enter it.

Both the API server and the worker need outbound HTTPS on port 443 to the AWS control-plane endpoints in every region you configure: `sts`, `elasticache`, `monitoring`, `tagging`, and `ec2`. Radar never opens a connection to a cache endpoint.

{{<image filename="images/radar/add-connection-amazon-elasticache.png" alt="The Add connection dialog set to connection type Amazon ElastiCache">}}

{{< note >}}
Blocking the CloudWatch or tagging endpoints degrades what Radar can report and produces a capability warning. Blocking the identity or ElastiCache inventory endpoints stops the connection test and collection outright.
{{< /note >}}

### Connect Google Memorystore

One Memorystore connection covers every Memorystore resource in the regions you select, across the Redis, Valkey, and Memcached engines.

**Google Memorystore** appears in the connection type list only if an administrator enabled the Memorystore connector, which is off by default.

Before you connect, create a service account in the target project and grant it the read roles for the engines you run:

| Role | Covers |
|---|---|
| `roles/redis.viewer` | Memorystore for Redis and Redis Cluster |
| `roles/memorystore.viewer` | Memorystore for Valkey only |
| `roles/memcache.viewer` | Memorystore for Memcached |
| `roles/monitoring.viewer` | Cloud Monitoring metrics for every engine |

A single custom role with the same read permissions works too.

On a self-managed install, Radar authenticates with a service account key:

1. Select **Add connection**.
2. Set the **connection type** to **Google Memorystore**.
3. Enter a **display name**.
4. Enter the **GCP project ID**, for example `my-gcp-project`.
5. Enter the **GCP regions** to scan, separated by commas, for example `us-central1, us-east1`.
6. Paste the **service account key JSON**. It must be 16 KiB or less.
7. Select **Add connection**.

Both the API server and the worker need outbound HTTPS on port 443 to `oauth2.googleapis.com`, `redis.googleapis.com`, `memorystore.googleapis.com`, `memcache.googleapis.com`, and `monitoring.googleapis.com`. Allowing `*.googleapis.com` covers the whole path.

{{<image filename="images/radar/add-connection-google-memorystore.png" alt="The Add connection dialog set to connection type Google Memorystore">}}

## Secure cluster connections

Radar holds credentials for every cluster in your fleet, so treat the connection path as sensitive.

- **Encrypt the connection.** Redis Software connections always use HTTPS. For Redis Open Source, select **Use TLS** unless the instance is unencrypted and you accept that.
- **Give Radar its own account on each cluster.** A dedicated account keeps Radar's access auditable and separate from any user's, and lets you limit what Radar can do.
- **Protect the encryption key.** On a self-managed install, every credential Radar stores is encrypted with the key you supplied at install. Back that key up alongside the database and store the backup separately. See [Install Radar]({{< relref "/operate/radar/install#the-credential-encryption-key" >}}).

## Remove or reconnect a cluster

Only administrators can remove a connection. See [Manage access]({{< relref "/operate/radar/manage-access" >}}).

Radar has no way to edit a saved connection's credentials, host, port, or scanned regions. If any of those change — for example, a rotated password or access key, or a cluster that moved to a new address — remove the connection and add it again with the new details.

To remove a connection:

1. Go to the **Connections** page.
2. Select **More options** next to the connection.
3. Select **Remove connection**.
4. Confirm the removal.

Removing a connection permanently deletes the health and usage data Radar collected through it. It does not affect the underlying Redis deployment or cloud account, and it cannot be undone.

{{< warning >}}
For a Redis Cloud account connection, removing it removes every subscription discovered through that account, not just one database.
{{< /warning >}}

## Next steps

Radar starts collecting as soon as a connection is saved. The first collection populates the fleet view, and Radar refreshes each source after that. See [Monitor clusters and databases]({{< relref "/operate/radar/monitor" >}}).
