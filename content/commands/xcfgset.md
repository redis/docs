---
acl_categories:
- STREAM
arguments:
- key_spec_index: 0
  name: key
  type: key
- arguments:
  - name: duration-token
    token: DURATION
    type: pure-token
  - name: duration
    type: integer
  name: duration-block
  optional: true
  type: block
- arguments:
  - name: maxsize-token
    token: MAXSIZE
    type: pure-token
  - name: maxsize
    type: integer
  name: maxsize-block
  optional: true
  type: block
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
- WRITE
- FAST
complexity: O(1)
description: Sets the IDMP configuration parameters for a stream.
function: xcfgsetCommand
group: stream
hidden: false
key_specs:
- begin_search:
    index:
      pos: 1
  find_keys:
    range:
      lastkey: 0
      limit: 0
      step: 1
  flags:
  - RW
  - UPDATE
linkTitle: XCFGSET
reply_schema:
  const: OK
since: 8.6.0
summary: Sets the IDMP configuration parameters for a stream.
syntax_fmt: XCFGSET key [DURATION duration] [MAXSIZE maxsize]
title: XCFGSET
---
Sets the IDMP (Idempotent Message Processing) configuration parameters for a stream. This command configures how long idempotent IDs are retained and the maximum number of idempotent IDs tracked per producer.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the stream key. The stream must already exist.

</details>

## Optional arguments

<details open><summary><code>DURATION duration</code></summary>

Sets the duration in seconds that each idempotent ID (iid) is kept in the stream's IDMP map. Valid range: 1-86400 seconds. Default: 100 seconds.

When an idempotent ID expires, it can be reused for new messages. This provides operational guarantee that Redis will not forget an iid before the duration elapses (unless capacity is reached).

</details>

<details open><summary><code>MAXSIZE maxsize</code></summary>

Sets the maximum number of most recent idempotent IDs kept for each producer in the stream's IDMP map. Valid range: 1-10,000 entries. Default: 100 entries.

When the capacity is reached, the oldest idempotent IDs for that producer are evicted regardless of remaining duration. This prevents unbounded memory growth.

</details>

## Behavior

- Calling `XCFGSET` clears all existing producer IDMP maps for the stream
- At least one of `DURATION` or `MAXSIZE` must be specified
- The stream must exist before calling this command
- Configuration changes apply immediately to all future IDMP operations

## Examples

{{% redis-cli %}}
XADD mystream * field value
XCFGSET mystream DURATION 300
XCFGSET mystream MAXSIZE 1000
XCFGSET mystream DURATION 600 MAXSIZE 500
{{% /redis-cli %}}

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
- **ERR invalid duration**: Duration value is outside the valid range (1-86400)
- **ERR invalid maxsize**: Maxsize value is outside the valid range (1-10,000)

