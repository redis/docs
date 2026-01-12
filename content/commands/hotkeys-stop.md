---
arity: 2
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
- ADMIN
- NOSCRIPT
complexity: O(1)
container: HOTKEYS
description: Stops hotkeys tracking.
function: hotkeysCommand
group: server
hidden: false
linkTitle: HOTKEYS STOP
railroad_diagram: /images/railroad/hotkeys-stop.svg
reply_schema:
  const: OK
since: 8.6.0
summary: Stops hotkeys tracking.
syntax_fmt: HOTKEYS STOP
title: HOTKEYS STOP
---
Stops hotkeys tracking.

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when tracking is successfully stopped.

Example:
```
+OK
```

-tab-sep-

[Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` when tracking is successfully stopped.

Example:
```
+OK
```

{{< /multitabs >}}
