---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Use OCSP stapling to verify certificates maintained by a third-party
  CA and authenticate connection attempts between clients and servers.
linkTitle: Enable OCSP stapling
title: Enable OCSP stapling
weight: 50
url: '/operate/rs/7.8/security/certificates/ocsp-stapling/'
---

OCSP ([Online Certificate Status Protocol](https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol)) lets a client or server verify the status (`GOOD`, `REVOKED`, or `UNKNOWN`) of a certificate maintained by a third-party [certificate authority (CA)](https://en.wikipedia.org/wiki/Certificate_authority).

To check whether a certificate is still valid or has been revoked, a client or server can send a request to the CA's OCSP server (also called an OCSP responder). The OCSP responder checks the certificate's status in the CA's [certificate revocation list](https://en.wikipedia.org/wiki/Certificate_revocation_list) and sends the status back as a signed and timestamped response.

## OCSP stapling overview

 With OCSP enabled, the Redis Enterprise server regularly polls the CA's OCSP responder for the certificate's status. After it receives the response, the server caches this status until its next polling attempt.

 When a client tries to connect to the Redis Enterprise server, they perform a [TLS handshake](https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_handshake) to authenticate the server and create a secure, encrypted connection. During the TLS handshake, [OCSP stapling](https://en.wikipedia.org/wiki/OCSP_stapling) lets the Redis Enterprise server send (or "staple") the cached certificate status to the client.

If the stapled OCSP response confirms the certificate is still valid, the TLS handshake succeeds and the client connects to the server.

The TLS handshake fails and the client blocks the connection to the server if the stapled OCSP response indicates either:

- The certificate has been revoked.

- The certificate's status is unknown. This can happen if the OCSP responder fails to send a response.

## Set up OCSP stapling

You can configure and enable OCSP stapling for your Redis Enterprise cluster with the [Cluster Manager UI](#cluster-manager-ui-method), the [REST API](#rest-api-method), or [`rladmin`](#rladmin-method).

While OCSP is enabled, the server always staples the cached OCSP status when a client tries to connect. It is the client's responsibility to use the stapled OCSP status. Some Redis clients, such as [Jedis](https://github.com/redis/jedis) and [redis-py](https://github.com/redis/redis-py), already support OCSP stapling, but others might require additional configuration.

### Cluster Manager UI method

To set up OCSP stapling with the Redis Enterprise Cluster Manager UI:

1. Go to **Cluster > Security > OCSP**.

1. In the **Responder URI** section, select **Replace Certificate** to update the proxy certificate.

1. Provide the key and certificate signed by your third-party CA, then select **Save**.

1. Configure query settings if you don't want to use their default values:

    | Name | Default value | Description |
    |------|---------------|-------------|
    | **Query frequency** | 1 hour | The time interval between OCSP queries to the responder URI. |
    | **Response timeout** | 1 second | The time interval in seconds to wait for a response before timing out. |
    | **Recovery frequency** | 1 minute | The time interval between retries after a failed query. |
    | **Recovery maximum tries** | 5 | The number of retries before the validation query fails and invalidates the certificate. |

1. Select **Enable** to turn on OCSP stapling.

### REST API method

To set up OCSP stapling with the [REST API]({{< relref "/operate/rs/references/rest-api" >}}):

1. Use the REST API to [replace the proxy certificate]({{< relref "/operate/rs/security/certificates/updating-certificates#use-the-rest-api" >}}) with a certificate signed by your third-party CA.

1. To configure and enable OCSP, send a [`PUT` request to the `/v1/ocsp`]({{< relref "/operate/rs/references/rest-api/requests/ocsp#put-ocsp" >}}) endpoint and include an [OCSP JSON object]({{< relref "/operate/rs/references/rest-api/objects/ocsp" >}}) in the request body:

    ```json
    {
        "ocsp_functionality": true,
        "query_frequency": 3600,
        "response_timeout": 1,
        "recovery_frequency": 60,
        "recovery_max_tries": 5
    }
    ```

### `rladmin` method

To set up OCSP stapling with the [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command-line utility:

1. Use [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/certificate" >}}) to [replace the proxy certificate]({{< relref "/operate/rs/security/certificates/updating-certificates#use-the-cli" >}}) with a certificate signed by your third-party CA.

1. Update the cluster's OCSP settings with the [`rladmin cluster ocsp config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/ocsp#ocsp-config" >}}) command if you don't want to use their default values.

    For example: 

    ```sh
    rladmin cluster ocsp config recovery_frequency set 30
    ```

1. Enable OCSP:

    ```sh
    rladmin cluster ocsp config ocsp_functionality set enabled
    ```
