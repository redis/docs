---
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

This is a container command for hotkeys tracking commands that provides a method for identifying hotkeys inside a Redis server during a specifiedtracking time period.

Hotkeys in this context are defined by two metrics:
* Percentage of CPU time spent on the key from the total time during the tracking period.
* Percentage of network bytes (input+output) used for the key from the total network bytes used by Redis during the tracking period.

## Usage

The general workflow is for the user to initiate a hotkeys tracking process which should run for some time. The keys' metrics are recorded inside a probabilistic structure and after that the user is able to fetch the top K of them.

Available subcommands:

- [`HOTKEYS START`]({{< relref "/commands/hotkeys-start" >}}) - Starts hotkeys tracking
- [`HOTKEYS STOP`]({{< relref "/commands/hotkeys-stop" >}}) - Stops hotkeys tracking
- [`HOTKEYS GET`]({{< relref "/commands/hotkeys-get" >}}) - Returns two lists of top K hotkeys
