---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Monitor changes to individual subkeys in real time
linkTitle: Subkey notifications
title: Redis subkey notifications
weight: 5
---

Subkey notifications, added in Redis 8.8, extend Redis's existing [keyspace notification]({{< relref "/develop/pubsub/keyspace-notifications" >}}) system to include the key, the subkey (for example, the field for hashes, the path for JSON documents, and the element for arrays), and the event type.

With standard keyspace notifications, when a hash field is modified via [`HSET`]({{< relref "/commands/hset" >}}), [`HDEL`]({{< relref "/commands/hdel" >}}), or [`HEXPIRE`]({{< relref "/commands/hexpire" >}}), the subscriber receives the key name and the event type but not which specific fields were affected. Subkey notifications solve this by carrying the affected field names in the message payload.

Subkey notifications are delivered through Pub/Sub channels and are independent of the standard keyspace/keyevent notification channels. Enabling subkey notifications does **not** implicitly enable standard keyspace notifications, and vice versa.

Note: Redis Pub/Sub is *fire and forget*. If your Pub/Sub client disconnects and reconnects later, all events delivered during the disconnection period are lost.

### Notification channels

Four new channel types are available, each suited to a different subscription pattern:

| Channel format | Payload |
|---|---|
| `__subkeyspace@<db>__:<key>` | `<event>\|<len>:<subkey>[,...]` |
| `__subkeyevent@<db>__:<event>` | `<key_len>:<key>\|<len>:<subkey>[,...]` |
| `__subkeyspaceitem@<db>__:<key>\n<subkey>` | `<event>` |
| `__subkeyspaceevent@<db>__:<event>\|<key>` | `<len>:<subkey>[,...]` |

**Design rationale:**

- **Subkeyspace** (`__subkeyspace@<db>__:<key>`): Subscribe to a specific key; each message contains an event type and subkey names.
- **Subkeyevent** (`__subkeyevent@<db>__:<event>`): Subscribe to a specific event type; each message contains a key name and subkey names.
- **Subkeyspaceitem** (`__subkeyspaceitem@<db>__:<key>\n<subkey>`): Subscribe to a specific key and subkey name combination; each message contains an event type.
- **Subkeyspaceevent** (`__subkeyspaceevent@<db>__:<event>|<key>`): Subscribe to a specific event and key combination; each message contains subkey names.

Subkeys in the payload are encoded in a length-prefixed format (`<len>:<subkey>`) to support binary-safe subkey names that may contain delimiter characters.

**Safeguards:**

- Events whose name contains `|` are skipped for the `__subkeyspace` and `__subkeyspaceevent` channels to avoid parsing ambiguity.
- Keys containing `\n` are skipped for the `__subkeyspaceitem` channel because newline is the key/subkey separator.
- Subkey events are only published when at least one subkey is present.

### Configuration

Subkey notifications are controlled by the existing `notify-keyspace-events` configuration string. Four new flag characters are added:

    S     Subkeyspace events, published with __subkeyspace@<db>__ prefix.
    T     Subkeyevent events, published with __subkeyevent@<db>__ prefix.
    I     Subkeyspaceitem events, published with __subkeyspaceitem@<db>__ prefix.
    V     Subkeyspaceevent events, published with __subkeyspaceevent@<db>__ prefix.

These flags are **independent** from the existing key-level flags (`K`, `E`, and so on). You may enable any combination. For example, to enable only the subkeyspace and subkeyevent channels:

    $ redis-cli config set notify-keyspace-events ST

To enable all four subkey channel types:

    $ redis-cli config set notify-keyspace-events STIV

### Supported commands

The following commands emit subkey notifications. Currently, only hash commands are supported; support for additional data types is planned for future releases.

| Command | Event | Subkeys included |
|---|---|---|
| [`HSET`]({{< relref "/commands/hset" >}}) / [`HMSET`]({{< relref "/commands/hmset" >}}) | `hset` | All subkeys being set |
| [`HSETNX`]({{< relref "/commands/hsetnx" >}}) | `hset` | The subkey (only if it was set) |
| [`HDEL`]({{< relref "/commands/hdel" >}}) | `hdel` | All subkeys deleted |
| [`HGETDEL`]({{< relref "/commands/hgetdel" >}}) | `hdel` / `hexpired` | Deleted or lazily expired subkeys |
| [`HGETEX`]({{< relref "/commands/hgetex" >}}) | `hexpire` / `hpersist` / `hdel` / `hexpired` | Affected subkeys per event type |
| [`HINCRBY`]({{< relref "/commands/hincrby" >}}) | `hincrby` | The subkey |
| [`HINCRBYFLOAT`]({{< relref "/commands/hincrbyfloat" >}}) | `hincrbyfloat` | The subkey |
| [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) / [`HPEXPIRE`]({{< relref "/commands/hpexpire" >}}) / [`HEXPIREAT`]({{< relref "/commands/hexpireat" >}}) / [`HPEXPIREAT`]({{< relref "/commands/hpexpireat" >}}) | `hexpire` | Subkeys whose TTLs were updated |
| [`HPERSIST`]({{< relref "/commands/hpersist" >}}) | `hpersist` | Subkeys that were persisted |
| [`HSETEX`]({{< relref "/commands/hsetex" >}}) | `hset` / `hdel` / `hexpire` / `hexpired` | Affected subkeys per event type |
| Subkey expiration (active or lazy) | `hexpired` | All expired subkeys, batched into a single notification |

### Watching events in real time

To observe subkey notifications, enable the desired channel types and use `redis-cli` to subscribe with a glob pattern:

    $ redis-cli config set notify-keyspace-events ST
    $ redis-cli --csv psubscribe '__subkey*'
    Reading messages... (press Ctrl-C to quit)
    "psubscribe","__subkey*",1

Then, in another terminal, run a command:

    $ redis-cli hset myhash field1 val1 field2 val2

You will see messages similar to the following:

    "pmessage","__subkey*","__subkeyspace@0__:myhash","hset|7:field1,7:field2"
    "pmessage","__subkey*","__subkeyevent@0__:hset","5:myhash|7:field1,7:field2"
