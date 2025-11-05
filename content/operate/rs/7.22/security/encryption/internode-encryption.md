---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes internode encryption which improves the security of data in
  transit.
linkTitle: Internode encryption
title: Internode encryption
weight: 15
url: '/operate/rs/7.22/security/encryption/internode-encryption/'
---
As of v6.2.4, Redis Enterprise Software supports _internode encryption_, which encrypts internal communication between nodes. This improves the security of data as it travels within a cluster.

Internode encryption is enabled for the _control plane_, which manages the cluster and its databases.

Internode encryption is supported for the _data plane_, which encrypts communication used to replicate shards between nodes and proxy communication with shards located on different nodes.

The following diagram shows how this works.

{{<image filename="images/rs/internode-encryption.png" alt="A diagram showing the interaction between data internode encryption, control plane encryption, and various elements of a cluster." >}}

Data internode encryption is disabled by default for individual databases in order to optimize for performance.  Encryption adds latency and overhead; the impact is measurable and varies according to the database, its field types, and the details of the underlying use case. 

You can enable data internode encryption for a database by changing the database configuration settings.  This lets you choose when to favor performance and when to encrypt data.

## Prerequisites

Internode encryption requires certain prerequisites.  

You need to:

- Upgrade all nodes in the cluster to v6.2.4 or later.

- Open port 3342 for the TLS channel used for encrypted communication.


## Enable data internode encryption

To enable internode encryption for a database (also called _data internode encryption_), you need to enable the appropriate setting for each database you wish to encrypt.  To do so, you can:

- Use the Cluster Manager UI to enable the **Internode Encryption** setting from the database **Security** screen.

-  Use the `rladmin` command-line utility to set the [data_internode_encryption]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/tune#tune-db" >}}) setting for the database:

    ``` shell
    rladmin tune db <database_id> data_internode_encryption enabled
    ``` 

- Use the Redis Enterprise Software REST API to set the `data_internode_encryption` setting for the database.

    ``` rest
    put /v1/bdbs/${database_id}
    { "data_internode_encryption" : true }
    ```

When you change the data internode encryption setting for a database, all active remote client connections are disconnected.  This restarts the internal (DMC) proxy and disconnects all client connections.

## Change cluster policy

To enable internode encryption for new databases by default, use one of the following methods:

- Cluster Manager UI

    1. On the **Databases** screen, select {{< image filename="/images/rs/buttons/button-toggle-actions-vertical.png#no-click" alt="Toggle actions button" width="22px" class="inline" >}} to open a list of additional actions.

    1. Select **Database defaults**.

    1. Go to **Internode Encryption** and click **Change**.

    1. Select **Enabled** to enable internode encryption for new databases by default.

    1. Click **Change**.

    1. Select **Save**.

- [rladmin tune cluster]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/tune#tune-cluster" >}}): 
    
    ```sh
    rladmin tune cluster data_internode_encryption enabled
    ```

