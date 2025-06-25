---
Title: Prepare AWS Aurora MySQL/AWS RDS MySQL for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-mysql/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Enable CDC features in your source databases
group: di
hideListLinks: false
linkTitle: Prepare AWS Aurora/RDS MySQL
summary: Prepare AWS Aurora MySQL and AWS RDS MySQL databases to work with Redis Data Integration.
type: integration
weight: 2
---

Follow the steps in the sections below to prepare an [AWS Aurora MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.Aurora.html) or [AWS RDS MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.MySQL.html) database to work with RDI.

{{< embed-md "rdi-aur-rds-pub-access.md" >}} 

## Create and apply parameter group

RDI requires some changes to database parameters. On AWS RDS and AWS Aurora, you change these parameters via a parameter group.

1. In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.CreatingCluster.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **Aurora MySQL** for Aurora MySQL or **MySQL Community** for AWS RDS MySQL.  |
    | **Parameter group family**  | Choose **aurora-mysql8.0** for Aurora MySQL or **mysql8.0** for AWS RDS MySQL. |

    Select **Create** to create the parameter group.

1. Navigate to **Parameter groups** in the console. Select the parameter group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `binlog_format`  | `ROW` |
    | `binlog_row_image`  | `FULL` |

    Select **Save Changes** to apply the changes to the parameter group.

1. Go back to your target database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created. 

    Select **Save changes** to apply the parameter group to the new database.

## Create Debezium user

The Debezium connector needs a user account to connect to MySQL. This
user must have appropriate permissions on all databases where you want Debezium
to capture changes.

1. Connect to your database as an admin user and create a new user for the connector:

    ```sql
    CREATE USER '<username>'@'%' IDENTIFIED BY '<password>';
    ```

    Replace `<username>` and `<password>` with a username and password for the new user.

    The `%` means that the user can connect from any client. If you want to restrict the user to connect only from the RDI host, replace `%` with the IP address of the RDI host.

1. Grant the user the necessary permissions:

    ```sql
    GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT, LOCK TABLES ON *.* TO '<username>'@'%';
    ```

    Replace `<username>` with the username of the Debezium user.

1. Finalize the user's permissions:

    ```sql
    FLUSH PRIVILEGES;
    ```
