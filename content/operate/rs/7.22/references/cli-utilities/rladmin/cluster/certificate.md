---
Title: rladmin cluster certificate
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sets cluster certificates.
headerRange: '[1-2]'
linkTitle: certificate
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/cluster/certificate/'
---

## `cluster certificate set <certificate_name>`

Sets a cluster certificate to a specified PEM file.

```sh
rladmin cluster certificate set <certificate_name>
        certificate_file <filepath>
        [ key_file <filepath> ]
```

To set a certificate for a specific service, use the corresponding certificate name. See the [certificates table]({{< relref "/operate/rs/7.22/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| certificate_name | 'cm'<br /> 'api'<br /> 'proxy'<br /> 'syncer'<br /> 'metrics_exporter' | Name of the certificate to update. See the [certificates table]({{< relref "/operate/rs/7.22/security/certificates" >}}) for descriptions. |
| certificate_file | filepath | Path to the certificate file |
| key_file | filepath | Path to the key file (optional) |

### Returns

Reports that the certificate was set to the specified file. Returns an error message if the certificate fails to update.

### Example

Update the proxy certificate:

```sh
$ rladmin cluster certificate set proxy \
       certificate_file /tmp/proxy.pem
Set proxy certificate to contents of file /tmp/proxy.pem
```

## `cluster certificate set internal`

Sets [customer-provided internode encryption certificates]({{<relref "/operate/rs/7.22/security/encryption/internode-encryption#customer-provided-certificates">}}).

```sh
rladmin cluster certificate set internal
        dpine_certificate_file <filepath>
        dpine_key_file <filepath>
        cpine_certificate_file <filepath>
        cpine_key_file <filepath>
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| dpine_certificate_file | filepath | Path to the data plane internode encryption (DPINE) certificate file |
| dpine_key_file | filepath | Path to the data plane internode encryption (DPINE) key file |
| cpine_certificate_file | filepath | Path to the control plane internode encryption (CPINE) certificate file |
| cpine_key_file | filepath | Path to the control plane internode encryption (CPINE) key file |

### Returns

Reports that the internal certificates were set to the specified files. Returns an error message if the certificates fail to update.

### Example

Set up [customer-provided internode encryption certificates]({{<relref "/operate/rs/7.22/security/encryption/internode-encryption#customer-provided-certificates">}}):

```sh
$ rladmin cluster certificate set internal \
       dpine_certificate_file /tmp/dpine_cert.pem \
       dpine_key_file /tmp/dpine_key.pem \
       cpine_certificate_file /tmp/cpine_cert.pem \
       cpine_key_file /tmp/cpine_key.pem
```
