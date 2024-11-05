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
description: Connect your .NET application to a Redis database
linkTitle: C#/.NET
title: C#/.NET guide
weight: 2
---

[NRedisStack](https://github.com/redis/NRedisStack) is the .NET client for Redis.
The sections below explain how to install `NRedisStack` and connect your application
to a Redis database.

`NRedisStack` requires a running Redis server. See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Community Edition installation instructions.

You can also access Redis with an object-mapping client interface. See
[Redis OM for .NET]({{< relref "/integrate/redisom-for-net" >}})
for more information.

## Install

Using the `dotnet` CLI, run:

```bash
dotnet add package NRedisStack
```

## Connect

Connect to localhost on port 6379.

```csharp
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
//...
ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost");
IDatabase db = redis.GetDatabase();
```

Store and retrieve a simple string.

```csharp
db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

Store and retrieve a HashMap.

```csharp
var hash = new HashEntry[] { 
    new HashEntry("name", "John"), 
    new HashEntry("surname", "Smith"),
    new HashEntry("company", "Redis"),
    new HashEntry("age", "29"),
    };
db.HashSet("user-session:123", hash);

var hashFields = db.HashGetAll("user-session:123");
Console.WriteLine(String.Join("; ", hashFields));
// Prints: 
// name: John; surname: Smith; company: Redis; age: 29
```

To access the advanced data structures capability of Redis Community Edition, use the appropriate interface like this:

```
IBloomCommands bf = db.BF();
ICuckooCommands cf = db.CF();
ICmsCommands cms = db.CMS();
IGraphCommands graph = db.GRAPH();
ITopKCommands topk = db.TOPK();
ITdigestCommands tdigest = db.TDIGEST();
ISearchCommands ft = db.FT();
IJsonCommands json = db.JSON();
ITimeSeriesCommands ts = db.TS();
```

## Connect to a Redis cluster

To connect to a Redis cluster, you just need to specify one or all cluster endpoints in the client configuration:

```csharp
ConfigurationOptions options = new ConfigurationOptions
{
    //list of available nodes of the cluster along with the endpoint port.
    EndPoints = {
        { "localhost", 16379 },
        { "localhost", 16380 },
        // ...
    },            
};

ConnectionMultiplexer cluster = ConnectionMultiplexer.Connect(options);
IDatabase db = cluster.GetDatabase();

db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

Before connecting your application to the TLS-enabled Redis server, ensure that your certificates and private keys are in the correct format.

To convert user certificate and private key from the PEM format to `pfx`, use this command:

```bash
openssl pkcs12 -inkey redis_user_private.key -in redis_user.crt -export -out redis.pfx
```

Enter password to protect your `pfx` file.

Establish a secure connection with your Redis database using this snippet.

```csharp
ConfigurationOptions options = new ConfigurationOptions
{
    EndPoints = { { "my-redis.cloud.redislabs.com", 6379 } },
    User = "default",  // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
    Password = "secret", // use your Redis password
    Ssl = true,
    SslProtocols = System.Security.Authentication.SslProtocols.Tls12                
};

options.CertificateSelection += delegate
{
    return new X509Certificate2("redis.pfx", "secret"); // use the password you specified for pfx file
};
options.CertificateValidation += ValidateServerCertificate;

bool ValidateServerCertificate(
        object sender,
        X509Certificate? certificate,
        X509Chain? chain,
        SslPolicyErrors sslPolicyErrors)
{
    if (certificate == null) {
        return false;       
    }

    var ca = new X509Certificate2("redis_ca.pem");
    bool verdict = (certificate.Issuer == ca.Subject);
    if (verdict) {
        return true;
    }
    Console.WriteLine("Certificate error: {0}", sslPolicyErrors);
    return false;
}

ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect(options);   
            
//Creation of the connection to the DB
IDatabase conn = muxer.GetDatabase();

//send SET command
conn.StringSet("foo", "bar");

//send GET command and print the value
Console.WriteLine(conn.StringGet("foo"));   
```

## Multiplexing

Although example code typically works with a single connection,
real-world code often uses multiple connections at the same time.
Opening and closing connections repeatedly is inefficient, so it is best
to manage open connections carefully to avoid this.

Several other
Redis client libraries use *connection pools* to reuse a set of open
connections efficiently. NRedisStack uses a different approach called
*multiplexing*, which sends all client commands and responses over a
single connection. NRedisStack manages multiplexing for you automatically.
This gives high performance without requiring any extra coding.
See
[Connection pools and multiplexing]({{< relref "/develop/connect/clients/pools-and-muxing" >}})
for more information.

## Example: Indexing and querying JSON documents

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) data and
run queries against the index.

Make sure that you have Redis Community Edition 8.x and `NRedisStack` installed. 

Start by importing dependencies:

{{< clients-example cs_home_json import >}}
{{< /clients-example >}}

Connect to the database:

{{< clients-example cs_home_json connect >}}
{{< /clients-example >}}

Create some test data to add to the database:

{{< clients-example cs_home_json create_data >}}
{{< /clients-example >}}

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}).

{{< clients-example cs_home_json make_index >}}
{{< /clients-example >}}

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

{{< clients-example cs_home_json add_data >}}
{{< /clients-example >}}

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

{{< clients-example cs_home_json query1 >}}
{{< /clients-example >}}

Specify query options to return only the `city` field:

{{< clients-example cs_home_json query2 >}}
{{< /clients-example >}}

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

{{< clients-example cs_home_json query3 >}}
{{< /clients-example >}}

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.

## Learn more

* [GitHub](https://github.com/redis/NRedisStack)
 
