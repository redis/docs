---
Title: What's new in Redis Enterprise Software 6.x?
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
draft: true
weight: 20
---
Below are detailed a few of the major features of this release of Redis Enterprise Software
along with bug fixes and patches.

## Geo-Distributed Active-Active Conflict-free Replicated Databases (CRDB) {#geodistributed-activeactive-conflictfree-replicated-databases-crdb}

Developing globally distributed applications can be challenging, as
developers have to think about race conditions and complex combinations
of events under geo-failovers and cross-region write conflicts. Active-Active databases
simplify developing such applications by directly using built-in smarts
for handling conflicting writes based on the data type in use. Instead
of depending on just simplistic "last-writer-wins" type conflict
resolution, geo-distributed Active-Active databases combines techniques defined in CRDT
(conflict-free replicated data types) research with Redis types to
provide smart and automatic conflict resolution based on the data type's
intent.

For more information, go here. For information, go to [Developing with
Active-Active databases]({{< relref "/operate/rs/developing/crdbs" >}}).

## Redis modules

Redis Modules enable you to extend the functionality of Redis Enterprise
Software. One can add new data types, capabilities, etc. to tailor the
cluster to a specific use case or need. Once installed, modules benefit
from the high performance, scalability, and high availability that Redis
Enterprise is known for.

### Certified modules

Redis developed and certified these modules for use with Redis Enterprise Software:

- [RedisBloom]({{< relref "/operate/modules/redisbloom" >}})
    - Enables Redis to have a scalable bloom filter as a data type. Bloom
      filters are probabilistic data structures that quickly determine if something is contained within a set.
- RedisGraph
    - RedisGraph is the first queryable Property Graph database to use sparse
      matrices to represent the adjacency matrix in graphs and linear algebra to query the graph.
      RedisGraph uses [Cypher](https://www.opencypher.org/) as its query language.
- [RedisJSON]({{< relref "/operate/modules/redisjson" >}})
    - Now you have the convenience JSON as a built-in data type and easily
      able to address nested data via a path.
- [RediSearch]({{< relref "/operate/modules/redisearch" >}})
    - This module turns Redis into a distributed in-memory
      full-text indexing and search beast.

### Custom modules

In addition, Redis Enterprise Software provides the ability to load and
use custom [Redis modules](https://redislabs.com/community/redis-modules-hub/) or
of your own creation.

## Support for Docker

Deploying and running your Redis Enterprise Software cluster on Docker
containers is supported in development systems and
available to pull from Docker hub. With the official image, you can
easily and quickly test several containers to build the scalable
and highly available cluster Redis Enterprise Software is famous for.

For more information go to [quick start with Redis Enterprise Software
on Docker.]({{< relref "/operate/rs/installing-upgrading/get-started-docker.md" >}})

## LDAP integration

As part of our continued emphasis on security, administrative user
accounts in Redis Enterprise Software can now use either built-in
authentication or authenticate externally via LDAP with saslauthd. The
accounts can be used for administering resources on the cluster via
command line, Rest API, or admin console.

For more information see [LDAP
Integration]({{< relref "/operate/rs/security/passwords-users-roles.md#setting-up-ldap" >}}).
