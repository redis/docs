---
title: Connect clusters
alwaysopen: false
categories:
- docs
- operate
- radar
description: Add Redis Software, Redis Cloud, and Redis Open Source clusters to Radar.
linkTitle: Connect
weight: 20
---

Radar does not find clusters on its own. You add each one, Radar tests the connection, and from then on the worker collects that cluster's state on a schedule.

Adding a cluster to Radar does not change it. Radar reads through the same management interfaces you already use.

## What you can connect

| Type | How Radar reaches it | What you supply |
|---|---|---|
| [Redis Software](#connect-a-redis-software-cluster) | The cluster REST API, over HTTPS on port 9443 | A hostname or IP address, plus an account on the cluster |
| [Redis Cloud](#connect-a-redis-cloud-account) | The Redis Cloud API | An account key and a user secret |
| [Redis Open Source](#connect-a-redis-open-source-instance) | The instance directly, or the Radar agent | A hostname and port, plus credentials if the instance requires them |

One Redis Cloud connection covers every subscription and database in that account. Redis Software and Redis Open Source connections are per cluster or per instance.

## Before you connect

For every connection you need two things:

- **Credentials for the cluster's management interface.** Radar uses the cluster's own API, so it needs an account there. Reading the cluster's state is all Radar needs for monitoring. If you also want to [update licenses]({{< relref "/operate/radar/licenses-and-certificates#update-a-cluster-license" >}}) from Radar, the account needs permission to do that too.
- **Network access from Radar to the cluster.** Radar connects outbound. Nothing needs to connect back to Radar, so no inbound rule is required on the Radar host.

Radar encrypts every credential you give it before storing it, using the key you supplied at install. Credentials are never returned through the API and never written to logs.

## Connect a Redis Software cluster

Radar reads Redis Software clusters through the cluster REST API.

1. Go to **Connections** and add a connection.
2. Select **Redis Software**.
3. Enter a **display name**. Use something you can recognize in a fleet-wide list, such as `Production East 1`.
4. Enter the cluster's **hostname or IP address**, for example `cluster.redis.internal` or `10.0.0.1`.
5. Enter the **port**. The default is `9443`, the cluster REST API port.
6. Enter the **username** and **password** of an account on the cluster.
7. Select **Test connection**, then save.

Radar always reaches the REST API over HTTPS.

{{< note >}}
Point Radar at the cluster's fully qualified domain name rather than one node's address. A node address works until that node is unavailable, at which point Radar reports the whole cluster as unreachable.
{{< /note >}}

## Connect a Redis Cloud account

A Redis Cloud connection uses the Redis Cloud API, so it covers every subscription and database in the account at once.

1. Create a Redis Cloud API key. You need both the **account key** and a **user secret**. See [Redis Cloud API]({{< relref "/operate/rc/api" >}}).
2. In Radar, go to **Connections** and add a connection.
3. Select **Redis Cloud**.
4. Enter a **display name**.
5. Enter the **account key** and the **user secret**.
6. Select **Test connection**, then save.

## Connect a Redis Open Source instance

Radar reaches Redis Open Source two ways. Choose based on whether Radar can open a connection to the instance.

| Path | Use it when |
|---|---|
| [Direct endpoint](#direct-endpoint) | Radar can reach the instance over the network. |
| [Radar agent](#radar-agent) | The instance sits in a network Radar cannot reach. |

### Direct endpoint

1. Go to **Connections** and add a connection.
2. Select **Redis Open Source**.
3. Enter a **display name**.
4. Enter the **hostname or IP address** and **port**. The default port is `6379`.
5. Enter a **username** and **password** if the instance requires authentication. Leave both empty if it does not.
6. Select **Use TLS** if the instance requires an encrypted connection.
7. Select **Test connection**, then save.

### Radar agent

The agent runs next to instances Radar cannot reach and reports back to Radar, so the connection is made outbound from your network. The RPM installs the agent alongside Radar; it can also run on its own host.

The agent runs in one of two modes.

**Managed mode** gets its configuration and credentials from Radar after you approve it. Activate the agent from the host that runs it:

```bash
sudo -u mcm /usr/libexec/mcm/radar-agent activate \
  --endpoint radar-agent-grpc.example.test:9443 \
  --state-dir /var/lib/radar-agent \
  --display-name edge-collector-01
```

Approve the agent in Radar, then set its mode and start it:

```bash
sudo systemctl start radar-agent.service
sudo systemctl status radar-agent.service
```

**Static mode** keeps the configuration and credentials in a file on the agent host, which is the right choice when credentials must not leave your network. Create the file, protect it, and validate it before starting the service:

```bash
sudo install -o root -g mcm -m 0640 /path/to/config.yaml /etc/radar-agent/config.yaml
sudo -u mcm /usr/libexec/mcm/radar-agent validate --config /etc/radar-agent/config.yaml
sudo -u mcm /usr/libexec/mcm/radar-agent once --config /etc/radar-agent/config.yaml
```

Static mode can also run fully offline. Export what the agent collected, move the file, and submit it separately:

```bash
sudo -u mcm /usr/libexec/mcm/radar-agent export \
  --config /etc/radar-agent/config.yaml \
  --output /var/tmp/radar-agent-export.json
sudo -u mcm /usr/libexec/mcm/radar-agent submit-export \
  --config /etc/radar-agent/config.yaml \
  --input /var/tmp/radar-agent-export.json
```

A managed agent uses only the credentials Radar assigns it. If Radar has no stored credential for a source it has been assigned, the agent reports the failure rather than trying default or anonymous credentials.

## Secure cluster connections

Radar holds credentials for every cluster in your fleet, which makes the connection path worth treating as sensitive on its own terms.

**Encrypt the connection.** Redis Software connections always use HTTPS. For Redis Open Source, select **Use TLS** unless the instance is unencrypted and you accept that.

**Give Radar its own account on each cluster.** A dedicated account keeps Radar's access auditable and separable from a person's, and lets you scope its permissions to what you actually want Radar to do. Monitoring needs read access only.

**Keep credentials out of your network only when you choose to.** A managed agent receives credentials from Radar. Static mode keeps them in a file on the agent host instead, so use static mode when credentials must stay local.

**Protect the encryption key.** Every credential Radar stores is encrypted with the key you supplied at install. Back that key up alongside the database and store the backup separately. See [Install Radar]({{< relref "/operate/radar/install#the-credential-encryption-key" >}}).

<!-- TODO(DOC-6912): RED-197466 makes replacing username/password for cluster connections a hard GA gate, and the mechanism is still TBD (no PM; ask Guy). This section documents only what is verifiable today. When the mechanism lands, it likely becomes the primary path here and may warrant its own page. Do not describe it before it is decided. -->

## Next steps

Radar starts collecting as soon as a connection is saved. The first collection populates the fleet view; after that, each cluster is refreshed on its own schedule. See [Monitor clusters and databases]({{< relref "/operate/radar/monitor" >}}).
