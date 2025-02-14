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

## Install

Install [`Lettuce`]({{< relref "/develop/clients/lettuce" >}}) first,
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
    you want to apply.

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

## Connect using the `withAuthentication()` option

When you have created your `TokenAuthConfig` instance, you are ready to
connect to AMR.
The example below shows how to include the `TokenAuthConfig` details in a
`TokenBasedRedisCredentialsProvider` instance and pass it to the `RedisURI.Builder`
using the `withAuthentication()` option.

{{< note >}} Azure requires you to use
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security)
when you connect, as shown in the example.
{{< /note >}}

```java
TokenAuthConfig authConfig = EntraIDTokenAuthConfigBuilder.builder()
        // Chain of options...
        .build();

TokenBasedRedisCredentialsProvider credentialsProvider =
        TokenBasedRedisCredentialsProvider.create(tokenAuthConfig);

RedisURI uri = RedisURI.Builder.redis("<host>", <port>)
        .withAuthentication(credentialsProvider)
        .withSsl(true)
        .build();

RedisClient client = RedisClient.create(uri);

SslOptions sslOptions = SslOptions.builder().jdkSslProvider()
        .truststore(new File(
            "<path_to_truststore.jks_file>"),
            "<password_for_truststore.jks_file>"
        )
        .build();

client.setOptions(ClientOptions.builder()
        .sslOptions(sslOptions)
        .build());

StatefulRedisConnection<String, String> connection = client.connect();
RedisAsyncCommands<String, String> asyncCommands = connection.async();

// Test the connection.
CompletableFuture<Void> testDBSize = asyncCommands.dbsize()
        .thenAccept(r -> {
            System.out.println(String.format("Database size: %d", r));
        })
        .toCompletableFuture();

testDBSize.join();
```
