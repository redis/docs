---
acl_categories:
- '@pubsub'
- '@slow'
arguments:
- display_text: pattern
  multiple: true
  name: pattern
  type: pattern
arity: -2
command_flags:
- pubsub
- noscript
- loading
- stale
complexity: O(N) where N is the number of patterns to subscribe to.
description: Listens for messages published to channels that match one or more patterns.
group: pubsub
hidden: false
linkTitle: PSUBSCRIBE
since: 2.0.0
summary: Listens for messages published to channels that match one or more patterns.
syntax_fmt: PSUBSCRIBE pattern [pattern ...]
syntax_str: ''
title: PSUBSCRIBE
---
Subscribes the client to the given patterns.

Supported glob-style patterns:

* `h?llo` subscribes to `hello`, `hallo` and `hxllo`
* `h*llo` subscribes to `hllo` and `heeeello`
* `h[ae]llo` subscribes to `hello` and `hallo,` but not `hillo`

Use `\` to escape special characters if you want to match them verbatim.

Once the client enters the subscribed state it is not supposed to issue any other commands, except for additional [`SUBSCRIBE`](/commands/subscribe), [`SSUBSCRIBE`](/commands/ssubscribe), `PSUBSCRIBE`, [`UNSUBSCRIBE`](/commands/unsubscribe), [`SUNSUBSCRIBE`](/commands/sunsubscribe), [`PUNSUBSCRIBE`](/commands/punsubscribe), [`PING`](/commands/ping), [`RESET`](/commands/reset) and [`QUIT`](/commands/quit) commands.
However, if RESP3 is used (see [`HELLO`](/commands/hello)) it is possible for a client to issue any commands while in subscribed state.

For more information, see [Pub/sub](/docs/interact/pubsub/).

## Behavior change history

*   `>= 6.2.0`: [`RESET`](/commands/reset) can be called to exit subscribed state.
