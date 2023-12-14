---
Title: rlcheck
alwaysopen: false
categories:
- docs
- operate
- rs
description: Verify nodes.
linkTitle: rlcheck (verify nodes)
weight: $weight
---
The `rlcheck` utility runs various health checks on a Redis Enterprise Software node and reports any discovered issues.
You can use this utility to confirm a successful installation or to verify that the node is functioning properly.

You can run `rlcheck` from the host's command-line interface (CLI).
The output of `rlcheck` shows information specific to the host that you run it on.

To open the `rladmin` CLI:

1. Sign in to the Redis Enterprise Software host with an account that is a member of the **redislabs** operating system group.

1. Run: `rlcheck`

The utility runs and reports the result of each check.

{{< note >}}
To see the `rlcheck` optional flags, run: `rlcheck --help`
Specifically, the `--continue-on-error` flag runs all tests to completion and shows all errors when complete.
{{< /note >}}

To resolve issues reported by `rlcheck`, [contact Redis support](https://redis.com/company/support/).
