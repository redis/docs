---
acl_categories:
- '@slow'
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
complexity: Depends on subcommand.
description: A container for hotkeys tracking commands.
group: server
hidden: false
linkTitle: HOTKEYS
railroad_diagram: /images/railroad/hotkeys.svg
since: 8.6.0
summary: A container for hotkeys tracking commands.
syntax_fmt: HOTKEYS
title: HOTKEYS
---

This is a container command for hotkeys tracking commands that provides a method for identifying hotkeys inside a Redis server during a specified tracking time period.

Hotkeys in this context are defined by two metrics:
* Percentage of CPU time spent on the key from the total time during the tracking period.
* Percentage of network bytes (input + output) used for the key from the total network bytes used by Redis during the tracking period.

## Usage

The general workflow is for the user to initiate a hotkeys tracking process which should run for some time. The keys' metrics are recorded inside a probabilistic data structure, after which the user is able to fetch the top K metrics.

Available subcommands:

- [`HOTKEYS START`](/content/commands/hotkeys-start.md) - Starts hotkeys tracking with specified metrics.
- [`HOTKEYS STOP`](/content/commands/hotkeys-stop.md) - Stops hotkeys tracking but preserves data.
- [`HOTKEYS GET`](/content/commands/hotkeys-get.md) - Returns tracking results and metadata.
- [`HOTKEYS RESET`](/content/commands/hotkeys-reset.md) - Releases resources used for tracking.

## Example

The following example tracks keys by CPU time and network bytes, reads the results while tracking is active, and then stops tracking and releases its resources.

The redis-py and go-redis cluster clients, and redis-rs async cluster connections, don't support `HOTKEYS`. With these clients, connect directly to a single node instead.

{{< clients-example set="cmds_hotkeys" step="hotkeys" description="Profiling: Find the keys that use the most CPU time and network bandwidth using HOTKEYS START, GET, STOP, and RESET (only one tracking session can run at a time)" difficulty="intermediate" >}}
> HOTKEYS START METRICS 2 CPU NET COUNT 10
OK
> GET product:1
"Laptop"
> GET product:1
"Laptop"
> GET product:2
"Phone"
> HOTKEYS GET
1)  1) "tracking-active"
    2) (integer) 1
    3) "sample-ratio"
    4) (integer) 1
    5) "selected-slots"
    6) 1) 1) (integer) 0
          2) (integer) 16383
    7) "all-commands-all-slots-us"
    8) (integer) 27
    9) "net-bytes-all-commands-all-slots"
   10) (integer) 119
   11) "collection-start-time-unix-ms"
   12) (integer) 1791553768375
   13) "collection-duration-ms"
   14) (integer) 44
   15) "total-cpu-time-user-ms"
   16) (integer) 2
   17) "total-cpu-time-sys-ms"
   18) (integer) 0
   19) "total-net-bytes"
   20) (integer) 119
   21) "by-cpu-time-us"
   22) 1) "product:1"
       2) (integer) 24
       3) "product:2"
       4) (integer) 3
   23) "by-net-bytes"
   24) 1) "product:1"
       2) (integer) 80
       3) "product:2"
       4) (integer) 39
> HOTKEYS STOP
OK
> HOTKEYS RESET
OK
{{< /clients-example >}}
