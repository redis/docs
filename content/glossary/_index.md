---
Title: Glossary
description:
weight: 100
alwaysopen: false
categories: ["Glossary"]
aliases: /glossary/
---
<dl class="glossary">

<!--- 
{{%definition ""%}}
{{%/definition%}}
--->

## A, B {#letter-a}

{{%definition "access control list (ACL)"%}}
Allows you to manage permissions based on key patterns.

More info: [redis.io/operate/oss_and_stack/management/security/acl]({{< relref "/operate/oss_and_stack/management/security/acl" >}}); [ACL wikipedia](https://en.wikipedia.org/wiki/Access-control_list); [Database access control]({{<relref "/operate/rs/security/access-control">}}); [Update database ACLs]({{<relref "/operate/rs/security/access-control/ldap/update-database-acls">}}); [Role-based access control]({{<relref "/operate/rc/security/data-access-control/role-based-access-control">}})
{{%/definition%}}

<a name="active-active"></a>
{{%definition "Active-Active database (CRDB)"%}}
Geo-distributed databases that span multiple [Redis Enterprise Software]({{<relref "#redis-enterprise-software">}}) [clusters]({{<relref "#cluster">}}). Active-Active databases, also known as conflict-free replicated databases (CRDB), depend on [multi-master replication (MMR)]({{<relref "#multi-master-replication-mmr">}}) and [conflict-free replicated data types (CRDTs)]({{<relref "#conflict-free-replicated-data-types-crdt">}}) to power a simple development experience for geo-distributed applications.

More info: [Active-Active geo-distributed Redis]({{<relref "/operate/rs/databases/active-active">}}), [Geo-distributed Active-Active Redis applications]({{<relref "/operate/rs/databases/active-active/" >}}), [Developing applications for Active-Active databases]({{<relref "/operate/rs/databases/active-active/develop/">}})
{{%/definition%}}

{{%definition "Active-Active database instance"%}}
A “member database” of a global Active-Active database which is made up of its own master and replica shards spanning a single cluster.
{{%/definition%}}

{{%definition "active-passive database replication"%}}
Provides applications read-only access to replicas of the data set from different geographical locations. The Redis Enterprise implementation of active-passive replication is called [Replica Of]({{<relref "#replica-of">}}).
{{%/definition%}}

{{%definition"admin console"%}}
Each node runs a web server that is used to provide the user with access to the Redis Enterprise Software admin console (previously known as management UI). The admin console allows viewing and managing the entire cluster, so it does not matter which node is used to access it.
{{%/definition%}}

{{%definition "admission controller"%}}
A piece of code that intercepts requests to the Kubernetes API server prior to persistence of the object.

More info: [Using Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)
{{%/definition%}}

{{%definition "append-only file (AoF)"%}}
Log files that keep a record of data changes by writing to the end of a file. This happens with every write, or every second to allow data recovering the entire
dataset by replaying the append-only log from the beginning to the end.

More info: [Data Persistence]({{<relref "/operate/rc/databases/configuration/data-persistence" >}}), [Data Persistence with Redis Enterprise Software]({{<relref "/operate/rs/databases/configure/database-persistence" >}})
{{%/definition%}}

## C {#letter-c}

{{%definition "causal consistency"%}}
A distributed database is causally consistent if it maintains the same order of operations on a piece of data across all database copies.

More info: [Causal consistency wikipedia](https://en.wikipedia.org/wiki/Causal_consistency), [Causal consistency in an Active-Active database]({{<relref "/operate/rs/databases/active-active/causal-consistency">}})
{{%/definition%}}

{{%definition "CIDR allowlist"%}}
Classless Inter-Domain Routing (CIDR) is a method to allocate and route IP addresses. A CIDR allowlist defines a range of IP addresses and permits connections to them.

More info: [CIDR wikipedia](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing), [Configure CIDR allowlist]({{<relref "/operate/rc/security/network-security/cidr-whitelist">}})
{{%/definition%}}

{{%definition "concurrent writes"%}}

Concurrency or updates and writes refer to more than events that happen at the same wall clock time across member Active-Active databases. Concurrent updates refer to the fact that updates happen in between sync events that catch up member Active-Active databases with updates that happened on other member Active-Active databases.

{{%/definition%}}

{{%definition "consistency"%}}

Consistency models describe the way a distributed system keeps replicated data consistent between copies.

More info: [Consistency models](https://en.wikipedia.org/wiki/Consistency_model)

{{%/definition%}}

{{%definition "cluster"%}}
A Redis Enterprise cluster is composed of identical nodes that are deployed within a data center or stretched across local availability zones.

More info: [Database clustering]({{<relref "/operate/rc/databases/configuration/clustering" >}})
{{%/definition%}}

{{%definition "Cluster Configuration Store (CCS)"%}}
An internally managed Redis database that acts as a single repository for all cluster metadata.
{{%/definition%}}

{{%definition "Cluster Node Manager (CNM)"%}}
A collection of Redis Enterprise services responsible for provisioning, migration, monitoring, re-sharding, re-balancing, de-provisioning, auto-scaling
{{%/definition%}}

{{%definition "conflict-free replicated databases (CRDB)"%}}

Conflict-free replicated databases (CRDB) are an alternate name for [Active-Active databases](#active-active).
{{%/definition%}}

{{%definition "conflict-free replicated data types (CRDT)"%}}
Techniques used by Redis data types in Active-Active databases that handle conflicting concurrent writes across member Active-Active databases. The Redis Enterprise implementation of CRDT is called an Active-Active database (formerly known as CRDB).

More info: [CRDT info]({{<relref "/operate/rs/databases/active-active/develop/#info" >}}), [Active-Active geo-distributed Redis]({{< relref "/operate/rs/databases/active-active" >}}), [CRDT wikipedia](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
{{%/definition%}}

{{%definition "CustomResourceDefinition (CRD)"%}}
Custom code that defines a resource to add to your Kubernetes API server without building a complete custom server. 

More info: [CustomResourceDefinition](https://kubernetes.io/docs/reference/glossary/?fundamental=true#term-CustomResourceDefinition), [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
{{%/definition%}}

## D - F {#letter-d}

{{%definition "data eviction policy"%}}
Defines how excess data is handled when the database exceeds the memory limit.

More info: [Data Eviction Policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies">}})
{{%/definition%}}

{{%definition "deprecated"%}}
Features are marked as _deprecated_ when they're scheduled to be removed from our products, generally because they've been replaced by new features.

For details, see [obsolete](#obsolete).
{{%/definition%}}

{{%definition "Domain Name Service (DNS)"%}}
Naming system for computers, services, or other resources connected to the Internet or a private network. It associates various information with domain names assigned to each of the participating entities.

More info: [DNS wikipedia](https://en.wikipedia.org/wiki/Domain_Name_System)
{{%/definition%}}

{{%definition "eventual consistency"%}}

After updating data on one instance of a distributed database, the other database copies may have stale data for a short time while they sync. Eventual consistency means that the updated data will eventually be the same across all database copies.

More info: [Eventual consistency wikipedia](https://en.wikipedia.org/wiki/Eventual_consistency)
{{%/definition%}}

{{%definition "Fully qualified domain name (FQDN)"%}}
A domain name that includes a list of domain labels to specify the exact location in the DNS.

More info: [FQDN wikipedia](https://en.wikipedia.org/wiki/Fully_qualified_domain_name)

{{%/definition%}}

{{%definition "`fysnc`"%}}
Linux command to synchronize a file's in-core state with a storage device

More info: [`fsync` man page](https://man7.org/linux/man-pages/man2/fsync.2.html)
{{%/definition%}}

## G - J {#letter-g}

{{%definition "hash slot"%}}
The result of a hash calculation.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}})
{{%/definition%}}

{{%definition "hash tag"%}}
A part of the key that is used in the hash calculation.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}})
{{%/definition%}}

{{%definition "high availability"%}}

High availability (HA) is a characteristic of distributed systems that keeps systems available for users for longer than normal periods of time. This is done by reducing single points of failure, increasing redundancy, and making recovering from failures easier.

More info: [Redis Enterprise durability and high availability]({{<relref "/operate/rs/databases/durability-ha/">}}), [High availability wikipedia](https://en.wikipedia.org/wiki/High_availability)
{{%/definition%}}

{{%definition "ingress"%}}
An API object that manages external access to the services in a Kubernetes cluster, typically HTTP.

More info: [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [Ingress routing for Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes/networking/ingress">}})
{{%/definition%}}

## K, L {#letter-k}

{{%definition "kubectl"%}}
A command-line tool for communicating with a Kubernetes API server.

More info: [Overview of kubectl](https://kubernetes.io/docs/reference/kubectl/overview/)
{{%/definition%}}

{{%definition "Lightweight Directory Access Protocol (LDAP)"%}}
A protocol for accessing and maintaining distributed directory services over an IP network, often used to authenticate users.

More info: [LDAP wikipedia](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol), [LDAP authentication]({{<relref "/operate/rs/security/access-control/ldap">}})
{{%/definition%}}

## M - O {#letter-m}

{{%definition "master node"%}}
Node that operates as the leader of a cluster. Also known as the primary node.
{{%/definition%}}

{{%definition "migration"%}}
Deciding when and where shards will be moved if more network throughput, memory, or CPU resources are needed
{{%/definition%}}

{{%definition "multicast DNS (mDNS)"%}}
Protocol that resolves hostnames to the IP addresses that do not include a local name server.

More info: [multicast DNS wikipedia](https://en.wikipedia.org/wiki/Multicast_DNS)
{{%/definition%}}

{{%definition "multi-factor authentication (MFA)"%}}
Method of authenticating users with pieces of evidence of the user's identity. When MFA is enabled on Redis Cloud, users must enter their username, password, and an authentication code when logging in.

More info: [Multi-factor authentication]({{<relref "/operate/rc/security/access-control/multi-factor-authentication">}})
{{%/definition%}}

{{%definition "multi-primary replication"%}}
Also known as multi-master replication, Active-Active databases have multiple primary nodes (one on each participating cluster) to enable concurrent writes operations.

More info: [Multi-primary replication]({{<relref "/operate/rs/databases/active-active/#multi-primary-replication">}})

{{%/definition%}}

{{%definition "namespace"%}}
An abstraction used by Kubernetes to support multiple virtual clusters on the same physical cluster.

More info: [Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
{{%/definition%}}

{{%definition "obsolete"%}}
When features are removed from our products, they're generally replaced by new features that provide a better experience, more functionality, improved security, and other benefits.  

To provide a transition period, we mark older features as _deprecated_ when introducing replacement features.  This gives you time to adjust your deployments, apps, and processes to support the new features.  During this transition, the older features continue to work as a courtesy.

Eventually, older features are removed from the product.  When this happens, they're considered _obsolete_, partly because they can no longer be used.  

For best results, we advise against relying on deprecated features for any length of time.  
{{%/definition%}}

{{%definition "operator"%}}
Operators are software extensions to Kubernetes that make use of custom resources to manage applications and their components.

More info: [operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
{{%/definition%}}

{{%definition "Out-of-Memory (OOM)"%}}
If a member Active-Active database is in an out of memory situation, that member is marked “inconsistent” by Redis Enterprise Software, the member stops responding to user traffic, and the syncer initiates full reconciliation with other peers in the Active-Active database.
{{%/definition%}}

## P - Q {#letter-p}

{{%definition "participating clusters"%}}
Clusters participating in the multi-primary replication of an Active-Active database.
{{%/definition%}}

{{%definition "provisioning"%}}
Deciding where shards will be created and placed.
{{%/definition%}}

{{%definition "proxy policy"%}}
Determines the number and location of active proxies tied to a single endpoint that receive incoming traffic for a database.

For more info, see [Proxy policy]({{<relref "/operate/rs/databases/configure/proxy-policy">}}).
{{%/definition%}}

{{%definition "quorum node"%}}
Node provisioned only for cluster operations that can be elected as a master node. The quorum node participates in the cluster quorum and must be explicitly assigned this role via the `rladmin` command.
{{%/definition%}}

## R {#letter-r}

{{%definition "rack-zone awareness"%}}
Redis Enterprise feature that helps to ensure high availability in the event of a rack or zone failure. In the event of a rack or zone failure, the replicas and endpoints in the remaining racks/zones will be promoted.

More info: [Rack-zone awareness in Redis Enterprise Software]({{<relref "/operate/rs/clusters/configure/rack-zone-awareness">}})
{{%/definition%}}

{{%definition "replication backlog"%}}
Databases using replication or Active-Active maintain a backlog to synchronize the primary and replica shards.
{{%/definition%}}

{{%definition "re-sharding"%}}
Distributing keys and their values among new shards.
{{%/definition%}}

{{%definition "rebalancing"%}}
Moving shards to nodes where more resources are available.
{{%/definition%}}

{{%definition "Redis Cloud"%}}
The cloud version of Redis Enterprise.
{{%/definition%}}

{{%definition "Redis Enterprise cluster"%}}
Collection of Redis Enterprise nodes. A cluster pools system resources across nodes in the cluster and supports multi-tenant database instances.
{{%/definition%}}

{{%definition "Redis Enterprise database"%}}
Logical entity that manages your entire dataset across multiple Redis instances. It segments the data into shards and distributes them among nodes.
{{%/definition%}}

{{%definition "Redis Enterprise nodes"%}}
Physical or virtual machines or containers that runs a collection of Redis Enterprise services
{{%/definition%}}

{{%definition "Redis Enterprise Software"%}}
The on-premises version of Redis Enterprise.
{{%/definition%}}

{{%definition "Redis instance"%}}
Single-threaded Redis Open Source database. Redis OSS was renamed Redis Open Source with the Redis 8 in Redis Open Source release.
{{%/definition%}}

{{%definition "Auto Tiering "%}}
Previously known as Redis on Flash. Enables your Redis databases to span both RAM and dedicated flash memory (SSD). Auto Tiering manages the location of key values (RAM vs Flash) in the database via a LRU-based (least-recently-used) mechanism.

More info: [Auto Tiering]({{<relref "/operate/rs/databases/auto-tiering/">}}), [Auto Tiering  quick start]({{<relref "/operate/rs/databases/auto-tiering/quickstart">}})
{{%/definition%}}

{{%definition "replica high availability (replicaHA)"%}}
High availability feature of Redis Enterprise Software. After a node failure, the cluster automatically migrates remaining replica shards to available nodes. Previously known as "Slave HA" or `slave_ha`.

More info: [High availability for replica shards]({{<relref "/operate/rs/databases/configure/replica-ha">}})
{{%/definition%}}

{{%definition "Replica Of"%}}
The Redis Enterprise implementation of active-passive database replication.

More info: [Replica Of
]({{<relref "/operate/rs/databases/import-export/replica-of/">}})
{{%/definition%}}

{{%definition "ReplicaSet"%}}
A ReplicaSet is a type of Kubernetes resource that (aims to) maintain a set of replica pods running at any given time.

More info: [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
{{%/definition%}}

{{%definition "replication"%}}

Database replication provides a mechanism to ensure high availability. When replication is enabled, your dataset is replicated to a replica shard,
which is constantly synchronized with the primary shard. If the primary 
shard fails, an automatic failover happens and the replica shard is promoted.

More info: [Database replication]({{<relref "/operate/rs/databases/durability-ha/replication">}})
{{%/definition%}}

{{%definition "role-based access control (RBAC)"%}}
A security approach that restricts system access to authorized users.

More info: [RBAC wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control); [Database access control]({{<relref "/operate/rs/security/access-control">}}); [Role-based access control]({{<relref "/operate/rc/security/data-access-control/role-based-access-control">}})
{{%/definition%}}

## S {#letter-s}

{{%definition "secret"%}}
Kubernetes term for object that stores sensitive information, such as passwords, OAuth tokens, and ssh keys.
{{%/definition%}}

{{%definition "shard"%}}
Redis process that is part of the Redis clustered database.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [terminology]({{<relref "/operate/rs/references/terminology">}})
{{%/definition%}}

{{%definition "sharding"%}}
Technique that has been used to scale larger data storage and processing loads. Sharding take your data, partitions it into smaller pieces and then send the data to different locations depending on which partition the data has been assigned to.
{{%/definition%}}

{{%definition "Simple Authentication and Security Layer (SASL)"%}}
Framework for adding authentication support and data security to connection-based protocols via replaceable mechanisms.

More info: [SASL wikipedia](https://en.wikipedia.org/wiki/Simple_Authentication_and_Security_Layer)
{{%/definition%}}

{{%definition "snapshot (RDB)"%}}
Data persistence file that performs a data dump every one, six, or twelve hours.
{{%/definition%}}

{{%definition "syncer"%}}
Process on each node hosting an Active-Active database instance that synchronizes a backlog of operations between participating clusters.

More info: [Syncer process]({{<relref "/operate/rs/databases/active-active/syncer">}})
{{%/definition%}}

## T - Z {#letter-t}

{{%definition "tombstone"%}}

A key that is logically deleted but stays in memory until it is collected by the garbage collector.

{{%/definition%}}

{{%definition "Transport Layer Security (TLS)"%}}
Protocols that provide communications security over a computer network.

More info: [TLS wikipedia](https://en.wikipedia.org/wiki/Transport_Layer_Security), [Cloud database TLS]({{<relref "/operate/rc/security/database-security/tls-ssl">}}), [Redis Enterprise TLS]({{<relref "/operate/rs/security/encryption/tls">}})
{{%/definition%}}

{{%definition "VPC peering"%}}
Networking connection between two VPCs that enables you to route traffic between them using private IP addresses. Instances in either VPC can communicate with each other as if they are within the same network.

More info: [VPC wikipedia](https://en.wikipedia.org/wiki/Virtual_private_cloud), [Enable VPC peering]({{<relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering">}})
{{%/definition%}}


</dl>