- [Update cluster policy]({{< relref "/operate/rs/7.22/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) REST API request:

    ```sh
    PUT /v1/cluster/policy 
    { "data_internode_encryption": true }
    ```

## Self-signed certificates

By default, Redis Enterprise Software uses self-signed certificates for internode encryption. These certificates are automatically generated, managed, and rotated by the system.

### Encryption ciphers and settings

To encrypt internode communications, Redis Enterprise Software uses TLS 1.2 and the following cipher suites:

- ECDHE-RSA-AES256-GCM-SHA384
- ECDHE-RSA-AES128-GCM-SHA256

As of Redis Enterprise Software v7.4, internode encryption also supports TLS 1.3 with the following cipher suites:

- TLS_AES_128_GCM_SHA256
- TLS_AES_256_GCM_SHA384

The TLS layer determines which TLS version to use.

No configurable settings are exposed; internode encryption is used internally within a cluster and not exposed to any outside service.

### Certificate authority and rotation

Starting with v6.2.4, internode communication is managed, in part, by two certificates: one for the control plane and one for the data plane.  These certificates are signed by a private certificate authority (CA).  The CA is not exposed outside of the cluster, so it cannot be accessed by external processes or services.  In addition, each cluster generates a unique CA that is not used anywhere else.

The private CA is generated when a cluster is created or upgraded to 6.2.4.  

When nodes join the cluster, the cluster CA is used to generate certificates for the new node, one for each plane.  Certificates signed by the private CA are not shared between clusters and they're not exposed outside the cluster.

All certificates signed by the internal CA expire after ninety (90) days and automatically rotate every thirty (30) days.  Alerts also monitor certificate expiration and trigger when certificate expiration falls below 45 days.  If you receive such an alert, contact support.

You can use the Redis Enterprise Software REST API to rotate certificates manually:

``` rest
POST /v1/cluster/certificates/rotate
```

## Customer-provided certificates

Instead of using Redis Enterprise Software's self-signed certificates for internode encryption, you can provide certificates generated by your Certificate Authority (CA).

### Certificate requirements

Customer-provided internode encryption certificates must meet the following requirements:

- Certificates must be in PEM format.

- Certificates must contain the certificate chain and the leaf certificate.

- Certificates must use an RSA key. Using other key types, such as ECDSA or EdDSA, might prevent internode encryption from working.

### Upload customer-provided certificates

You can upload either:

- One certificate for both data plane internode encryption (DPINE) and control plane internode encryption (CPINE).

- Two separate certificates: one for DPINE and one for CPINE.

To upload internode encryption certificates, use one of the following methods:

{{< multitabs id="upload-ine-certs" 
tab1="Cluster Manager UI"
tab2="rladmin"
tab3="REST API" >}}

1. In the Cluster Manager UI, go to **Cluster > Security > Certificates**.

1. Expand the **Internode encryption certificates** section.

1. Click **Replace certificates**.

1. In the **Internode encryption certificates** panel, select one of the following options:

    - Use the same certificate for data and control plane internode encryption

    - Use separate certificates for data and control plane internode encryption

1. For each certificate and key, click **Upload** and use the file browser to select the relevant PEM file.

1. Click **Save & Rotate**.

-tab-sep-

To use the same certificate for data and control plane internode encryption, run the following [`rladmin cluster certificate`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/cluster/certificate#cluster-certificate-set-internal" >}}) command:

```sh
rladmin cluster certificate set internal dpine_certificate_file <path-to-shared-cert> dpine_key_file <path-to-shared-key> cpine_certificate_file <path-to-shared-cert> cpine_key_file <path-to-shared-key>
```

To use separate certificates for data and control plane internode encryption, run the following [`rladmin cluster certificate`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/cluster/certificate#cluster-certificate-set-internal" >}}) command:

```sh
rladmin cluster certificate set internal dpine_certificate_file <path-to-dpine-cert> dpine_key_file <path-to-dpine-key> cpine_certificate_file <path-to-cpine-cert> cpine_key_file <path-to-cpine-key>
```

-tab-sep-

To use the same certificate for data and control plane internode encryption, send a [`PUT /v1/cluster/certificates`]({{< relref "/operate/rs/7.22/references/rest-api/requests/cluster/certificates#put-cluster-certificates" >}}) request:

```sh
PUT https://<host>:<port>/v1/cluster/certificates
{
  "certificates": [
    {
      "name": "ccs_internode_encryption",
      "key": "<shared-private-key>",
      "certificate": "<shared-certificate-chain>"
    },
    {
      "name": "data_internode_encryption",
      "key": "<shared-private-key>",
      "certificate": "<shared-certificate-chain>"
    }
  ]
}
```

To use separate certificates for data and control plane internode encryption, send a [`PUT /v1/cluster/certificates`]({{< relref "/operate/rs/7.22/references/rest-api/requests/cluster/certificates#put-cluster-certificates" >}}) request:

```sh
PUT https://<host>:<port>/v1/cluster/certificates
{
  "certificates": [
    {
      "name": "ccs_internode_encryption",
      "key": "<cpine-private-key>",
      "certificate": "<cpine-certificate-chain>"
    },
    {
      "name": "data_internode_encryption",
      "key": "<dpine-private-key>",
      "certificate": "<dpine-certificate-chain>"
    }
  ]
}
```

{{< /multitabs >}}


### Certificate expiration and rotation

Customer-provided internode encryption certificates are not rotated automatically. To prevent possible issues with cluster and database unavailability caused by expired internode encryption certificates:

- You should monitor the certificates' expiration dates and [renew them]({{<relref "/operate/rs/7.22/security/certificates/updating-certificates#how-to-update-certificates">}}) before they expire.

- In case you do not renew the customer-managed certificates before they expire, Redis Enterprise Software automatically replaces them with self-signed certificates 5 days before expiration. You can upload new customer-provided certificates to replace these certificates anytime.

### Performance recommendations

For optimal performance with customer-provided certificates, follow the same recommendations as for self-signed certificates detailed in the [Encryption ciphers and settings](#encryption-ciphers-and-settings) section.

