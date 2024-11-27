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

## 1. Create an Amazon Elastic Compute Cloud instance

Follow the instructions in
[Amazon's documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.AuroraPostgreSQL.html#CHAP_GettingStarted.Creating.AuroraPostgreSQL.EC2)
to create an Elastic Compute Cloud (EC2) instance for the database, if you don't
already have one available. If you want to run the RDI PostgreSQL demo,
you should select "Docker on Ubuntu 20.04 LTS" as the Amazon Machine Image (AMI)
and specify a disk size of 50GB.

## 2. Create a parameter group

In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),
navigate to **Parameter groups > Create parameter group**. You will see the panel shown
below:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateParamGroup.jpg" alt="Create parameter group panel" >}}

Enter the following information:

| Name | Value |
| :-- | :-- |
| **Parameter group name**  | rdi-aurora-pg |
| **Description**  | Enable logical replication for RDI |
| **Engine Type**  | Aurora PostgreSQL |
| **Parameter group family**  | aurora-postgresql15 |
| **Type**  | DB Cluster Parameter Group |

Select **Create** to create the parameter group.

## 3. Edit the parameter group

Navigate to **Parameter groups** in the console. Select the `rdi-aurora-pg`
group you have just created and then select **Edit** . You will see this panel:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/EditParamGroup.jpg" alt="Edit parameter group panel" >}}

Search for the `rds.logical_replication` parameter and set its value to 1. Then,
select **Save Changes**.

## 4. Create the Aurora PostgreSQL DB cluster

In the navigation pane of the console, select **Databases** and then
select **Create Database**. You will see the panel shown below:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB1.jpg" alt="Create Database panel" >}}

Select the **Standard Create** option and select **Aurora (PostgreSQL compatible)**
from the **Engine Options**. Leave the **Available Versions** popup menu with
its default value.

In the panel shown below, select **Dev/Test** from the **Templates**. In the
**Settings**, set the **DB cluster identifier** to `gvb-database` and set the 
**Master Password**. Make sure your password is verified as very strong or
use the **Auto generate password** option.

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB2.jpg" alt="Templates panel" >}}

Next, scroll down to **Cluster Storage Configuration** (shown below). Ensure that
**Aurora Standard** is selected in the **Configuration Options**. In the
**Instance Configuration**, ensure **Memory optimized classes** is selected.

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB3.jpg" alt="Cluster Storage Configuration panel" >}}

Then, in **Availability and Durability** (shown below), ensure **Don't create an Aurora replica**
is selected. In **Connectivity**, ensure **Connect to an EC2 compute resource** is selected.

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB4.jpg" alt="Availability and Durability panel" >}}

Further down, under **DB Subnet Group**, select **Automatic Setup**.
For the **VPC Security Group**, select **Create New** and add `gvb-aurora-pg` as the
**New VPC security group name**.

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB5.jpg" alt="DB Subnet Group panel" >}}

Scrolling down to **Additional Configuration** set the **DB Cluster Parameter Group**
to the value `gvb-aurora-pg` that you added earlier:

{{<image filename="images/rdi/ingest/prepsrc/aurora-pgsql/CreateDB6.jpg" alt="Additional Configuration panel" >}}

The final panel shows the estimated monthly costs for the database. If you are happy
that the configuration is correct, select **Create Database**.

