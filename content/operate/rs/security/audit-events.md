---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to audit commands and connection events.
linkTitle: Audit databases
title: Audit database commands and connections
weight: 15
---

Redis Software lets you audit database connection, authentication, and command (CRUD) events. This helps you track and troubleshoot connection and data-access activity.

The following events can be tracked, depending on the configured audit mode:

- Database connection attempts
- Authentication requests, including requests for new and existing connections
- Database disconnects
- Individual database commands (CRUD operations) if command auditing is enabled

{{<note>}}
Auditing never includes replication traffic on internal connections, such as data synchronization from a primary to a replica or between Active-Active clusters, regardless of the audit configuration.
{{</note>}}

When a tracked event occurs, Redis Software sends a notification over TCP to the address and port you configure when you enable auditing. Notifications arrive in near real time for an external listener to consume, such as a TCP listener, third-party service, or related utility.

Example external listeners include:

- [`ncat`](https://nmap.org/ncat/): useful for debugging but not suitable for production environments.

- Imperva Sonar: a third-party service available for purchase separately from Redis Software. See [Redis Onboarding Steps](https://docs.imperva.com/bundle/onboarding-databases-to-sonar-reference-guide/page/Redis-Onboarding-Steps_48368215.html) for more information.

- IBM Guardium

- Other SIEM or DAM platforms

In development and testing environments, you can save notifications to a local file. This is neither supported nor intended for production.

Auditing is turned off by default for performance reasons. It runs asynchronously in the background and is non-blocking: the action that triggered a notification continues regardless of the notification's status or the listener's availability.

Redis Software always favors database availability over audit completeness. If auditing fails—for example, because an internal buffer overflows or the audit destination is unreachable—database operations continue uninterrupted. Audit buffers are size-limited to prevent memory exhaustion, and dropped records are reported through the [auditing metrics](#monitor-auditing-metrics).

## Configure cluster audit destination

Before enabling auditing on any database, configure the audit destination using one of the following methods:

{{< multitabs id="config-cluster-audit-dest"
    tab1="REST API"
    tab2="rladmin" >}}

To configure the audit destination using the REST API, use an [update database auditing]({{< relref "/operate/rs/references/rest-api/requests/cluster/auditing-db-conns#put-cluster-audit-db-conns" >}}) cluster request:

```sh
PUT https://<host>:<port>/v1/cluster/auditing/db_conns
{
    "audit_protocol": "TCP",
    "audit_address": "audit-sink.example.com",
    "audit_port": <port>,
    "audit_reconnect_interval": <seconds>,
    "audit_reconnect_max_attempts": <integer>,
    "audit_queue_max_bytes": <bytes>
}
```

-tab-sep-

To configure the audit destination using `rladmin`, run the following command:

```
rladmin cluster config auditing db_conns \
    audit_protocol <TCP|local> \
    audit_address <address> \
    audit_port <port> \
    audit_reconnect_interval <interval in seconds> \
    audit_reconnect_max_attempts <number of attempts>
```

{{< /multitabs >}}

- _audit\_protocol_ sets the protocol used to send notifications. For production systems, _TCP_ is the only supported value.

- _audit\_address_ sets the address where the listener receives notifications.

- _audit\_port_ sets the port where the listener receives notifications.
   
- _audit\_reconnect\_interval_ sets the interval, in seconds, between reconnection attempts. Default is 1 second.
    
- _audit\_reconnect\_max\_attempts_ sets the maximum number of reconnection attempts. Default is 0 (infinite).

### Local socket for testing

For testing and training, development systems can set _audit\_protocol_ to `local`. This setting is _not_ supported for production use.  
    
When `audit_protocol` is set to `local`, `<address>` should be set to a [stream socket](https://man7.org/linux/man-pages/man7/unix.7.html) defined on the machine running Redis Software and _`<port>`_ should not be specified.

{{< multitabs id="config-cluster-audit-dest-local"
    tab1="REST API"
    tab2="rladmin" >}}

To configure a local audit destination using the REST API:

```sh
PUT https://<host>:<port>/v1/cluster/auditing/db_conns
{
    "audit_protocol": "local",
    "audit_address": "/var/opt/redislabs/run/db-audit.sock"
}
```

-tab-sep-

To configure a local audit destination using `rladmin`:

```
rladmin cluster config auditing db_conns \
    audit_protocol local audit_address <socket-file>
```

{{< /multitabs >}}

The socket file and path must be accessible by the user and group running Redis Software.

## Enable command and connection auditing

After you configure the audit destination for your cluster, you can enable command (CRUD) and connection auditing for individual databases.

Enabling command auditing introduces additional processing overhead compared to connection-only auditing. The performance impact is workload-dependent and varies based on hardware, operation mix (read-heavy vs. write-heavy), throughput, and the volume of audited events.

However, you can filter by usernames, source IP addresses, or both to manage data volume, avoid capturing irrelevant traffic, and minimize the performance impact. If both filters are configured, only requests matching both criteria are audited.

{{<note>}}
Filter changes affect new client connections only. Existing connections continue to be audited based on the filters that were active when the connection was established.
{{</note>}}

To enable command and connection auditing and configure filters, use an [update database configuration]({{< relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs" >}}) REST API request:

```
PUT https://<host>:<port>/v1/bdbs/<database-id>
{
    "audit_settings": {
        "audit_mode": "connection_and_crud",
        "username_filter": {
            "enabled": true,
            "usernames": ["application-user"],
            "filter_type": "inclusive",
            "allow_while_username_unknown": false
        },
        "source_ip_filter": {
            "enabled": true,
            "ip_addresses": [],
            "cidr_ranges": ["10.20.0.0/16"],
            "filter_type": "inclusive"
        },
        "max_total_key_bytes": 131072
    }
}
```

### Inclusive versus exclusive filters

For full CRUD auditing with clear scoping, use `inclusive` filters to audit only known application users or networks.

Use `exclusive` filters when the goal is to audit everything except specific users or networks.

### Username filtering

Username filtering controls which client usernames are included in or excluded from command audit records.

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Enables the username filter. |
| `usernames` | string array | `[]` | Usernames to include or exclude. Maximum 512 entries. |
| `filter_type` | string | `inclusive` | Either `inclusive` (audit only listed usernames) or `exclusive` (audit all except listed usernames). |
| `allow_while_username_unknown` | boolean | `false` | Allows command auditing before the username is known. |

**Username validation:**

- Each username must be 1–255 characters.
- Each username must use printable ASCII characters only.
- Usernames must not contain `&`, `<`, `>`, or double-quote characters.
- If `username_filter.enabled` is `true`, `usernames` must not be empty.

### Source IP filtering

Source IP filtering controls which client IP addresses are included in or excluded from command audit records.

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Enables the source IP filter. |
| `ip_addresses` | string array | `[]` | Bare IPv4 or IPv6 addresses. |
| `cidr_ranges` | string array | `[]` | IPv4 or IPv6 CIDR ranges. |
| `filter_type` | string | `inclusive` | Either `inclusive` (audit only listed IPs) or `exclusive` (audit all except listed IPs). |

**Source IP validation:**

- `ip_addresses` must contain only bare IPv4 or IPv6 addresses and no ranges.
- `cidr_ranges` must contain only valid IPv4 or IPv6 CIDR ranges.
- If `source_ip_filter.enabled` is `true`, at least one `ip_addresses` or `cidr_ranges` entry is required.
- The combined number of `ip_addresses` and `cidr_ranges` entries cannot exceed 512.

### Key byte limit

You can set the `max_total_key_bytes` to control how much key data is captured per command audit record. The default value is `131072` and the minimum is `0`.

### Partial updates

Updates to `audit_settings` merge with the database's existing audit configuration, so you can change one setting without resending the others. For example, the following request disables the username filter while preserving its username list and filter type:

```sh
PUT https://<host>:<port>/v1/bdbs/<database-id>
{
    "audit_settings": {
        "username_filter": {
            "enabled": false
        }
    }
}
```

## Enable connection auditing only

After you configure the audit destination for your cluster, you can enable connection auditing only for individual databases using one of the following methods:

{{< multitabs id="config-db-audit-connections-only"
    tab1="REST API"
    tab2="rladmin" >}}

To enable connection auditing only using the REST API, use an [update database configuration]({{< relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs" >}}) request:

```
PUT https://<host>:<port>/v1/bdbs/<database-id>
{
    "audit_settings": {
        "audit_mode": "connection"
    }
}
```

-tab-sep-

To enable connection auditing only using `rladmin`:

```
rladmin tune db db:<id|name> db_conns_auditing enabled
```

{{< /multitabs >}}

{{<note>}}
The legacy `db_conns_auditing` field enables connection auditing only; it does not enable command (CRUD) auditing. To audit commands, set `audit_settings.audit_mode` to `connection_and_crud`. If both are set, `audit_settings.audit_mode` takes precedence.
{{</note>}}

## Set policy defaults for new databases

To audit connections for new databases by default, use one of the following methods:

{{< multitabs id="set-audit-policy-defaults"
    tab1="REST API"
    tab2="rladmin" >}}

To enable auditing connections for new databases by default using the REST API, use an [update cluster policy]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) request:

```
PUT /v1/cluster/policy
{ "db_conns_auditing": true }
```

To deactivate this policy, set `db_conns_auditing` to `false`.

-tab-sep-

To enable auditing connections for new databases by default using `rladmin`:

```sh
rladmin tune cluster db_conns_auditing enabled
```

To deactivate this policy, set `db_conns_auditing` to `disabled`.

{{< /multitabs >}} 

## Auditing validation errors

| Error code | Cause |
|---|---|
| `audit_settings_config_missing` | Attempted to enable auditing before configuring `/v1/cluster/auditing/db_conns`. |
| `audit_settings_empty_filter_list` | Enabled username or source IP filter has no entries. |
| `audit_settings_invalid_ip_address` | Invalid value in `source_ip_filter.ip_addresses`. |
| `audit_settings_invalid_cidr_range` | Invalid value in `source_ip_filter.cidr_ranges`. |
| `audit_settings_filter_list_too_large` | Combined source IP and CIDR entries exceed 512. |
| `invalid_schema` | Request violates schema constraints, such as an invalid enum, negative size, extra fields, or an over-limit array. |
| `db_conns_auditing_missing_config` | TCP audit sink is missing required configuration, such as `audit_port`. |
| `db_conns_auditing_bad_config` | Invalid sink field combination, such as `audit_port` with `local`. |
| `db_conns_auditing_bad_address` | Invalid sink address for the selected protocol. |

## Turn off auditing

To turn off auditing for a specific database:

```sh
PUT https://<host>:<port>/v1/bdbs/<database-id>
{
    "audit_settings": {
        "audit_mode": "disabled"
    }
}
```

## Notification examples

Audit event notifications are reported as JSON objects.

### New connection

This example reports a new connection for a database:

```json
{
    "ts": 1779874366,
    "new_conn": {
        "id": 13001000,
        "srcip": "127.0.0.1",
        "srcp": "46252",
        "trgip": "127.0.0.1",
        "trgp": "12000",
        "bdb_name": "D1",
        "bdb_uid": "1"
    },
    "audit_worker_id": 0,
    "audit_seq": 0
}
```

### Authentication request

Here is a sample authentication request for a database:

```json
{
    "ts": 1779874366,
    "action": "auth",
    "id": 13001000,
    "srcip": "127.0.0.1",
    "srcp": "46252",
    "trgip": "127.0.0.1",
    "trgp": "12000",
    "bdb_name": "D1",
    "bdb_uid": "1",
    "status": 2,
    "username": "default",
    "identity": "user:default",
    "acl-rules": "allkeys +@all allchannels",
    "audit_worker_id": 0,
    "audit_seq": 1
}
```

### Successful command

The following example shows the audit notification for a successful command, such as `GET myKey`:

```json
{
    "ts": 1779874374,
    "action": "command",
    "id": 13001000,
    "srcip": "127.0.0.1",
    "srcp": "46252",
    "trgip": "127.0.0.1",
    "trgp": "12000",
    "bdb_name": "D1",
    "bdb_uid": "1",
    "status": 9,
    "command": "get",
    "keys": ["myKey"],
    "full_key_size_bytes": 3,
    "captured_key_size_bytes": 3,
    "total_keys_count": 1,
    "key_truncated": false,
    "affected_count": null,
    "audit_worker_id": 0,
    "audit_seq": 3
}
```

### Failed command

The following example shows the audit notification for a failed command, such as when you run `SET` without a key:

```json
{
    "ts": 1779874378,
    "action": "command",
    "id": 13001000,
    "srcip": "127.0.0.1",
    "srcp": "46252",
    "trgip": "127.0.0.1",
    "trgp": "12000",
    "bdb_name": "D1",
    "bdb_uid": "1",
    "status": 10,
    "command": "set",
    "keys": [],
    "full_key_size_bytes": 0,
    "captured_key_size_bytes": 0,
    "total_keys_count": 0,
    "key_truncated": false,
    "affected_count": null,
    "error": "ERR wrong number of arguments for 'set' command",
    "error_truncated": false,
    "audit_worker_id": 0,
    "audit_seq": 4
}
```

### Close connection

Here's what's reported when a database connection is closed:

```json
{
    "ts": 1779874380,
    "close_conn": {
        "id": 13001000,
        "srcip": "127.0.0.1",
        "srcp": "46252",
        "trgip": "127.0.0.1",
        "trgp": "12000",
        "bdb_name": "D1",
        "bdb_uid": "1"
    },
    "audit_worker_id": 0,
    "audit_seq": 5
}
```

## Notification field reference

All audit records follow a unified JSON structure that is backward compatible with the existing authentication request format used for connection auditing.

{{<note>}}
Command audit records never include the payload value associated with a key. Only the key name is recorded.
{{</note>}}

### Record types

The field that appears immediately after the timestamp (`"ts"`) describes the action that triggered the notification:

| Type | Description |
|------|-------------|
| new_conn | Emitted when a new client connection is established. |
| auth | `"action": "auth"` indicates an authentication request and can refer to new authentication requests or authorization checks on existing connections. |
| command | `"action": "command"` indicates CRUD requests. Emitted for audited database commands. |
| close_conn | Emitted when a client connection is closed. |

### Notification fields

The following fields can appear in audit event notifications:

| Field | Type | Description |
|---|---|---|
| ts | integer | Unix timestamp of the event, in UTC. Granularity is within one second. |
| action | string | `auth` for authentication requests; `command` for CRUD requests. (Not present on `new_conn`/`close_conn` records, which are identified by their own key instead.) |
| id | integer | Unique connection ID assigned by the proxy. |
| srcip | string | Source IP address of the client. |
| srcp | string | Source port of the client connection. |
| trgip | string | Target IP address (the Redis endpoint). |
| trgp | string | Target port. |
| hname | string | Client hostname, if available. Currently empty; reserved for future use. |
| bdb_name | string | Name of the database. |
| bdb_uid | string | Unique cluster ID of the database. |
| status | integer | Result code. See [Status result codes](#status-result-codes). |
| username | string | Authentication username associated with the connection. |
| identity | string | A unique ID the proxy assigned to the user for the current connection. |
| acl-rules | string | ACL rules associated with the user. |
| group | string | LDAP group name associated with the user. Present only when the user has an associated LDAP group. |
| command | string | The Redis command name for CRUD requests. |
| keys | array[string] | The key or keys associated with the command. Empty when no keys are captured. |
| full_key_size_bytes | integer | Byte size of the full key payload before truncation. |
| captured_key_size_bytes | integer | Byte size of the key payload actually captured in the audit record. |
| total_keys_count | integer | Total number of keys referenced by the command. |
| key_truncated | boolean | Whether the captured key list was truncated. |
| affected_count | integer / null | Number of keys or elements affected by the command, when applicable. |
| error | string | Error text for failed command execution (present on failure only). |
| error_truncated | boolean | Whether the error text was truncated (present on failure only). |
| audit_worker_id | integer | ID of the proxy worker thread that produced the audit record. For debugging purposes only. |
| audit_seq | integer | Per-worker sequence number of the audit report. Useful for debugging and detecting dropped audit reports. |

### Fields by record type

The following table shows which fields can appear in each record type:

| Field | new_conn / close_conn | auth | command |
|---|---|---|---|
| ts | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| action | | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| id | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| srcip | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| srcp | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| trgip | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| trgp | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| bdb_name | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| bdb_uid | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| status | | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| username | | <span title="Supported">:white_check_mark:</span> | |
| identity | | <span title="Supported">:white_check_mark:</span> | |
| acl-rules | | <span title="Supported">:white_check_mark:</span> | |
| group | | <span title="Supported">:white_check_mark:</span> | |
| command | | | <span title="Supported">:white_check_mark:</span> |
| keys | | | <span title="Supported">:white_check_mark:</span> |
| full_key_size_bytes | | | <span title="Supported">:white_check_mark:</span> |
| captured_key_size_bytes | | | <span title="Supported">:white_check_mark:</span> |
| total_keys_count | | | <span title="Supported">:white_check_mark:</span> |
| key_truncated | | | <span title="Supported">:white_check_mark:</span> |
| affected_count | | | <span title="Supported">:white_check_mark:</span> |
| error | | | <span title="Supported">:white_check_mark:</span> |
| error_truncated | | | <span title="Supported">:white_check_mark:</span> |
| audit_worker_id | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| audit_seq | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |

### Status result codes

The `status` field reports a numeric result code. Its meaning depends on the record type: authentication requests (`"action": "auth"`) and commands (`"action": "command"`) use separate sets of codes.

#### Authentication request status codes

For authentication request records, `status` reports the result of the authentication attempt:

| Status code | Description |
|-------------|-------------|
| `0` | AUTHENTICATION_FAILED: Invalid username and/or password. |
| `2` | AUTHENTICATION_NOT_REQUIRED: Client tried to authenticate, but authentication isn't necessary. |
| `3` | AUTHENTICATION_DIRECTORY_PENDING: Attempting to receive authentication info from the directory in async mode. |
| `4` | AUTHENTICATION_DIRECTORY_ERROR: Authentication attempt failed due to a directory connection error. |
| `5` | AUTHENTICATION_SYNCER_IN_PROGRESS: Syncer SASL handshake; return SASL response and wait for the next request. |
| `6` | AUTHENTICATION_SYNCER_FAILED: Syncer SASL handshake; returned SASL response and closed the connection. |
| `7` | AUTHENTICATION_SYNCER_OK: Syncer authenticated; returned SASL response. |
| `8` | AUTHENTICATION_OK: Client successfully authenticated. |
| `9` | AUTHENTICATION_ENTRAID_ERROR: Authentication attempt failed due to an EntraID connection error. |
| `10` | AUTHENTICATION_CBA_PENDING: Certificate-based authentication (CBA) pending; waiting for the external authentication service response. |

#### Command status codes

For command records, `status` reports whether the command completed successfully:

| Status code | Description |
|-------------|-------------|
| `9` | The command completed successfully. |
| `10` | The command failed. The `error` field contains the returned error message. |

## Monitor auditing metrics

You can use the following metrics exported by Redis Software to monitor your database auditing pipeline. For more information about monitoring Redis Software, see the [monitoring v2 documentation]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}).

| Metric | Description |
|--------|---|
| audit_sink_sent_messages | Count of audit records sent to the audit sink. Does not guarantee the remote consumer received them. |
| audit_sink_sent_bytes | Total size, in bytes, of audit data sent to the audit sink. Does not guarantee the remote consumer received it. |
| audit_sink_dropped_messages | Count of audit records discarded before they could be delivered to the sink. |
| audit_sink_dropped_bytes | Total size, in bytes, of audit data discarded before delivery to the sink. |
| audit_sink_pending_bytes | Current amount of audit data waiting in the outgoing queue to be sent to the sink. |
| audit_sink_connect_events | Count of times a connection to the sink was successfully established. |
| audit_sink_disconnect_events | Count of times the connection to the sink was disconnected. |
| audit_sink_reconnect_attempts | Count of attempts to create or re-create a connection to the sink, successful or not. |
| audit_sink_reconnect_attempts_exhausted | Count of times the system gave up reconnecting after reaching the configured maximum number of attempts. |
| audit_sink_disconnect_loss_events | Total disconnect events that lost buffered audit data. |
| audit_sink_disconnect_loss_bytes | Total buffered audit bytes lost due to disconnect events. |
| audit_sink_dropped_queue_full_messages | Count of audit records discarded because an individual worker's queue had no more capacity. |
| audit_sink_dropped_record_too_large_messages | Count of audit records discarded because a single record was larger than the allowed queue byte limit. |
| audit_sink_dropped_disconnected_messages | Count of audit records discarded because there was no active connection to the sink when delivery was needed. |
| audit_sink_dropped_queue_disabled_messages | Count of audit records discarded because queuing was disabled. |
| audit_sink_dropped_send_failed_messages | Count of audit records discarded because an attempt to send them to the sink failed. |
| audit_sink_connected_workers | Number of workers that currently have an active connection to the sink. |
| audit_sink_queue_high_watermark_bytes | Sum of each worker's highest observed pending-buffer size since the process started. |
