---
acl_categories:
- '@write'
- '@stream'
- '@fast'
arguments:
- key_spec_index: 0
  name: key
  type: key
- name: idmp-duration
  optional: true
  token: IDMP-DURATION
  type: integer
- name: idmp-maxsize
  optional: true
  token: IDMP-MAXSIZE
  type: integer
arity: -2
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
command_flags:
- write
- fast
complexity: O(1)
description: Sets the IDMP configuration parameters for a stream.
group: stream
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: XCFGSET
railroad_diagram: /images/railroad/xcfgset.svg
since: 8.6.0
summary: Sets the IDMP configuration parameters for a stream.
syntax_fmt: "XCFGSET key [IDMP-DURATION\_idmp-duration]\n  [IDMP-MAXSIZE\_idmp-maxsize]"
title: XCFGSET
---
Sets the IDMP (Idempotent Message Processing) configuration parameters for a stream. This command configures how long idempotent IDs are retained and the maximum number of idempotent IDs tracked per producer.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the stream key. The stream must already exist.

</details>

## Optional arguments

<details open><summary><code>IDMP-DURATION idmp-duration</code></summary>

Sets the duration in seconds that each idempotent ID (iid) is kept in the stream's IDMP map. Valid range: 1-86,400 seconds. Default: 100 seconds.

When an idempotent ID expires, it can be reused for new messages. This provides an operational guarantee that Redis will not forget an idempotency ID before the duration elapses (unless capacity is reached).

</details>

<details open><summary><code>IDMP-MAXSIZE idmp-maxsize</code></summary>

Sets the maximum number of most recent idempotent IDs kept for each producer in the stream's IDMP map. Valid range: 1-10,000 entries. Default: 100 entries.

When the capacity is reached, the oldest idempotent IDs for that producer are evicted regardless of remaining duration. This prevents unbounded memory growth.

</details>

## Behavior

- Calling `XCFGSET` clears all existing producer IDMP maps for the stream.
- At least one of `IDMP-DURATION` or `IDMP-MAXSIZE` must be specified.
- The stream must exist before calling this command.
- Configuration changes apply immediately to all future IDMP operations.

## Examples

```redis-cli
XADD mystream * field value
XCFGSET mystream IDMP-DURATION 300
XCFGSET mystream IDMP-MAXSIZE 1000
XCFGSET mystream IDMP-DURATION 600 IDMP-MAXSIZE 500
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the configuration was set successfully.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the configuration was set successfully.

{{< /multitabs >}}

## Error conditions

The command returns an error in the following cases:

- **WRONGTYPE**: The key exists but is not a stream
- **ERR no such key**: The stream does not exist
- **ERR syntax error**: Invalid command syntax or missing required arguments
- **ERR invalid duration**: Duration value is outside the valid range (1-86,400)
- **ERR invalid maxsize**: Maxsize value is outside the valid range (1-10,000)
