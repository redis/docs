---
Title: Flush data
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
weight: 40
draft: true
---

The [FLUSHALL]({{< relref "/commands/flushall" >}}) command provides a fast way to remove all data from a database.

{{< note >}}
When you _flush_ a database, you remove all data.<br/><br/>

This _permanently_ removes all data from the database.  The data cannot be recovered, except by restoring from earlier backups.<br/><br/>

We _strongly_ recommend backing up databases before flushing them.
{{</note>}}

## How to use FLUSHALL

To use it, connect your database and then issue the command.  

There are several ways to do this, depending on your circumstances and environment.

The following sections provide some options:

- [`redis-cli`](#redis-cli)
- [Redis Insight CLI](#redisinsight)
- [SASL connection](#sasl-connection)

### redis-cli

To use the `redis-cli` utility:

```sh
redis-cli -h <hostname> -p <portnumber> -a <password> flushall
```

Example:

```sh
redis-cli -h redis-12345.server.cloud.redislabs.example.com -p 12345 -a xyz flushall
```

### Redis Insight

If you install [Redis Insight]({{< relref "/develop/tools/insight" >}}) and [add your database]({{< relref "/operate/rc/rc-quickstart#using-redisinsight" >}}), you can use the Redis Insight workbench to run commands:

1.  Start Redis Insight and connect to your database.

2.  From the Redis Insight menu, select **Workbench** and wait for the client to connect to your database.

3.  In the command area, enter `flushall` and then select the green **run** arrow.

    {{<image filename="images/rc/redisinsight-cli-flushall-example.png" alt="You can use Redis Insight to issue commands to a database." >}}

    The 'OK' response indicates that the command executed properly.
<!--
### netcat 

If you have shell access to your database's host server, you can use [netcat](https://en.wikipedia.org/wiki/Netcat) (`nc`) to send the `flush_all` command to your database:

```sh
echo "flush_all" | nc redis-12345.server.cloud.redislabs.example.com 12345
```
-->

### SASL connection

If you do not have permission to access the command shell of the server hosting your database or are unable to use Redis Insight, but you have connection credentials and your database supports [Simple Authentication and Security Layer](https://en.wikipedia.org/wiki/Simple_Authentication_and_Security_Layer) connections, you can use an SASL-enabled command-line client.

For example, suppose you're using Memcached Enterprise Cloud and that your database has SASL enabled. In this case, you can can use the [bmemcached-CLI](https://github.com/RedisLabs/bmemcached-cli) client to connect and issue commands to your database.

Setup instructions vary according to the environment.  Many Linux systems, such as Ubuntu, follow this process:

```sh
$ wget https://github.com/RedisLabs/bmemcached-cli/archive/master.zip
$ sudo apt-get install unzip python-pip
$ unzip master.zip -d bmemcached-cli
$ cd bmemcached-cli/bmemcached-cli-master/
$ sudo pip install --upgrade pip
$ sudo pip install . -r requirements.pip
```

Adjust as needed for your operating system and configuration.

When the client is properly installed, you can use it to run the `flush_all` command:

```sh
bmemcached-cli [user]:[password]@[host]:[port]
```

Here's an example:

```sh
$ bmemcached-cli username:password@redis-12345.server.cloud.redislabs.example.com:12345
([B]memcached) flush_all
True
exit
```