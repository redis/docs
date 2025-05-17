---
Title: Prepare AWS Aurora and PostgreSQL for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/my-sql-mariadb/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare AWS Aurora/PostgreSQL databases to work with RDI
group: di
linkTitle: Prepare AWS Aurora/PostgreSQL
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 5
---

Follow the steps in the sections below to prepare an
[AWS Aurora PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.AuroraPostgreSQL.html)
database to work with RDI.

## 1. Create a parameter group

In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),
navigate to **Parameter groups > Create parameter group**. You will see the panel shown
below:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateParamGroup.webp" alt="Create parameter group panel" >}}

Enter the following information:

| Name | Value |
| :-- | :-- |
| **Parameter group name**  | rdi-aurora-pg |
| **Description**  | Enable logical replication for RDI |
| **Engine Type**  | Aurora PostgreSQL |
| **Parameter group family**  | aurora-postgresql15 |
| **Type**  | DB Cluster Parameter Group |

Select **Create** to create the parameter group.

## 2. Edit the parameter group

Navigate to **Parameter groups** in the console. Select the `rdi-aurora-pg`
group you have just created and then select **Edit** . You will see this panel:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/EditParamGroup.webp" alt="Edit parameter group panel" >}}

Search for the `rds.logical_replication` parameter and set its value to 1. Then,
select **Save Changes**.

## 3. Select the new parameter group

Go back to your target database on the RDS console, select **Modify** and then
scroll down to **Additional Configuration**. Set
the **DB Cluster Parameter Group** to the value `rdi-aurora-pg` that you have just added:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB6.webp" alt="Additional Configuration panel" >}}
