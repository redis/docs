---
arguments:
- display_text: library name
  name: library-name
  optional: true
  token: LIBRARYNAME
  type: string
- display_text: withcode
  name: withcode
  optional: true
  token: WITHCODE
  type: pure-token
- display_text: verbose
  name: verbose
  optional: true
  token: VERBOSE
  type: pure-token
- display_text: v
  name: v
  optional: true
  token: V
  type: pure-token
bannerText: 'The triggers and functions feature of Redis Stack and its documentation
  are currently in preview, and only available in Redis Stack 7.2 or later. You can
  try out the triggers and functions preview with a [free Redis Cloud account](https://redis.com/try-free/?utm_source=redisio&utm_medium=referral&utm_campaign=2023-09-try_free&utm_content=cu-redis_cloud_users).
  The preview is available in the fixed subscription plan for the **Google Cloud Asia
  Pacific (Tokyo)** and **AWS Asia Pacific (Singapore)** regions.


  If you notice any errors in this documentation, feel free to submit an issue to
  GitHub using the "Create new issue" link in the top right-hand corner of this page.

  '
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
- readonly
complexity: O(N) where N is the number of libraries loaded into Redis
description: List all JavaScript libraries loaded into Redis
group: triggers_and_functions
hidden: false
linkTitle: TFUNCTION LIST
module: Triggers and functions
since: 2.0.0
stack_path: docs/interact/programmability/triggers-and-functions
summary: List all JavaScript libraries loaded into Redis
syntax: "TFUNCTION LIST [WITHCODE] [VERBOSE] [v] [LIBRARY <library name>] \n"
syntax_fmt: "TFUNCTION LIST [LIBRARYNAME\_library name] [WITHCODE] [VERBOSE] [V]"
syntax_str: '[WITHCODE] [VERBOSE] [V]'
title: TFUNCTION LIST
---

List the functions with additional information about each function.

## Optional arguments

<details open>
<summary><code>WITHCODE</code></summary>

Include the code in the library.
</details>

<details open>
<summary><code>VERBOSE | v</code></summary>

Increase output verbosity (can be used multiple times to increase verbosity level).
</details>

<details open>
<summary><code>LIBRARY</code></summary>

Specify a library name to show, can be used multiple times to show multiple libraries in a single command.
</details>

## Return

`TFUNCTION LIST` returns information about the requested libraries.

## Examples

{{< highlight bash >}}
TFUNCTION LIST vvv
1)  1) "engine"
    2) "js"
    3) "api_version"
    4) "1.0"
    5) "name"
    6) "lib"
    7) "pending_jobs"
    8) (integer) 0
    9) "user"
    10) "default"
    11) "functions"
    12) 1)  1) "name"
            2) "foo"
            3) "flags"
            4) (empty array)
    13) "keyspace_triggers"
    14) (empty array)
    15) "stream_triggers"
    16) (empty array)
{{</ highlight>}}

## See also

## Related topics
