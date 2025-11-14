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

```checklist {id="auroramysql" nointeractive="true" }
- [ ] [Add an Aurora reader node](#add-an-aurora-reader-node)
- [ ] [Create and apply parameter group](#aurora-create-and-apply-parameter-group)
- [ ] [Create Debezium user](#aurora-create-debezium-user)
```

## Add an Aurora reader node

RDI requires that your Aurora MySQL database has at least one replica or reader node. 

To add a reader node to an existing database, select **Add reader** from the **Actions** menu of the database and [add a reader node](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-replicas-adding.html).

You can also create one during database creation by selecting **Create an Aurora Replica or Reader node in a different AZ (recommended for scaled availability)** under **Availability & durability > Multi-AZ deployment**. 

## <a id="aurora-create-and-apply-parameter-group"></a>Create and apply parameter group

RDI requires some changes to database parameters. On AWS Aurora, you change these parameters via a parameter group.

```checklist {id="auroramysql-param-group" nointeractive="true" }
- [ ] [Create a parameter group](#aurora-create-a-parameter-group)
- [ ] [Apply the parameter group](#aurora-apply-the-parameter-group)
- [ ] [Apply the parameter group to the database](#aurora-apply-the-parameter-group-to-the-database)
- [ ] [Reboot the database instance](#aurora-reboot-the-database-instance)
```

1. <a id="aurora-create-a-parameter-group"></a>
    In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.Creating.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **Aurora MySQL**.  |
    | **Parameter group family**  | Choose **aurora-mysql8.0**. |
    | **Type**  | Select **DB Parameter Group**. |

    Select **Create** to create the parameter group.

1. <a id="aurora-apply-the-parameter-group"></a>
    Navigate to **Parameter groups** in the console. Select the parameter group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `binlog_format`  | `ROW` |
    | `binlog_row_image`  | `FULL` |
    | `gtid_mode`  | `ON` |
    | `enforce_gtid_consistency`  | `ON` |

    Select **Save Changes** to apply the changes to the parameter group.

1. <a id="aurora-apply-the-parameter-group-to-the-database"></a>
    Go back to your target database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created.

    Select **Save changes** to apply the parameter group to the new database.

1. <a id="aurora-reboot-the-database-instance"></a>
    Reboot your database instance. See [Rebooting a DB instance within an Aurora cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-reboot-db-instance.html) for more information.

<a id="aurora-create-debezium-user"></a>

{{< embed-md "aur-rds-mysql-create-debezium-user.md" >}}

-tab-sep-

```checklist {id="rds-mysql-list" nointeractive="true" }
- [ ] [Create and apply parameter group](#rds-create-and-apply-parameter-group)
- [ ] [Create Debezium user](#rds-create-debezium-user)
```

## <a id="rds-create-and-apply-parameter-group"></a>Create and apply parameter group

RDI requires some changes to database parameters. On AWS RDS, you change these parameters via a parameter group.

```checklist {id="rds-mysql-param-group" nointeractive="true" }
- [ ] [Create a parameter group](#rds-create-a-parameter-group)
- [ ] [Apply the parameter group](#rds-apply-the-parameter-group)
- [ ] [Apply the parameter group to the database](#rds-apply-the-parameter-group-to-the-database)
- [ ] [Reboot the database instance](#rds-reboot-the-database-instance)
```

1. <a id="rds-create-a-parameter-group"></a>
    In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithParamGroups.Creating.html) with the following settings:

    | Name | Value |
    | :-- | :-- |
    | **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
    | **Description**  | (Optional) Enter a description for the parameter group |
    | **Engine Type**  | Choose **MySQL Community**.  |
    | **Parameter group family**  | Choose **mysql8.0**. |

    Select **Create** to create the parameter group.

1. <a id="rds-apply-the-parameter-group"></a>
    Navigate to **Parameter groups** in the console. Select the parameter group you have just created and then select **Edit**. Change the following parameters:

    | Name | Value |
    | :-- | :-- |
    | `binlog_format`  | `ROW` |
    | `binlog_row_image`  | `FULL` |

    Select **Save Changes** to apply the changes to the parameter group.

1. <a id="rds-apply-the-parameter-group-to-the-database"></a>
    Go back to your target database on the RDS console, select **Modify** and then scroll down to **Additional Configuration**. Set the **DB Cluster Parameter Group** to the group you just created.

    Select **Save changes** to apply the parameter group to the new database.

1. <a id="rds-reboot-the-database-instance"></a>
    Reboot your database instance. See [Rebooting a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RebootInstance.html) for more information.

<a id="rds-create-debezium-user"></a>

{{< embed-md "aur-rds-mysql-create-debezium-user.md" >}}

{{< /multitabs >}}
