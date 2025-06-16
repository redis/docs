---
Title: Prepare AWS Aurora and MySQL for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare AWS Aurora/MySQL databases to work with RDI
group: di
linkTitle: Prepare AWS Aurora/MySQL
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 6
---

Follow the steps in the sections below to prepare an
[AWS Aurora MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.CreatingConnecting.Aurora.html)
database to work with RDI.

## 1. Create a parameter group

In the [Relational Database Service (RDS) console](https://console.aws.amazon.com/rds/),
navigate to **Parameter groups > Create parameter group**. You will see the panel shown
below:

{{<image filename="images/rdi/ingest/prepsrc/aurora-mysql/RDIAWSMySQLParamGroup.webp" alt="Create parameter group panel" >}}

Enter the following information:

| Name | Value |
| :-- | :-- |
| **Parameter group family**  | `mysql<your-mysql-version>` |
| **Group name**  | `cdc_mysql_param_group` |
| **Description**  | A parameter group for configuring CDC |


Select **Create** to create the parameter group.

## 2. Edit the parameter group

Navigate to **Parameter groups** in the console. Select the `cdc_mysql_param_group`
group you have just created and then select **Edit** . In the panel that appears,
set the `binlog_format` parameter to `ROW`:

{{< image filename="images/rdi/ingest/prepsrc/aurora-mysql/SetBinlogFormat.webp" alt="Set binlog_format to ROW" >}}

Then, set the `binlog_row_image` parameter to `FULL`:

{{< image filename="images/rdi/ingest/prepsrc/aurora-mysql/SetBinlogRowImage.webp" alt="Set binlog_row_image to FULL" >}}

Select **Save changes** to apply the changes.

## 3. Set the `binlog` retention period

A 10-day `binlog` retention period is recommended for RDI. You can check the current
setting by running the following query in
[MySQL Workbench](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToInstance.MySQLWorkbench.html):

```sql
mysql> call mysql.rds_show_configuration;
+------------------------+-------+------------------------------------------------------------------------------------------------------+
| name                   | value | description                                                                                          |
+------------------------+-------+------------------------------------------------------------------------------------------------------+
| binlog retention hours | NULL  | binlog retention hours specifies the duration in hours before binary logs are automatically deleted. |
+------------------------+-------+------------------------------------------------------------------------------------------------------+
1 row in set (0.06 sec)

Query OK, 0 rows affected (0.06 sec)
```

A value of `NULL` or zero, as in the example above, means that the log will be
erased as soon as possible. You can set the retention period to 10 days by running
the following query:

```sql
mysql> call mysql.rds_set_configuration('binlog retention hours', 240);
Query OK, 0 rows affected (0.02 sec)
```

## 4. Create a CDC user

Use the commands below, with administrator privileges, to create a user with
permissions for CDC:

```sql
CREATE USER 'cdc_user'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE, REPLICATION CLIENT, SELECT ON *.* TO 'cdc_user'@'%';
```

Finally, flush the privileges to apply the changes:

```sql
FLUSH PRIVILEGES;
```

## 5. Setup is complete

You have now completed the setup for using AWS Aurora/MySQL with RDI.
