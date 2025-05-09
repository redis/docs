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

## Step 1: Create a parameter group

In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),
navigate to **Parameter groups > Create parameter group**. [Create a parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_WorkingWithParamGroups.CreatingCluster.html)
with the following settings:

| Name | Value |
| :-- | :-- |
| **Parameter group name**  | Enter a suitable parameter group name, like `rdi-mysql` |
| **Description**  | (Optional) Enter a description for the parameter group |
| **Engine Type**  | Choose **Aurora MySQL** for Aurora MySQL or **MySQL Community** for AWS RDS MySQL.  |
| **Parameter group family**  | Choose **aurora-mysql8.0** for Aurora MySQL or **mysql8.0** for AWS RDS MySQL. |

Select **Create** to create the parameter group.

## Step 2: Edit the parameter group

Navigate to **Parameter groups** in the console. Select the `rdi-aurora-pg`
group you have just created and then select **Edit**. 

Search for the `binlog_format` parameter and set its value to `ROW`, and search for the the `binlog_row_image` parameter and set its value to `FULL`. Then,
select **Save Changes**.

## Step 3: Select the new parameter group

Go back to your target database on the RDS console, select **Modify** and then
scroll down to **Additional Configuration**. Set
the **DB Cluster Parameter Group** to the group you just created. 

Select **Save changes** to apply the parameter group to the new database.