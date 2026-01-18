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
description: Learn how to authenticate to an Azure Managed Redis (AMR) database
linkTitle: Connect to AMR
title: Connect to Azure Managed Redis
weight: 2
---

The [`redis-authx-entraid`](https://github.com/redis/jvm-redis-authx-entraid) package
lets you authenticate your app to
[Azure Managed Redis (AMR)](https://azure.microsoft.com/en-us/products/managed-redis)
using [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/).
You can authenticate using a system-assigned or user-assigned
[managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
or a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals),
letting `redis-authx-entraid` fetch and renew the authentication tokens for you automatically.

See
[Use Microsoft Entra for cache authentication](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-azure-active-directory-for-authentication)
in the Microsoft docs to learn how to configure Azure to use Entra ID authentication.

## Install

Install [`jedis`]({{< relref "/develop/clients/jedis" >}}) first,
if you have not already done so.

If you are using Maven, add
the following dependency to your `pom.xml` file:

```xml
<dependency>
    <groupId>redis.clients.authentication</groupId>
    <artifactId>redis-authx-entraid</artifactId>
    <version>0.1.1-beta1</version>
</dependency>
```

If you are using Gradle, add the following dependency to your
`build.gradle` file:

```bash
implementation 'redis.clients.authentication:redis-authx-entraid:0.1.1-beta1'
```

## Create a `TokenAuthConfig` instance

The `TokenAuthConfig` class contains the authentication details that you
must supply when you connect to Redis. Chain the methods of the
`EntraIDTokenAuthConfigBuilder` class together (starting with the `builder()`
method) to include the details you need, as shown in the following example:

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        .secret("<secret>")
        .authority("<authority>")
        // Other options...
        .build();
```

Some of the details you can supply are common to different use cases:

-   `secret()`: A string containing the [authentication secret](https://learn.microsoft.com/en-us/purview/sit-defn-azure-ad-client-secret).
-   `authority()`: A string containing the [authority](https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-application-configuration#authority)
    URL.
-   `scopes()`: A set of strings defining the [scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc)
    you want to apply. Configure your client application to acquire a Microsoft Entra token for scope, `https://redis.azure.com/.default` or `acca5fbb-b7e4-4009-81f1-37e38fd66d78/.default` (as detailed at [Microsoft Entra ID for authentication](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/managed-redis/managed-redis-entra-for-authentication#microsoft-entra-client-workflow)) 
    with the
    [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview)

(See [Advanced configuration options](#advanced-configuration-options) below
to learn more about the options for controlling token request retry and timeout
behavior.)

You can also add configuration to authenticate with a [service principal](#serv-principal)
or a [managed identity](#mgd-identity) as described in the sections below.

### Configuration for a service principal {#serv-principal}

Add `clientId()` to the `EntraIDTokenAuthConfigBuilder` chain to specify
authentication via a service principal, passing the ID token string as
a parameter. (See the
[Microsoft EntraID docs](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals)
for more information about service principals.)

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        .clientId("<CLIENT-ID>")
         // ...
        .build();
```

### Configuration for a managed identity {#mgd-identity}

You can also authenticate to AMR using a managed identity (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities).

For a system assigned managed identity, simply add the `systemAssignedManagedIdentity()`
method to the `EntraIDTokenAuthConfigBuilder` chain:

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        .systemAssignedManagedIdentity()
         // ...
        .build();
```

For a user assigned managed identity, add `userAssignedManagedIdentity()`. This
requires a member of the `UserManagedIdentityType` enum (to select a
`CLIENT_ID`, `OBJECT_ID`, or `RESOURCE_ID`) as well as the `id` string itself:

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        .userAssignedManagedIdentity(
            UserManagedIdentityType.CLIENT_ID,
            "<ID>"
        )
         // ...
        .build();

```

## Connect using `DefaultJedisClientConfig`

When you have created your `TokenAuthConfig` instance, you are ready to
connect to AMR.
The example below shows how to include the `TokenAuthConfig` details in a
`JedisClientConfig` instance and use it with the `RedisClient` connection.
The connection uses
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security),
which is recommended and enabled by default for managed identities. See
[Connect to your production Redis with TLS]({{< relref "/develop/clients/jedis/connect#connect-to-your-production-redis-with-tls" >}}) for more information about
TLS connections, including the implementation of the `createSslSocketFactory()`
method used in the example.

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        // Chain of options...
        .build();

SSLSocketFactory sslFactory = createSslSocketFactory(
        "./truststore.jks",
        "secret!", // Use the password you specified for `keytool`
        "./redis-user-keystore.p12",
        "secret!" // Use the password you specified for `openssl`
);

JedisClientConfig config = DefaultJedisClientConfig.builder()
        // Include the `TokenAuthConfig` details.
        .authXManager(new AuthXManager(authConfig))
        .ssl(true).sslSocketFactory(sslFactory)
        .build();

RedisClient jedis = RedisClient.builder()
        .hostAndPort(new HostAndPort("<host>", <port>))
        .clientConfig(config)
        .build();

// Test the connection.
System.out.println(String.format("Database size is %d", jedis.dbSize()));
```

## Advanced configuration options

The `TokenAuthConfig` class has several other options that you can
set with the `EntraIDTokenAuthConfigBuilder.builder()`. These give you
more precise control over the way the token is renewed:

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        .expirationRefreshRatio(0.75)
        .lowerRefreshBoundMillis(100)
        .tokenRequestExecTimeoutInMs(100)
        .maxAttemptsToRetry(10)
        .delayInMsToRetry()
         // ...
        .build();
```

These options are explained below:

-  `expirationRefreshRatio`: a `float` value representing the fraction
   of a token's lifetime that should elapse before attempting to
   refresh it. For example, a value of 0.75 means that you want to
   refresh the token after 75% of its lifetime has passed.
-  `lowerRefreshBoundMillis`: the minimum amount of the token's lifetime
   (in milliseconds) remaining before attempting to refresh, regardless
   of the `expirationRefreshRatio` value. Set this to zero if you want
   the refresh time to depend only on `expirationRefreshRatio`.
-  `tokenRequestExecTimeoutInMs`: the maximum time (in milliseconds) to
   wait for a token request to receive a response. A timeout occurs if this limit is exceeded.
-  `maxAttemptsToRetry`: the maximum number of times to retry a token
   request before aborting.
-  `delayInMsToRetry`: the time (in milliseconds) to wait before
    retrying a token request after a failed attempt. This provides a mechanism to request throttling to prevent an excessive number of token requests.
