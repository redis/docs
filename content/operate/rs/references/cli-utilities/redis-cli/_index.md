---
Title: redis-cli
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Run Redis commands.
hideListLinks: true
linkTitle: redis-cli (run Redis commands)
toc: 'true'
weight: $weight
---

The `redis-cli` command-line utility lets you interact with a Redis database. With `redis-cli`, you can run [Redis commands]({{< relref "/commands" >}}) directly from the command-line terminal or with [interactive mode](#interactive-mode).

If you want to run Redis commands without `redis-cli`, you can [connect to a database with Redis Insight]({{< relref "/develop/tools/insight" >}}) and use the built-in [CLI]({{< relref "/develop/tools/insight" >}}) prompt instead.

## Install `redis-cli`

When you install Redis Enterprise Software or Redis Community Edition, it also installs the `redis-cli` command-line utility.

To learn how to install Redis and `redis-cli`, see the following installation guides:

- [Redis Community Edition]({{< relref "/operate/oss_and_stack/install/install-stack/" >}})

- [Redis Enterprise Software]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})

- [Redis Enterprise Software with Docker]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}})

## Connect to a database

To run Redis commands with `redis-cli`, you need to connect to your Redis database.

You can find endpoint and port details in the **Databases** list or the database’s **Configuration** screen.

### Connect remotely

If you have `redis-cli` installed on your local machine, you can use it to connect to a remote Redis database. You will need to provide the database's connection details, such as the hostname or IP address, port, and password.

```sh
$ redis-cli -h <endpoint> -p <port> -a <password>
```

You can also provide the password with the `REDISCLI_AUTH` environment variable instead of the `-a` option:

```sh
$ export REDISCLI_AUTH=<password>
$ redis-cli -h <endpoint> -p <port>
```

### Connect over TLS

To connect to a Redis Enterprise Software or Redis Cloud database over TLS:

1. Download or copy the Redis Enterprise server (or proxy) certificates.

    - For Redis Cloud, see [Download certificates]({{< relref "/operate/rc/security/database-security/tls-ssl#download-certificates" >}}) for detailed instructions on how to download the server certificates (`redis_ca.pem`) from the [Redis Cloud console](https://cloud.redis.io/).

    - For Redis Enterprise Software, copy the proxy certificate from the Cluster Manager UI (**Cluster > Security > Certificates > Server authentication**) or from a cluster node (`/etc/opt/redislabs/proxy_cert.pem`).

1. Copy the certificate to each client machine.

1. If your database doesn't require client authentication, provide the Redis Enterprise server certificate (`redis_ca.pem` for Cloud or `proxy_cert.pem` for Software) when you connect:

    ```sh
    redis-cli -h <endpoint> -p <port> --tls --cacert <redis_cert>.pem
    ```

1. If your database requires client authentication, provide your client's private and public keys along with the Redis Enterprise server certificate (`redis_ca.pem` for Cloud or `proxy_cert.pem` for Software) when you connect:

    ```sh
    redis-cli -h <endpoint> -p <port> --tls --cacert <redis_cert>.pem \
        --cert redis_user.crt --key redis_user_private.key
    ```

### Connect with Docker

If your Redis database runs in a Docker container, you can use `docker exec` to run `redis-cli` commands:

```sh
$ docker exec -it <Redis container name> redis-cli -p <port>
```

## Basic use

You can run `redis-cli` commands directly from the command-line terminal:

```sh
$ redis-cli -h <endpoint> -p <port> <Redis command>
```

For example, you can use `redis-cli` to test your database connection and store a new Redis string in the database:

```sh
$ redis-cli -h <endpoint> -p 12000 PING
PONG
$ redis-cli -h <endpoint> -p 12000 SET mykey "Hello world"
OK
$ redis-cli -h <endpoint> -p 12000 GET mykey              
"Hello world"
```

For more information, see [Command line usage]({{< relref "/develop/tools/cli" >}}#command-line-usage).

## Interactive mode

In `redis-cli` [interactive mode]({{< relref "/develop/tools/cli" >}}#interactive-mode), you can:

- Run any `redis-cli` command without prefacing it with `redis-cli`.
- Enter `?` for more information about how to use the `HELP` command and [set `redis-cli` preferences]({{< relref "/develop/tools/cli" >}}#preferences).
- Enter [`HELP`]({{< relref "/develop/tools/cli" >}}#showing-help-about-redis-commands) followed by the name of a command for more information about the command and its options.
- Press the `Tab` key for command completion.
- Enter `exit` or `quit` or press `Control+D` to exit interactive mode and return to the terminal prompt.

This example shows how to start interactive mode and run Redis commands:

```sh
$ redis-cli -p 12000
127.0.0.1:12000> PING
PONG
127.0.0.1:12000> SET mykey "Hello world"
OK
127.0.0.1:12000> GET mykey
"Hello world"
```

## Examples

### Check slowlog

Run [`slowlog get`]({{< relref "/commands/slowlog-get" >}}) for a list of recent slow commands:

```sh
redis-cli -h <endpoint> -p <port> slowlog get <number of entries>
```

### Scan for big keys

Scan the database for big keys:

```sh
redis-cli -h <endpoint> -p <port> --bigkeys
```

See [Scanning for big keys]({{< relref "/develop/tools/cli" >}}#scanning-for-big-keys) for more information.

## More info

- [Redis CLI documentation]({{< relref "/develop/tools/cli" >}})
- [Redis commands reference]({{< relref "/commands/" >}})
