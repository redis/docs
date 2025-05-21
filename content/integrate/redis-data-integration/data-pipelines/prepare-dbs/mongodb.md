---
Title: Prepare MongoDB for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/mongodb/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare MongoDB databases to work with RDI
group: di
linkTitle: Prepare MongoDB
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

This guide describes the steps required to prepare a MongoDB database as a source for Redis Data Integration (RDI) pipelines.

## Prerequisites
- **MongoDB version:** 4.0 or later (replica set, sharded cluster, or MongoDB Atlas).
- **User privileges:** You must have a MongoDB user with sufficient privileges to read the oplog and collections, and to use change streams (if required).
- **Network access:** The RDI Collector must be able to connect to all MongoDB nodes in your deployment.

## 1. Configure Oplog Size
Ensure the oplog is large enough to retain changes for the duration of your RDI pipeline's snapshot and streaming operations. 
Follow the MongoDB [documentation](https://www.mongodb.com/docs/manual/tutorial/change-oplog-size/) to check and resize (if necessary) the oplog size.

## 2. Create a MongoDB User for RDI
Create a user with the following roles on the source database:
- readAnyDatabase
- clusterMonitor

Example:
```javascript
use admin;
db.createUser({
  user: "rdi_user",
  pwd: "rdi_password",
  roles: [
    { role: "readAnyDatabase", db: "admin" },
    { role: "clusterMonitor", db: "admin" }
  ]
});
```

## 3. Connection String Format
The RDI Collector requires a MongoDB connection string that includes all relevant hosts and authentication details.

Example (Replica Set):
```
mongodb://${SOURCE_DB_USERNAME}:${SOURCE_DB_PASSWORD}@host1:27017,host2:27017,host3:27017/?replicaSet=rs0&authSource=admin
```
Example (Sharded Cluster):
```
mongodb://${SOURCE_DB_USERNAME}:${SOURCE_DB_PASSWORD}@host:30000
```
- For Atlas, adjust the connection string accordingly.
- Set replicaSet and authSource as appropriate for your deployment.

## 4. Enable Change Streams and Pre/Post Images (Only if Using a Custom Key)
Change Streams: Required only if you are using a custom key in your RDI pipeline. Change streams are available by default on replica sets, sharded clusters, and MongoDB Atlas.
Pre/Post Images: If your RDI pipeline uses a custom key, you must enable pre- and post-images on the relevant collections to capture the document state before and after updates or deletes. This allows RDI to access both the previous and updated versions of documents during change events, ensuring accurate synchronization.
```javascript
db.runCommand({
  collMod: "your_collection",
  changeStreamPreAndPostImages: { enabled: true }
});
```

## 5. MongoDB Atlas Specific Requirements
MongoDB Atlas only supports secure connections via SSL.
The root CA certificate for MongoDB Atlas must be added as a SOURCE_DB_CACERT secret in RDI.

- Download the MongoDB Atlas root CA certificate.
- In RDI, add this certificate as a secret named SOURCE_DB_CACERT.
- Ensure your connection string includes ssl=true or tls=true and references the CA certificate if required by your deployment.

Example connection string for Atlas:
```
mongodb+srv://${SOURCE_DB_USERNAME}:${SOURCE_DB_PASSWORD}@cluster0.mongodb.net/?authSource=admin&tls=true
```

## 6. Network and Security
- Ensure the RDI Collector can connect to all MongoDB nodes on the required ports (default: 27017, or as provided by Atlas).
- If using TLS/SSL, provide the necessary certificates and connection options in the connection string.

## 7. Configuration is complete
Once you have followed the steps above, your MongoDB database is ready for Debezium to use.

## Additional Resources
- [MongoDB Replica Set Documentation](https://www.mongodb.com/docs/manual/replication/)
- [MongoDB Sharded Cluster Documentation](https://www.mongodb.com/docs/manual/sharding/)
- [MongoDB Change Streams](https://www.mongodb.com/docs/manual/changeStreams/)
- [MongoDB User Management](https://www.mongodb.com/docs/manual/core/security-users/)
- [Debezium MongoDB Connector Documentation](https://debezium.io/documentation/reference/stable/connectors/mongodb.html)
- [MongoDB Atlas SSL Setup](https://debezium.io/documentation/reference/stable/connectors/mongodb.html#mongodb-in-the-cloud)

## Summary Table
| Requirement         | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| MongoDB Topology    | Replica Set, Sharded Cluster, or MongoDB Atlas                              |
| User Roles          | readAnyDatabase, clusterMonitor                                             |
| Oplog               | Sufficient size for snapshot and streaming                                  |
| Pre/Post Images     | Enable on collections **only if using a custom key**                        |
| Connection String   | Must include all hosts, replicaSet (if applicable), authSource, credentials |
| MongoDB Atlas       | **[SSL required](https://debezium.io/documentation/reference/stable/connectors/mongodb.html#mongodb-property-mongodb-ssl-enabled)**, provide root CA as `SOURCE_DB_CACERT` secret in RDI       |
| Network             | RDI Collector must reach all MongoDB nodes on required ports                |

By following these steps, your MongoDB database—including MongoDB Atlas—will be ready to serve as a source for Redis Data Integration pipelines.
