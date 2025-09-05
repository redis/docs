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
Geo-distributed databases that span multiple [Redis Enterprise Software]({{<relref "#redis-enterprise-software">}}) [clusters]({{<relref "#cluster">}}). Active-Active databases, also known as conflict-free replicated databases (CRDB), depend on [multi-primary replication]({{<relref "#multi-primary-replication">}}) and [conflict-free replicated data types (CRDTs)]({{<relref "#conflict-free-replicated-data-types-crdt">}}) to power a simple development experience for geo-distributed applications.

More info: [Active-Active geo-distributed Redis]({{<relref "/operate/rs/databases/active-active">}}), [Geo-distributed Active-Active Redis applications]({{<relref "/operate/rs/databases/active-active/" >}}), [Developing applications for Active-Active databases]({{<relref "/operate/rs/databases/active-active/develop/">}})
{{%/definition%}}

{{%definition "Active-Active database instance"%}}
A "member database" of a global [Active-Active database]({{<relref "#active-active">}}) which is made up of its own master and replica [shards]({{<relref "#shard">}}) spanning a single [cluster]({{<relref "#cluster">}}).

More info: [Active-Active database instances]({{<relref "/operate/rs/databases/active-active/create">}})
{{%/definition%}}

{{%definition "active-passive database replication"%}}
Provides applications read-only access to replicas of the data set from different geographical locations. The Redis Enterprise implementation of active-passive [replication]({{<relref "#replication">}}) is called [Replica Of]({{<relref "#replica-of">}}).

More info: [Database replication]({{<relref "/operate/rs/databases/durability-ha/replication">}}), [Replica Of]({{<relref "/operate/rs/databases/import-export/replica-of">}})
{{%/definition%}}

{{%definition "admin console"%}}
Each node runs a web server that is used to provide the user with access to the Redis Enterprise Software admin console (previously known as management UI). The admin console allows viewing and managing the entire [cluster]({{<relref "#cluster">}}), so it does not matter which [node]({{<relref "#redis-enterprise-nodes">}}) is used to access it.

More info: [Manage clusters]({{<relref "/operate/rs/clusters">}})
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

{{%definition "Bloom filter"%}}
A probabilistic data structure that tests whether an element is a member of a set. False positive matches are possible, but false negatives are not. Bloom filters are space-efficient and provide fast membership testing.

More info: [Bloom filters]({{<relref "/develop/data-types/probabilistic/bloom-filter">}}), [RedisBloom]({{<relref "/operate/oss_and_stack/stack-with-enterprise/bloom">}})
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
Concurrency or updates and writes refer to more than events that happen at the same wall clock time across member [Active-Active databases]({{<relref "#active-active">}}). Concurrent updates refer to the fact that updates happen in between sync events that catch up member Active-Active databases with updates that happened on other member Active-Active databases.

More info: [Developing applications for Active-Active databases]({{<relref "/operate/rs/databases/active-active/develop">}}), [Conflict-free replicated data types (CRDT)]({{<relref "#conflict-free-replicated-data-types-crdt">}})
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
An internally managed [Redis database]({{<relref "#redis-enterprise-database">}}) that acts as a single repository for all [cluster]({{<relref "#cluster">}}) metadata.

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}})
{{%/definition%}}

{{%definition "Cluster Node Manager (CNM)"%}}
A collection of Redis Enterprise services responsible for [provisioning]({{<relref "#provisioning">}}), [migration]({{<relref "#migration">}}), monitoring, [re-sharding]({{<relref "#re-sharding">}}), [rebalancing]({{<relref "#rebalancing">}}), de-provisioning, auto-scaling.

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}}), [Database operations]({{<relref "/operate/rs/databases">}})
{{%/definition%}}

{{%definition "conflict-free replicated databases (CRDB)"%}}

