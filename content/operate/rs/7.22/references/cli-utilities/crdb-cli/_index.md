---
Title: crdb-cli
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage Active-Active databases.
hideListLinks: true
linkTitle: crdb-cli (manage Active-Active)
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/crdb-cli/'
---

An [Active-Active database]({{< relref "/operate/rs/7.22/databases/active-active/_index.md" >}}) (also known as CRDB or conflict-free replicated database)
replicates your data across Redis Enterprise Software clusters located in geographically distributed regions.
Active-Active databases allow read-write access in all locations, making them ideal for distributed applications that require fast response times and disaster recovery.

The Active-Active database on an individual cluster is called an **instance**.
Each cluster that hosts an instance is called a **participating cluster**.

An Active-Active database requires two or more participating clusters.
Each instance is responsible for updating the instances that reside on other participating clusters with the transactions it receives.
Write conflicts are resolved using [conflict-free replicated data types]({{< relref "/operate/rs/7.22/databases/active-active" >}}) (CRDTs).

To programmatically maintain an Active-Active database and its instances, you can use the `crdb-cli` command-line tool.

## `crdb-cli` commands

{{<table-children columnNames="Command,Description" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}

## Use the crdb-cli

To use the `crdb-cli` tool, use SSH to sign in to a Redis Enterprise host with a user that belongs to the group that Redis Enterprise Software was installed with (Default: **redislabs**).
If you sign in with a non-root user, you must add `/opt/redislabs/bin/` to your `PATH` environment variables.

`crdb-cli` commands use the syntax: `crdb-cli <command> <arguments>` to let you:

- Create, list, update, flush, or delete an Active-Active database.
- Add or remove an instance of the Active-Active database on a specific cluster.

Each command creates a task.

By default, the command runs immediately and displays the result in the output.

If you use the <nobr>`--no-wait`</nobr> flag, the command runs in the background so that your application is not delayed by the response.

Use the [`crdb-cli task` commands]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli/task/" >}}) to manage Active-Active database tasks.

For each `crdb-cli` command, you can use <nobr>`--help`</nobr> for additional information about the command.
