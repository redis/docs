---
Title: Active-Active Redis applications
alwaysopen: false
categories:
- docs
- operate
- rc
description: General information to keep in mind while developing applications for
  an Active-Active database.
hideListLinks: true
linktitle: Develop applications
weight: 99
note: The rest of the content in this folder is mounted from content/operate/rs/databases/active-active/develop. If you need to make a change in the pages in this folder, make it in the RS folder.
---
Developing globally distributed applications can be challenging, as
developers have to think about race conditions and complex combinations
of events under geo-failovers and cross-region write conflicts. In Redis Cloud, Active-Active databases
simplify developing such applications by directly using built-in smarts
for handling conflicting writes based on the data type in use. Instead
of depending on just simplistic "last-writer-wins" type conflict
resolution, geo-distributed Active-Active databases combine techniques defined in CRDT
(conflict-free replicated data types) research with Redis types to
provide smart and automatic conflict resolution based on the data type's
intent.

An Active-Active database is a globally distributed database that spans multiple cloud provider regions. Each Active-Active database can have many Active-Active database instances
that come with added smarts for handling globally distributed writes
using the proven
[CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
approach.
[CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
research describes a set of techniques for creating systems that can
handle conflicting writes. CRDBs powered by Multi-Master Replication
(MMR) provide a straightforward and effective way to replicate your
data between regions and simplify development of complex applications
that can maintain correctness under geo-failovers and concurrent
cross-region writes to the same data.

{{< image filename="/images/rs/crdbs.png" alt="Geo-replication world map">}}

Active-Active databases replicate data between multiple Redis Cloud provider regions. Common uses for Active-Active databases include disaster recovery,
geographically redundant applications, and keeping data closer to your
users' locations. MMR is always multi-directional amongst the regions
configured in the Active-Active database. For unidirectional replication, see [Active-Passive replication]({{< relref "/operate/rc/databases/migrate-databases#sync-using-active-passive" >}}).

## Example of synchronization

{{< embedmd "content/embeds/rc-rs-aa-synchronization.md" >}}

[Learn more about
synchronization for
each supported data type]({{< relref "content/operate/rc/databases/active-active/develop/data-types/" >}}) and [how to develop applications]({{< relref "content/operate/rc/databases/active-active/develop/develop-for-aa.md" >}}) with them on Redis Cloud.