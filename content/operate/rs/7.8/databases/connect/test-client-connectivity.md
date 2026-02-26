---
Title: Test client connection
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linktitle: Test connection
weight: 20
url: '/operate/rs/7.8/databases/connect/test-client-connectivity/'
---
In various scenarios, such as after creating a new cluster or upgrading
the cluster, you should verify clients can connect to the
database.

To test client connectivity:

1. After you [create a Redis database]({{< relref "/operate/rs/7.8/databases/create" >}}), copy the database endpoint, which contains the cluster name (FQDN).

    To view and copy endpoints for a database in the cluster, see the database’s **Configuration > General** section in the Cluster Manager UI:

    {{<image filename="images/rs/screenshots/databases/config-general-endpoints.png" width="75%" alt="View public and private endpoints from the General section of the database's Configuration screen." >}}

1. Try to connect to the database endpoint from your client of choice,
    and run database commands.

1. If the database does not respond, try to connect to the database
    endpoint using the IP address rather than the FQDN. If you
    succeed, then DNS is not properly configured. For
    additional details, see
    [Configure cluster DNS]({{< relref "/operate/rs/7.8/networking/cluster-dns" >}}).

If any issues occur when testing database connections, [contact
support](https://redis.com/company/support/).

## Test database connections

After you create a Redis database, you can connect to your
database and store data using one of the following methods:

- [`redis-cli`]({{< relref "/operate/rs/7.8/references/cli-utilities/redis-cli" >}}), the built-in command-line tool

- [Redis Insight](https://redis.com/redis-enterprise/redis-insight/), a free Redis GUI that is available for macOS, Windows, and Linux 

- An application using a Redis client library, such as [`redis-py`](https://github.com/redis/redis-py) for Python. See the [client list]({{< relref "/develop/clients" >}}) to view all Redis clients by language.

### Connect with redis-cli

Connect to your database with `redis-cli` (located in the `/opt/redislabs/bin` directory), then store and retrieve a key:

```sh
$ redis-cli -h <endpoint> -p <port>
127.0.0.1:16653> set key1 123
OK
127.0.0.1:16653> get key1
"123"
```

For more `redis-cli` connection examples, see the [`redis-cli` reference]({{< relref "/operate/rs/7.8/references/cli-utilities/redis-cli" >}}).

### Connect with Redis Insight

Redis Insight is a free Redis GUI that is available for macOS, Windows, and Linux.

1. [Install Redis Insight]({{< relref "/develop/tools/insight" >}}).

1. Open Redis Insight and select **Add Redis Database**.

1. Enter the host and port in the **Host** and **Port** fields.

1. Select **Use TLS** if [TLS]({{< relref "/operate/rs/7.8/security/encryption/tls" >}}) is set up.

1. Select **Add Redis Database** to connect to the database.

See the [Redis Insight documentation]({{< relref "/develop/tools/insight" >}}) for more information.

### Connect with Python

Python applications can connect
to the database using the `redis-py` client library. For installation instructions, see the
[`redis-py` README](https://github.com/redis/redis-py#readme) on GitHub.

1. From the command line, create a new file called
`redis_test.py`:

    ```sh
    vi redis_test.py
    ```

1. Paste the following code in `redis_test.py`, and replace `<host>` and `<port>` with your database's endpoint details:

    ```python
    import redis

    # Connect to the database
    r = redis.Redis(host='<host>', port=<port>)

    # Store a key
    print("set key1 123")
    print(r.set('key1', '123'))

    # Retrieve the key
    print("get key1")
    print(r.get('key1'))
    ```

1. Run the application:

    ```sh
    python redis_test.py
    ```

1. If the application successfully connects to your database, it outputs: 

    ```sh
    set key1 123
    True
    get key1
    123
    ```
### Connect with discovery service

You can also connect a Python application to the database using the discovery service, which complies with the Redis Sentinel API.

In the IP-based connection method, you only need the database name, not the port number.
The following example uses the discovery service that listens on port 8001 on all nodes of the cluster
to discover the endpoint for the database named "db1".

```python
from redis.sentinel import Sentinel

# with IP based connections, a list of known node IP addresses is constructed
# to allow connection even if any one of the nodes in the list is unavailable.
sentinel_list = [
('10.0.0.44', 8001),
('10.0.0.45', 8001),
('10.0.0.46', 8001)
]

# change this to the db name you want to connect
db_name = 'db1'

sentinel = Sentinel(sentinel_list, socket_timeout=0.1)
r = sentinel.master_for(db_name, socket_timeout=0.1)

# set key "foo" to value "bar"
print(r.set('foo', 'bar'))
# set value for key "foo"
print(r.get('foo'))
```

For more `redis-py` connection examples, see the [`redis-py` developer documentation](https://redis.readthedocs.io/en/stable/examples/connection_examples.html).