Conflict-free replicated databases (CRDB) are an alternate name for [Active-Active databases](#active-active).
{{%/definition%}}

{{%definition "conflict-free replicated data types (CRDT)"%}}
Techniques used by Redis data types in Active-Active databases that handle conflicting concurrent writes across member Active-Active databases. The Redis Enterprise implementation of CRDT is called an Active-Active database (formerly known as CRDB).

More info: [CRDT info]({{<relref "/operate/rs/databases/active-active/develop/#info" >}}), [Active-Active geo-distributed Redis]({{< relref "/operate/rs/databases/active-active" >}}), [CRDT wikipedia](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
{{%/definition%}}

{{%definition "controllers"%}}
Control loops that watch the state of your Kubernetes cluster and make or request changes where needed to move the current cluster state closer to the desired state.

More info: [Controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
{{%/definition%}}

{{%definition "custom resources (CRs)"%}}
Extensions of the Kubernetes API that allow you to store and retrieve structured data. Custom resources let you extend Kubernetes capabilities without modifying the core Kubernetes code.

More info: [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
{{%/definition%}}

{{%definition "CustomResourceDefinition (CRD)"%}}
A cluster-wide resource that specifies which settings can be configured via custom resource files. CRDs define the structure and validation rules for custom resources.

More info: [CustomResourceDefinition](https://kubernetes.io/docs/reference/glossary/?fundamental=true#term-CustomResourceDefinition), [Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
{{%/definition%}}

## D - F {#letter-d}

{{%definition "data eviction policy"%}}
Defines how excess data is handled when the [database]({{<relref "#redis-enterprise-database">}}) exceeds the memory limit.

More info: [Data Eviction Policy]({{<relref "/operate/rc/databases/configuration/data-eviction-policies">}}), [Redis Enterprise data eviction]({{<relref "/operate/rs/databases/memory-performance/eviction-policy">}})
{{%/definition%}}

{{%definition "declarative configuration"%}}
A configuration approach where you specify the desired state of your system, and the system automatically makes the necessary changes to achieve that state.

More info: [Managing Kubernetes Objects Using Declarative Configuration](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/)
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

{{%definition "failover"%}}
The automatic process of switching to a backup system when the primary system fails. In Redis Enterprise, failover promotes replica shards to primary when the original primary becomes unavailable.

More info: [High availability]({{<relref "/operate/rs/databases/durability-ha">}}), [Replica HA]({{<relref "/operate/rs/databases/configure/replica-ha">}})
{{%/definition%}}

{{%definition "Fully qualified domain name (FQDN)"%}}
A domain name that includes a list of domain labels to specify the exact location in the DNS.

More info: [FQDN wikipedia](https://en.wikipedia.org/wiki/Fully_qualified_domain_name)

{{%/definition%}}

{{%definition "`fsync`"%}}
Linux command to synchronize a file's in-core state with a storage device. Used in [data persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}}) operations.

More info: [`fsync` man page](https://man7.org/linux/man-pages/man2/fsync.2.html), [Data persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}})
{{%/definition%}}

{{%definition "full-text search"%}}
A search technique that examines all words in every stored document to find matches to search criteria. Redis provides full-text search capabilities through its Search and Query features.

More info: [Search and query]({{<relref "/develop/ai/search-and-query">}}), [Full-text search]({{<relref "/develop/ai/search-and-query/query/full-text">}})
{{%/definition%}}

## G - J {#letter-g}

{{%definition "indexing"%}}
The process of creating data structures that improve the speed of data retrieval operations. Redis supports various types of indexing including secondary indexing, vector indexing, and full-text indexing.

More info: [Search and query]({{<relref "/develop/ai/search-and-query">}}), [Indexing concepts]({{<relref "/develop/ai/search-and-query/advanced-concepts">}})
{{%/definition%}}

{{%definition "JSON"%}}
JavaScript Object Notation (JSON) is a lightweight data-interchange format. Redis provides native JSON support through RedisJSON, allowing you to store, update, and retrieve JSON values.

More info: [JSON data type]({{<relref "/develop/data-types/json">}}), [RedisJSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}})
{{%/definition%}}

{{%definition "hash slot"%}}
The result of a hash calculation used in [database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}) to determine which [shard]({{<relref "#shard">}}) stores a particular key.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [Sharding]({{<relref "#sharding">}})
{{%/definition%}}

{{%definition "hash tag"%}}
A part of the key that is used in the hash calculation to determine the [hash slot]({{<relref "#hash-slot">}}) for [database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}).

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [Hash slots]({{<relref "#hash-slot">}})
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

{{%definition "latency"%}}
The time delay between when a command is issued and when a response is received. Redis is designed for low latency, typically operating in the sub-millisecond range.

More info: [Latency monitoring]({{<relref "/operate/oss_and_stack/management/optimization/latency-monitor">}}), [Latency diagnosis]({{<relref "/operate/oss_and_stack/management/optimization/latency">}})
{{%/definition%}}

## M - O {#letter-m}

{{%definition "master node"%}}
[Node]({{<relref "#redis-enterprise-nodes">}}) that operates as the leader of a [cluster]({{<relref "#cluster">}}). Also known as the primary node.

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}}), [High availability]({{<relref "#high-availability">}})
{{%/definition%}}

