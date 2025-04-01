---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create self-signed certificates to install on a Redis Enterprise cluster.
linkTitle: Create certificates
title: Create certificates
weight: 10
url: '/operate/rs/7.8/security/certificates/create-certificates/'
---

When you first install Redis Enterprise Software, self-signed certificates are created to enable encryption for Redis Enterprise endpoints.  These certificates expire after a year (365 days) and must be renewed.

You can renew these certificates by replacing them with new self-signed certificates or by replacing them with certificates signed by a [certificate authority](https://en.wikipedia.org/wiki/Certificate_authority) (CA).

## Renew self-signed certificates

As of [v6.2.18-70]({{< relref "/operate/rs/release-notes/rs-6-2-18-releases/rs-6-2-18-70" >}}), Redis Enterprise Software includes a script to generate self-signed certificates.  

By default, the `generate_self_signed_certs.sh` script is located in `/opt/redislabs/utils/`.  

Here, you learn how to use this script to generate new certificates and how to install them.

### Step 1: Generate new certificates 

Sign in to the machine hosting the cluster's master node and then run the following command:

``` bash
% sudo -u redislabs /opt/redislabs/utils/generate_self_signed_certs.sh \
   -f "<DomainName1 DomainName2>" -d <Days> -t <Type>
```

where:

- _\<DomainName1>_ is the fully qualified domain name (FQDN) of the cluster.  (This is the name given to the cluster when first created.)
- _\<DomainName2>_ is an optional FQDN for the cluster.  Multiple domain names are allowed, separated by whitespace.  Quotation marks (`""`) should enclose the full set of names.
- _\<Days>_ is an integer specifying the number of days the certificate should be valid.  We recommend against setting this longer than a year (365 days).

    _\<Days>_ is optional and defaults to `365`.

- _\<Type>_ is a string identifying the name of the certificate to generate.  
    
    The following values are supported:

    | Value | Description |
    |-------|-------------|
    | `api` | The REST API |
    | `cm` | The Cluster Manager UI |
    | `metrics` | The metrics exporter |
    | `proxy` | The database endpoint |
    | `syncer` | The synchronization process |
    | `all` | Generates all certificates in a single operation |

    _Type_ is optional and defaults to `all`.

When you run the script, it either reports success (`"Self signed cert generated successfully"`) or an error message.  Use the error message to troubleshoot any issues.

The following example generates all self signed certificates for `mycluster.example.com`; these certificates expire one year after the command is run:

``` bash
$ sudo -u redislabs /opt/redislabs/utils/generate_self_signed_certs.sh \
    -f "mycluster.example.com"`
```

Suppose you want to create a Cluster Manager UI certificate to support two clusters for a period of two years.  The following example shows how:

``` bash
$ sudo -u redislabs /opt/redislabs/utils/generate_self_signed_certs.sh \
    -f "mycluster.example.com anothercluster.example.com" -d 730 -t cm
```

Here, a certificate file and certificate key are generated to support the following domains:

``` text
mycluster.example.com
*.mycluster.example.com
anothercluster.example.com 
*.anothercluster.example.com
```

### Step 2: Locate the new certificate files

When successful, the script generates two .PEM files for each generated certificate: a certificate file and a certificate key, each named after the type of certificate generated (see earlier table for individual certificate names.)

These files can be found in the `/tmp` directory.

``` bash
$ ls -la /tmp/*.pem
```

### Step 3: Set permissions

We recommend setting the permissions of your new certificate files to limit read and write access to the file owner and to set group and other user permissions to read access.

``` bash
$ sudo chmod 644 /tmp/*.pem
```

### Step 4: Replace existing certificates {#replace-self-signed}

You can use `rladmin` to replace the existing certificates with new certificates:

``` console
$ rladmin cluster certificate set <CertName> certificate_file \
   <CertFilename>.pem key_file <KeyFilename>.pem
```

The following values are supported for the _\<CertName>_ parameter:

| Value | Description |
|-------|-------------|
| `api` | The REST API |
| `cm` | The Cluster Manager UI |
| `metrics_exporter` | The metrics exporter |
| `proxy` | The database endpoint |
| `syncer` | The synchronization process |

You can also use the REST API.  To learn more, see [Update certificates]({{< relref "/operate/rs/security/certificates/updating-certificates#how-to-update-certificates" >}}).

## Create CA-signed certificates

You can use certificates signed by a [certificate authority](https://en.wikipedia.org/wiki/Certificate_authority) (CA).  

For best results, use the following guidelines to create the certificates.

### TLS certificate guidelines

When you create certificates signed by a certificate authority, you need to create server certificates and client certificates.  The following provide guidelines that apply to both certificates and guidance for each certificate type. 

#### Guidelines for server and client certificates

1.  Include the full [certificate chain](https://en.wikipedia.org/wiki/X.509#Certificate_chains_and_cross-certification) when creating certificate .PEM files for either server or client certificates.   

1.  List (_chain_) certificates in the .PEM file in the following order:

    ``` text    
    -----BEGIN CERTIFICATE-----    
    Domain (leaf) certificate
    -----END CERTIFICATE-----
    -----BEGIN CERTIFICATE-----
    Intermediate CA certificate
    -----END CERTIFICATE----
    -----BEGIN CERTIFICATE-----
    Trusted Root CA certificate
    -----END CERTIFICATE-----
    ```

#### Server certificate guidelines

Server certificates support clusters.  

In addition to the general guidelines described earlier, the following guidelines apply to server certificates:

1.  Use the cluster's fully qualified domain name (FQDN) as the certificate Common Name (CN).

1.  Set the following values according to the values specified by your security team or certificate authority:

    - Country Name (C)
    - State or Province Name (ST)
    - Locality Name (L)
    - Organization Name (O)
    - Organization Unit  (OU)

1.  The [Subject Alternative Name](https://en.wikipedia.org/wiki/Subject_Alternative_Name) (SAN) should include the following values based on the FQDN:

    ``` text
    dns=<cluster-fqdn>
    dns=*.<cluster-fqdn>
    dns=internal.<cluster-fqdn>
    dns=*.internal.<cluster-fqdn>
    ```

1.  The Extended Key Usage attribute should be set to `TLS Web Client Authentication` and `TLS Web Server Authentication`.

1.  We strongly recommend using a strong hash algorithm, such as <nobr>SHA-256</nobr> or <nobr>SHA-512</nobr>.

    Individual operating systems might limit access to specific algorithms.  For example, Ubuntu 20.04 [limits  access](https://manpages.ubuntu.com/manpages/focal/man7/crypto-policies.7.html) to <nobr>SHA-1</nobr>.  In such cases, Redis Enterprise Software is limited to the features supported by the underlying operating system.


#### Client certificate guidelines

Client certificates support database connections.  

In addition to the general guidelines described earlier, the following guidelines apply to client certificates:

1.  The Extended Key Usage attribute should be set to `TLS Web Client Authentication`.

1.  We strongly recommend using a strong hash algorithm, such as <nobr>SHA-256</nobr> or <nobr>SHA-512</nobr>.

    Individual operating systems might limit access to specific algorithms.  For example, Ubuntu 20.04 [limits  access](https://manpages.ubuntu.com/manpages/focal/man7/crypto-policies.7.html) to <nobr>SHA-1</nobr>.  In such cases, Redis Enterprise Software is limited to the features supported by the underlying operating system.

### Create certificates

The actual process of creating CA-signed certificates varies according to the CA.  In addition, your security team may have custom instructions that you need to follow. 

Here, we demonstrate the general process using OpenSSL.  If your CA provides alternate tools, you should use those according to their instructions. 

However you choose to create the certificates, be sure to incorporate the guidelines described earlier.

1.  Create a private key.

    ``` bash
    $ openssl genrsa -out <key-file-name>.pem 2048
    ```

1.  Create a certificate signing request.

    ``` bash
    $ openssl req -new -key <key-file-name>.pem -out \
       <key-file-name>.csr -config <csr-config-file>.cnf
    ```
    _Important:&nbsp;_ The .CNF file is a configuration file.  Check with your security team or certificate authority for help creating a valid configuration file for your environment.

3.  Sign the private key using your certificate authority.

    ```sh
    $ openssl x509 -req -in <key-file-name>.csr -signkey <key-file-name>.pem -out <cert-name>.pem
    ```

    The signing process varies for each organization and CA vendor.  Consult your security team and certificate authority for specific instructions describing how to sign a certificate.

4.  Upload the certificate to your cluster.

    You can use [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/certificate" >}}) to replace the existing certificates with new certificates:

    ``` console
    $ rladmin cluster certificate set <cert-name> certificate_file \
       <cert-name>.pem key_file <key-file-name>.pem
    ```

    For a list of values supported by the `<cert-name>` parameter, see the [earlier table](#replace-self-signed).

    You can also use the REST API.  To learn more, see [Update certificates]({{< relref "/operate/rs/security/certificates/updating-certificates#how-to-update-certificates" >}}).

