---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Shows how to configure cipher suites.
linkTitle: Configure cipher suites
title: Configure cipher suites
weight: 60
url: '/operate/rs/7.8/security/encryption/tls/ciphers/'
---

Ciphers are algorithms that help secure connections between clients and servers. You can change the ciphers to improve the security of your Redis Enterprise cluster and databases. The default settings are in line with industry best practices, but you can customize them to match the security policy of your organization.

## TLS 1.2 cipher suites

| Name | Configurable | Description |
|------------|--------------|-------------|
| control_cipher_suites | <span title="Yes">&#x2705; Yes</span> | Cipher list for TLS 1.2 communications for cluster administration (control plane) |
| data_cipher_list | <span title="Yes">&#x2705; Yes</span> | Cipher list for TLS 1.2 communications between applications and databases (data plane) |
| sentinel_cipher_suites | <span title="Yes">&#x2705; Yes</span> | Cipher list for [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service" >}}) (Sentinel) TLS 1.2 communications |

## TLS 1.3 cipher suites

| Name | Configurable | Description |
|------------|--------------|-------------|
| control_cipher_suites_tls_1_3 | <span title="No">&#x274c; No</span> | Cipher list for TLS 1.3 communications for cluster administration (control plane) |
| data_cipher_suites_tls_1_3 | <span title="Yes">&#x2705; Yes</span> | Cipher list for TLS 1.3 communications between applications and databases (data plane) |
| sentinel_cipher_suites_tls_1_3 | <span title="No">&#x274c; No</span> | Cipher list for [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service" >}}) (Sentinel) TLS 1.3 communications |

## Configure cipher suites

You can configure ciphers with the [Cluster Manager UI](#edit-ciphers-ui), [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}), or the [REST API]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}).

{{<warning>}}
Configuring cipher suites overwrites existing ciphers rather than appending new ciphers to the list.
{{</warning>}}

When you modify your cipher suites, make sure:

- The configured TLS version matches the required cipher suites.
- The certificates in use are properly signed to support the required cipher suites.

{{<note>}}
- Redis Enterprise Software doesn't support static [Diffie–Hellman (`DH`) key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) ciphers.

- Support for Ephemeral Diffie–Hellman (ECDHE) key exchange ciphers depends on the operating system version and security policy.
{{</note>}}

### Edit cipher suites in the UI {#edit-ciphers-ui}

To configure cipher suites using the Cluster Manager UI:

1. Go to **Cluster > Security**, then select the **TLS** tab.

1. In the **Cipher suites lists** section, click **Configure**:

    {{<image filename="images/rs/screenshots/cluster/security-tls-cipher-suites-view.png" alt="Cipher suites lists as shown in the Cluster Manager UI." >}}

1. Edit the TLS cipher suites in the text boxes:

    {{<image filename="images/rs/screenshots/cluster/security-tls-cipher-suites-edit.png" alt="Edit cipher suites drawer in the Cluster Manager UI." >}}

1. Click **Save**.

### Control plane cipher suites {#control-plane-ciphers-tls-1-2}

As of Redis Enterprise Software version 6.0.12, control plane cipher suites can use the BoringSSL library format for TLS connections to the Cluster Manager UI. See the BoringSSL documentation for a full list of available [BoringSSL configurations](https://github.com/google/boringssl/blob/master/ssl/test/runner/cipher_suites.go#L99-L131).

#### Configure TLS 1.2 control plane cipher suites

To configure TLS 1.2 cipher suites for cluster communication, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config control_cipher_suites <BoringSSL cipher list>
```

See the example below to configure cipher suites for the control plane:

```sh
rladmin cluster config control_cipher_suites ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305
```
{{<note>}}
- The deprecated 3DES and RC4 cipher suites are no longer supported.
{{</note>}}


### Data plane cipher suites {#data-plane-ciphers-tls-1-2}

Data plane cipher suites use the OpenSSL library format in Redis Enterprise Software version 6.0.20 or later. For a list of available OpenSSL configurations, see [Ciphers](https://www.openssl.org/docs/man1.1.1/man1/ciphers.html) (OpenSSL).

#### Configure TLS 1.2 data plane cipher suites

To configure TLS 1.2 cipher suites for communications between applications and databases, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config  data_cipher_list <OpenSSL cipher list>
```

See the example below to configure cipher suites for the data plane:

```sh
rladmin cluster config data_cipher_list AES128-SHA:AES256-SHA
```
{{<note>}}
- The deprecated 3DES and RC4 cipher suites are no longer supported.
{{</note>}}

#### Configure TLS 1.3 data plane cipher suites

To configure TLS 1.3 cipher suites for communications between applications and databases, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config data_cipher_suites_tls_1_3 <OpenSSL cipher list>
```

The following example configures TLS 1.3 cipher suites for the data plane:

```sh
rladmin cluster config data_cipher_suites_tls_1_3 TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256
```

### Discovery service cipher suites {#discovery-service-ciphers-tls-1-2}

Sentinel service cipher suites use the golang.org OpenSSL format for [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service" >}}) TLS connections in Redis Enterprise Software version 6.0.20 or later. See their documentation for a list of [available configurations](https://golang.org/src/crypto/tls/cipher_suites.go).

#### Configure TLS 1.2 discovery service cipher suites

To configure TLS 1.2 cipher suites for the discovery service cipher suites, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config  sentinel_cipher_suites <golang cipher list> 
```

See the example below to configure cipher suites for the sentinel service:

```sh
rladmin cluster config sentinel_cipher_suites TLS_RSA_WITH_AES_128_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```
