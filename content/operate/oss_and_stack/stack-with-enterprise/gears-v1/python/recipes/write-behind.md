---
Title: Write-behind caching
alwaysopen: false
categories:
- docs
- operate
- stack
description: Write-behind and write-through caching between Redis and other databases
  (SQL or NoSQL).
linkTitle: Write-behind caching
weight: 70
---

Write-behind is a caching strategy in which the cache layer itself connects to the backing database. This means that your applications need only ever connect to your cache layer, and the cache then reads from or updates the backing database as needed. Redis currently supports write-behind caching in [Redis Enterprise Software]({{< relref "/operate/rs" >}}).

Here's how these caching patterns work:

1. Your application uses the cache for reads and writes.
1. The cache syncs any changed data to the backing database asynchronously.

<!-- ### Read-through caching

1. Your application reads from the cache. If there's a cache hit, the data is returned.
1. If there's cache miss, the cache retrieves the data from your backing database (think Oracle, PostgreSQL, etc.). The data is then stored in the cache and returned. -->

## Install the write-behind recipe

The write-behind recipe comes with two types of dependencies:

- Drivers to connect to the backend database
- Python libraries for the RedisGears functions

In most cases all of these can be provisioned to RedisGears before the functions are uploaded.
However, root access for the driver on the host is required in some cases, for example with Oracle drivers.

### Install Oracle driver (optional)

If you want to do write-behind with an Oracle database:

1. [Download the Oracle driver](https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html).
1. On each RS node in the cluster, follow the installation instructions on the download page for the Oracle driver.

### Import requirements

