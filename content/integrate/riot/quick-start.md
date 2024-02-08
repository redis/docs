---
title: Quick Start
linkTitle: Quick Start
type: integration
description: RIOT quick start guide
weight: 3
---

You can launch RIOT with the following command:

```
riot
```

This will show usage help, which you can also get by running:

```
riot --help
```

{{< tip >}}
You can use `--help` on any command and subcommand:
{{< /tip >}}

```
riot command --help
riot command subcommand --help
```

## Commands

RIOT includes the following commands:

* **[`db-import`]({{< relref "http://localhost:1313/integrate/riot/databases#database-import" >}})**\
Import from a relational database.
* **[`db-export`]({{< relref "/integrate/riot/databases#database-export" >}})**\
Export Redis data to a relational database.
* **[`dump-import`]({{< relref "/integrate/riot/files#dump-import" >}})**\
Import Redis data files into Redis.
* **[`file-import`]({{< relref "/integrate/riot/files#file-import" >}})**\
Import from CSV/JSON/XML files.
* **[`file-export`]({{< relref "/integrate/riot/files#file-export" >}})**\
Export Redis data to JSON or XML files.
* **[`faker-import`]({{< relref "/integrate/riot/generators#faker" >}})**\
Import from Faker.
* **[`generate`]({{< relref "/integrate/riot/generators" >}})**\
Generate data structures.
* **[`replicate`]({{< relref "/integrate/riot/replication" >}})**\
Replicate a Redis database into another Redis database.
* **[`ping`]({{< relref "/integrate/riot/misc-topics#generate-completion#ping" >}})**\
Test connectivity to a Redis database.
* **[`generate-completion`]({{< relref "/integrate/riot/misc-topics#generate-completion" >}})**\
Generate bash/zsh completion script for `riot`.

## General options

* **`-d, --debug`**\
Log in debug mode (includes normal stacktrace).
* **`-H, --help`**\
Show this help message and exit.
* **`-i, --info`**\
Set log level to info.
* **`-q, --quiet`**\
Log errors only.
* **`--stacktrace`**\
Print out the stacktrace for all exceptions.
* **`-V, --version`**\
Print version information and exit.
* **`-w, --warn`**\
Set log level to warn.

## Redis connection options

Use the following options to configure connections to Redis.

* **`-h`, `--hostname`**\
Server hostname
* **`-p`, `--port`**\
Server port
* **`-u`, `--uri`**\
Server URI. For syntax see [Redis URI syntax](https://github.com/lettuce-io/lettuce-core/wiki/Redis-URI-and-connection-details#uri-syntax).
* **`-c`, `--cluster`**\
Enable cluster mode
* **`-n`, `--db`**\
Database number
* **`--timeout`**\
Redis command timeout
* **`--client`**\
Client name used to connect to Redis
* **`--user`**\
ACL style 'AUTH username pass'. Needs password
* **`-a`, `--pass`**\
Password to use when connecting to the server
* **`--tls`**\
Establish a secure TLS connection
* **`--tls-verify`**\
TLS peer-verify mode: FULL (default), NONE, CA
* **`--cacert`**\
X.509 CA certificate file to verify with
* **`--cert`**\
X.509 cert chain file to authenticate (PEM)
* **`--key`**\
PKCS#8 private key file to authenticate (PEM)
* **`--key-pwd`**\
Private key password
* **`--no-auto-reconnect`**\
Disable auto-reconnect on connection loss

## Job options

* **`-b, --batch`**\
Number of items in each batch (default: 50).
See [Batching]({{< relref "/integrate/riot/architecture#batching" >}}) section for more details.
* **`--progress`**\
Style of progress bar (default: `ascii`)
* `block`: Color Unicode block
* `bar`: Color Unicode bar
* `ascii`: ASCII bar
* `log`: ASCII logs
* `none`: no progress bar
* **`--skip-policy`**\
Policy to determine what should be done when errors occur during processing.
* `always`: ignore errors and continue with processing
* `never`: fail as soon as an error occurs.
* `limit`: continue with processing until number of errors reached `--skip-limit`.
* **`--skip-limit`**\
Max number of failed items before considering the transfer has failed (default: 3). Only used for `limit` skip policy.
* **`--sleep`**\
Duration in ms to sleep after writing each batch (default: 0).
* **`--threads`**\
Number of concurrent threads to use for batch processing (default: 1).
See [Multi-threading]({{< relref "/integrate/riot/architecture#multi-threading" >}}) section for more details.
