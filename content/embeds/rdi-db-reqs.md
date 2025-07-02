* Redis Enterprise v6.4 or greater for the cluster.
* For production, 250MB RAM with one primary and one replica is recommended, but for the
  quickstart or for development, 125MB and a single shard is sufficient.
* If you are deploying RDI for a production environment then secure this database with a password
  and TLS.
* Set the database's
  [eviction policy]({{< relref "/operate/rs/databases/memory-performance/eviction-policy" >}}) to `noeviction`. Note that you can't set this using
  [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}),
  so you must either do it using the admin UI or with the following
  [REST API]({{< relref "/operate/rs/references/rest-api" >}})
  command:

  ```bash
  curl -v -k -d '{"eviction_policy": "noeviction"}' \
    -u '<USERNAME>:<PASSWORD>' \
    -H "Content-Type: application/json" \
    -X PUT https://<CLUSTER_FQDN>:9443/v1/bdbs/<BDB_UID>
  ```
* Set the database's
  [data persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}})
  to AOF - fsync every 1 sec. Note that you can't set this using
  [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}),
  so you must either do it using the admin UI or with the following
  [REST API]({{< relref "/operate/rs/references/rest-api" >}})
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
* **Ensure that the RDI database is not clustered.** RDI will not work correctly if the
  RDI database is clustered (but note that the target database *can* be clustered without
  any problems).

  If the **Database clustering** option is checked when you create the RDI database (as shown below),
  you must *uncheck* it before proceeding.

  {{< image filename="images/rdi/ingest/RDIClusterSetting.webp" alt="Uncluster the RDI database." >}}

  You can check if your RDI database is clustered from its **Configuration** tab in the
  Redis Enterprise console. The **Database clustering** option should be set to **None**,
  as shown in the following screenshot:

  {{< image filename="images/rdi/ingest/RDICheckUnclustered.webp" alt="Check that the RDI database is not clustered." >}}

  If you find the database has been clustered by mistake, you must create a new database with
  clustering disabled before continuing with the RDI installation.
