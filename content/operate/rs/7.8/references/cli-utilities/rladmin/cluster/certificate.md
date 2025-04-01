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
url: '/operate/rs/7.8/references/cli-utilities/rladmin/cluster/certificate/'
---

Sets a cluster certificate to a specified PEM file.

```sh
rladmin cluster certificate
        set <certificate name>
        certificate_file <certificate filepath>
        [ key_file <key filepath> ]
```

To set a certificate for a specific service, use the corresponding certificate name. See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions.

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| certificate name | 'cm'<br /> 'api'<br /> 'proxy'<br /> 'syncer'<br /> 'metrics_exporter' | Name of the certificate to update |
| certificate_file | filepath | Path to the certificate file |
| key_file | filepath | Path to the key file (optional) |

### Returns

Reports that the certificate was set to the specified file. Returns an error message if the certificate fails to update.

### Example

```sh
$ rladmin cluster certificate set proxy \
       certificate_file /tmp/proxy.pem
Set proxy certificate to contents of file /tmp/proxy.pem
```
