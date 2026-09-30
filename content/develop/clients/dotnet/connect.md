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
aliases:
- /develop/connect/clients/dotnet/connect/
---

## Basic connection

You can connect to the server simply by passing a string of the
form "hostname:port" to the `Connect()` method (for example,
"localhost:6379"). However, you can also connect using a
`ConfigurationOptions` parameter. Use this to specify a
username, password, and many other options:

```csharp
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
[Cluster API](/content/operate/rs/clusters/optimize/oss-cluster-api.md)
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

When you deploy your application, use TLS and follow the [Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

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
    return X509CertificateLoader.LoadPkcs12FromFile("redis.pfx", "secret"); // use the password you specified for pfx file
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

    var ca = X509CertificateLoader.LoadCertificateFromFile("redis_ca.pem");
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

### SNI hostname selection for cluster connections

> [!NOTE]
> The SNI precedence scheme described in this section
> requires `StackExchange.Redis` v3.3.1 or later.

When you connect with TLS to a cluster that `StackExchange.Redis` discovers through
`CLUSTER SLOTS`, each discovered node needs its own
[SNI hostname](https://en.wikipedia.org/wiki/Server_Name_Indication). This allows a shared load
balancer or proxy to route the TLS handshake to the right backend. `StackExchange.Redis`
resolves the SNI hostname for a connection in this order:

1. An explicitly configured `ConfigurationOptions.SslHost` always wins.
2. Otherwise, a `DnsEndPoint` uses its own host.
3. Otherwise, the client falls back to the default SNI provider.
4. If none of these is available, the client uses the endpoint address.

Because of this order, `ConfigurationOptions.SslHost` only reports a value if you set one
explicitly; it doesn't report a host that the client inferred for you.

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH.

> [!NOTE]
> SCH support in `StackExchange.Redis` requires v3.3.0 or later. The feature
> is functional and tested against real Redis Enterprise deployments, but
> because it is a large, new API, the types and members involved are
> marked with the `[Experimental]` attribute. This is so the developers can reserve
> the right to adjust the API without the usual backwards-compatibility
> guarantees. As a result, the compiler reports the `SER010` diagnostic when
> you use them. You can suppress this diagnostic by adding the following to
> your `.csproj` file:
>
> ```xml
> <NoWarn>$(NoWarn);SER010</NoWarn>
> ```
>
> Alternatively, you can suppress it locally in your source file:
>
> ```csharp
> #pragma warning disable SER010
> ```

SCH is disabled by default. Enable it with the `MaintenanceNotifications`
configuration option, either in code or using the `maintNotifications` key
in a configuration string:

```csharp
var options = ConfigurationOptions.Parse("host:6379,maintNotifications=Auto,maintRelaxedTimeout=15");

// or, in code:
var options = new ConfigurationOptions {
    EndPoints = { "host:6379" },
    MaintenanceNotifications = MaintenanceNotificationMode.Auto,
    MaintenanceRelaxedTimeout = TimeSpan.FromSeconds(15),
};

var muxer = await ConnectionMultiplexer.ConnectAsync(options);
```

> [!NOTE]
> `ConfigurationOptions` also has a `Defaults` property that accepts named
> provider profiles (`amr`, `rediscloud`, `enterprise`) using the `defaults`
> configuration key. As of v3.3.0, none of these profiles override
> `MaintenanceNotifications`, so it stays `Disabled` under every profile.
> Set `maintNotifications` explicitly, regardless of which server product
> you connect to.

The `ConfigurationOptions` object accepts the following SCH-related parameters:

| Name | Description |
| :-- | :-- |
| `MaintenanceNotifications` | Whether to request SCH. The options are `Disabled` (the default), `Enabled` (require SCH and reject the connection, including a fallback to RESP2, if the server can't deliver it), and `Auto` (request SCH and tolerate a server that doesn't support it). |
| `MaintenanceMovingEndpointType` | The endpoint type to request for a replacement node during a handoff. The options are `ServerDefault` (no preference), `Auto` (the default; derived from the connection's scheme and encryption), `InternalIp`, `InternalFqdn`, `ExternalIp`, `ExternalFqdn`, and `None`. |
| `MaintenanceRelaxedTimeout` | The timeout to use for commands and connections while the server has announced maintenance. The default is 10 seconds. |
| `MaintenanceRelaxedWindowMax` | The maximum time to keep using the relaxed timeout if no notification arrives to close the window. The default is three times `MaintenanceRelaxedTimeout`. |
| `MaintenancePostEventRelaxedDuration` | How long to keep using the relaxed timeout after a closing notification, to cover trailing effects of the maintenance. |

Subscribe to the `ConnectionMultiplexer.ServerMaintenanceEvent` event to
observe SCH notifications. This is the same event that some servers (such as
Azure Cache for Redis) already use for their own maintenance notifications
(see [Production usage](/content/develop/clients/dotnet/produsage.md#server-notification-events)),
so check the runtime type of the event arguments to tell the two apart:

```csharp
muxer.ServerMaintenanceEvent += (object sender, ServerMaintenanceEvent e) => {
    if (e is PushMaintenanceEvent pme) {
        // A server-native SCH notification.
        Console.WriteLine($"SCH notification: {pme.NotificationType} at {pme.EndPoint}");
    } else {
        // An older, provider-specific notification (for example, from Azure Cache for Redis).
        Console.WriteLine($"Maintenance event: {e.RawMessage}");
    }
};
```

`RedisConnectionException` and `RedisTimeoutException` both expose a
`MaintenanceType` property, so you can tell whether a failure happened
because of ongoing maintenance.

## Multiplexing

Although example code typically works with a single connection,
real-world code often uses multiple connections at the same time.
Opening and closing connections repeatedly is inefficient, so it is best
to manage open connections carefully to avoid this.

Several other
Redis client libraries use *connection pools* to reuse a set of open
connections efficiently. StackExchange.Redis uses a different approach called
*multiplexing*, which sends all client commands and responses over a
single connection. StackExchange.Redis manages multiplexing for you automatically.
This gives high performance without requiring any extra coding.
See
[Connection pools and multiplexing](/content/develop/clients/pools-and-muxing.md)
for more information.
