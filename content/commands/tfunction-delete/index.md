---
arguments:
- display_text: library name
  name: library-name
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
description: Delete a JavaScript library from Redis by name
group: triggers_and_functions
hidden: false
linkTitle: TFUNCTION DELETE
module: Triggers and functions
since: 2.0.0
stack_path: docs/interact/programmability/triggers-and-functions
summary: Delete a JavaScript library from Redis by name
syntax: 'TFUNCTION DELETE "<library name>" '
syntax_fmt: TFUNCTION DELETE library name
syntax_str: ''
title: TFUNCTION DELETE
---

Delete a JavaScript library from Redis.

## Required arguments

<details open>
<summary><code>library name</code></summary>

The name of the library to delete.
</details>

## Return

`TFUNCTION DELETE` returns either

* ["OK"]({{< baseurl >}}/develop/reference/protocol-spec#resp-simple-strings) when the library was deleted correctly.
* [Error reply]({{< baseurl >}}/develop/reference/protocol-spec#resp-errors) when the library could not be deleted.

## Examples

{{< highlight bash >}}
TFUNCTION DELete lib
1) "OK"
{{</ highlight>}}

## See also

## Related topics
