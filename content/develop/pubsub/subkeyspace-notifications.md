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

Subkey notifications, added in Redis 8.8, extend Redis's existing [keyspace notification](/content/develop/pubsub/keyspace-notifications.md) system to include the key, the subkey (for example, the field for hashes, the member for sets, the path for JSON documents, and the element for arrays), and the event type.

With standard keyspace notifications, when a hash field is modified via [`HSET`](/content/commands/hset.md), [`HDEL`](/content/commands/hdel.md), or [`HEXPIRE`](/content/commands/hexpire.md), the subscriber receives the key name and the event type but not which specific fields were affected. Subkey notifications solve this by carrying the affected field names in the message payload. The same applies to set members changed by set member expiration commands such as [`SEXPIRE`](/content/commands/sexpire.md).

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
    h     Hash commands.
    s     Set commands.

These flags are **independent** from the existing key-level flags (`K`, `E`, and so on). You may enable any combination. However, Redis only delivers subkey events for the data types whose class flag is also enabled: `h` for hashes, `s` for sets, or `A` for all types. For example, to enable only the subkeyspace and subkeyevent channels for hashes:

    $ redis-cli config set notify-keyspace-events STh

To enable all four subkey channel types for hashes and sets:

    $ redis-cli config set notify-keyspace-events STIVhs

### Commands emitting subkey notifications

The following hash and set commands emit subkey notifications. Other set commands, including [`SADD`](/content/commands/sadd.md), [`SREM`](/content/commands/srem.md), and [`SMOVE`](/content/commands/smove.md), generate only key-level events.

| Command | Event | Subkeys included |
|---|---|---|
| [`HSET`](/content/commands/hset.md) / [`HMSET`](/content/commands/hmset.md) | `hset` | All fields being set |
| [`HSETNX`](/content/commands/hsetnx.md) | `hset` | The field (only if it was set) |
| [`HDEL`](/content/commands/hdel.md) | `hdel` | All fields deleted |
| [`HGETDEL`](/content/commands/hgetdel.md) | `hdel` / `hexpired` | Deleted or lazily expired fields |
| [`HGETEX`](/content/commands/hgetex.md) | `hexpire` / `hpersist` / `hdel` / `hexpired` | Affected fields per event type |
| [`HINCRBY`](/content/commands/hincrby.md) | `hincrby` | The field |
| [`HINCRBYFLOAT`](/content/commands/hincrbyfloat.md) | `hincrbyfloat` | The field |
| [`HEXPIRE`](/content/commands/hexpire.md) / [`HPEXPIRE`](/content/commands/hpexpire.md) / [`HEXPIREAT`](/content/commands/hexpireat.md) / [`HPEXPIREAT`](/content/commands/hpexpireat.md) | `hexpire` | Fields whose TTLs were updated |
| [`HPERSIST`](/content/commands/hpersist.md) | `hpersist` | Fields that were persisted |
| [`HSETEX`](/content/commands/hsetex.md) | `hset` / `hdel` / `hexpire` / `hexpired` | Affected fields per event type |
| Subkey expiration (active or lazy) | `hexpired` | All expired fields, batched into a single notification |
| [`SADDEX`](/content/commands/saddex.md) | `sadd` / `srem` / `sexpire` | Affected members per event type |
| [`SEXPIRE`](/content/commands/sexpire.md) / [`SPEXPIRE`](/content/commands/spexpire.md) / [`SEXPIREAT`](/content/commands/sexpireat.md) / [`SPEXPIREAT`](/content/commands/spexpireat.md) | `sexpire` / `srem` | Members whose TTLs were updated, or members removed by a TTL of 0 or a time in the past |
| [`SPERSIST`](/content/commands/spersist.md) | `spersist` | Members that were persisted |
| Set member expiration (active or lazy) | `sexpired` | Expired members |

### Watching events in real time

To observe subkey notifications, enable the desired channel types and use `redis-cli` to subscribe with a glob pattern:

    $ redis-cli config set notify-keyspace-events STh
    $ redis-cli --csv psubscribe '__subkey*'
    Reading messages... (press Ctrl-C to quit)
    "psubscribe","__subkey*",1

Then, in another terminal, run a command:

    $ redis-cli hset myhash field1 val1 field2 val2

You will see messages similar to the following:

    "pmessage","__subkey*","__subkeyspace@0__:myhash","hset|6:field1,6:field2"
    "pmessage","__subkey*","__subkeyevent@0__:hset","6:myhash|6:field1,6:field2"
