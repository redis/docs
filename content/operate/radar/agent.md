---
title: Connect clusters with an agent
alwaysopen: false
categories:
- docs
- operate
- radar
description: Install an agent to connect Redis Software and Redis Open Source clusters that Radar cannot reach directly.
linkTitle: Agent
weight: 25
---

The Radar agent collects telemetry from Redis deployments that Radar can't reach over the network. You install it on a host inside your network, and it opens an outbound connection to Radar. Radar never needs inbound access to your network.

## When to connect clusters with an agent

Use an agent when Radar can't open a connection to the cluster you want to see. This applies to Redis Software and Redis Open Source deployments behind a firewall, in a private subnet, or on a segmented network.

You don't need an agent for Redis Cloud, Amazon ElastiCache, or Google Memorystore. Radar reaches those over their provider APIs, so [connecting the account]({{< relref "/operate/radar/connect" >}}) is all the setup they need.

The agent makes one connection to Radar over Transport Layer Security (TLS), using gRPC, and separate local connections to each Redis endpoint you configure.

To verify Radar's certificate against a private certificate authority (CA), set `tls.ca_file`. That file then becomes the only trust bundle the agent uses for Radar, replacing the host's system roots rather than adding to them. Use `tls.server_name` to override the certificate name the agent verifies.

The agent runs in one of two modes. They differ in where your source credentials live.

| Mode | Radar holds source credentials | You maintain | Choose it when |
|---|---|---|---|
| Managed | Yes | Nothing on the host | You want to add and change sources from the Radar UI. |
| Static | No | A YAML file on the agent host | Source credentials must never leave the agent host. |

In managed mode, you activate the agent from its host, approve it in Radar, and enter the source details in Radar. The agent receives its configuration from Radar and reports heartbeat and per-source health back.

In static mode, a YAML file on the agent host owns the Radar key, the source endpoints, and the source credentials. Radar never holds them.

## Install the agent

Install the agent on a host that can reach both Radar and the Redis endpoints you want to collect from.

