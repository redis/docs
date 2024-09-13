---
Title: Write-behind configuration guide
aliases: /integrate/redis-data-integration/write-behind/configuration-guide/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Configure write-behind to your database
draft: null
group: di
hidden: false
linkTitle: Configuration
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

This guide shows you how to configure write-behind target connections.

## Overview
Write-behind target connections are the connections established between a Write-behind instance and a target database in a
[write-behind scenario]({{< relref "/integrate/write-behind/quickstart/write-behind-guide" >}}).
Write-behind is used to replicate changes captured in a Write-behind-enabled Redis Enterprise database to a target database. 
The connections must be configured in the `config.yaml` before deploying any jobs and must follow one of the formats shown below. Multiple connections can be specified in the `connections` section.

### For relational datastores

```yaml
connections:
    my-sql-datastore:
        type: <db-type>     # mysql | oracle | postgresql | sqlserver
        host: <db-host>     # IP address or FQDN of a database host and instance
        port: <db-port>     # database port
        database: <db-name> # name of the database
        user: <db-user>         # database user
        password: <db-password> # database password
        # connect_args:     # optional connection parameters passed to the driver - these are driver specific
        # query_args:       # optional parameters for SQL query execution - typically not required for Write-behind operation
```

### For non-relational datastores

```yaml
connections:
    my-nosql-datastore:
        type: <db-type>     # cassandra
        hosts: <db-hosts>   # array of IP addresses or host names of a datastore nodes
        port: <db-port>     # database port
        database: <db-name> # name of the database
        user: <db-user>         # database user
        password: <db-password> # database password
```

## Microsoft SQL Server

Microsoft SQL Server supports different authentication mechanisms (SQL Server Authentication and Integrated Windows Authentication) and protocols (NTLM and Kerberos). Write-behind can use all of them. However, systems that use Kerberos may require some additional configuration.

### Account permissions

To enable Write-behind to work with a SQL Server database, check that the account you specify was assigned at least the `db_datawriter` role.

### SQL Server authentication

To use SQL Server authentication mode, create a user with login credentials and then assign the necessary permissions for the target database to that user.

```yaml
connections:
    mssql2019-sqlauth:
        type: sqlserver
        host: ip-10-0-0-5.internal
        port: 1433
        database: rdi_wb_database
        user: rdi_user
        password: secret
```

### Windows authentication

To use Windows authentication mode, you need to create a Windows or Active Directory account that has the necessary permissions to access the target database, and is able to log into SQL Server. The Linux machine hosting Write-behind can be configured to support the NTLM authentication protocol. 

For NTLM:

```yaml
connections:
    mssql2019-ntlm:
        type: sqlserver
        host: ip-10-0-0-5.internal
        port: 1433
        database: rdi_wb_database
        user: MYDOMAIN\rdi_service_account  # company-domain\service-account
        password: secret                    # NTLM requires to provide a password
```

> Note: User must be specified with the domain name for Windows Authentication to work correctly.

After you configure the Write-behind connection and deploy the write-behind job, run the following SQL query to have the operator check if Write-behind is using the expected authentication mechanism and protocol. Note: this operation may require the `sysadmin` role.

```sql
SELECT session_id, auth_scheme FROM sys.dm_exec_connections;
```

The results indicate which `auth_scheme` is used by each session and may take values `SQL`, `NTLM`, and `Kerberos`.