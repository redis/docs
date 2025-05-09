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

## Step 1: Create a parameter group

In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),
navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.CreatingCluster.html)
with the following settings:

| Name | Value |
| :-- | :-- |
| **Parameter group name**  | Enter a suitable parameter group name, like `rdi-aurora-pg` or `rdi-rds-pg` |
| **Description**  | (Optional) Enter a description for the parameter group |
| **Engine Type**  | Choose **Aurora PostgreSQL** for Aurora PostgreSQL or **PostgreSQL** for AWS RDS PostgreSQL. |
| **Parameter group family**  | Choose **aurora-postgresql15** for Aurora PostgreSQL or **postgresql13** for AWS RDS PostgreSQL. |

Select **Create** to create the parameter group.

## Step 2: Edit the parameter group

Navigate to **Parameter groups** in the console. Select the 
group you have just created and then select **Edit**.

Search for the `rds.logical_replication` parameter and set its value to 1. Then,
select **Save Changes**.

## Step 3: Select the new parameter group

Go back to your target database on the RDS console, select **Modify** and then
scroll down to **Additional Configuration**. Set
the **DB Cluster Parameter Group** to the group you just created. 

Select **Save changes** to apply the parameter group to the new database.
