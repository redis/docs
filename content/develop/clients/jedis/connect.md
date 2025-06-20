---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Connect your Java application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 2
---

## Basic connection

The following code opens a basic connection to a local Redis server:

```java
package org.example;
import redis.clients.jedis.UnifiedJedis;

public class Main {
    public static void main(String[] args) {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

        // Code that interacts with Redis...

        jedis.close();
    }
}
```

After you have connected, you can check the connection by storing and
retrieving a simple string value:

```java
...

String res1 = jedis.set("bike:1", "Deimos");
System.out.println(res1); // OK

String res2 = jedis.get("bike:1");
System.out.println(res2); // Deimos

...
```

### Connect to a Redis cluster

To connect to a Redis cluster, use `JedisCluster`. 

```java
import redis.clients.jedis.JedisCluster;
import redis.clients.jedis.HostAndPort;

//...

Set<HostAndPort> jedisClusterNodes = new HashSet<HostAndPort>();
jedisClusterNodes.add(new HostAndPort("127.0.0.1", 7379));
jedisClusterNodes.add(new HostAndPort("127.0.0.1", 7380));
JedisCluster jedis = new JedisCluster(jedisClusterNodes);
```

### Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

Before connecting your application to the TLS-enabled Redis server, ensure that your certificates and private keys are in the correct format.

To convert user certificate and private key from the PEM format to `pkcs12`, use this command:

```
openssl pkcs12 -export -in ./redis_user.crt -inkey ./redis_user_private.key -out redis-user-keystore.p12 -name "redis"
```

Enter password to protect your `pkcs12` file.

Convert the server (CA) certificate to the JKS format using the [keytool](https://docs.oracle.com/en/java/javase/12/tools/keytool.html) shipped with JDK.

```
keytool -importcert -keystore truststore.jks \ 
  -storepass REPLACE_WITH_YOUR_PASSWORD \
  -file redis_ca.pem
```

Establish a secure connection with your Redis database using this snippet.

```java
package org.example;

import redis.clients.jedis.*;

import javax.net.ssl.*;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.KeyStore;

public class Main {

    public static void main(String[] args) throws GeneralSecurityException, IOException {
        HostAndPort address = new HostAndPort("my-redis-instance.cloud.redislabs.com", 6379);

        SSLSocketFactory sslFactory = createSslSocketFactory(
                "./truststore.jks",
                "secret!", // use the password you specified for keytool command
                "./redis-user-keystore.p12",
                "secret!" // use the password you specified for openssl command
        );

        JedisClientConfig config = DefaultJedisClientConfig.builder()
                .ssl(true).sslSocketFactory(sslFactory)
                .user("default") // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
                .password("secret!") // use your Redis password
                .build();

        JedisPooled jedis = new JedisPooled(address, config);
        jedis.set("foo", "bar");
        System.out.println(jedis.get("foo")); // prints bar
    }

    private static SSLSocketFactory createSslSocketFactory(
            String caCertPath, String caCertPassword, String userCertPath, String userCertPassword)
            throws IOException, GeneralSecurityException {

        KeyStore keyStore = KeyStore.getInstance("pkcs12");
        keyStore.load(new FileInputStream(userCertPath), userCertPassword.toCharArray());

        KeyStore trustStore = KeyStore.getInstance("jks");
        trustStore.load(new FileInputStream(caCertPath), caCertPassword.toCharArray());

        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance("X509");
        trustManagerFactory.init(trustStore);

        KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance("PKIX");
        keyManagerFactory.init(keyStore, userCertPassword.toCharArray());

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(keyManagerFactory.getKeyManagers(), trustManagerFactory.getTrustManagers(), null);

        return sslContext.getSocketFactory();
    }
}
```

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction]({{< relref "/develop/clients/client-side-caching" >}})
for more information about how client-side caching works and how to use it effectively.

