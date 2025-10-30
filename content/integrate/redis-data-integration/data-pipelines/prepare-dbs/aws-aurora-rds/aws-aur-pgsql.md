---
Title: Prepare AWS Aurora PostgreSQL/AWS RDS PostgreSQL for RDI
aliases: 
- /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/aws-aur-pgsql/
- /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-pgsql/
- /integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aur-pgsql/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rc
- rdi
description: Prepare AWS Aurora PostgreSQL databases to work with RDI
group: di
linkTitle: Prepare AWS Aurora PostgreSQL
summary: Prepare AWS Aurora PostgreSQL databases to work with Redis Data Integration.
type: integration
weight: 1
---

Follow the steps in the sections below to prepare an
[AWS Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.AuroraPostgreSQL.html) or [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)
database to work with RDI.

## Create and apply parameter group

RDI requires some changes to database parameters. On AWS RDS and AWS Aurora, you change these parameters via a parameter group.

1. In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/), navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.CreatingCluster.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-aurora-pg` or `rdi-rds-pg` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **Aurora PostgreSQL** for Aurora PostgreSQL or **PostgreSQL** for AWS RDS PostgreSQL. |
    | **Parameter group family**  | Choose **aurora-postgresql15** for Aurora PostgreSQL or **postgresql13** for AWS RDS PostgreSQL. |

    Select **Create** to create the parameter group.

1. Navigate to **Parameter groups** in the console. Select the group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `rds.logical_replication`  | `1` |

    Select **Save Changes** to apply the changes to the parameter group.

1. Go back to your database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created. 

    Select **Save changes** to apply the parameter group to your database.

1. Reboot your database instance. See [Rebooting a DB instance within an Aurora cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-reboot-db-instance.html) or [Rebooting a DB instance (RDS)](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RebootInstance.html) for more information.

## Create Debezium user

The Debezium connector needs a user account to connect to PostgreSQL. This
user must have appropriate permissions on all databases where you want Debezium
to capture changes.

1. Connect to PostgreSQL as the `postgres` user and create a new user for the connector:

    ```sql
    CREATE ROLE <username> WITH LOGIN PASSWORD '<password>' VALID UNTIL 'infinity';
    ```

    Replace `<username>` and `<password>` with a username and password for the new user.

1. Grant the user the necessary replication permissions:

    ```sql
    GRANT rds_replication TO <username>;
    ```

    Replace `<username>` with the username of the Debezium user.

1. Connect to your database as the `postgres` user and grant the new user access to one or more schemas in the database:

    ```sql
    GRANT SELECT ON ALL TABLES IN SCHEMA <schema> TO <username>;
    ```

    Replace `<username>` with the username of the Debezium user and `<schema>` with the schema name.

