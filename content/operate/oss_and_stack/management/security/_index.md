---
categories:
- docs
- operate
- stack
- oss
description: Security model and features in Redis
linkTitle: Security
title: Redis security
aliases:
- /management/security/
weight: 1
---

This document provides an introduction to the topic of security from the point of
view of Redis. It covers the access control provided by Redis, code security concerns,
attacks that can be triggered from the outside by selecting malicious inputs, and
other similar topics. 
You can learn more about access control, data protection and encryption, secure Redis architectures, and secure deployment techniques by taking the [Redis University security course](https://university.redis.com/courses/ru330/).

For security-related contacts, open an issue on GitHub, or when you feel it
is really important to preserve the security of the communication, use this
[downloadable GPG key](/operate/oss_and_stack/management/security/gpgkey.txt).

## Security model

Redis is designed to be accessed by trusted clients inside trusted environments.
This means that usually it is not a good idea to expose the Redis instance
directly to the internet or, in general, to an environment where untrusted
clients can directly access the Redis TCP port or UNIX socket.

For instance, in the common context of a web application implemented using Redis
as a database, cache, or messaging system, the clients inside the front-end
(web side) of the application will query Redis to generate pages or
to perform operations requested or triggered by the web application user.

In this case, the web application mediates access between Redis and
untrusted clients (the user browsers accessing the web application).

In general, untrusted access to Redis should
always be mediated by a layer implementing ACLs, validating user input,
and deciding what operations to perform against the Redis instance.

## Network security

Access to the Redis port should be denied to everybody but trusted clients
in the network, so the servers running Redis should be directly accessible
only by the computers implementing the application using Redis.

In the common case of a single computer directly exposed to the internet, such
as a virtualized Linux instance (Linode, EC2, ...), the Redis port should be
firewalled to prevent access from the outside. Clients will still be able to
access Redis using the loopback interface.

Note that it is possible to bind Redis to a single interface by adding a line
like the following to the **redis.conf** file:

    bind 127.0.0.1

Failing to protect the Redis port from the outside can have a big security
impact because of the nature of Redis. For instance, a single [`FLUSHALL`](/commands/flushall) command can be used by an external attacker to delete the whole data set.

## Protected mode

Unfortunately, many users fail to protect Redis instances from being accessed
from external networks. Many instances are simply left exposed on the
internet with public IPs. Since version 3.2.0, Redis enters a special mode called **protected mode** when it is
executed with the default configuration (binding all the interfaces) and
without any password in order to access it. In this mode, Redis only replies to queries from the
loopback interfaces, and replies to clients connecting from other
addresses with an error that explains the problem and how to configure
Redis properly.

We expect protected mode to seriously decrease the security issues caused
by unprotected Redis instances executed without proper administration. However,
the system administrator can still ignore the error given by Redis and
disable protected mode or manually bind all the interfaces.

## Authentication

Redis provides two ways to authenticate clients.
The recommended authentication method, introduced in Redis 6, is via Access Control Lists, allowing named users to be created and assigned fine-grained permissions.
Read more about Access Control Lists [here]({{< relref "/operate/oss_and_stack/management/security/acl" >}}).

The legacy authentication method is enabled by editing the **redis.conf** file, and providing a database password using the `requirepass` setting.
This password is then used by all clients.

When the `requirepass` setting is enabled, Redis will refuse any query by
unauthenticated clients. A client can authenticate itself by sending the
**AUTH** command followed by the password.

The password is set by the system administrator in clear text inside the
redis.conf file. It should be long enough to prevent brute force attacks
for two reasons:

* Redis is very fast at serving queries. Many passwords per second can be tested by an external client.
* The Redis password is stored in the **redis.conf** file and inside the client configuration. Since the system administrator does not need to remember it, the password can be very long.

The goal of the authentication layer is to optionally provide a layer of
redundancy. If firewalling or any other system implemented to protect Redis
from external attackers fails, an external client will still not be able to
access the Redis instance without knowledge of the authentication password.

Since the [`AUTH`](/commands/auth) command, like every other Redis command, is sent unencrypted, it
does not protect against an attacker who has enough access to the network to
perform eavesdropping.

## TLS support

Redis has optional support for TLS on all communication channels, including
client connections, replication links, and the Redis Cluster bus protocol.

## Disallowing specific commands

{{< warning >}}
The method is deprecated and may be removed in future versions.
Instead, use [ACL rules](/operate/oss_and_stack/management/security/acl/) to disallow specific commands.
{{< /warning >}}

It is possible to disallow commands in Redis or to rename them as an unguessable
name, so that normal clients are limited to a specified set of commands.

For instance, a virtualized server provider may offer a managed Redis instance
service. In this context, normal users should probably not be able to
call the Redis **CONFIG** command to alter the configuration of the instance,
but the systems that provide and remove instances should be able to do so.

In this case, it is possible to either rename or completely shadow commands from
the command table. This feature is available as a statement that can be used
inside the redis.conf configuration file. For example:

    rename-command CONFIG b840fc02d524045429941cc15f59e41cb7be6c52

In the above example, the **CONFIG** command was renamed into an unguessable name.  It is also possible to completely disallow it (or any other command) by renaming it to the empty string, like in the following example:

    rename-command CONFIG ""

## Attacks triggered by malicious inputs from external clients

There is a class of attacks that an attacker can trigger from the outside even
without external access to the instance. For example, an attacker might insert data into Redis that triggers pathological (worst case)
algorithm complexity on data structures implemented inside Redis internals.

An attacker could supply, via a web form, a set of strings that
are known to hash to the same bucket in a hash table in order to turn the
O(1) expected time (the average time) to the O(N) worst case. This can consume more
CPU than expected and ultimately causes a Denial of Service.

To prevent this specific attack, Redis uses a per-execution, pseudo-random
seed to the hash function.

Redis implements the SORT command using the qsort algorithm. Currently,
the algorithm is not randomized, so it is possible to trigger a quadratic
worst-case behavior by carefully selecting the right set of inputs.

## String escaping and NoSQL injection

The Redis protocol has no concept of string escaping, so injection
is impossible under normal circumstances using a normal client library.
The protocol uses prefixed-length strings and is completely binary safe.

Since Lua scripts executed by the [`EVAL`](/commands/eval) and [`EVALSHA`](/commands/evalsha) commands follow the
same rules, those commands are also safe.

While it would be a strange use case, the application should avoid composing the body of the Lua script from strings obtained from untrusted sources.

## Code security

In a classical Redis setup, clients are allowed full access to the command set,
but accessing the instance should never result in the ability to control the
system where Redis is running.

Internally, Redis uses all the well-known practices for writing secure code to
prevent buffer overflows, format bugs, and other memory corruption issues.
However, the ability to control the server configuration using the **CONFIG**
command allows the client to change the working directory of the program and
the name of the dump file. This allows clients to write RDB Redis files
to random paths. This is [a security issue](http://antirez.com/news/96) that may lead to the ability to compromise the system and/or run untrusted code as the same user as Redis is running.

Redis does not require root privileges to run. It is recommended to
run it as an unprivileged *redis* user that is only used for this purpose.

## Other security topics

The other pages in this section cover security topics in more detail.