To enable client-side caching, specify the
[RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol and pass a cache configuration object during the connection.

The example below shows the simplest client-side caching connection to the default host and port,
`localhost:6379`.
All of the connection variants described above accept these parameters, so you can
use client-side caching with a connection pool or a cluster connection in exactly the same way.

{{< note >}}Client-side caching requires Jedis v5.2.0 or later.
To maximize compatibility with all Redis products, client-side caching
is supported by Redis v7.4 or later.

The [Redis server products]({{< relref "/operate" >}}) support
[opt-in/opt-out]({{< relref "/develop/reference/client-side-caching#opt-in-and-opt-out-caching" >}}) mode
and [broadcasting mode]({{< relref "/develop/reference/client-side-caching#broadcasting-mode" >}})
for CSC, but these modes are not currently implemented by Jedis.
{{< /note >}}

```java
HostAndPort endpoint = new HostAndPort("localhost", 6379);

DefaultJedisClientConfig config = DefaultJedisClientConfig
    .builder()
    .password("secretPassword")
    .protocol(RedisProtocol.RESP3)
    .build();

CacheConfig cacheConfig = CacheConfig.builder().maxSize(1000).build();

UnifiedJedis client = new UnifiedJedis(endpoint, config, cacheConfig);
```

Once you have connected, the usual Redis commands will work transparently
with the cache:

```java
client.set("city", "New York");
client.get("city");     // Retrieved from Redis server and cached
client.get("city");     // Retrieved from cache
```

You can see the cache working if you connect to the same Redis database
with [`redis-cli`]({{< relref "/develop/tools/cli" >}}) and run the
[`MONITOR`]({{< relref "/commands/monitor" >}}) command. If you run the
code above but without passing `cacheConfig` during the connection,
you should see the following in the CLI among the output from `MONITOR`:

```
1723109720.268903 [...] "SET" "city" "New York"
1723109720.269681 [...] "GET" "city"
1723109720.270205 [...] "GET" "city"
```

The server responds to both `get("city")` calls.
If you run the code with `cacheConfig` added in again, you will see

```
1723110248.712663 [...] "SET" "city" "New York"
1723110248.713607 [...] "GET" "city"
```

The first `get("city")` call contacted the server, but the second
call was satisfied by the cache.

### Removing items from the cache

You can remove individual keys from the cache with the
`deleteByRedisKey()` method of the cache object. This removes all cached items associated
with each specified key, so all results from multi-key commands (such as
[`MGET`]({{< relref "/commands/mget" >}})) and composite data structures
(such as [hashes]({{< relref "/develop/data-types/hashes" >}})) will be
cleared at once. The example below shows the effect of removing a single
key from the cache:

```java
client.hget("person:1", "name");    // Read from the server
client.hget("person:1", "name");    // Read from the cache

client.hget("person:2", "name");    // Read from the server
client.hget("person:2", "name");    // Read from the cache

Cache myCache = client.getCache();
myCache.deleteByRedisKey("person:1");

client.hget("person:1", "name");    // Read from the server
client.hget("person:1", "name");    // Read from the cache

client.hget("person:2", "name");    // Still read from the cache
```

You can also clear all cached items using the `flush()`
method:

```java
client.hget("person:1", "name");    // Read from the server
client.hget("person:1", "name");    // Read from the cache

client.hget("person:2", "name");    // Read from the server
client.hget("person:2", "name");    // Read from the cache

Cache myCache = client.getCache();
myCache.flush();

client.hget("person:1", "name");    // Read from the server
client.hget("person:1", "name");    // Read from the cache

client.hget("person:2", "name");    // Read from the server
client.hget("person:2", "name");    // Read from the cache
```

The client will also flush the cache automatically
if any connection (including one from a connection pool)
is disconnected.

## Connect with a connection pool

For production usage, you should use a connection pool to manage
connections rather than opening and closing connections individually.
A connection pool maintains several open connections and reuses them
efficiently. When you open a connection from a pool, the pool allocates
one of its open connections. When you subsequently close the same connection,
it is not actually closed but simply returned to the pool for reuse.
This avoids the overhead of repeated connecting and disconnecting.
See
[Connection pools and multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
for more information.

Use the following code to connect with a connection pool:

```java
package org.example;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class Main {
    public static void main(String[] args) {
        JedisPool pool = new JedisPool("localhost", 6379);

        try (Jedis jedis = pool.getResource()) {
            // Store & Retrieve a simple string
            jedis.set("foo", "bar");
            System.out.println(jedis.get("foo")); // prints bar
            
            // Store & Retrieve a HashMap
            Map<String, String> hash = new HashMap<>();;
            hash.put("name", "John");
            hash.put("surname", "Smith");
            hash.put("company", "Redis");
            hash.put("age", "29");
            jedis.hset("user-session:123", hash);
            System.out.println(jedis.hgetAll("user-session:123"));
            // Prints: {name=John, surname=Smith, company=Redis, age=29}
        }
    }
}
```

Because adding a `try-with-resources` block for each command can be cumbersome, consider using `JedisPooled` as an easier way to pool connections. `JedisPooled`, added in Jedis version 4.0.0, provides capabilities similar to `JedisPool` but with a more straightforward API.

```java
import redis.clients.jedis.JedisPooled;

//...

JedisPooled jedis = new JedisPooled("localhost", 6379);
jedis.set("foo", "bar");
System.out.println(jedis.get("foo")); // prints "bar"
```

A connection pool holds a specified number of connections, creates more connections when necessary, and terminates them when they are no longer needed.

Here is a simplified connection lifecycle in a pool:

1. A connection is requested from the pool.
2. A connection is served:
   - An idle connection is served when non-active connections are available, or 
   - A new connection is created when the number of connections is under `maxTotal`. 
3. The connection becomes active.
4. The connection is released back to the pool.
5. The connection is marked as stale. 
6. The connection is kept idle for `minEvictableIdleTime`. 
7. The connection becomes evictable if the number of connections is greater than `minIdle`. 
8. The connection is ready to be closed.

It's important to configure the connection pool correctly. 
Use `GenericObjectPoolConfig` from [Apache Commons Pool2](https://commons.apache.org/proper/commons-pool/apidocs/org/apache/commons/pool2/impl/GenericObjectPoolConfig.html).

```java
ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
// maximum active connections in the pool,
// tune this according to your needs and application type
// default is 8
poolConfig.setMaxTotal(8);

// maximum idle connections in the pool, default is 8
poolConfig.setMaxIdle(8);
// minimum idle connections in the pool, default 0
poolConfig.setMinIdle(0);

// Enables waiting for a connection to become available.
poolConfig.setBlockWhenExhausted(true);
// The maximum number of seconds to wait for a connection to become available
poolConfig.setMaxWait(Duration.ofSeconds(1));

// Enables sending a PING command periodically while the connection is idle.
poolConfig.setTestWhileIdle(true);
// controls the period between checks for idle connections in the pool
poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(1));

// JedisPooled does all hard work on fetching and releasing connection to the pool
// to prevent connection starvation
JedisPooled jedis = new JedisPooled(poolConfig, "localhost", 6379);
```

### Retrying a command after a connection failure

If a connection is lost before a command is completed, the command will fail with a `JedisConnectionException`. Although the connection pool manages the connections
for you, you must request a new connection from the pool to retry the command.
You would typically do this in a loop that makes several attempts to reconnect
before aborting and reporting that the error isn't transient. The example below
shows a retry loop that uses a simple
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
strategy:

```java
JedisPooled jedis = new JedisPooled(
    new HostAndPort("localhost", 6379),
    clientConfig,
    poolConfig
);

// Set max retry attempts
final int MAX_RETRIES = 5;

// Example of retrying a command
String key = "retry-example";
String value = "success";

int attempts = 0;
boolean success = false;

while (!success && attempts < MAX_RETRIES) {
    try {
        attempts++;
        String result = jedis.set(key, value);
        System.out.println("Command succeeded on attempt " + attempts + ": " + result);
        success = true;
    } catch (JedisConnectionException e) {
        System.out.println("Connection failed on attempt " + attempts + ": " + e.getMessage());
        if (attempts >= MAX_RETRIES) {
            System.out.println("Max retries reached. Giving up.");
            throw e;
        }

        // Wait before retrying
        try {
            Thread.sleep(500 * attempts); // Exponential backoff
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
```