{{%definition "migration"%}}
Deciding when and where [shards]({{<relref "#shard">}}) will be moved if more network throughput, memory, or CPU resources are needed.

More info: [Database operations]({{<relref "/operate/rs/databases">}}), [Cluster management]({{<relref "/operate/rs/clusters">}})
{{%/definition%}}

{{%definition "multicast DNS (mDNS)"%}}
Protocol that resolves hostnames to the IP addresses that do not include a local name server.

More info: [multicast DNS wikipedia](https://en.wikipedia.org/wiki/Multicast_DNS)
{{%/definition%}}

{{%definition "module"%}}
A Redis extension that adds new commands, data types, and capabilities to Redis. Redis Enterprise includes several modules like RedisJSON, RedisSearch, RedisTimeSeries, and RedisBloom.

More info: [Redis modules]({{<relref "/operate/oss_and_stack/stack-with-enterprise">}}), [Install modules]({{<relref "/operate/oss_and_stack/stack-with-enterprise/install">}})
{{%/definition%}}

{{%definition "monitoring"%}}
The process of observing and tracking the performance, health, and behavior of Redis databases, clusters, and nodes using metrics and alerts.

More info: [Monitoring with metrics and alerts]({{<relref "/operate/rs/monitoring">}}), [Metrics reference]({{<relref "/operate/rs/references/metrics">}})
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
If a member [Active-Active database]({{<relref "#active-active">}}) is in an out of memory situation, that member is marked "inconsistent" by Redis Enterprise Software, the member stops responding to user traffic, and the [syncer]({{<relref "#syncer">}}) initiates full reconciliation with other peers in the Active-Active database.

More info: [Active-Active database troubleshooting]({{<relref "/operate/rs/databases/active-active/syncer">}}), [Memory management]({{<relref "/operate/rs/databases/memory-performance">}})
{{%/definition%}}

## P - Q {#letter-p}

{{%definition "persistence"%}}
The ability to store data permanently to disk so that it survives server restarts. Redis supports RDB snapshots and AOF (Append-Only File) persistence methods.

More info: [Data persistence]({{<relref "/operate/oss_and_stack/management/persistence">}}), [Redis Enterprise persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}})
{{%/definition%}}

{{%definition "participating clusters"%}}
[Clusters]({{<relref "#cluster">}}) participating in the [multi-primary replication]({{<relref "#multi-primary-replication">}}) of an [Active-Active database]({{<relref "#active-active">}}).

More info: [Active-Active geo-distributed Redis]({{<relref "/operate/rs/databases/active-active">}}), [Create Active-Active database]({{<relref "/operate/rs/databases/active-active/create">}})
{{%/definition%}}

{{%definition "PersistentVolume (PV)"%}}
A piece of storage in the cluster that has been provisioned by an administrator or dynamically provisioned using storage classes.