1. Install [Python 3](https://www.python.org/downloads/).
1. To install the [gears-cli](https://pypi.org/project/gears-cli/), run: 
    ```sh
    pip install gears-cli
    ```

1. Download [rgsync offline package](https://redislabs.com/download-center/modules/).
1. Import the requirements:

    ```sh
    # gears-cli import-requirements \
        --host HOST [ --port PORT ] --password PASSWORD \
        --requirements-path rgsync-99.99.99.linux-bionic-x64.zip
    ```

    {{< note >}}
You can be more efficient and import only the requirements you need, but rgsync is always required and can be combined with one or more of these packages according to your backend database:

- redisgears-requirement-v1-snowflake-sqlalchemy-linux-\<os>-x64.zip
- redisgears-requirement-v1-PyMySQL-linux-\<os>-x64.zip
- redisgears-requirement-v1-cx-Oracle-linux-\<os>-x64.zip
- redisgears-requirement-v1-cassandra-driver-linux-\<os>-x64.zip

This list can be different or more extensive in newer versions.
The `module.json` file in the module package lists the dependencies for the module.

    {{< /note >}}

1. From the CLI of a node or of a client that is connected to the database, check that the requirements were imported successfully with: 

    ```sh
    redis-cli RG.PYDUMPREQS
    ```

    To connect to the database from a client, run:

    ```sh
    redis-cli -h <FQDN_of_node> -p <host> [-a <password>]
    ```

    This command returns a list of all available requirements.

### Register the functions

The following is a RedisGears recipe that shows how to use the write-behind pattern to map data from Redis hashes to MySQL tables.

The recipe maps all Redis hashes with the prefix <nobr>`person:<id>`</nobr> to the MySQL table `persons`, with `<id>` being the primary key and mapped to the `person_id` column.
Similarly, it maps all hashes with the prefix <nobr>`car:<id>`</nobr> to the `cars` table.

```sh
from rgsync import RGWriteBehind
from rgsync.Connectors import MySqlConnector, MySqlConnection

'''
Create MySQL connection object
'''
connection = MySqlConnection('demouser', 'Password123!', 'localhost:3306/test')

'''
Create MySQL persons connector
persons - MySQL table to put the data
person_id - primary key
'''
personConnector = MySqlConnector(connection, 'persons', 'person_id')

personsMappings = {
	'first_name':'first',
	'last_name':'last',
	'age':'age'
}

RGWriteBehind(GB, keysPrefix='person', mappings=personsMappings, connector=personConnector, name='PersonsWriteBehind', version='99.99.99')

'''
Create MySQL car connector
cars - MySQL table to put the data
car_id - primary key
'''
carConnector = MySqlConnector(connection, 'cars', 'car_id')

carsMappings = {
	'id':'id',
	'color':'color'
}

RGWriteBehind(GB, keysPrefix='cars', mappings=carsMappings, connector=carConnector, name='CarsWriteBehind', version='99.99.99')
```

Go to the [rgsync website](https://pypi.org/project/rgsync/) to get the replication options and the configuration options for the database and mapping.

1. Create a Python file with the configuration mapping according to your specific needs.
1. Run `gears-cli` with your custom file:

    ```sh
    gears-cli run --host <host> --port <post> --password <password> <yourfile>.py
    ```

## Write-behind caching with RedisGears

[RGSync](https://github.com/RedisGears/rgsync) is a RedisGears recipe that uses the write-behind pattern to synchronize Redis data structures to a backing data store (Oracle, MySQL, Cassandra, and Snowflake are currently supported).

Here's how you can create a write-behind function using the `RGSync` recipe against MySQL. This function will synchronize a set of fields in a Redis hash to the columns in a MySQL row. The key name for the Redis hash must have the form `{name}:{id}`, where `id` is the primary key for the row we want to keep in sync with. So, for example, suppose our hashes look like this:

```sh
redis.cloud:6379> HSET person:5 first_name Marek last_name Michalski age 27
(integer) 2
```

The data in this hash would correspond to a row with ID of 5. But we need to define the mapping from our hash field to our columns. In our function, we do this using a Python dictionary:

```py
personsMappings = {
	'first_name':'first',
	'last_name':'last',
	'age':'age'
}
```

This is saying that the `last_name` field in our hash should be synchronized with the 'last' field in our row. So, now we're ready to write our RedisGears function.

First, load the necessary libraries and connect to MySQL:

```py
from rgsync import RGWriteBehind
from rgsync.Connectors import MySqlConnector, MySqlConnection

connection = MySqlConnection('myapplication', 'Password123!', 'localhost:3306/test')
```

Next, create a connector object, specifying the table name and the name of the column storing the primary key:

```py
personConnector = MySqlConnector(mySqlConnection, 'persons', 'id')
```

After that, define your field-column mappings:

```py
personsMappings = {
	'first_name':'first',
	'last_name':'last',
	'age':'age'
}
```

Finally, use these initialized objects to create an `RGWRiteBehind` object:

```py
RGWriteBehind(GB,
              name='PersonsWriteBehind',
              version='1',
              connector=personsConnector,
              keysPrefix='person',
              mappings=personsMappings)
```

Notice here that you can version this function registration with the `version` argument, as newer versions with the same `name` will replace the old one.

If you've placed all of this code into a file (`example.py`), then you can load it into your Redis deployment using the [`gears-cli`](https://github.com/RedisGears/gears-cli) tool:

```sh
gears-cli --host <host>
          --port <post>
          --password <password>
          example.py
          REQUIREMENTS rgsync
```

### Secret management

You may not want to store database credentials in your RedisGears functions. To avoid this, you can pass these credentials as module parameters and then reference them from your functions.

The code below shows how to reference these credentials when creating a backing database connection.

```py
def User():
	return configGet('MySqlUser')
def Password():
	return configGet('MySqlPassword')
def DB():
	return configGet('MySqlDB')

connection = MySqlConnection(User, Password, DB)
```

Notice that for each credential, we define a Python function that returns the specified module parameter. We then provide each function reference when we instantiate `MySqlConnection`.

This code references three parameters: `MySqlUser`, `MySqlPassword`, and `MySqlDB`. In Redis Enterprise, you can set these parameters using the `rladmin` tool. The command to set these parameters takes the following form:

```sh
rladmin tune db [DB-NAME] module_name rg module_config_params "[PARAM-NAME] [PARAM-VALUE]"
```

To set the `MySqlPassword` parameter to "Password123!" on a database named "user-api", you would run the this `rladmin` command:

```sh
rladmin tune db user-api module_name rg module_config_params "MySqlPassword Password123!"
```

Once a connection is successfully established, RedisGears will not attempt to reconnect until a disconnect occurs.
This means that updates to the parameters that store the secrets will not take effect immediately,
but they will be used for all subsequent connection attempts.
