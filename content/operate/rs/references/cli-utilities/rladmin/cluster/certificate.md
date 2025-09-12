---
Title: rladmin cluster certificate
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sets the cluster certificate.
headerRange: '[1-2]'
linkTitle: certificate
tags:
- configured
toc: 'true'
weight: $weight
---

Sets a cluster certificate to a specified PEM file.

```sh
rladmin cluster certificate
        set { <certificate_name> | internal }
        [ certificate_file <filepath> ]
        [ key_file <filepath> ]
        [ cpine_certificate_file <filepath> ]
        [ cpine_key_file <filepath> ]
        [ dpine_certificate_file <filepath> ]
        [ dpine_key_file <filepath> ] 
```

To set a certificate for a specific service, use the corresponding certificate name. See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| certificate_name | 'cm'<br /> 'api'<br /> 'proxy'<br /> 'syncer'<br /> 'metrics_exporter' | Name of the certificate to update |
| internal | | Set up internal certificates for data plane internode encryption (DPINE) and control plane internode encryption (CPINE) |
| certificate_file | filepath | Path to the certificate file |
| key_file | filepath | Path to the key file (optional) |
| dpine_certificate_file | filepath | Path to the data plane internode encryption (DPINE) certificate file (internal certificate) |
| dpine_key_file | filepath | Path to the data plane internode encryption (DPINE) key file (internal certificate) |
| cpine_certificate_file | filepath | Path to the control plane internode encryption (CPINE) certificate file (internal certificate) |
| cpine_key_file | filepath | Path to the control plane internode encryption (CPINE) key file (internal certificate) |

### Returns

Reports that the certificate was set to the specified file. Returns an error message if the certificate fails to update.

### Examples

Update the proxy certificate:

```sh
$ rladmin cluster certificate set proxy \
       certificate_file /tmp/proxy.pem
Set proxy certificate to contents of file /tmp/proxy.pem
```

Set up [customer-provided internode encryption certificates]({{<relref "/operate/rs/security/encryption/internode-encryption#customer-provided-certificates">}}):

```sh
$ rladmin cluster certificate set internal \
       dpine_certificate_file /tmp/dpine_cert.pem \
       dpine_key_file /tmp/dpine_key.pem \
       cpine_certificate_file /tmp/cpine_cert.pem \
       cpine_key_file /tmp/cpine_key.pem
```