More info: [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
{{%/definition%}}

{{%definition "PersistentVolumeClaims (PVC)"%}}
A request for storage by a user that serves as an abstract representation of PersistentVolume (PV) resources. PVCs consume PV resources and can request specific size and access modes.

More info: [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
{{%/definition%}}

{{%definition "pods"%}}
The smallest deployable units of computing that you can create and manage in Kubernetes. A pod represents a single instance of a running process in your cluster.

More info: [Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
{{%/definition%}}

{{%definition "provisioning"%}}
Deciding where [shards]({{<relref "#shard">}}) will be created and placed within a [cluster]({{<relref "#cluster">}}).

More info: [Database operations]({{<relref "/operate/rs/databases">}}), [Create databases]({{<relref "/operate/rs/databases/create">}})
{{%/definition%}}

{{%definition "proxy policy"%}}
Determines the number and location of active proxies tied to a single endpoint that receive incoming traffic for a database.

For more info, see [Proxy policy]({{<relref "/operate/rs/databases/configure/proxy-policy">}}).
{{%/definition%}}

{{%definition "quorum node"%}}
[Node]({{<relref "#redis-enterprise-nodes">}}) provisioned only for [cluster]({{<relref "#cluster">}}) operations that can be elected as a [master node]({{<relref "#master-node">}}). The quorum node participates in the cluster quorum and must be explicitly assigned this role via the `rladmin` command.

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}}), [rladmin command reference]({{<relref "/operate/rs/references/cli-utilities/rladmin">}})
{{%/definition%}}

## R {#letter-r}

{{%definition "Redis Stack"%}}
A collection of Redis modules that extends Redis with modern data models and processing engines. Includes capabilities for document databases, graph databases, time series, and more.

More info: [Redis Stack]({{<relref "/operate/oss_and_stack/stack-with-enterprise">}}), [Redis Stack features]({{<relref "/operate/oss_and_stack/stack-with-enterprise/enterprise-capabilities">}})
{{%/definition%}}

{{%definition "rack-zone awareness"%}}
Redis Enterprise feature that helps to ensure high availability in the event of a rack or zone failure. In the event of a rack or zone failure, the replicas and endpoints in the remaining racks/zones will be promoted.

More info: [Rack-zone awareness in Redis Enterprise Software]({{<relref "/operate/rs/clusters/configure/rack-zone-awareness">}})
{{%/definition%}}

{{%definition "replication backlog"%}}
[Databases]({{<relref "#redis-enterprise-database">}}) using [replication]({{<relref "#replication">}}) or [Active-Active]({{<relref "#active-active">}}) maintain a backlog to synchronize the primary and replica [shards]({{<relref "#shard">}}).

More info: [Database replication]({{<relref "/operate/rs/databases/durability-ha/replication">}}), [Active-Active databases]({{<relref "/operate/rs/databases/active-active">}})
{{%/definition%}}

{{%definition "re-sharding"%}}
Distributing keys and their values among new [shards]({{<relref "#shard">}}) to optimize performance and resource utilization.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [Database operations]({{<relref "/operate/rs/databases">}})
{{%/definition%}}

{{%definition "rebalancing"%}}
Moving [shards]({{<relref "#shard">}}) to [nodes]({{<relref "#redis-enterprise-nodes">}}) where more resources are available.

More info: [Database operations]({{<relref "/operate/rs/databases">}}), [Cluster management]({{<relref "/operate/rs/clusters">}})
{{%/definition%}}

{{%definition "Redis Cloud"%}}
The cloud version of Redis Enterprise.

More info: [Redis Cloud]({{<relref "/operate/rc">}}), [Redis Cloud quick start]({{<relref "/operate/rc/rc-quickstart">}})
{{%/definition%}}

