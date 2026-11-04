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
description: The key's hash slot is moving to another cluster node, and the key may already be there.
linkTitle: ASK
title: ASK error
weight: 21
error:
  prefix: ASK
  message: ASK <slot> <endpoint>:<port>
  match:
  - AskError
---

A Redis cluster returns this error while a hash slot is moving from one node to another, for example, while you reshard the cluster. The key you asked for isn't on the node you sent the command to, so it may already be on the new node. The error gives the slot number and the new node's address:

```
ASK 8000 127.0.0.1:6461
```

In redis-py, this error is `AskError: 8000 127.0.0.1:6461`.

## Example

During the move, the old node no longer has the key:

```
> GET user:{42}:cart
(error) ASK 8000 127.0.0.1:6461
```

## How to fix it

- **Your client doesn't support clusters.** Use a cluster client, which handles `ASK` errors for you, as it does [`MOVED`](/content/develop/reference/errors/common/moved.md) errors. In `redis-cli`, add the `-c` option.
- **You handle redirects yourself.** Send [`ASKING`](/content/commands/asking.md) to the node in the error, and then send the command again to that node. Without `ASKING`, the new node replies with `MOVED` and points you back to the old node. Unlike with `MOVED`, don't update your map of the cluster. The slot still belongs to the old node until the move finishes, so send later commands to the old node first.

See [ASK redirection](/content/operate/oss_and_stack/reference/cluster-spec.md#ask-redirection) in the cluster specification.
