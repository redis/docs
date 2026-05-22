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
weight: 25
---

The `entra-id` feature lets you authenticate your app to
[Azure Managed Redis (AMR)](https://azure.microsoft.com/en-us/products/managed-redis)
using [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/).
You can authenticate using a system-assigned or user-assigned
[managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
or a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals),
letting the `redis-rs` connection fetch and renew the authentication tokens for you automatically.

## Install

Add the `entra-id` feature to your `Cargo.toml` file:

```toml
[dependencies]
redis = { version = "1.0.4", features = ["entra-id"] }
```

## Create a `EntraIdCredentialsProvider` instance

A `EntraIdCredentialsProvider` object obtains the authentication credentials you
need when you connect to Redis. See the sections below to learn how
to create the `EntraIdCredentialsProvider` instances for AMR
using the factory methods that the class provides.


### `EntraIdCredentialsProvider` for a service principal

Use the `new_client_secret()` factory method to create a
`EntraIdCredentialsProvider` that authenticates to AMR using a
service principal (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals) to learn more about service principals).

You will need the following details of your service principal to make the connection:

- Client ID
- Client secret
- Tenant ID

The example below shows how to import the required modules and call
`new_client_secret()`:

```rust
use redis::{EntraIdCredentialsProvider, RetryConfig, RedisResult};

fn example() -> RedisResult<()> {
    let mut provider = EntraIdCredentialsProvider::new_client_secret(
        "your-tenant-id".to_string(),
        "your-client-id".to_string(),
        "your-client-secret".to_string(),
    )?;

    provider.start(RetryConfig::default());
    Ok(())
}
```

For extra security, you can also supply a certificate:

```rust
use redis::{
    ClientCertificate, EntraIdCredentialsProvider,
    RetryConfig, RedisResult
};
use std::fs;

fn example() -> RedisResult<()> {
    // Load certificate from file
    let certificate_base64 = fs::read_to_string(
            "path/to/base64_pkcs12_certificate"
        )
        .expect("Base64 PKCS12 certificate not found.")
        .trim()
        .to_string();

    // Create the credentials provider using service principal with
    // client certificate
    let mut provider = EntraIdCredentialsProvider::new_client_certificate(
        "your-tenant-id".to_string(),
        "your-client-id".to_string(),
        ClientCertificate {
            base64_pkcs12: certificate_base64, // Base64 encoded PKCS12 data
            password: None,
        },
    )?;
    provider.start(RetryConfig::default());
    Ok(())
}
```

### `EntraIdCredentialsProvider` for a managed identity

`EntraIdCredentialsProvider` provides two factory methods that authenticate to AMR using a
managed identity:

- `new_system_assigned_managed_identity()` for system-assigned managed identities
- `new_user_assigned_managed_identity()` for user-assigned managed identities

See the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities.

The example below shows how to import the required modules and call both methods for
Azure-hosted applications:

```rust
use redis::{EntraIdCredentialsProvider, RetryConfig, RedisResult};

fn example() -> RedisResult<()> {
    // System-assigned managed identity
    let mut provider = EntraIdCredentialsProvider::new_system_assigned_managed_identity()?;
    provider.start(RetryConfig::default());

    // User-assigned managed identity
    let mut provider = EntraIdCredentialsProvider::new_user_assigned_managed_identity()?;
    provider.start(RetryConfig::default());
    Ok(())
}
```

You can also create a user-assigned managed identity with custom scopes and
identity specification:

```rust
use redis::{EntraIdCredentialsProvider, RetryConfig, RedisResult};
use azure_identity::{ManagedIdentityCredentialOptions, UserAssignedId};

fn example() -> RedisResult<()> {
    let mut provider = EntraIdCredentialsProvider::new_user_assigned_managed_identity_with_scopes(
        vec!["your-scope".to_string()],
        Some(ManagedIdentityCredentialOptions {
            // Specify the user-assigned identity using one of:
            user_assigned_id: Some(UserAssignedId::ClientId("your-client-id".to_string())),
            // or: user_assigned_id: Some(UserAssignedId::ObjectId("your-object-id".to_string())),
            // or: user_assigned_id: Some(UserAssignedId::ResourceId("your-resource-id".to_string())),
            ..Default::default()
        }),
    )?;

    provider.start(RetryConfig::default());
    Ok(())
}
```

## Advanced configuration

The examples above use the default `RetryConfig` when starting the provider.
However, the `RetryConfig` class provides configuration methods that let you customise
the way the the provider retries token requests:

```rust
use redis::{EntraIdCredentialsProvider, RetryConfig, RedisResult};
use std::time::Duration;

fn example() -> RedisResult<()> {
    let mut provider = EntraIdCredentialsProvider::new_system_assigned_managed_identity()?;

    let retry_config = RetryConfig::default()
        .set_number_of_retries(3)
        .set_min_delay(Duration::from_millis(100))
        .set_max_delay(Duration::from_secs(30))
        .set_exponent_base(2.0);

    provider.start(retry_config);
    Ok(())
}
```

`RetryConfig` provides the following configuration methods:

| Method | Description |
| --- | --- |
| `set_number_of_retries()` | The maximum number of times to retry a token request before aborting. |
| `set_min_delay()` | Minimum time to wait before retrying a token request after a failed attempt. This provides a mechanism to request throttling to prevent an excessive number of token requests. |
| `set_max_delay()` | Maximum time to wait before retrying a token request after a failed attempt. |
| `set_exponent_base()` | An `f64` value representing the fraction of a token's lifetime that should elapse before attempting to refresh it. For example, a value of 0.75 means that you want to refresh the token after 75% of its lifetime has passed. |


## Connect

When you have created your `EntraIdCredentialsProvider` instance, you are ready to
connect to AMR. Create a connection configuration with the credentials provider and
use it to create a connection, as shown in the example below.

```rust
use redis::{
    Client, EntraIdCredentialsProvider,
    RetryConfig, AsyncConnectionConfig
};

async fn example() -> redis::RedisResult<()> {
    // Create the credentials provider.
    let mut provider = EntraIdCredentialsProvider::new_system_assigned_managed_identity()?;
    provider.start(RetryConfig::default());

    // Create Redis client.
    let client = Client::open("redis://your-redis-instance.com:6380")?;

    // Create a connection configuration with the credentials provider.
    let config = AsyncConnectionConfig::new().set_credentials_provider(provider);

    // Get a multiplexed connection with the configuration.
    let mut r = client.get_multiplexed_async_connection_with_config(&config).await?;
    
    // Use the connection.
    r.set("foo", "bar").await?;

    let res: String = r.get("foo").await?;
    println!("foo={res}");

    Ok(())
}
```