{{%definition "Redis Enterprise cluster"%}}
Collection of [Redis Enterprise nodes]({{<relref "#redis-enterprise-nodes">}}). A [cluster]({{<relref "#cluster">}}) pools system resources across nodes in the cluster and supports multi-tenant [database]({{<relref "#redis-enterprise-database">}}) instances.

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}}), [Cluster management]({{<relref "/operate/rs/clusters">}})
{{%/definition%}}

{{%definition "Redis Enterprise database"%}}
Logical entity that manages your entire dataset across multiple [Redis instances]({{<relref "#redis-instance">}}). It segments the data into [shards]({{<relref "#shard">}}) and distributes them among [nodes]({{<relref "#redis-enterprise-nodes">}}).

More info: [Database operations]({{<relref "/operate/rs/databases">}}), [Create databases]({{<relref "/operate/rs/databases/create">}})
{{%/definition%}}

{{%definition "Redis Enterprise nodes"%}}
Physical or virtual machines or containers that runs a collection of Redis Enterprise services within a [cluster]({{<relref "#cluster">}}).

More info: [Redis Enterprise cluster architecture]({{<relref "/operate/rs/clusters">}}), [Install and setup]({{<relref "/operate/rs/installing-upgrading">}})
{{%/definition%}}

{{%definition "Redis Enterprise Software"%}}
The on-premises version of Redis Enterprise.

More info: [Redis Enterprise Software]({{<relref "/operate/rs">}}), [Install Redis Enterprise Software]({{<relref "/operate/rs/installing-upgrading">}})
{{%/definition%}}

{{%definition "Redis instance"%}}
Single-threaded Redis Open Source database. Redis OSS was renamed Redis Open Source with the Redis 8 in Redis Open Source release.

More info: [Redis Open Source]({{<relref "/operate/oss_and_stack">}}), [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}})
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

{{%definition "role bindings"%}}
Kubernetes objects that grant the permissions defined in a role to a user or set of users, including service accounts.

More info: [RoleBinding and ClusterRoleBinding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding)
{{%/definition%}}

{{%definition "role-based access control (RBAC)"%}}
A security approach that restricts system access to authorized users.

More info: [RBAC wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control); [Database access control]({{<relref "/operate/rs/security/access-control">}}); [Role-based access control]({{<relref "/operate/rc/security/data-access-control/role-based-access-control">}})
{{%/definition%}}

{{%definition "roles"%}}
Kubernetes objects that contain rules representing a set of permissions. Roles define what actions can be performed on which resources.