1. Get the agent archive for your platform from the [Redis Download Center](https://cloud.redis.io/#/rlec-downloads), under **Modules, tools and integrations**.

   <br>

2. Verify the download.

   ```bash
   sha256sum -c SHA256SUMS
   ```

   <br>

3. Extract the archive and install the binary.

   The archive contains the `radar-agent` binary, a systemd unit and environment template, and an example static configuration.

   <br>

4. Confirm the version you installed.

   ```bash
   radar-agent version
   ```

   The agent must report version `1.0.0` or newer. Radar rejects an older agent on every request and names the minimum version in the error.

   <br>

5. Create the service account and directories.

   The agent runs as the `mcm` service account and uses two directories: `/etc/radar-agent` for configuration and `/var/lib/radar-agent` for runtime state. Both hold secrets, so make them readable only by their owner.

   <br>

6. Install the systemd service from the template in the archive, then reload, start, and enable it.

## Set up a managed agent

1. In Radar, go to **Settings > Agents** and select **Activate managed agent**.

   Radar shows an activation command and a daemon command.

   {{<image filename="images/radar/activate-managed-agent.png" alt="The Activate managed agent dialog, showing the activation command and the daemon command" width="75%">}}

   <br>

2. Run the activation command on the agent host.

   ```bash
   radar-agent activate \
     --endpoint <radar-agent-grpc-host>:9443 \
     --state-dir /var/lib/radar-agent \
     --display-name <agent-name>
   ```

   The command waits for approval and prints an activation code. Note the code — you use it to identify this host in Radar.

   <br>

3. In Radar, find the request under **Pending activations**, confirm the activation code matches, and select **Approve**.

   {{<image filename="images/radar/settings-agents.png" alt="The Agents tab, showing pending activations with Approve and Deny actions above the registered agents list" width="90%">}}

   Activation requests expire, so approve the request while the command is still waiting.

   <br>

4. Enter the Redis Software or Redis Open Source connection details in the approval form.

   Radar stores these credentials and sends them to the agent over the authenticated connection.

   <br>

5. Start the agent.

   ```bash
   radar-agent daemon --managed --state-dir /var/lib/radar-agent
   ```

To change an agent's sources later, go to **Settings > Agents**, find the agent under **Registered agents**, and select **Edit connections**.

{{< note >}}
Managed mode stores the credential it was issued in `/var/lib/radar-agent/agent-key.json`. Keep that file readable only by its owner. The configuration cache Radar writes alongside it holds no secrets.
{{< /note >}}

## Set up a static agent

1. In Radar, go to **Settings > Agents** and select **Provision static agent**.

   Radar returns an agent ID and a one-time access token in the form `<key_id>.<secret>`. Copy both now — Radar shows the token once.

   Manage these tokens later under **Settings > Access keys**.

   {{<image filename="images/radar/settings-access-keys.png" alt="The Access keys tab, listing credential keys with their creation date, last use, and Revoke action" width="90%">}}

   <br>

2. Generate one universally unique identifier (UUID) for each Redis source you plan to collect from.

   ```bash
   uuidgen
   ```

   <br>

3. Create `/etc/radar-agent/config.yaml` from the example in the archive, and fill in the agent ID, the token, and one UUID per source.

   <br>

4. Validate the configuration.

   ```bash
   radar-agent validate --config /etc/radar-agent/config.yaml
   ```

   <br>

5. Collect from every source and print a redacted summary, without submitting anything to Radar.

   ```bash
   radar-agent dry-run --config /etc/radar-agent/config.yaml
   ```

   <br>

6. Submit one collection to confirm the connection to Radar works.

   ```bash
   radar-agent once --config /etc/radar-agent/config.yaml
   ```

   Radar creates each source the first time that source submits telemetry, using the `name` you gave it as the display label.

   <br>

7. Start the agent.

   ```bash
   radar-agent daemon --config /etc/radar-agent/config.yaml --metrics-addr 127.0.0.1:9090
   ```

{{< note >}}
Don't also add a static agent's sources as regular Radar connections. In static mode the endpoint and credential values belong only in the agent's YAML file.
{{< /note >}}

### Configuration reference

Static mode uses a single YAML file. Managed mode doesn't use one.

| Setting | Description |
|---|---|
| `agent.id` | The agent ID Radar returned when you provisioned the agent. It must match the identity bound to the token, or Radar denies every submission. |
| `agent.version` | Optional. Defaults to the version of the installed binary. |
| `radar.endpoint` | The Radar agent endpoint, as `host:port`. |
| `radar.agent_key` | The one-time token, as `<key_id>.<secret>`. |
| `radar.tls.ca_file` | Optional. A PEM bundle used to verify Radar's certificate, replacing the host's system roots. |
| `radar.tls.server_name` | Optional. Overrides the certificate name the agent verifies. |
| `collection.interval` | How often the agent collects when running as a daemon. |
| `collection.timeout` | The limit on a single collection. |
| `sources[].id` | The UUID you generated for this source. |
| `sources[].name` | A readable name. Radar uses it as the source's display label. |
| `sources[].type` | Either `redis_enterprise` for Redis Software or `redis_oss` for Redis Open Source. |

A `redis_enterprise` source takes `base_url`, `username`, and `password`. To collect from a cluster running an older Redis Software version, set `old_version_compatibility.enabled` to `true`.

A `redis_oss` source takes `host`, `port`, and `password`. Set `username` only if you connect as an access control list (ACL) user.

Both source types accept their own TLS settings. You can reference environment variables instead of writing secrets into the file.

### Collect from an isolated network

When the agent host can't reach Radar at all, collect and submit in two steps from different hosts.

1. On the host that can reach your Redis sources, collect to a file.

   ```bash
   radar-agent export --config /etc/radar-agent/config.yaml --output telemetry.json
   ```

   <br>

2. Move the file to a host that can reach Radar, then submit it.

   ```bash
   radar-agent submit-export --config /etc/radar-agent/config.yaml --input telemetry.json
   ```

The exported file holds sanitized telemetry only. It never contains your Radar token or your source credentials.

## Monitor and secure the agent

Every agent appears in Radar under **Settings > Agents** and in the **Connected agents** list on the Connections page. Radar shows each agent's mode, platform, version, last heartbeat, and health, and rolls up the health of the sources it collects from.

{{<image filename="images/radar/connections-with-agents.png" alt="The Connections page, with the Connected agents list showing each agent's mode, platform, version, and status" width="90%">}}

To expose health and metrics endpoints on the agent host, pass `--metrics-addr` when you start the daemon:

- `GET /healthz` returns a health snapshot. It returns `200` when the agent is healthy and `503` when a source is failing.
- `GET /metrics` returns per-source collection, submission, and failure counters in Prometheus format.

{{< warning >}}
These endpoints are unauthenticated. Bind them to loopback, as in `--metrics-addr 127.0.0.1:9090`, or put a firewall in front of them.
{{< /warning >}}

Use `radar-agent health` to read the health snapshot the daemon writes locally. Use `journalctl` for the agent's logs and `systemctl` to restart it.

To keep an agent secure, restrict `/etc/radar-agent/config.yaml` and `/var/lib/radar-agent/agent-key.json` to their owner, since both hold secrets. Never set `tls.insecure_skip_verify` outside local development — it turns off certificate verification. To cut off an agent, revoke its key under **Settings > Access keys**; revoking takes effect centrally and the agent can no longer connect.

Source passwords and the agent's token are redacted from logs, diagnostics, health output, error messages, and export bundles.

## Upgrade or remove the agent

To upgrade, replace the binary, run `radar-agent validate` if you use static mode, then restart the service. Keep `/etc/radar-agent` and `/var/lib/radar-agent` in place — the agent needs its state to stay registered.

Radar enforces a version policy on every request. An agent older than the minimum supported version is rejected until you upgrade it. An agent newer than the Radar deployment supports is also rejected, and Radar asks for a server upgrade instead.

A managed agent has to be activated again if Radar's database is reset. Remove the old state directory, run `radar-agent activate`, and start the daemon again.

To remove the agent, run `systemctl stop` and `systemctl disable` on the service, then delete the binary, `/etc/radar-agent`, and `/var/lib/radar-agent`. Revoke its key in Radar under **Settings > Access keys**.

## Next steps

After the agent reports its first collection, its sources appear alongside your other clusters. See [Monitor your fleet]({{< relref "/operate/radar/monitor" >}}).
