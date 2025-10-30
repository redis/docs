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
linkTitle: Connect
title: Connect to the server
weight: 20
---

## Basic connection

You can connect to the server simply by passing a string of the
form "hostname:port" to the `Connect()` method (for example,
"localhost:6379"). However, you can also connect using a
`ConfigurationOptions` parameter. Use this to specify a
username, password, and many other options:

```csharp
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;

ConfigurationOptions conf = new ConfigurationOptions {
    EndPoints = { "localhost:6379" },
    User = "yourUsername",
    Password = "yourPassword"
};

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(conf);
IDatabase db = redis.GetDatabase();

db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

## Connect to a Redis cluster

The basic connection will use the
[Cluster API]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}})
if it is available without any special configuration. However, if you know
the addresses and ports of several cluster nodes, you can specify them all
during connection in the `Endpoints` parameter:

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
[Connection pools and multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
for more information.
