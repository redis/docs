* Redis Enterprise v6.4 or greater for the cluster.
* For production, 250MB RAM with one primary and one replica is recommended, but for the
  quickstart or for development, 125MB and a single shard is sufficient.
* If you are deploying RDI for a production environment then secure this database with a password
  and TLS.
* Set the database's
  [eviction policy](/content/operate/rs/databases/memory-performance/eviction-policy.md) to `noeviction`. Note that you can't set this using
  [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md),
  so you must either do it using the admin UI or with the following
  [REST API](/content/operate/rs/references/rest-api/_index.md)
  command:

  ```bash
  curl -v -k -d '{"eviction_policy": "noeviction"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" \
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  ```
* Set the database's
  [data persistence](/content/operate/rs/databases/configure/database-persistence.md)
  to AOF - fsync every 1 sec. Note that you can't set this using
  [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md),
  so you must either do it using the admin UI or with the following
  [REST API](/content/operate/rs/references/rest-api/_index.md)
  commands:

  ```bash
  curl -v -k -d '{"data_persistence":"aof"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" 
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  curl -v -k -d '{"aof_policy":"appendfsync-every-sec"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" \
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  ```
 If you don't have permissions to use AOF persistence, please check the [Using RDI without persistence](/content/integrate/redis-data-integration/faq.md#can-i-use-rdi-without-persistence-enabled) section in the FAQ.

* **Ensure that the RDI database is not clustered.** RDI will not work correctly if the
  RDI database is clustered (but note that the target database *can* be clustered without
  any problems).

  When you create the RDI database, expand the **Clustering** section and make sure the
  **Sharding** option is *unchecked* (as shown below).

  {{< image filename="images/rdi/ingest/RDIClusterSetting.webp" alt="The Sharding option is unchecked in the Clustering section of the create database form." >}}

  You can check if your RDI database is clustered from its **Configuration** tab in the
  Cluster Manager UI. In the **Clustering** section, **Sharding** should be set to **Disabled**,
  as shown in the following screenshot:

  {{< image filename="images/rdi/ingest/RDICheckUnclustered.webp" alt="The Clustering section of the database Configuration tab shows Sharding: Disabled." >}}

  If you find the database has been clustered by mistake, you must create a new database with
  sharding disabled before continuing with the RDI installation.
