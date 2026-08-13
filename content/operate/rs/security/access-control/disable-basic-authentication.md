---
Title: Disable basic authentication for the REST API
alwaysopen: false
categories:
- docs
- operate
- rs
description: Disable Basic and Digest authentication for the cluster management REST API and require certificate or JWT authentication instead.
linkTitle: Disable basic authentication
weight: 40
---

By default, the Redis Software cluster management REST API accepts HTTP Basic authentication using a cluster username and password. Starting with Redis Software 8.2.0, you can disable Basic and Digest authentication cluster-wide with the `control_plane_basic_authentication` setting.

When you disable basic authentication, the cluster rejects Basic and Digest authentication on all inbound REST API requests, and clients must authenticate with a client certificate (mTLS) or a JSON Web Token (JWT) instead. This reduces the cluster's attack surface by removing password-based access to the management API.

{{<note>}}
This setting applies only to the cluster management REST API. It does not change how clients authenticate to databases.
{{</note>}}

## Before you begin

{{<warning>}}
Before you disable basic authentication, make sure every client and tool that calls the REST API can still authenticate another way. If you disable basic authentication without another working method in place, you lose REST API access to the cluster.
{{</warning>}}

When basic authentication is disabled, other configured authentication methods—such as certificate-based (mTLS), JWT, and LDAP—continue to work. Set up at least one before you disable basic authentication:

- **Certificate-based (mTLS) authentication** (recommended) — see [Certificate-based authentication]({{<relref "/operate/rs/security/certificates/certificate-based-authentication">}}).

- **JWT authentication** — obtain a token with an [authorize user]({{<relref "/operate/rs/references/rest-api/requests/users/authorize">}}) request, then send it as a bearer token on subsequent requests.

Some cluster-management flows support **certificate credentials** when Basic and Digest authentication are disabled or unavailable. These flows don't use JWT or LDAP:

- **Joining a node to the cluster** and **Active-Active database management.** Configure these flows to use certificate credentials (client certificate, client key, and trusted CA) instead of a username and password. The client certificate's signing CA must be present in the cluster's `mtls_trusted_ca`. See [Certificate-based authentication for cluster management]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#certificate-based-authentication-for-cluster-management">}}).

### Follow this order

Set up and verify certificate-based authentication *before* you disable basic authentication. If you disable it first, you can lock yourself out of the cluster and out of Active-Active database management.

1. Enable certificate-based authentication on the cluster (`mtls_certificate_authentication`) and add the client certificate's signing CA to the cluster's `mtls_trusted_ca`. See [Set up certificate-based authentication for the REST API]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#set-up-certificate-based-authentication-for-the-rest-api">}}).

1. Verify that certificate authentication works *while basic authentication is still enabled*. Enabling certificate-based authentication is additive—it doesn't disable password-based access:

    ```sh
    curl --cert client.pem --key client.key https://<host>:9443/v1/cluster
    # HTTP 200
    ```

1. Verify that your client trusts the cluster's API certificate chain:

    ```sh
    curl --cacert <ca-bundle> --cert client.pem --key client.key https://<host>:9443/v1/cluster
    ```

1. Configure certificate credentials for each participating cluster whose basic authentication you're disabling. Use either a username and password or certificate credentials per cluster—not both—so participating clusters can migrate one at a time. See [Manage an Active-Active database]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#manage-an-active-active-database">}}).

1. Disable basic authentication.

If you lose access, see [Re-enable basic authentication](#re-enable-basic-authentication)—`rladmin` runs locally on a cluster node and doesn't require REST API access.

## Disable basic authentication

Basic authentication is enabled by default (`control_plane_basic_authentication` is `true`). To disable it, use one of the following methods:

{{< multitabs id="disable-basic-auth"
    tab1="REST API"
    tab2="rladmin" >}}

To disable basic authentication using the REST API, use an [update cluster settings]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}) request:

```sh
PUT https://<host>:<port>/v1/cluster
{
    "control_plane_basic_authentication": false
}
```

-tab-sep-

To disable basic authentication using [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune" >}}):

```sh
rladmin tune cluster control_plane_basic_authentication disabled
```

{{< /multitabs >}}

## Verify

After you disable basic authentication, a request that uses Basic authentication returns `401 Unauthorized`:

```sh
curl -k -u "<username>:<password>" https://<host>:<port>/v1/cluster
# HTTP 401 Unauthorized
```

A request that uses a client certificate or a JWT succeeds. For example, using a client certificate:

```sh
curl -k --cert <client-cert> --key <client-key> https://<host>:<port>/v1/cluster
```

## Re-enable basic authentication

{{<note>}}
If disabling basic authentication left you without cluster access, use the `rladmin` method below. It runs locally on a cluster node and doesn't require REST API access.
{{</note>}}

To re-enable basic authentication, use one of the following methods:

{{< multitabs id="enable-basic-auth"
    tab1="REST API"
    tab2="rladmin" >}}

```sh
PUT https://<host>:<port>/v1/cluster
{
    "control_plane_basic_authentication": true
}
```

-tab-sep-

```sh
rladmin tune cluster control_plane_basic_authentication enabled
```

{{< /multitabs >}}
