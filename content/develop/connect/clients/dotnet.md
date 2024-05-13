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
title: C#/.NET client library guide
weight: 1
---

In this guide, we introduce `NRedisStack`, our C#/.NET client library. 
It is supported by Redis but it builds on the functionality of Microsoft's
[`StackExchange.Redis`](https://stackexchange.github.io/StackExchange.Redis/)
library to provide full access to the features of Redis databases.

The core `StackExchange.Redis` library uses a *multiplexing* strategy to handle
requests from multiple callers with just 2 network connections. This approach
reduces delays caused by network latency without adding complexity to your code.
However, multiplexing has certain trade-offs and disadvantages compared to
*connection pooling*, which is a different optimization supported by some of
our other client libraries. We will highlight multiplexing issues in this guide
wherever we encounter them, but see the
[`StackExchange.Redis` documentation](https://stackexchange.github.io/StackExchange.Redis/PipelinesMultiplexers)
for a full description of multiplexing.

## Install

First, you should download and install .NET from
[Microsoft's website](https://dotnet.microsoft.com/en-us/download)
if you haven't already done so. This will install the
[`dotnet`](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet)
command, which is the main command line tool we will use for .NET development.

You can use a simple
[console app](https://learn.microsoft.com/en-gb/dotnet/core/tutorials/top-level-templates)
project to experiment with `NRedisStack`. Create the project in the current 
folder with the command:

```bash
dotnet new console
```

Then, add `NRedisStack` to the project using:

```bash
dotnet add package NRedisStack
```

You can now add code to the default `Program.cs` file that the `dotnet` tool
created. Build and run the code using:

```bash
dotnet run
```

## Connect to a server

You will need a Redis Stack server to connect to. See
[Install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) to learn how to install and run a server locally. You can also create
a [Redis Cloud database](https://redis.io/try-free/) with a free trial account.

If you are using a local server, you can connect to it on the default port (port 6379)
with the following code:

```csharp
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost");
IDatabase db = redis.GetDatabase();
```

If you need a secure connection to your server or if you are connecting to a Redis Cloud endpoint, you must supply a password for authentication. Pass the endpoint
details and password together in a `ConfigurationOptions` object:

```csharp
var options = new ConfigurationOptions{
	EndPoints = {"redis-18732.c250.eu-central-1-1.ec2.redns.redis-cloud.com:18732"},
	Password = "9lP4qv5xz7M3lVmIzlXOm3B86oEuzVQN"
};

ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(options);
IDatabase db = redis.GetDatabase();
```

You can check you are connected to the server using the `Ping()` method,
which returns the latency time of the connection:

```csharp
Console.WriteLine(db.Ping());
// >>> 00:00:00.0007608
```

The simplest example of a database command is storing and retrieving
a string:

```csharp
db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // >>> bar
```

## Connect to a cluster

The [Redis Cluster API]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api/" >}})
lets you connect to all nodes in a cluster to improve performance. You can do this
simply by specifying all the cluster endpoints in the `options` object when you
connect:

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
```

## Connect to Sentinel

[Redis Sentinel]({{< relref "/operate/oss_and_stack/management/sentinel/" >}})
is a multi-purpose utility that provides high availability without
using [Redis Cluster]({{< relref "/operate/oss_and_stack/management/scaling/" >}}). The Sentinel deployment consists of one master and one or more replicas. `StackExchange.Redis`
provides commands to monitor the master and replicas, execute failover operations, and more. Redis Sentinel is a distributed system that needs several instances of the Sentinel process to administer the master and its replicas.

You can connect to Sentinel by specifying the service name along with the endpoint
details:

```csharp
ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost:6001,serviceName=myprimary");
IDatabase db = redis.GetDatabase();
```

You can specify several Sentinel endpoints at once when you connect. Use this
to ensure the app is not dependent on a single node IP address (which is helpful
when DNS is not available). You can also determine which of the endpoints is
the master using the following code:

```csharp
var config = new ConfigurationOptions()
{
	EndPoints = { "localhost:6001", "localhost:6002" },
	AbortOnConnectFail = false,
	Password = ""
};

var sentinelConnection = ConnectionMultiplexer.SentinelConnect(config);
var masterConfig = new ConfigurationOptions()
{
	ServiceName = "myprimary",
	Password = "",
	AllowAdmin = true
};

// Get the master from the existing Sentinel connection.
var redis = sentinelConnection.GetSentinelMasterConnection(masterConfig);
IDatabase db = redis.GetDatabase();
```

## Secure the connection

Use [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) and follow the
[Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines
to ensure your Redis deployment is secure.

You must ensure that your certificates and private keys are in the PFX format before
using them to connect to your TLS-enabled Redis server. Use the following command
to convert a user certificate and private key from the PEM format to PFX:

```bash
openssl pkcs12 -inkey redis_user_private.key -in redis_user.crt -export -out redis.pfx
```

You must enter a password to protect your `pfx` file.

Once you have the `pfx` file, you can connect securely to your Redis database using the
following code:

```csharp
ConfigurationOptions options = new ConfigurationOptions
{
    EndPoints = { { "my-redis.cloud.redislabs.com", 6379 } },
    User = "default",  // Use your Redis username here. See https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/ for more information
    Password = "secret", // Use your Redis password here.
    Ssl = true,
    SslProtocols = System.Security.Authentication.SslProtocols.Tls12                
};

options.CertificateSelection += delegate
{
    return new X509Certificate2("redis.pfx", "secret"); // Use the password you specified for the pfx file
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
IDatabase conn = muxer.GetDatabase();  
```

## Access Redis Stack features

Redis Stack is a Redis configuration that extends the core functionality
with a set of modules. These provide features like JSON documents and full-text
search. `NRedisStack` provides a specific class to access each module in Redis Stack.
You can get instances of these classes using the following methods of
`IDatabase`:

```csharp
IBloomCommands bf = db.BF();                // Bloom filter
ICuckooCommands cf = db.CF();               // Cuckoo filter
ICmsCommands cms = db.CMS();                // Count-min sketch
ITopKCommands topk = db.TOPK();             // Top-K
ITdigestCommands tdigest = db.TDIGEST();    // t-digest
ISearchCommands ft = db.FT();               // Full-text search
IJsonCommands json = db.JSON();             // JSON document access
ITimeSeriesCommands ts = db.TS();           // Time series
```

### Learn more

* [GitHub](https://github.com/redis/NRedisStack)
 
