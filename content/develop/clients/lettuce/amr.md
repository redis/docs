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

## Create a `TokenBasedRedisCredentialsProvider` instance

The `TokenBasedRedisCredentialsProvider` class contains the authentication details that you
must supply when you connect to Redis. Chain the methods of the
`EntraIDTokenAuthConfigBuilder` class together (starting with the `builder()`
method) to include the details you need, as shown in the following example:

```java
TokenBasedRedisCredentialsProvider credentials;

try ( EntraIDTokenAuthConfigBuilder builder = EntraIDTokenAuthConfigBuilder.builder()) {
        builder.clientId(CLIENT_ID)
                .secret(CLIENT_SECRET)
                .authority(AUTHORITY) // "https://login.microsoftonline.com/{YOUR_TENANT_ID}";
                .scopes(SCOPES);      // "https://redis.azure.com/.default";

        credentials = TokenBasedRedisCredentialsProvider.create(builder.build());
}
```

Some of the details you can supply are common to different use cases:

-   `secret()`: A string containing the [authentication secret](https://learn.microsoft.com/en-us/purview/sit-defn-azure-ad-client-secret).
-   `authority()`: A string containing the [authority](https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-application-configuration#authority)
    URL.
-   `scopes()`: A set of strings defining the [scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc)
    you want to apply. Configure your client application to acquire a Microsoft Entra token for scope, `https://redis.azure.com/.default` or `acca5fbb-b7e4-4009-81f1-37e38fd66d78/.default`
    with the
    [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview)

You can also add configuration to authenticate with a [service principal](#serv-principal)
or a [managed identity](#mgd-identity) as described in the sections below.

When you have created your `TokenBasedRedisCredentialsProvider` instance, you may want to
test it by obtaining a token, as shown in the folowing example:

```java
// Test that the Entra ID credentials provider can resolve credentials.
credentials.resolveCredentials()
        .doOnNext(c-> System.out.println(c.getUsername()))
        .block();
```

### Configuration for a service principal {#serv-principal}

Add `clientId()` to the `EntraIDTokenAuthConfigBuilder` chain to specify
authentication via a service principal, passing the ID token string as
a parameter. (See the
[Microsoft EntraID docs](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals)
for more information about service principals.)

```java
TokenBasedRedisCredentialsProvider credentials;

try ( EntraIDTokenAuthConfigBuilder builder = EntraIDTokenAuthConfigBuilder.builder()) {
        builder.clientId(CLIENT_ID)
                .secret(CLIENT_SECRET)
                .authority(AUTHORITY) // "https://login.microsoftonline.com/{YOUR_TENANT_ID}";
                .scopes(SCOPES);      // "https://redis.azure.com/.default";

        credentials = TokenBasedRedisCredentialsProvider.create(builder.build());
}
```

### Configuration for a managed identity {#mgd-identity}

You can also authenticate to AMR using a managed identity (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities).

For a system assigned managed identity, simply add the `systemAssignedManagedIdentity()`
method to the `EntraIDTokenAuthConfigBuilder` chain:

```java
TokenBasedRedisCredentialsProvider credentials;

try ( EntraIDTokenAuthConfigBuilder builder = EntraIDTokenAuthConfigBuilder.builder()) {
        builder.clientId(CLIENT_ID)
                // ...
                .systemAssignedManagedIdentity();

        credentials = TokenBasedRedisCredentialsProvider.create(builder.build());
}
```

For a user assigned managed identity, add `userAssignedManagedIdentity()`. This
requires a member of the `UserManagedIdentityType` enum (to select a
`CLIENT_ID`, `OBJECT_ID`, or `RESOURCE_ID`) as well as the `id` string itself:

```java
TokenBasedRedisCredentialsProvider credentials;

try ( EntraIDTokenAuthConfigBuilder builder = EntraIDTokenAuthConfigBuilder.builder()) {
        builder.clientId(CLIENT_ID)
                // ...
                .userAssignedManagedIdentity(
                        UserManagedIdentityType.CLIENT_ID,
                        "<ID>"
                );

        credentials = TokenBasedRedisCredentialsProvider.create(builder.build());
}
```

## Connect using the `withAuthentication()` option

When you have created your `TokenBasedRedisCredentialsProvider` instance, you are ready to
connect to AMR.
The example below shows how to include the authentication details in a
`TokenBasedRedisCredentialsProvider` instance and pass it to the `RedisURI.Builder`
using the `withAuthentication()` option. It also uses a `ClientOptions` object to
enable automatic re-authentication.

The connection uses
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security),
which is recommended and enabled by default for managed identities. See
[TLS connection]({{< relref "/develop/clients/lettuce/connect#tls-connection" >}}) for more information.

{{< note >}} The `Lettuce` client library doesn't manage the lifecycle of
the `TokenBasedRedisCredentialsProvider` instance for you. You can reuse the
same instance for as many clients and connections as you want. When you have
finished using the credentials provider, call its `close()` method, as shown
at the end of the example.
{{< /note >}}

```java
// Entra ID credentials provider for Service Principal Identity with Client Secret.
TokenBasedRedisCredentialsProvider credentialsSP;
try (EntraIDTokenAuthConfigBuilder builder = EntraIDTokenAuthConfigBuilder.builder()) {
        builder
                .clientId(CLIENT_ID)
                .secret(CLIENT_SECRET).authority(AUTHORITY) // "https://login.microsoftonline.com/{YOUR_TENANT_ID}"
                .scopes(SCOPES); // "https://redis.azure.com/.default"

        credentialsSP = TokenBasedRedisCredentialsProvider.create(builder.build());
}

// Optionally test the credentials provider.
// credentialsSP.resolveCredentials().doOnNext(c -> System.out.println("SPI ID :" + c.getUsername())).block();

// Enable automatic re-authentication.
ClientOptions clientOptions = ClientOptions.builder()
        .reauthenticateBehavior(
                ClientOptions.ReauthenticateBehavior.ON_NEW_CREDENTIALS
        ).build();

// Use the Entra ID credentials provider.
RedisURI redisURI = RedisURI.builder()
        .withHost(HOST)
        .withPort(PORT)
        .withAuthentication(credentialsSP)
        .withSsl(true)
        .build();

// Create the RedisClient and set the re-authentication options.
RedisClient redisClient = RedisClient.create(redisURI);
redisClient.setOptions(clientOptions);

// Connect with the credentials provider.
try (StatefulRedisConnection<String, String> user1 = redisClient.connect(StringCodec.UTF8)) {
        System.out.println("Connected to redis as :" + user1.sync().aclWhoami());
        System.out.println("Db size :" + user1.sync().dbsize());
} finally {
        redisClient.shutdown();  // Shutdown Redis client and close connections.
        credentialsSP.close(); // Shutdown Entra ID Credentials provider.
}
```
