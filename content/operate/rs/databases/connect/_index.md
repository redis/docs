---
Title: Connect to a database
categories:
- docs
- operate
- rs
description: Learn how to connect your application to a Redis database hosted by Redis
  Enterprise Software and test your connection.
linkTitle: Connect
weight: 20
---

After you have [Set up a cluster]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) and [created a Redis database]({{< relref "/operate/rs/databases/create" >}}), you can connect to your database.

To connect to your database, you need the database endpoint, which includes the cluster name (FQDN) and the database port. Select the Configuration tab in the database screen to find the database endpoint.

If you try to connect with the FQDN, and the database does not respond, try connecting with the IP address. If this succeeds, DNS is not properly configured. To set up DNS, see [Configure cluster DNS]({{< relref "/operate/rs/networking/cluster-dns.md" >}}).

If you want to secure your connection, set up [TLS]({{< relref "/operate/rs/security/encryption/tls/" >}}).

## Connect to a database

Use one of the following connection methods to connect to your database:

- [`redis-cli`]({{< relref "/operate/rs/references/cli-utilities/redis-cli/" >}}) utility

- [Redis client](https://redis.io/clients) for your preferred programming language

- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/)

## redis-cli {#using-rediscli}

The [`redis-cli`]({{< relref "/operate/rs/references/cli-utilities/redis-cli/" >}}) utility is installed when you install Redis.  It provides a command-line interface that lets you work with your database using core [Redis commands](https://redis.io/commands/).

`redis-cli` is located in `/opt/redislabs/bin/` on a node with Redis Enterprise installed. To connect to the database from a node in the cluster, run `redis-cli` with the database port.

```sh
$ sudo /opt/redislabs/bin/redis-cli -p <port>
```

To connect using `redis-cli` from outside of the cluster, run `redis-cli` with the database hostname and port.

```sh
$ sudo /opt/redislabs/bin/redis-cli -h <host> -p <port>
```


## Redis client{#using-redis-client}

Different programming languages use different connection clients to interact with Redis databases, and each client has its own syntax and installation process. For help with a specific client, see the client's documentation.

See the [client list](https://redis.io/docs/clients/) to view all Redis clients by language.

{{< note >}}
You can't use client libraries to configure Redis Enterprise Software.  Instead, use:

- The Redis Software [admin console]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- The [REST API]({{< relref "/operate/rs/references/rest-api" >}})
- Command-line utilities, such as [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}})
{{< /note >}}

### Code example (Python)

A simple python application can also connect to the database.

{{< note >}}
The following section assumes you already have Python
and redis-py (python library for connecting to Redis) configured.
You can find the instructions to configure redis-py on the [github page for redis-py](https://github.com/redis/redis-py).
{{< /note >}}

1. Create a new file called `redis_test.py`:

    ```python
    import redis

    r = redis.StrictRedis(host='<host>', port=<port>)
    print("set key1 123")
    print(r.set('key1', '123'))
    print("get key1")
    print(r.get('key1'))
    ```

    Replace `<host>` and `<port>` with the hostname and port for your database.

1. Run the redis_test.py application to store and retrieve a key:

    ```sh
    $ python redis_test.py
    ```

If the connection is successful, the output of the application looks like this:

```sh
set key1 123
True
get key1
123
```

## RedisInsight {#using-redisinsight}

RedisInsight is a free Redis GUI that is available for MacOS, Windows, and Linux.

1. [Install RedisInsight]({{< relref "/develop/connect/insight" >}}).

1. Open RedisInsight and select **Add Redis Database**.

1. Enter the host and port in the **Host** and **Port** fields.

1. Select **Use TLS** if [TLS]({{< relref "/operate/rs/security/encryption/tls" >}}) is set up.

1. Select **Add Redis Database** to connect to the database.

See the [RedisInsight documentation]({{< relref "/develop/connect/insight" >}}) for more information.
