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

The [`@redis/entraid`](https://github.com/redis/node-redis/tree/master/packages/entraid)
package lets you authenticate your app to
[Azure Managed Redis (AMR)](https://azure.microsoft.com/en-us/products/managed-redis)
using [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/).
You can authenticate using a system-assigned or user-assigned
[managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview),
a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals),
an [auth code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow),
or a [`DefaultAzureCredential`](https://learn.microsoft.com/en-gb/dotnet/azure/sdk/authentication/credential-chains?tabs=dac#defaultazurecredential-overview) instance.
The `@redis/entraid` code fetches and renews the authentication tokens for you automatically.

## Install

Install [`node-redis`]({{< relref "/develop/clients/nodejs" >}}) and
`@redis/entraid` with the following commands:

```bash
npm install "@redis/client"
npm install "@redis/entraid"
```

## Create a credentials provider instance

A credentials provider object obtains the authentication credentials you
need when you connect to Redis (see the [Connect](#connect) section below
for a connection example). The `EntraIdCredentialsProviderFactory`
class provides a factory method for each type of credentials provider.
Import `EntraIdCredentialsProviderFactory` with the following code:

```js
import { EntraIdCredentialsProviderFactory }
    from '@redis/entraid';
```

Then, use the appropriate factory method to create your credentials provider:

-   Use [`createForClientCredentials()`](#authenticate-with-a-service-principal)
    to authenticate with a service principal using a client secret.
-   Use [`createForClientCredentialsWithCertificate()`](#authenticate-with-a-service-principal)
    to authenticate with a service principal using a certificate.
-   Use [`createForSystemAssignedManagedIdentity()`](#authenticate-with-a-managed-identity)
    to authenticate with a system-assigned managed identity.
-   Use [`createForUserAssignedManagedIdentity()`](#authenticate-with-a-managed-identity)
    to authenticate with a user-assigned managed identity.
-   Use [`createForAuthorizationCodeWithPKCE()`](#auth-code-flow-with-pkce)
    for interactive authentication flows in user applications.
-   Use [`createForDefaultAzureCredential()`](#def-az-cred)
    to authenticate with Azure Identity's `DefaultAzureCredential` class.

The sections below describe these factory functions in more detail.

### Provider parameters

All these factory functions receive an object containing the parameters
to create the credentials provider. The object generally contains the following
fields, but specific factory methods add or omit particular parameters:

-   `clientId`: A string containing the client ID.
-   `scopes`: (Optional) A string or an array of strings defining the
    [scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc)
    you want to apply. Configure your client application to acquire a Microsoft Entra token for scope, https://redis.azure.com/.default or acca5fbb-b7e4-4009-81f1-37e38fd66d78/.default with the
    [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview). Note that the `entra-id-credentials-provider-factory`
    module exports a constant `REDIS_SCOPE_DEFAULT` for the default scope. See the
    [`DefaultAzureCredential`](#def-az-cred) example below to learn how to use this.
-   `authorityConfig`: (Optional) [Authority](https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-application-configuration#authority)
    settings. See the [`authorityConfig`](#authorityconfig) section below for a full
    description.
-   `tokenManagerConfig`: An object with fields that specify how to refresh the token.
    See the [`tokenManagerConfig`](#tokenmanagerconfig) section below for a full
    description.

#### **tokenManagerConfig**

You can configure an authentication token to expire after a certain amount of
time, known as its *lifetime*. You must refresh a token before its lifetime
is over to continue using it (see
[Configurable token lifetimes in the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/configurable-token-lifetimes)
for more information). The `tokenManagerConfig` object lets you pass parameters to
specify how you want to manage token refreshes. The fields of the object are listed
below:

-   `expirationRefreshRatio`: This is the fraction of the token's lifetime that should
    elapse before a refresh is triggered. For example, a value of 0.75 means the token
    should be refreshed when 75% of its lifetime has elapsed.
-   `retry`: This object specifies the policy to retry refreshing the token if
    an error occurs. It has the following fields:
    -   `maxAttempts`: The maximum number of times to attempt a refresh before
        aborting.
    -   `initialDelayMs`: The delay (in milliseconds) before retrying after the
        first failed attempt.
    -   `maxDelayMs`: The maximum time (in milliseconds) to wait between attempts
        to refresh.
    -   `backoffMultiplier`: The
        [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
        for the time between attempts to refresh. For example, a value of 2
        will double the delay for each attempt. Use a value of 1 to keep
        the delay roughly constant.
    -   `jitterPercentage`: (Optional) The maximum fraction of the calculated delay time to
        randomly add or subtract. For example, a value of 0.1 will add or subtract
        up to 10% of the delay time. This random component helps to prevent
        repeated collisions between clients that have the same retry settings.
    -   `isRetryable`: (Optional) This specifies a function with the signature <br/><br/>
        `(error, attempt) => boolean`<br/><br/>
        where `error` is the error object from
        a failed attempt and `attempt` is the number of attempts previously made.
        This function classifies errors from the identity provider as 
        retryable (returning `true`) or non-retryable (returning `false`).
        Implement your own custom logic here to determine if a token refresh failure
        should be retried, based on the type of error. For example, a refresh failure
        caused by a transient network error would probably succeed eventually if you retry
        it, but an invalid certificate is generally a fatal error. If you don't supply a custom
        function in this parameter, the default behavior is to retry all types of errors.

#### **authorityConfig**

The `authorityConfig` object has a `type` field that can take any of
the string values `default`, `multi-tenant`, or `custom`. If you use
`multi-tenant` then you must also supply a `tenantId` field containing
the tenant ID string:

```js
// Other fields...
authorityConfig: {
    type: 'multi-tenant',
    tenantId: 'your-tenant-id'
  },
// ...
```

If you use `custom` then you must also supply an `authorityUrl`
containing the authority URL string:

```js
// Other fields...
authorityConfig: {
    type: 'custom',
    authorityUrl: 'your-authority-url'
  },
// ...
```
See Microsoft's [Authority]([Authority](https://learn.microsoft.com/en-us/entra/identity-platform/msal-client-application-configuration#authority))
docs for more information.

### Authenticate with a service principal

Use the `createForClientCredentials()` factory function to create a
credentials provider that authenticates to AMR using a
service principal (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals) to learn more about service principals).

You will need the following details of your service principal to make the connection:

- Client ID
- Client secret
- Tenant ID

The example below shows how to call `createForClientCredentials()`. Note that the
[parameter object](#provider-parameters) includes an extra field here for the
client secret.

```js
const provider = EntraIdCredentialsProviderFactory.createForClientCredentials({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  authorityConfig: {
    type: 'multi-tenant',
    tenantId: 'your-tenant-id'
  },
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8 // Refresh token after 80% of its lifetime
  }
});
```

If you want to authenticate using a service principal with a certificate,
use `createForClientCredentialsWithCertificate()` to create the credentials
provider. This is similar to `createForClientCredentials()` but it takes
a `clientCertificate` parameter object instead of the `clientSecret` parameter.
This object has the following string fields:

-   `x5c`: X.509 certificate.
-   `privateKey`: The certificate's private key.
-   `thumbprintSha256`: (Optional) SHA-256 hash of the certificate.

The example below shows how to call `createForClientCredentialsWithCertificate()` and
demonstrates the `retry` parameter in `tokenManagerConfig`:

```js
const provider = EntraIdCredentialsProviderFactory.createForClientCredentialsWithCertificate({
  clientId: 'your-client-id',
  clientCertificate: {
    x5c: '<certificate>',
    privateKey: '<private-key>',
    thumbprintSha256: '<certificate-SHA-256-hash>'
  },
  tokenManagerConfig: {
    expirationRefreshRatio: 0.75,
    retry: {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2
    }
  }
});
```

### Authenticate with a managed identity

You can authenticate to AMR using a managed identity (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities).

For a system-assigned managed identity, use the `createForSystemAssignedManagedIdentity()` factory function as shown in the example below:

```js
const provider = EntraIdCredentialsProviderFactory.createForSystemAssignedManagedIdentity({
    clientId: 'your-client-id'
});
```

For a user-assigned managed identity, use `createForUserAssignedManagedIdentity()`.
Here, the [parameter object](#provider-parameters) includes an extra field for
the user-assigned client ID.

```js
const provider = EntraIdCredentialsProviderFactory.createForUserAssignedManagedIdentity({
  clientId: 'your-client-id',
  userAssignedClientId: 'your-user-assigned-client-id'
});
```

### Auth code flow with PKCE

*Auth code flow with Proof Key for Code Exchange (PKCE)* lets a client app
authenticate for access to web APIs and other restricted resources. This
requires a redirect URI to return control to your app after authentication.
See
[Microsoft identity platform and OAuth 2.0 authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
for more information.

Use the `createForAuthorizationCodeWithPKCE()` factory method to use auth code flow
with PKCE. The example below shows the extra field `redirectUri` in the parameter
object:

```js
const provider = EntraIdCredentialsProviderFactory.createForAuthorizationCodeWithPKCE({
  clientId: 'your-client-id',
  redirectUri: '<uri-for-your-app>'
});
```

### Authenticate with `DefaultAzureCredential` {#def-az-cred}

The
[`DefaultAzureCredential`](https://learn.microsoft.com/en-gb/dotnet/azure/sdk/authentication/credential-chains?tabs=dac#defaultazurecredential-overview)
class in `@azure/identity` is designed for use during development. It simplifies
authentication by automatically trying different credentials until one succeeds.
See [`DefaultAzureCredential` overview](https://learn.microsoft.com/en-gb/dotnet/azure/sdk/authentication/credential-chains?tabs=dac#defaultazurecredential-overview)
in the Microsoft docs for more information.

The example below shows how to use `createForDefaultAzureCredential()`:

```js
import { DefaultAzureCredential } from '@azure/identity';
import { EntraIdCredentialsProviderFactory, REDIS_SCOPE_DEFAULT }
    from '@redis/entraid';

// ...

// Create a DefaultAzureCredential instance
const credential = new DefaultAzureCredential();

// Create a provider using DefaultAzureCredential
const provider = EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
  // Use the same parameters you would pass to credential.getToken()
  credential,
  scopes: REDIS_SCOPE_DEFAULT, // The Redis scope
  // Optional additional parameters for getToken
  options: {
    // Any options you would normally pass to credential.getToken()
  },
  tokenManagerConfig: {
    expirationRefreshRatio: 0.8
  }
});
```

Note that when you use `createForDefaultAzureCredential()`, you must:

-   Create your own instance of `DefaultAzureCredential`.
-   Pass the same parameters to the factory method that you would use with the `getToken()`
    method:
    -   `scopes`: The Redis scope (use the exported `REDIS_SCOPE_DEFAULT` constant).
    -   `options`: Any other options for the `getToken()` method.

## Connect

When you have created your credential provider instance, you are ready to
connect to AMR.
The example below shows how to pass the instance as a parameter to the standard
`createClient()` connection method.

```js
import { createClient } from '@redis/client';
import { EntraIdCredentialsProviderFactory }
    from '@redis/entraid';
    
// Create credentials provider instance...

const client = createClient({
  url: 'redis://localhost',
  credentialsProvider: provider
});

await client.connect();

const size = await client.dbSize();
console.log(`Database size is ${size}`);
```

## RESP2 PUB/SUB limitations

If you are using the
[RESP2]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, you should
be aware that [pub/sub]({{< relref "/develop/pubsub" >}}) can
cause complications with reauthentication.

After a connection enters PUB/SUB mode, the socket is blocked and can't process
out-of-band commands like [`AUTH`]({{< relref "/commands/auth" >}}). This means that
connections in PUB/SUB mode can't be reauthenticated when the tokens are refreshed.
As a result, PUB/SUB connections will be evicted by the Redis proxy when their tokens expire. 
You must reconnect with fresh tokens when this happens.

## Note about transactions

If you use
[transactions](https://redis.io/docs/latest/develop/clients/nodejs/transpipe)
in code that also uses token-based authentication, ensure that you use
the `node-redis` client multi/exec API rather than explicit commands to create
each transaction (see
[Execute a transaction](https://redis.io/docs/latest/develop/clients/nodejs/transpipe/#execute-a-transaction)
for an example of correct usage).
This is because the token manager might attempt to reauthenticate while your code
issues the separate transaction commands, which will interfere with the transaction.
The transaction API handles this case for you safely.
