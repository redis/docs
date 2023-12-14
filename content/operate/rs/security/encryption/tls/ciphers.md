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
---

Ciphers are algorithms that help secure connections between clients and servers. You can change the ciphers to improve the security of your Redis Enterprise cluster and databases. The default settings are in line with industry best practices, but you can customize them to match the security policy of your organization.


## Configure cipher suites

The communications for which you can modify ciphers are:

- Control plane - The TLS configuration for cluster administration.
- Data plane - The TLS configuration for the communication between applications and databases.
- Discovery service (Sentinel) - The TLS configuration for the [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}).

You can configure ciphers with the [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) commands shown here or with the [REST API]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}).

{{<warning>}}
Configuring cipher suites overwrites existing ciphers rather than appending new ciphers to the list.
{{</warning>}}

When you modify your cipher suites, make sure:

- The configured TLS version matches the required cipher suites.
- The certificates in use are properly signed to support the required cipher suites.

{{<note>}}
- Redis Enterprise Software doesn't support static [Diffie–Hellman (`DH`) key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) ciphers.

- It does support Ephemeral Diffie–Hellman (`DHE` or `ECDHE`) key exchange ciphers on Red Hat Enterprise Linux (RHEL) 8 and Bionic OS.  
{{</note>}}

### Control plane

As of Redis Enterprise Software version 6.0.12, control plane cipher suites can use the BoringSSL library format for TLS connections to the admin console. See the BoringSSL documentation for a full list of available [BoringSSL configurations](https://github.com/google/boringssl/blob/master/ssl/test/runner/cipher_suites.go#L99-L131).

To configure the cipher suites for cluster communication, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config cipher_suites <BoringSSL cipher list>
```

See the example below to configure cipher suites for the control plane:

```sh
rladmin cluster config cipher_suites ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:!3DES
```
{{<note>}}
- The phrase '!3DES' disables all 3DES cipher suites.
{{</note>}}


### Data plane

Data plane cipher suites use the OpenSSL library format in Redis Enterprise Software version 6.0.20 or later. For a list of available OpenSSL configurations, see [Ciphers](https://www.openssl.org/docs/man1.1.1/man1/ciphers.html) (OpenSSL).

To configure the cipher suites for communications between applications and databases, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config  data_cipher_list <OpenSSL cipher list>
```

See the example below to configure cipher suites for the data plane:

```sh
rladmin cluster config data_cipher_list AES128-SHA:AES256-SHA:!3DES
```
{{<note>}}
- The phrase '!3DES' disables all 3DES cipher suites.
{{</note>}}

### Discovery service

Sentinel service cipher suites use the golang.org OpenSSL format for [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service" >}}) TLS connections in Redis Enterprise Software version 6.0.20 or later. See their documentation for a list of [available configurations](https://golang.org/src/crypto/tls/cipher_suites.go).

To configure the discovery service cipher suites, use the following [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) command syntax:

```sh
rladmin cluster config  sentinel_cipher_suites <golang cipher list> 
```

See the example below to configure cipher suites for the sentinel service:

```sh
rladmin cluster config sentinel_cipher_suites TLS_RSA_WITH_AES_128_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```
