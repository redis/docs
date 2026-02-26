---
Title: Connect to your Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to connect to an Active-Active database using redis-cli or a sample
  Python application.
linkTitle: Connect
weight: 26
url: '/operate/rs/7.22/databases/active-active/connect/'
---

With the Redis database created, you are ready to connect to your
database to store data. You can use one of the following ways to test
connectivity to your database:

- Connect with redis-cli, the built-in command-line tool
- Connect with a _Hello World_ application written in Python

Remember we have two member Active-Active databases that are available for connections and
concurrent reads and writes. The member Active-Active databases are using bi-directional
replication to for the global Active-Active database.

{{< image filename="/images/rs/crdb-diagram.png" >}}

### Connecting using redis-cli {#connecting-using-rediscli}

redis-cli is a simple command-line tool to interact with redis database.

1. To use redis-cli on port 12000 from the node 1 terminal, run:

    ```sh
    redis-cli -p 12000
    ```

1. Store and retrieve a key in the database to test the connection with these
    commands:

    - `set key1 123`
    - `get key1`

    The output of the command looks like this:

    ```sh
    127.0.0.1:12000> set key1 123
    OK
    127.0.0.1:12000> get key1
    "123"
    ```

1. Enter the terminal of node 1 in cluster 2, run the redis-cli, and
   retrieve key1.

    The output of the commands looks like this:

    ```sh
    $ redis-cli -p 12000
    127.0.0.1:12000> get key1
    "123"
    ```

### Connecting using _Hello World_ application in Python

A simple python application running on the host machine can also connect
to the database.

{{< note >}}
Before you continue, you must have python and
[redis-py](https://github.com/andymccurdy/redis-py#installation)
(python library for connecting to Redis) configured on the host machine
running the container.
{{< /note >}}

1. In the command-line terminal, create a new file called "redis_test.py"

    ```sh
    vi redis_test.py
    ```

1. Paste this code into the "redis_test.py" file.

    This application stores a value in key1 in cluster 1, gets that value from
    key1 in cluster 1, and gets the value from key1 in cluster 2.

    ```py
    import redis
    rp1 = redis.StrictRedis(host='localhost', port=12000, db=0)
    rp2 = redis.StrictRedis(host='localhost', port=12002, db=0)
    print ("set key1 123 in cluster 1")
    print (rp1.set('key1', '123'))
    print ("get key1 cluster 1")
    print (rp1.get('key1'))
    print ("get key1 from cluster 2")
    print (rp2.get('key1'))
    ```

1. To run the "redis_test.py" application, run:

    ```sh
    python redis_test.py
    ```

    If the connection is successful, the output of the application looks like:

    ```sh
    set key1 123 in cluster 1
    True
    get key1 cluster 1
    "123"
    get key1 from cluster 2
    "123"
    ```