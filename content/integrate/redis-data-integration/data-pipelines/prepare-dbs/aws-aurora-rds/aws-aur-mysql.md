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

Follow the steps in the sections below to prepare an [AWS Aurora MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.Aurora.html) or [AWS RDS MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.MySQL.html) database.
database to work with RDI.

Select the steps for your database type.

{{< multitabs id="rds-aur-mysql" 
    tab1="AWS Aurora MySQL" 
    tab2="AWS RDS MySQL" >}}

## Add an Aurora reader node

RDI requires that your Aurora MySQL database has at least one replica or reader node. 

To add a reader node to an existing database, select **Add reader** from the **Actions** menu of the database and [add a reader node](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-replicas-adding.html).

You can also create one during database creation by selecting **Create an Aurora Replica or Reader node in a different AZ (recommended for scaled availability)** under **Availability & durability > Multi-AZ deployment**. 

## Create and apply parameter group

RDI requires some changes to database parameters. On AWS Aurora, you change these parameters via a parameter group.

1. In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.Creating.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **Aurora MySQL**.  |
    | **Parameter group family**  | Choose **aurora-mysql8.0**. |
    | **Type**  | Select **DB Parameter Group**. |

    Select **Create** to create the parameter group.

1. Navigate to **Parameter groups** in the console. Select the parameter group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `binlog_format`  | `ROW` |
    | `binlog_row_image`  | `FULL` |
    | `gtid_mode`  | `ON` |
    | `enforce_gtid_consistency`  | `ON` |

    Select **Save Changes** to apply the changes to the parameter group.

1. Go back to your target database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created. 

    Select **Save changes** to apply the parameter group to the new database.

1. Reboot your database instance. See [Rebooting a DB instance within an Aurora cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-reboot-db-instance.html) for more information.


{{< embed-md "aur-rds-mysql-create-debezium-user.md" >}}

-tab-sep-

## Create and apply parameter group

RDI requires some changes to database parameters. On AWS RDS, you change these parameters via a parameter group.

1. In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithParamGroups.Creating.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **MySQL Community**.  |
    | **Parameter group family**  | Choose **mysql8.0**. |

    Select **Create** to create the parameter group.

1. Navigate to **Parameter groups** in the console. Select the parameter group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `binlog_format`  | `ROW` |
    | `binlog_row_image`  | `FULL` |

    Select **Save Changes** to apply the changes to the parameter group.

1. Go back to your target database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created. 

    Select **Save changes** to apply the parameter group to the new database.

1. Reboot your database instance. See [Rebooting a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RebootInstance.html) for more information. 

{{< embed-md "aur-rds-mysql-create-debezium-user.md" >}}

{{< /multitabs >}}
