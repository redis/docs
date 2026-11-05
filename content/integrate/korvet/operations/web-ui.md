---
Title: Web UI
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Korvet includes a web-based administration console for managing topics,
  monitoring consumer groups, and inspecting storage health.
linkTitle: Web UI
weight: 50
---

Korvet includes a web-based administration console for managing topics, monitoring consumer groups, and inspecting storage health.

## Accessing the Web UI

The web UI is available at `http://localhost:8080` by default.

```bash
# Start the server
korvet server

# Open http://localhost:8080 in your browser
# (macOS: open, Linux: xdg-open)
open http://localhost:8080
```

## Authentication

The web UI uses HTTP Basic authentication. Configure the admin credentials:

```yaml
korvet:
  admin:
    username: admin
    password: admin
    bootstrap: true
```

When `bootstrap` is `true` (the default), Korvet creates the configured admin user on startup if it does not already exist. Set it to `false` once you manage admin credentials yourself.

Change the default password before exposing the UI outside a local development environment.

For local demos and development, you can disable authentication:

```bash
korvet server --korvet.admin.security-enabled=false
```

When authentication is disabled, the UI skips the login screen and all API endpoints are publicly accessible.

{{< warning >}}
Only disable authentication in trusted local environments. The `korvet demo` command uses this mode but binds to loopback (`127.0.0.1`) to keep the unauthenticated UI and broker accessible only locally.
{{< /warning >}}

## Dashboard Pages

### Topics

Browse and manage Kafka topics:

- List all topics with partition counts
- View topic configuration (retention policies, segment settings)
- Inspect messages and their content
- Monitor topic metrics and throughput

### Consumer Groups

Monitor consumer group health and activity:

- List all consumer groups
- View group members and their partition assignments
- Track committed offsets and consumer lag
- Monitor consumption progress per partition

### Brokers

View broker health and configuration:

- Broker status and connectivity
- Kafka listener addresses
- Version and build information
- Cluster metadata

### Storage

The Storage Control Plane provides comprehensive visibility into tiered storage health and operations across four tabs:

#### Redis Streams (Local Tier)

Monitor the local Redis Streams storage:

- Redis connectivity, latency, and health metrics
- Total key count and memory usage
- Per-topic/partition stream health
- Latency breakdown by Redis command
- Connection pool statistics

#### Remote Storage

Track the Iceberg cold-tier archival:

- Remote storage enabled status
- Topics using remote tier
- Offload throughput and backlog
- Per-topic archival statistics

#### Segments & Retention

Review retention policies and segment management:

- Local and total retention policies per topic (time and size)
- Segment rolling configuration (`segment.ms`, `segment.bytes`)
- Policy inheritance and overrides

#### Offload Jobs

Monitor segment archival jobs:

{{< note >}}
The Offload Jobs tab displays placeholder data in the current release. Full job tracking will be added in a future version.
{{< /note >}}

### Security

Manage Kafka SASL credentials for client authentication:

- Create, update, and delete credentials
- Support for SCRAM-SHA-256 and PLAIN mechanisms
- Credential rotation and password management

## Configuration

Customize the web UI port and binding:

```yaml
server:
  port: 8080
  address: 0.0.0.0  # Bind to all interfaces (use 127.0.0.1 for local-only)

korvet:
  admin:
    security-enabled: true  # Set to false to disable authentication
```

## Next Steps

- [Admin API]({{< relref "/integrate/korvet/operations/admin-api" >}}) for programmatic access
- [Monitoring]({{< relref "/integrate/korvet/operations/monitoring" >}}) for metrics and health checks
- [Authentication]({{< relref "/integrate/korvet/operations/authentication" >}}) for production security
