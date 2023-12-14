---
Title: Transport Layer Security (TLS)
alwaysopen: false
categories:
- docs
- operate
- rc
description: Enable TLS to encrypt data communications between applications and Redis
  databases.
weight: 20
---

Transport Layer Security (TLS) uses encryption to secure [network communications](https://en.wikipedia.org/wiki/Transport_Layer_Security).  

Redis Cloud Fixed, Flexible, and Annual subscriptions can use TLS to encrypt data communications between applications and Redis databases.

## Use TLS with Redis Cloud

TLS is not enabled by default.

### TLS recommendations

Because TLS has an impact on performance, you need to determine whether the security benefits of TLS are worth the performance impact. TLS recommendations depend on the subscription plan and whether clients connect to your database using public or private endpoints.

This table shows TLS recommendations:

| Subscription | Public&nbsp;endpoint | Private endpoint |
|--------------|----------------------|------------|
| Fixed        | Enable TLS           | N/A |
| Flexible     | Enable TLS           | Enable TLS if security outweighs performance impact |
| Annual       | Enable TLS           | Enable TLS if security outweighs performance impact |

### Client authentication

When you enable TLS, you can optionally require client authentication (also known as "mutual authentication"). If enabled, all clients must present a valid client certificate when they connect to the database.

Client authentication is not required by Redis Cloud; however, it is strongly recommended.

### Enable TLS

To enable TLS for a Redis Cloud database:

1. Select **Databases** from the [Redis Cloud console](https://app.redislabs.com/) menu and then select your database from the list.

1. From the database's **Configuration** screen, select the **Edit database** button:

    {{<image filename="images/rc/button-database-edit.png" width="140px" alt="The Edit database button lets you change selected database properties." >}}{{< /image >}}

1. In the **Security** section, use the **Transport layer security (TLS)** toggle to enable TLS:

    {{<image filename="images/rc/database-details-configuration-tab-security-tls-toggle.png" width="200px" alt="Use the Transport Layer Security toggle to enable TLS." >}}{{< /image >}}

1. Select the **Download server certificate** button to download the Redis Cloud certificate bundle `redis_ca.pem`:

    {{<image filename="images/rc/button-database-config-security-server-ca-download.png" width="250px" alt="Use the Download server certificate button to download the Redis Cloud CA certificates." >}}{{< /image >}}

1. Decide whether you want to require client authentication:

    - If you only want clients that present a valid certificate to be able to connect, continue to the next step.
    
    - If you do not want to require client authentication, skip to the final step to apply your changes.

1. To require client authentication, select the **TLS client authentication** checkbox.

1. Either provide an [X.509 certificate](https://en.wikipedia.org/wiki/X.509) that contains a public key for your client or select **Generate certificate** to create one:

    {{<image filename="images/rc/database-details-configuration-tab-security-tls-client-auth-certificate.png" width="300px" alt="Provide or generate a certificate for TLS client authentication." >}}{{< /image >}}

    If you generate your certificate from the Redis Cloud console, a download button will appear after it is generated. The download contains:

    - `redis_user.crt` – the certificate's public key.

    - `redis_user_private.key` – the certificate's private key.

    {{<note>}}
You must download the certificate using the button at this point.  After your changes have been applied, the full bundle of public and private keys will no longer be available for download.
    {{</note>}}

2. To apply your changes and enable TLS, select the **Save database** button:

    {{<image filename="images/rc/button-database-save.png" width="140px" alt="Use the Save database button to save database changes." >}}{{< /image >}}

{{<note>}}
Once you've enabled TLS, all client connections to your database must use TLS. Unencrypted connections
will no longer be permitted.
{{</note>}}

## Connect over TLS

To connect to a Redis Cloud database over TLS, you need:

* A Redis client that supports TLS
* Redis Cloud CA certificates

### Download CA certificates

If you don't have the Redis Cloud CA certificates, you can download them from the Redis Cloud console:

1. Either select **Account Settings** from the Redis Cloud console menu or go to the database's **Configuration** screen.

1. Go to the **Security** section.

1. For **Redis Cloud certificate authority**, either:

    - Select the **Download** button to download the certificates from **Account Settings**:

        {{<image filename="images/rc/button-account-settings-security-ca-download.png" width="140px" alt="Use the Download button to download the Redis Cloud CA certificates." >}}{{< /image >}}

    - Select the **Download server certificate** button to download the certificates from the database's **Configuration** screen:

        {{<image filename="images/rc/button-database-config-security-server-ca-download.png" width="250px" alt="Use the Download server certificate button to download the Redis Cloud CA certificates." >}}{{< /image >}}

The download contains a file called `redis_ca.pem`, which includes the following certificates:
   
- Self-signed Redis Cloud Fixed plan Root CA (deprecated but still in use)

- Self-signed Redis Cloud Flexible plan Root CA and intermediate CA (deprecated but still in use)

- Publicly trusted GlobalSign Root CA

{{<note>}}
The downloaded PEM file contains multiple certificates. Make sure to import **all** certificates to your client trust store. If your client code is not implemented properly, it may only import the first certificate. 
{{</note>}}

To inspect the certificates in `redis_ca.pem`, run the `keytool` command:

```sh
keytool -printcert -file ./redis_ca.pem | grep "Owner:"
```

You can add `redis_ca.pem` to the trust store or pass it directly to a Redis client.

If your database requires client authentication, you also need the public (`redis_user.crt`) and private (`redis_user_private.key`) client keys. See
[Enable TLS](#enable-tls) for details.

### Connect with the Redis CLI

Here's how to use the [Redis CLI]({{< relref "/operate/rs/references/cli-utilities/redis-cli" >}}) to connect to a TLS-enabled Redis Cloud database.

Endpoint and port details are available from the **Databases** list or the database's **Configuration** screen.

#### Without client authentication

If your database doesn't require client authentication, then provide the Redis Cloud CA certificate bundle (`redis_ca.pem`) when you connect:

```sh
redis-cli -h <endpoint> -p <port> --tls --cacert redis_ca.pem
```

#### With client authentication

If your database requires client authentication, then you also need to provide your client's private and public keys:

```sh
redis-cli -h <endpoint> -p <port> --tls --cacert redis_ca.pem \
    --cert redis_user.crt --key redis_user_private.key
```
