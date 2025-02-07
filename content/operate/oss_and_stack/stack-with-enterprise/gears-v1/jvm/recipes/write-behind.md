---
Title: Write-behind, write-through, and read-through caching
alwaysopen: false
categories:
- docs
- operate
- stack
description: Write-behind, write-through, and read-through caching between Redis and
  other databases (SQL or NoSQL).
linkTitle: Caching strategies
toc: 'true'
weight: 70
---

The [rghibernate](https://github.com/RedisGears/rghibernate) recipe uses RedisGears functions and the [Hibernate](https://hibernate.org/) framework to implement write-behind, write-through, and read-through caching.

These caching strategies allow applications to simply connect to a Redis cache layer instead of an underlying database. Whenever the application updates data in the cache, Redis also syncs the data in the backend database.

The underlying database could be an SQL database like MySQL, so you will need to provide an XML file that tells rghibernate how to map data between Redis and the other database.

## Differences from RGSync

[RGSync](https://github.com/RedisGears/rgsync):
- Python-based recipe
- Programmable

[rghibernate](https://github.com/RedisGears/rghibernate):
- Java-based recipe
- Uses the Hibernate framework
- Configurable rather than programmable

## Set up write-behind and read-through

To set up write-behind caching, first build an rghibernate JAR and register it with RedisGears.

Then, register the following configuration files:

- Connector XML: Tells Redis how to connect to the underlying database.

- Mapping XML: Shows how to map data between the two databases, such as mapping Redis hashes to MySQL tables.

### Register rghibernate JAR

1. Download the rghibernate JAR from the [download center](https://redis.com/redis-enterprise-software/download-center/modules/).

1. Upload the JAR to a Redis node.

1. Register rghibernate with RedisGears:

    ```sh
    $ redis-cli -x RG.JEXECUTE com.redislabs.WriteBehind < {filepath}/rghibernate-0.1.1-jar-with-dependencies.jar
    ```

### Configure database connection

1. Create a [connector XML file](#connector-xml) with the configuration to connect Redis to an underlying database.

1. Upload the file to a Redis node.

1. Register the connector configuration:

    ```sh
    > redis-cli -x RG.TRIGGER SYNC.REGISTERCONNECTOR mysql 1000 10 5 < src/test/resources/mysql_hibernate.cfg.xml 
    1) "OK"
    ```

### Configure data mapping

1. Create a [mapping XML file](#mapping-xml) that defines how Redis maps data to an underlying database.

1. Upload the file to a Redis node.

1. Register the mapping configuration for write-behind:

    ```sh
    > redis-cli -x RG.TRIGGER SYNC.REGISTERSOURCE StudentWrite mysql WriteBehind < src/test/resources/Student.hbm.xml 
    1) "OK"
    ````

1. Register the same mapping configuration for read-through:

    ```sh
    > redis-cli -x RG.TRIGGER SYNC.REGISTERSOURCE StudentRead mysql ReadThrough 0 < src/test/resources/Student.hbm.xml 
    1) "OK"
    ````
## Example configuration

Here are some example configuration files for connecting to databases and mapping data.

### Connector XML

This configuration file contains connection details for an underlying MySQL database:

```xml
<!DOCTYPE hibernate-configuration PUBLIC
        "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
  "http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
        
<hibernate-configuration>
  <session-factory>
    <!-- JDBC Database connection settings -->
    <property name="connection.driver_class">org.mariadb.jdbc.Driver</property>
    <property name="connection.url">jdbc:mysql://localhost:3306/test?allowPublicKeyRetrieval=true&amp;useSSL=false</property>
    <property name="connection.username">user</property>
    <property name="connection.password">pass</property>
    <!-- JDBC connection pool settings ... using built-in test pool -->
    <property name="connection.pool_size">1</property>
    <!-- Echo the SQL to stdout -->
    <property name="show_sql">false</property>
    <!-- Set the current session context -->
    <property name="current_session_context_class">thread</property>
    <!-- Drop and re-create the database schema on startup -->
    <property name="hbm2ddl.auto">update</property>
    <!-- dbcp connection pool configuration -->
    <property name="hibernate.dbcp.initialSize">5</property>
    <property name="hibernate.dbcp.maxTotal">20</property>
    <property name="hibernate.dbcp.maxIdle">10</property>
    <property name="hibernate.dbcp.minIdle">5</property>
    <property name="hibernate.dbcp.maxWaitMillis">-1</property>
  </session-factory>
</hibernate-configuration>
```

### Mapping XML

The following XML maps Redis hashes, which represent students, to a MySQL table:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<hibernate-mapping xmlns="http://www.hibernate.org/xsd/hibernate-mapping"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.hibernate.org/xsd/hibernate-mapping
    http://www.hibernate.org/xsd/hibernate-mapping/hibernate-mapping-4.0.xsd">

  <class entity-name="Student" table="student">
          <tuplizer entity-mode="dynamic-map" class="org.hibernate.tuple.entity.DynamicMapEntityTuplizer"/>
          <id name="id" type="integer" length="50" column="id"/>
          <property name="firstName" column="first_name" type="string"/>
          <property name="lastName" column="last_name" type="string"/>
          <property name="email" column="email" type="string" not-null="true"/>
          <property name="age" column="age" type="integer"/>
  </class>

</hibernate-mapping>
```
## Commands

Run rghibernate commands with `RG.TRIGGER`:

```sh
redis-cli RG.TRIGGER SYNC.<COMMAND>
```

To pass a file to a command like `SYNC.REGISTERCONNECTOR` or `SYNC.REGISTERSOURCE`, use the <nobr>`redis-cli -x`</nobr> option:

```sh
redis-cli -x RG.TRIGGER SYNC.{COMMAND} {arg1 arg2 ...} < {file}
```

### Command list

| Command | Description |
|---------|-------------|
| [SYNC.REGISTERCONNECTOR](#syncregisterconnector) | Register a new connector |
| SYNC.UNREGISTERCONNECTOR | Unregister a connector (cannot have sources attached) |
| [SYNC.REGISTERSOURCE](#syncregistersource) | Extra configuration based on policy |
| SYNC.UNREGISTERSOURCE | Unregister a source |
| SYNC.INFO SOURCES | Dump all sources |
| SYNC.INFO CONNECTORS | Dump all connectors |

### SYNC.REGISTERCONNECTOR

```sh
$ redis-cli -x RG.TRIGGER SYNC.REGISTERCONNECTOR \
    {connector name} {batch size} {timeout} {retry interval} \
    < {connector xml}
```

| Name | Description |
|------|-------------|
| connector name | Name to give to your connector |
| batch size | The size of the data sent to the backend in batches |
| timeout | After this timeout, sends data to the backend even if the batch size was not reached |
| retry interval | Retry interval on error |
| connector xml | Hibernate XML definition of the connector |

### SYNC.REGISTERSOURCE

```sh
redis-cli -x RG.TRIGGER SYNC.REGISTERSOURCE \
    {source name} {connector name} {policy} \
    < {mapping xml}
```

| Name | Description |
|------|-------------|
| source name | Name to give to your source |
| connector name | Connector to send the data to |
| policy | WriteBehind/WriteThrough/ReadThrough: <br></br>• On WriteThrough, an extra argument is WriteTimeout <br></br>• On ReadThrough, an extra argument is expire (0 for no expire) |
| mapping xml | Hibernate XML definition of the mapping |

