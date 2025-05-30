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
weight: 15
---

The [`go-redis-entraid`](https://github.com/redis/go-redis-entraid) package
lets you authenticate your app to
[Azure Managed Redis (AMR)](https://azure.microsoft.com/en-us/products/managed-redis)
using [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/).
You can authenticate using a system-assigned or user-assigned
[managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
or a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals),
letting `go-redis-entraid` fetch and renew the authentication tokens for you automatically.

## Install

Install [`go-redis`]({{< relref "/develop/clients/go" >}}) if you
have not already done so.

Install `go-redis-entraid` with the
following command:

```bash
go get github.com/redis/go-redis-entraid
```

## Create a `StreamingCredentialsProvider` instance

The `StreamingCredentialsProvider` interface defines methods
to provide credentials for authentication. Use an object that
implements this interface to obtain the authentication credentials you
need when you connect to Redis. See the sections below to learn how
to create the `StreamingCredentialsProvider` instances for AMR
using the factory functions that `go-redis-entraid` provides.


### `StreamingCredentialsProvider` for a service principal

Use the `NewConfidentialCredentialsProvider()` factory function to create a
`StreamingCredentialsProvider` that authenticates to AMR using a
service principal (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals) to learn more about service principals).

You will need the following details of your service principal to make the connection:

- Client ID
- Client secret
- Tenant ID

Use an `AuthorityConfiguration` instance to pass the tenant ID.
This type has the following fields:

-   `AuthorityType`: This should have one of the values
    - `identity.AuthorityTypeDefault` ("default")
    - `identity.AuthorityTypeMultiTenant` ("multi-tenant")
    - `identity.AuthorityTypeCustom` ("custom")
-   `TenantID`: Pass your tenant ID string here, or use "common" for
    a multi-tentant application.
-   `Authority`: Custom authority URL. This is only required if you
    specified `AuthorityTypeCustom` in the `AuthorityType` field.

The example below shows how to import the required modules and call
`NewConfidentialCredentialsProvider()`:

```go
import (
    "github.com/redis-developer/go-redis-entraid/entraid"
    "github.com/redis-developer/go-redis-entraid/identity"
        ...
)
    .
    .
provider, err := entraid.NewConfidentialCredentialsProvider(
    entraid.ConfidentialIdentityProviderOptions{
	    ConfidentialIdentityProviderOptions: identity.ConfidentialIdentityProviderOptions{
		    ClientID:        "<your-azure-client-id>",
		    ClientSecret:    "<your-azure-client-secret>",
		    CredentialsType: identity.ClientSecretCredentialType,
		    Authority: identity.AuthorityConfiguration{
			    AuthorityType: identity.AuthorityTypeDefault,
			    TenantID:      "<your-azure-tenant-id>",
		    },
	    },
    },
)
```

### `StreamingCredentialsProvider` for a managed identity

Use the `NewManagedIdentityCredentialsProvider()` function to create a
`StreamingCredentialsProvider` that authenticates to AMR using a
managed identity (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities).

The example below shows how to import the required modules and call
`NewManagedIdentityCredentialsProvider()`.
Pass `identity.SystemAssignedIdentity` or `identity.UserAssignedIdentity`
as the `ManagedIdentityType` parameter.

```go
import (
    "github.com/redis-developer/go-redis-entraid/entraid"
    "github.com/redis-developer/go-redis-entraid/identity"
        ...
)
    .
    .
provider, err := entraid.NewManagedIdentityCredentialsProvider(
	entraid.ManagedIdentityCredentialsProviderOptions{
		ManagedIdentityProviderOptions: identity.ManagedIdentityProviderOptions{
			ManagedIdentityType:  identity.UserAssignedObjectID,
			UserAssignedObjectID: "<your-user-assigned-client-id>",
		},
	},
)
```

### Custom configuration

The examples above use a default configuration but you can also provide a custom
configuration using the `TokenManagerOptions` field of `CredentialsProviderOptions`:

```go
options := entraid.CredentialsProviderOptions{
    TokenManagerOptions: manager.TokenManagerOptions{
        ExpirationRefreshRatio: 0.7,
        LowerRefreshBounds: 10000,
        RetryOptions: manager.RetryOptions{
            MaxAttempts: 3,
            InitialDelay: 1000 * time.Millisecond,
            MaxDelay: 30000 * time.Millisecond,
            BackoffMultiplier: 2.0,
            IsRetryable: func(err error) bool {
                return strings.Contains(err.Error(), "network error") ||
                    strings.Contains(err.Error(), "timeout")
            },
        },
    },
}
```

These options are explained below:

-   `ExpirationRefreshRatio`: A `float` value representing the fraction
    of a token's lifetime that should elapse before attempting to
    refresh it. For example, a value of 0.75 means that you want to
    refresh the token after 75% of its lifetime has passed.
-   `LowerRefreshBounds`: The minimum amount of the token's lifetime
    (in milliseconds) remaining before attempting to refresh, regardless
    of the `expirationRefreshRatio` value. Set this to zero if you want
    the refresh time to depend only on `expirationRefreshRatio`.
-   `RetryOptions`: This object specifies how to retry a token request
    after failure. The available options are:
    -   `MaxAttempts`: The maximum number of times to retry a token request
        The default value is 3.
    -   `InitialDelay`: The initial delay between retries in milliseconds. This
        will be modified during successive attempts by the `BackoffMultiplier`
        value (see below). The default is 1000ms.
    -   `BackoffMultiplier`: The factor by which the `InitialDelay` is multiplied
        between attempts, following an
        [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
        strategy. The default multiplier is 2.0.
    -   `IsRetryable`: A function that receives an `error` parameter and returns
        a boolean `true` result if an attempt that failed with that error is
        retryable and `false` otherwise. Use this to implement your own custom
        logic to decide which errors should be retried.


## Connect

When you have created your `StreamingCredentialsProvider` instance, you are ready to
connect to AMR.
The example below shows how to pass the instance as a parameter to the standard
`NewClient()` connection method. It also illustrates how to use
[`os.Getenv()`](https://pkg.go.dev/os#Getenv) to get the connection details
from environment variables rather than include their values in the code.

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "strings"

    "github.com/redis-developer/go-redis-entraid/entraid"
    "github.com/redis/go-redis/v9"
)

func main() {
    // Get required environment variables
    clientID := os.Getenv("AZURE_CLIENT_ID")
    redisEndpoint := os.Getenv("REDIS_ENDPOINT")
    if clientID == "" || redisEndpoint == "" {
        log.Fatal(
            "AZURE_CLIENT_ID and REDIS_ENDPOINT env variables are required"
        )
    }

    // Create credentials provider for system assigned identity
    provider, err := entraid.NewManagedIdentityCredentialsProvider(
        entraid.ManagedIdentityCredentialsProviderOptions{
		    ManagedIdentityProviderOptions: identity.ManagedIdentityProviderOptions{
			    ManagedIdentityType: identity.SystemAssignedIdentity,
		    },
        }
    )
    if err != nil {
        log.Fatalf("Failed to create credentials provider: %v", err)
    }

    // Create Redis client
    client := redis.NewClient(&redis.Options{
        Addr: redisEndpoint,
        StreamingCredentialsProvider: provider,
    })
    defer client.Close()

    // Test connection
    ctx := context.Background()
    if err := client.Ping(ctx).Err(); err != nil {
        log.Fatalf("Failed to connect to Redis: %v", err)
    }
    log.Println("Connected to Redis!")
}
```

## More information

See the [`go-redis-entraid`](https://github.com/redis/go-redis-entraid)
GitHub repository for full source code and more examples and details.
