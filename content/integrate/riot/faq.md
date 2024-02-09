---
description: RIOT FAQs
linkTitle: Frequently asked questions
title: Frequently asked questions
type: integration
weight: 10
---

## Logs are cut off or missing

This could be caused by concurrency issues in the terminal when refreshing the progress bar and displaying logs.
Try running with the job option `--progress log`.

## Unknown options: '--keyspace', '--keys'

You must specify one or more Redis commands with import commands [`file-import`]({{< relref "/integrate/riot/files#file_import" >}}), [`faker-import`]({{< relref "/integrate/riot/generators#faker" >}}), [`db-import`]({{< relref "/integrate/riot/databases#database-import" >}}).

## ERR DUMP payload version or checksum are wrong

Redis 7.x DUMP format is not backwards compatible with previous versions.
To replicate between different Redis versions, use [Type-Based Replication]({{< relref "/integrate/riot/replication#type-based-replication" >}}).

## Process gets stuck during replication and eventually times out

This could be caused by big keys clogging the replication pipes.
In these cases it might be hard to catch the offending key(s).
Try running the same command with `--info` (see [General options]({{< relref "/integrate/riot/quick-start#general-options" >}})) and `--progress log` so that all errors are reported.
Check the database with `redis-cli` [Big Keys](https://developer.redis.com/operate/redis-at-scale/observability/identifying-issues/#scanning-keys) and/or use the [source reader options]({{< relref "/integrate/riot/replication#usage" >}}) to filter these keys out.

## NOAUTH Authentication required

This issue occurs when you fail to supply the `--pass <password>` parameter.
