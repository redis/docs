---
arguments:
- display_text: replace
  name: replace
  optional: true
  token: REPLACE
  type: pure-token
- display_text: config
  name: config
  optional: true
  token: CONFIG
  type: string
- display_text: library code
  name: library-code
  type: string
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
complexity: O(1)
description: Load a new JavaScript library into Redis
group: triggers_and_functions
hidden: false
linkTitle: TFUNCTION LOAD
module: Triggers and functions
since: 2.0.0
stack_path: docs/interact/programmability/triggers-and-functions
summary: Load a new JavaScript library into Redis
syntax: "TFUNCTION LOAD [REPLACE] [CONFIG <config>] \"<library code>\" \n"
syntax_fmt: "TFUNCTION LOAD [REPLACE] [CONFIG\_config] library code"
syntax_str: "[CONFIG\_config] library code"
title: TFUNCTION LOAD
---

Load a new JavaScript library into Redis.

## Required arguments

<details open>
<summary><code>library code</code></summary>

The library code.
</details>

## Optional arguments

<details open>
<summary><code>replace</code></summary>

Instructs Redis to replace the function if it already exists.
</details>

<details open>
<summary><code>config</code></summary>

A string representation of a JSON object that will be provided to the library on load time, for more information refer to [library configuration](../docs/concepts/Library_Configuration.md).
</details>

## Return

TFUNCTION LOAD returns either

* ["OK"]({{< baseurl >}}/develop/reference/protocol-spec#resp-simple-strings) when the library was loaded correctly.
* [Error reply]({{< baseurl >}}/develop/reference/protocol-spec#resp-errors) when the library could not be loaded.

## Examples

{{< highlight bash >}}
TFUNCTION LOAD "#!js api_version=1.0 name=lib\n redis.registerFunction('hello', ()=>{return 'Hello world'})"
1) "OK"
{{</ highlight>}}

## See also

## Related topics
