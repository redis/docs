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

The [`redis-entra-id`](https://github.com/redis/redis-py-entraid) package
lets you authenticate your app to
[Azure Managed Redis (AMR)](https://azure.microsoft.com/en-us/products/managed-redis)
using [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/).
You can authenticate using a system-assigned or user-assigned
[managed identity](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview)
or a [service principal](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals),
letting `redis-entra-id` fetch and renew the authentication tokens for you automatically.

## Install

Install [`redis-py`]({{< relref "/develop/clients/redis-py#install" >}}) first,
if you have not already done so. Then, install `redis-entra-id` with the
following command:

```bash
pip install redis-entraid
```

## Create a `CredentialProvider` instance

A `CredentialProvider` object obtains the authentication credentials you
need when you connect to Redis. See the sections below to learn how
to create the `CredentialProvider` instances for AMR
using the factory functions that `redis-entra-id` provides.


### `CredentialProvider` for a service principal

Use the `create_from_service_principal()` factory function to create a
`CredentialProvider` that authenticates to AMR using a
service principal (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity-platform/app-objects-and-service-principals) to learn more about service principals).

You will need the following details of your service principal to make the connection:

- Client ID
- Client secret
- Tenant ID

The example below shows how to import the required modules and call
`create_from_service_principal()`:

```python
from redis import Redis
from redis_entraid.cred_provider import *

credential_provider = create_from_service_principal(
    <CLIENT_ID>,
    <CLIENT_SECRET>,
    <TENANT_ID>
)
```

This uses a default configuration but you can also provide a custom
configuration using the `token_manager_config` parameter:

```python
credential_provider = create_from_service_principal(
    <CLIENT_ID>, 
    <CLIENT_SECRET>, 
    <TENANT_ID>,
    token_manager_config=TokenManagerConfig(
        expiration_refresh_ratio=0.9,
        lower_refresh_bound_millis=DEFAULT_LOWER_REFRESH_BOUND_MILLIS,
        token_request_execution_timeout_in_ms=DEFAULT_TOKEN_REQUEST_EXECUTION_TIMEOUT_IN_MS,
        retry_policy=RetryPolicy(
            max_attempts=5,
            delay_in_ms=50
        )
    )
)
```

### `CredentialProvider` for a managed identity

Use the `create_from_managed_identity()` factory function to create a
`CredentialProvider` that authenticates to AMR using a
managed identity (see the
[Microsoft documentation](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) to learn more about managed identities).

The example below shows how to import the required modules and call
`create_from_managed_identity()`.
Pass `ManagedIdentityType.USER_ASSIGNED` or `ManagedIdentityType.SYSTEM_ASSIGNED`
as the `identity_type` parameter.

```python
from redis import Redis
from redis_entraid.cred_provider import *

credential_provider = create_from_managed_identity(
    identity_type=ManagedIdentityType.SYSTEM_ASSIGNED,
)
```

This uses a default configuration but you can also provide a custom
configuration using the `token_manager_config` parameter:

```python
credential_provider = create_from_managed_identity(
    identity_type=ManagedIdentityType.SYSTEM_ASSIGNED, 
    ...

    token_manager_config=TokenManagerConfig(
        expiration_refresh_ratio=0.9,
        lower_refresh_bound_millis=DEFAULT_LOWER_REFRESH_BOUND_MILLIS,
        token_request_execution_timeout_in_ms=DEFAULT_TOKEN_REQUEST_EXECUTION_TIMEOUT_IN_MS,
        retry_policy=RetryPolicy(
            max_attempts=5,
            delay_in_ms=50
        )
    )
)
```

## Connect

When you have created your `CredentialProvider` instance, you are ready to
connect to AMR.
The example below shows how to pass the instance as a parameter to the standard
`Redis()` connection method.
{{< note >}} Azure requires you to use
[Transport Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security)
when you connect (see
[Connect with TLS]({{< relref "/develop/clients/redis-py/connect#connect-to-your-production-redis-with-tls" >}}) for more information).
{{< /note >}}

```python
r = Redis(
    host=<HOST>, port=<PORT>,
    credential_provider=credential_provider,
    ssl=True,
    ssl_certfile="./redis_user.crt",
    ssl_keyfile="./redis_user_private.key",
    ssl_ca_certs="./redis_ca.pem"
)

// Test the connection.
print("The database size is: {}".format(client.dbsize()))
```
