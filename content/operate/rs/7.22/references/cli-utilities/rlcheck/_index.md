---
Title: rlcheck
alwaysopen: false
categories:
- docs
- operate
- rs
description: Verify nodes.
hideListLinks: true
linkTitle: rlcheck (verify nodes)
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rlcheck/'
---
The `rlcheck` utility runs various [tests](#tests) to check the health of a Redis Enterprise Software node and reports any discovered issues.
You can use this utility to confirm a successful installation or to verify that the node is functioning properly.

To resolve issues reported by `rlcheck`, [contact Redis support](https://redis.com/company/support/).

## Run rlcheck

You can run `rlcheck` from the node host's command line.
The output of `rlcheck` shows information specific to the host you run it on.

To run `rlcheck` tests:

1. Sign in to the Redis Enterprise Software host with an account that is a member of the **redislabs** operating system group.

1. Run: 

    ```sh
    rlcheck
    ```

## Options

You can run `rlcheck` with the following options:

| Option | Description |
|--------|-------------|
| <nobr>`--suppress-tests TEXT`</nobr> | Skip the specified, comma-delimited list of tests. See [Tests](#tests) for the list of tests and descriptions. |
| <nobr>`--retry-delay INTEGER`</nobr> | Delay between retries, in seconds. |
| <nobr>`--retry INTEGER`</nobr> | Number of retries after a failure. |
| <nobr>`--file-path TEXT`</nobr> | Custom path to `rlcheck.log`. |
| <nobr>`--continue-on-error`</nobr> | Continue to run all tests even if a test fails, then show all errors when complete. |
| `--help` | Return the list of `rlcheck` options. |

## Tests

`rlcheck` runs the following tests by default:

| Test name | Description |
|-----------|-------------|
| verify_owner_and_group | Verifies the owner and group for Redis Enterprise Software files are correct. |
| verify_bootstrap_status | Verifies the local node's bootstrap process completed without errors. |
| verify_services | Verifies all Redis Enterprise Software services are running. |
| verify_port_range | Verifies the [`ip_local_port_range`](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html) doesn't conflict with the ports Redis Enterprise might assign to shards. |
| verify_pidfiles | Verifies all active local shards have PID files. |
| verify_capabilities | Verifies all binaries have the proper capability bits. |
| verify_existing_sockets | Verifies sockets exist for all processes that require them. |
| verify_host_settings | Verifies the following:<br />• Linux `overcommit_memory` setting is 1.<br />•`transparent_hugepage` is disabled.<br />• Socket maximum connections setting `somaxconn` is 1024. |
| verify_tcp_connectivity | Verifies this node can connect to all other alive nodes. |
| verify_encrypted_gossip | Verifies gossip communication is encrypted. |
