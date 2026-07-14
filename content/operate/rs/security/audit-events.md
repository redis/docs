---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to audit connection events.
linkTitle: Audit events
title: Audit connection events
weight: 15
---

Starting with version 6.2.18, Redis Software lets you audit database connection and authentication events.  This helps you track and troubleshoot connection activity.

The following events are tracked:

- Database connection attempts
- Authentication requests, including requests for new and existing connections
- Database disconnects

When tracked events are triggered, notifications are sent via TCP to an address and port defined when auditing is enabled.  Notifications appear in near real time and are intended to be consumed by an external listener, such as a TCP listener, third-party service, or related utility.

Example external listeners include:

- [`ncat`](https://nmap.org/ncat/): useful for debugging but not suitable for production environments.

- Imperva Sonar: a third-party service available for purchase separately from Redis Software. See [Redis Onboarding Steps](https://docs.imperva.com/bundle/onboarding-databases-to-sonar-reference-guide/page/Redis-Onboarding-Steps_48368215.html) for more information.

For development and testing environments, notifications can be saved to a local file; however, this is neither supported nor intended for production environments.

For performance reasons, auditing is not enabled by default.  In addition, auditing occurs in the background (asynchronously) and is non-blocking by design.  That is, the action that triggered the notification continues without regard to the status of the notification or the listening tool.  

## Enable audit notifications

### Cluster audits

To enable auditing for your cluster, use:

- `rladmin`

    ```
    rladmin cluster config auditing db_conns \
       audit_protocol <TCP|local> \
       audit_address <address> \
       audit_port <port> \
       audit_reconnect_interval <interval in seconds> \
       audit_reconnect_max_attempts <number of attempts>
    ```

    where:

    - _audit\_protocol_ indicates the protocol used to process notifications.  For production systems, _TCP_ is the only value. 

    - _audit\_address_ defines the TCP/IP address where one can listen for notifications

    - _audit\_port_ defines the port where one can listen for notifications
   
    - _audit\_reconnect\_interval_ defines the interval (in seconds) between attempts to reconnect to the listener. Default is 1 second.
    
    - _audit\_reconnect\_max\_attempts_ defines the maximum number of attempts to reconnect. Default is 0. (infinite)

    Development systems can set _audit\_protocol_ to `local` for testing and training purposes; however, this setting is _not_ supported for production use.  
    
    When `audit_protocol` is set to `local`, `<address>` should be set to a [stream socket](https://man7.org/linux/man-pages/man7/unix.7.html) defined on the machine running Redis Software and _`<port>`_ should not be specified:

    ```
    rladmin cluster config auditing db_conns \
       audit_protocol local audit_address <socket-file>
    ```

    The socket file (and path) must be accessible by the user and group running Redis Software.

- the [REST API]({{< relref "/operate/rs/references/rest-api/requests/cluster/auditing-db-conns#put-cluster-audit-db-conns" >}})

    ```
    PUT /v1/cluster/auditing/db_conns
    { 
        "audit_address": "<address>", 
        "audit_port": <port>, 
        "audit_protocol": "TCP",
        "audit_reconnect_interval": <interval>,
        "audit_reconnect_max_attempts": <max attempts>
    }
    ```

    where `<address>` is a string containing the TCP/IP address, `<port>` is a numeric value representing the port, `<interval>` is a numeric value representing the interval in seconds, and `<max attempts>` is a numeric value representing the maximum number of attempts to execute.

### Database audits

Once auditing is enabled for your cluster, you can audit individual databases.  To do so, use:

- `rladmin`

    ```
    rladmin tune db db:<id|name> db_conns_auditing enabled
    ```

    where the value of the _db:_ parameter is either the cluster ID of the database or the database name.

    To deactivate auditing, set `db_conns_auditing` to `disabled`.

    Use `rladmin info` to retrieve additional details:

    ```
    rladmin info db <id|name>
    rladmin info cluster
    ```

- the [REST API]({{< relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs" >}})

    ```
    PUT /v1/bdbs/1
    { "db_conns_auditing": true }
    ```

    To deactivate auditing, set `db_conns_auditing` to `false`.

You must enable auditing for your cluster before auditing a database; otherwise, an error appears:

>  _Error setting description: Unable to enable DB Connections Auditing before feature configurations are set.                                                                                                  
>  Error setting error_code: db_conns_auditing_config_missing_

To resolve this error, enable the protocol for your cluster _before_ attempting to audit a database.

### Policy defaults for new databases

To audit connections for new databases by default, use:

- `rladmin`

    ```
    rladmin tune cluster db_conns_auditing enabled
    ```

    To deactivate this policy, set `db_conns_auditing` to `disabled`.

- the [REST API]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}})

    ```
    PUT /v1/cluster/policy
    { "db_conns_auditing": true }
    ```

    To deactivate this policy, set `db_conns_auditing` to `false`.

## Notification examples

Audit event notifications are reported as JSON objects.

### New connection

This example reports a new connection for a database:

``` json
{
    "ts":1655821384,
    "new_conn":
    {
        "id":2285001002 ,
        "srcip":"127.0.0.1",
        "srcp":"39338",
        "trgip":"127.0.0.1",
        "trgp":"12635",
        "hname":"",
        "bdb_name":"DB1",
        "bdb_uid":"5"
    }
}
```

### Authentication request

Here is a sample authentication request for a database:

``` json
{
    "ts":1655821384,
    "action":"auth",
    "id":2285001002 ,
    "srcip":"127.0.0.1",
    "srcp":"39338",
    "trgip":"127.0.0.1",
    "trgp":"12635",
    "hname":"",
    "bdb_name":"DB1",
    "bdb_uid":"5",
    "status":2,
    "username":"user_one",
    "identity":"user:1",
    "acl-rules":"~* +@all"
}
```

The `status` field reports the following: 

- Values of 2, 7, or 8 indicate success.

- Values of 3 or 5 indicate that the client authentication is in progress and should conclude later.

- Other values indicate failures.

### Database disconnect

Here's what's reported when a database connection is closed:

``` json
{
    "ts":1655821384,
    "close_conn":
    {
        "id":2285001002,
        "srcip":"127.0.0.1",
        "srcp":"39338",
        "trgip":"127.0.0.1",
        "trgp":"12635",
        "hname":"",
        "bdb_name":"DB1",
        "bdb_uid":"5"
    }
}
```

## Notification field reference

All audit records follow a unified JSON structure that is backward compatibible with the existing authentication request format used for connection auditing.

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

In addition, the following fields may also appear in audit event notifications:

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
| command | string | The Redis command name for CRUD requests. |
| keys | array[string] | The key(s) associated with the command. Empty when no keys are captured. |
| full_key_size_bytes | integer | Byte size of the full key payload before truncation. |
| captured_key_size_bytes | integer | Byte size of the key payload actually captured in the audit record. |
| total_keys_count | integer | Total number of keys referenced by the command. |
| key_truncated | boolean | Whether the captured key list was truncated. |
| affected_count | integer / null | Number of keys or elements affected by the command, when applicable. |
| error` | string | Error text for failed command execution (present on failure only). |
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
| hname | <span title="Supported">:white_check_mark:</span> | | |
| bdb_name | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| bdb_uid | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| status | | <span title="Supported">:white_check_mark:</span> | <span title="Supported">:white_check_mark:</span> |
| username | | <span title="Supported">:white_check_mark:</span> | |
| identity | | <span title="Supported">:white_check_mark:</span> | |
| acl-rules | | <span title="Supported">:white_check_mark:</span> | |
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

The `status` field reports the result of an auditing request as a numeric code:

| Status code | Description |
|-------------|-------------|
| `0` | AUTHENTICATION_FAILED: Invalid username and/or password. |
| `1` | AUTHENTICATION_FAILED_TOO_LONG: Username or password are too long. |
| `2` | AUTHENTICATION_NOT_REQUIRED: Client tried to authenticate, but authentication isn't necessary. |
| `3` | AUTHENTICATION_DIRECTORY_PENDING: Attempting to receive authentication info from the directory in async mode. |
| `4` | AUTHENTICATION_DIRECTORY_ERROR: Authentication attempt failed due to a directory connection error. |
| `5` | AUTHENTICATION_SYNCER_IN_PROGRESS: Syncer SASL handshake; return SASL response and wait for the next request. |
| `6` | AUTHENTICATION_SYNCER_FAILED: Syncer SASL handshake; returned SASL response and closed the connection. |
| `7` | AUTHENTICATION_SYNCER_OK: Syncer authenticated; returned SASL response. |
| `8` | AUTHENTICATION_OK: Client successfully authenticated. |
| `9` | CRUD command executed successfully. |
| `10` | CRUD command execution failed. The `error` field is populated with the Redis error. |

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