More info: [Role and ClusterRole](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#role-and-clusterrole)
{{%/definition%}}

## S {#letter-s}

{{%definition "search"%}}
The ability to query and retrieve data using various search methods including full-text search, vector search, and secondary indexing. Redis provides search capabilities through its Search and Query features.

More info: [Search and query]({{<relref "/develop/ai/search-and-query">}}), [RedisSearch]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search">}})
{{%/definition%}}

{{%definition "secondary indexing"%}}
Creating additional data structures to enable fast lookups on fields other than the primary key. Redis supports secondary indexing for JSON documents, hashes, and other data types.

More info: [Search and query]({{<relref "/develop/ai/search-and-query">}}), [Indexing concepts]({{<relref "/develop/ai/search-and-query/advanced-concepts">}})
{{%/definition%}}

{{%definition "secret"%}}
Kubernetes term for object that stores sensitive information, such as passwords, OAuth tokens, and ssh keys.

More info: [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
{{%/definition%}}

{{%definition "service account"%}}
Provides an identity for processes that run in a pod, allowing them to access the Kubernetes API and other resources.

More info: [Service Accounts](https://kubernetes.io/docs/concepts/security/service-accounts/)
{{%/definition%}}

{{%definition "services"%}}
An abstract way to expose an application running on a set of pods as a network service in Kubernetes.

More info: [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
{{%/definition%}}

{{%definition "shard"%}}
Redis process that is part of the Redis clustered database.

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [terminology]({{<relref "/operate/rs/references/terminology">}})
{{%/definition%}}

{{%definition "sharding"%}}
Technique that has been used to scale larger data storage and processing loads. Sharding take your data, partitions it into smaller pieces and then send the data to different locations depending on which partition the data has been assigned to. Related to [hash slots]({{<relref "#hash-slot">}}) and [shards]({{<relref "#shard">}}).

More info: [Database clustering]({{<relref "/operate/rs/databases/durability-ha/clustering">}}), [Shards]({{<relref "#shard">}})
{{%/definition%}}

{{%definition "Simple Authentication and Security Layer (SASL)"%}}
Framework for adding authentication support and data security to connection-based protocols via replaceable mechanisms.

More info: [SASL wikipedia](https://en.wikipedia.org/wiki/Simple_Authentication_and_Security_Layer)
{{%/definition%}}

{{%definition "snapshot (RDB)"%}}
Data persistence file that performs a data dump every one, six, or twelve hours. Used alongside [append-only file (AoF)]({{<relref "#append-only-file-aof">}}) for data persistence.

More info: [Data persistence]({{<relref "/operate/rs/databases/configure/database-persistence">}}), [Append-only file (AoF)]({{<relref "#append-only-file-aof">}})
{{%/definition%}}

{{%definition "storage class"%}}
A way for administrators to describe the classes of storage they offer in Kubernetes, including different quality-of-service levels, backup policies, or arbitrary policies.

More info: [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
{{%/definition%}}

{{%definition "syncer"%}}
Process on each node hosting an Active-Active database instance that synchronizes a backlog of operations between participating clusters.

More info: [Syncer process]({{<relref "/operate/rs/databases/active-active/syncer">}})
{{%/definition%}}

## T - Z {#letter-t}

{{%definition "throughput"%}}
The number of operations or requests that can be processed per unit of time. Redis is designed for high throughput, capable of handling hundreds of thousands to millions of operations per second.

More info: [Redis benchmarks]({{<relref "/operate/oss_and_stack/management/optimization/benchmarks">}}), [Performance optimization]({{<relref "/operate/oss_and_stack/management/optimization">}})
{{%/definition%}}

{{%definition "time series"%}}
A sequence of data points indexed in time order. Redis provides native time series support through RedisTimeSeries for storing and querying time-stamped data.

More info: [Time series data type]({{<relref "/develop/data-types/timeseries">}}), [RedisTimeSeries]({{<relref "/operate/oss_and_stack/stack-with-enterprise/timeseries">}})
{{%/definition%}}

{{%definition "tombstone"%}}
A key that is logically deleted but stays in memory until it is collected by the garbage collector. Common in [Active-Active databases]({{<relref "#active-active">}}) during conflict resolution.

More info: [Active-Active database development]({{<relref "/operate/rs/databases/active-active/develop">}}), [Conflict-free replicated data types (CRDT)]({{<relref "#conflict-free-replicated-data-types-crdt">}})
{{%/definition%}}

{{%definition "Transport Layer Security (TLS)"%}}
Protocols that provide communications security over a computer network.

More info: [TLS wikipedia](https://en.wikipedia.org/wiki/Transport_Layer_Security), [Cloud database TLS]({{<relref "/operate/rc/security/database-security/tls-ssl">}}), [Redis Enterprise TLS]({{<relref "/operate/rs/security/encryption/tls">}})
{{%/definition%}}

{{%definition "vector search"%}}
A search method that finds similar items by comparing high-dimensional vectors representing data features. Redis supports vector search for AI applications, machine learning, and similarity matching.

More info: [Vector search]({{<relref "/develop/ai/search-and-query/vectors">}}), [Vector indexing]({{<relref "/develop/ai/search-and-query/query/vector-search">}})
{{%/definition%}}

{{%definition "VPC peering"%}}
Networking connection between two VPCs that enables you to route traffic between them using private IP addresses. Instances in either VPC can communicate with each other as if they are within the same network.

More info: [VPC wikipedia](https://en.wikipedia.org/wiki/Virtual_private_cloud), [Enable VPC peering]({{<relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering">}})
{{%/definition%}}

</dl>
