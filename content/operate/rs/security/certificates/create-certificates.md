---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create self-signed certificates to install on a Redis Software cluster.
linkTitle: Create certificates
title: Create certificates
weight: 10
---

When you first install Redis Software, self-signed certificates are created to enable encryption for Redis Software endpoints.  These certificates expire after a year (365 days) and must be renewed.

You can renew these certificates by replacing them with new self-signed certificates or by replacing them with certificates signed by a [certificate authority](https://en.wikipedia.org/wiki/Certificate_authority) (CA).

## Renew self-signed certificates

As of [v6.2.18-70]({{< relref "/operate/rs/release-notes/rs-6-2-18-releases/rs-6-2-18-70" >}}), Redis Software includes a script to generate self-signed certificates.  

By default, the `generate_self_signed_certs.sh` script is located in `/opt/redislabs/utils/`.  

Here, you learn how to use this script to generate new certificates and how to install them.

### Generate self-signed certs script options

You can run the `generate_self_signed_certs.sh` script with the following options:

| Option | Description |
|----------|-------------|
| `-h`<br />`--help` | Displays usage instructions. (Optional) |
| `-d <days>`<br />`--days <days>` | Number of days the self-signed certificate is valid for. Setting this field longer than a year (365 days) is not recommended. (Optional, default: 365) |
| `-f <names>`<br /><nobr>`--fqdnNames <names>`</nobr> | Space-separated list of [fully qualified domain names (FQDNs)](https://en.wikipedia.org/wiki/Fully_qualified_domain_name). Used for [storage area networks (SANs)](https://en.wikipedia.org/wiki/Storage_area_network). (Required)<br />Example: `-f "redis.example.com redis-1.example.com"` |
| `-t <type>`<br />`--type <type>` | Type of certificate to generate. (Optional, default: all) <br />Values:<br />**cm**: Cluster Manager UI certificate<br />**api**: REST API certificate<br /> **proxy**: database endpoint proxy certificate<br />**syncer**: syncer component certificate<br />**metrics**: metrics exporter certificate<br />**all**: generates all certificate types |

### Step 1: Generate new certificates 

Sign in to the machine hosting the cluster's master node and then run the following command:

``` bash
% sudo -u redislabs /opt/redislabs/utils/generate_self_signed_certs.sh \
   -f "<DomainName1 DomainName2>" -d <Days> -t <Type>
```

When you run the script, it either reports success (`"Self signed cert generated successfully"`) or an error message. Use the error message to troubleshoot any issues.

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

You can use certificates signed by a [certificate authority](https://en.wikipedia.org/wiki/Certificate_authority) (CA) for Redis Software cluster security.

For best results, use the following guidelines to create the certificates.

### Certificate requirements

- Certificates must include both of the following in the extended key usage extension:

    - TLS Web Server Authentication (OID: 1.3.6.1.5.5.7.3.1)

    - TLS Web Client Authentication (OID: 1.3.6.1.5.5.7.3.2)

    {{<warning>}}
Using certificate templates that only include Server Authentication will cause SSL and TLS errors.
    {{</warning>}}

- Include the full certificate chain when creating certificate .PEM files. List certificates in order from leaf to root. Some deployments may not require the root CA in the certificate file.

    ```sh
    -----BEGIN CERTIFICATE-----
    <Leaf/Domain Certificate>
    -----END CERTIFICATE-----
    -----BEGIN CERTIFICATE-----
    <Intermediate CA Certificate>
    -----END CERTIFICATE-----
    -----BEGIN CERTIFICATE-----
    <Root CA Certificate>
    -----END CERTIFICATE-----
    ```

- The Subject Alternative Name (SAN) extension must include the following DNS entries based on your cluster's fully qualified domain name (FQDN):

    ```ini
    dns=<cluster-fqdn>
    dns=*.<cluster-fqdn>
    dns=internal.<cluster-fqdn>
    dns=*.internal.<cluster-fqdn>
    ```

    For example, if the cluster FQDN is `redis.example.com`, the DNS entries include:

    ```ini
    dns=redis.example.com
    dns=*.redis.example.com
    dns=internal.redis.example.com
    dns=*.internal.redis.example.com
    ```

- The key usage extension must include:

    - Digital Signature
    
    - Key Encipherment

- Use the cluster's fully qualified domain name (FQDN) for the Common Name (CN).

- Use SHA-256 or SHA-512 for the signature algorithm.

    {{<note>}}
SHA-1 is deprecated and may be blocked by some operating systems.
    {{</note>}}

- The minimum key size is 2048 bits RSA. 4096 bits is recommended for enhanced security.

- A validity period of 1 year or less is recommended.

### Create certificates with OpenSSL

1. Create a configuration file named `redis-cert.cnf` with the following content:

    ```ini
    [req]
    default_bits = 2048
    prompt = no
    default_md = sha256
    distinguished_name = dn
    req_extensions = v3_req

    [dn]
    C = US
    ST = California
    L = Los Angeles
    O = Your Organization
    CN = redis-cluster.example.com

    [v3_req]
    keyUsage = critical, digitalSignature, keyEncipherment
    extendedKeyUsage = serverAuth, clientAuth
    subjectAltName = @alt_names

    [alt_names]
    DNS.1 = redis-cluster.example.com
    DNS.2 = *.redis-cluster.example.com
    DNS.3 = internal.redis-cluster.example.com
    DNS.4 = *.internal.redis-cluster.example.com
    ```

    **Important configuration notes:**

    - `extendedKeyUsage = serverAuth, clientAuth` includes both required authentication types
    - `keyUsage = critical, digitalSignature, keyEncipherment` sets required key usage flags
    - Replace `redis-cluster.example.com` with your cluster's FQDN
    - Adjust organization details in the `[dn]` section

1. Generate private key:

    ```sh
    openssl genrsa -out redis-key.pem 2048
    ```

    For enhanced security, use a 4096-bit key:

    ```sh
    openssl genrsa -out redis-key.pem 4096
    ```

3. Create a certificate signing request:

    ```sh
    openssl req -new \
        -key redis-key.pem \
        -out redis-cert.csr \
        -config redis-cert.cnf
    ```

#### Verify the CSR

Before submitting to your CA, verify the CSR contains all required attributes:

```bash
openssl req -text -noout -verify -in redis-cert.csr
```

Check the output for:

- Subject contains the correct Common Name
- Subject Alternative Names include all required DNS entries
- Key Usage includes Digital Signature, Key Encipherment
- Extended Key Usage includes TLS Web Server Authentication, TLS Web Client Authentication

#### Submit CSR to the certificate authority

Submit `redis-cert.csr` to your certificate authority for signing. The process varies by CA:

- **Internal CA:** Follow your organization's certificate request process
- **Commercial CA:** Use their web portal or API
- **Self-signed (testing only):** See below

#### Create self-signed certificate (testing only)

For testing purposes only, you can create a self-signed certificate:

```bash
openssl x509 -req \
  -in redis-cert.csr \
  -signkey redis-key.pem \
  -out redis-cert.pem \
  -days 365 \
  -extensions v3_req \
  -extfile redis-cert.cnf
```

**Warning:** Self-signed certificates should only be used in development or testing environments, not in production.

#### Create a certificate chain file

After receiving the signed certificate from your CA, create a certificate chain file by combining the certificates in the correct order:

```bash
cat redis-cert.pem intermediate-ca.pem root-ca.pem > redis-cert-chain.pem
```

Order is critical:

1. Leaf certificate (your domain certificate)
2. Intermediate CA certificate(s)
3. Root CA certificate (optional, depending on your deployment)

### Create certificates with Windows Active Directory Certificate Services

#### Prerequisites

- Access to Windows Active Directory Certificate Services
- Permissions to modify certificate templates
- Certificate Templates Console (certtmpl.msc)

#### Modify certificate template

The default "Web Server" template in Windows AD CS only includes Server Authentication. You must create a modified template that includes both Server and Client Authentication.

1. Open Certificate Templates Console as Administrator:

   ```cmd
   certtmpl.msc
   ```

2. Locate the "Web Server" template, right-click, and select **Duplicate Template**.

3. In the **General** tab:
   - Set **Template name** to `Redis Software Server`
   - Set the **Validity period** to 1 year

4. In the **Extensions** tab:
   - Select "Application Policies"
   - Click **Edit**
   - Verify both of the following are present:
     - Server Authentication (1.3.6.1.5.5.7.3.1)
     - Client Authentication (1.3.6.1.5.5.7.3.2)
   - If Client Authentication is missing, click **Add**, select **Client Authentication**, and click **OK**

5. In the **Subject Name** tab:
   - Select "Supply in the request" to allow specifying Subject Alternative Names during certificate request

6. In the **Extensions** tab:
   - Select "Key Usage"
   - Click **Edit**
   - Ensure **Digital signature** and **Key encipherment** are checked

7. In the **Security** tab:
   - Add appropriate users/groups
   - Grant **Read** and **Enroll** permissions

8. Click **OK** to save the template.

#### Publish the template

1. Open Certification Authority console:

   ```cmd
   certsrv.msc
   ```

2. Expand your CA, right-click **Certificate Templates**, select **New** → **Certificate Template to Issue**.

3. Select "Redis Software Server" and click **OK**.

#### Request a certificate using certreq

1. Create a certificate request file `redis-cert.inf`:

   ```ini
   [NewRequest]
   Subject = "CN=redis-cluster.example.com,O=Your Organization,L=City,ST=State,C=US"
   KeyLength = 2048
   KeySpec = 1
   Exportable = TRUE
   MachineKeySet = TRUE
   ProviderName = "Microsoft RSA SChannel Cryptographic Provider"
   RequestType = PKCS10

   [Extensions]
   2.5.29.17 = "{text}"
   _continue_ = "dns=redis-cluster.example.com&"
   _continue_ = "dns=*.redis-cluster.example.com&"
   _continue_ = "dns=internal.redis-cluster.example.com&"
   _continue_ = "dns=*.internal.redis-cluster.example.com"
   ```

   Replace `redis-cluster.example.com` with your cluster's FQDN.

2. Generate the certificate request:

   ```cmd
   certreq -new redis-cert.inf redis-cert.req
   ```

3. Submit the request to your CA:

   ```cmd
   certreq -submit -config "CA-SERVER\CA-Name" redis-cert.req redis-cert.cer
   ```

4. Accept the issued certificate:

   ```cmd
   certreq -accept redis-cert.cer
   ```

#### Export certificate and private key

1. Open Certificate Manager:

   ```cmd
   certlm.msc
   ```

2. Navigate to **Personal** → **Certificates**.

3. Find your certificate, right-click, select **All Tasks** → **Export**.

4. Export with private key:
   - Select **Yes, export the private key**
   - Choose **Personal Information Exchange - PKCS #12 (.PFX)**
   - Set a password
   - Save as `redis-cert.pfx`

5. Convert to PEM format (requires OpenSSL):

   ```bash
   # Extract certificate chain
   openssl pkcs12 -in redis-cert.pfx -nokeys -out redis-cert.pem

   # Extract private key
   openssl pkcs12 -in redis-cert.pfx -nocerts -out redis-key.pem -nodes
   ```

### Validate certificates

Before you upload certificates to Redis Software, validate that they meet all requirements:

1. Validate extended key usage:

    ```sh
    openssl x509 -in redis-cert-chain.pem -text -noout | grep -A 3 "Extended Key Usage"
    ```

    Expected output:

    ```sh
    X509v3 Extended Key Usage:
        TLS Web Server Authentication, TLS Web Client Authentication
    ```

    If Client Authentication is missing, the certificate will fail. You must reissue the certificate with both Server and Client Authentication.

1. Validate key usage:

    ```bash
    openssl x509 -in redis-cert-chain.pem -text -noout | grep -A 2 "Key Usage"
    ```

    Expected output:

    ```text
    X509v3 Key Usage: critical
        Digital Signature, Key Encipherment
    ```

1. Validate Subject Alternative Names:

    ```sh
    openssl x509 -in redis-cert-chain.pem -text -noout | grep -A 10 "Subject Alternative Name"
    ```

    Expected output:

    ```sh
    X509v3 Subject Alternative Name:
        DNS:redis-cluster.example.com
        DNS:*.redis-cluster.example.com
        DNS:internal.redis-cluster.example.com
        DNS:*.internal.redis-cluster.example.com
    ```

1. Validate certificate chain:

    1. Count the certificates in the chain:

        ```sh
        grep -c "BEGIN CERTIFICATE" redis-cert-chain.pem
        ```

        Expected output: 2 or 3 if the root CA is included.

    1. View all certificates in the chain:

        ```bash
        openssl crl2pkcs7 -nocrl -certfile redis-cert-chain.pem | \
            openssl pkcs7 -print_certs -text -noout | \
            grep -E "Subject:|Issuer:"
        ```

    1. Verify the chain order. Each certificate's `Issuer` should match the `Subject` of the next certificate.

1. Validate the signature algorithm:

    ```bash
    openssl x509 -in redis-cert-chain.pem -text -noout | grep "Signature Algorithm"
    ```

    Expected output: `sha256WithRSAEncryption` or `sha512WithRSAEncryption`.
    
    {{<note>}}
Avoid `sha1WithRSAEncryption` because it is deprecated and might be blocked.
    {{</note>}}

1. Validate the public key size:

    ```bash
    openssl x509 -in redis-cert-chain.pem -text -noout | grep "Public-Key"
    ```

    Expected output: `Public-Key: (2048 bit)` or higher.

1. Verify the private key matches the certificate:

    1. Get the certificate modulus:

        ```sh
        openssl x509 -noout -modulus -in redis-cert-chain.pem | openssl md5
        ```

    1. Get the key modulus:

        ```sh
        openssl rsa -noout -modulus -in redis-key.pem | openssl md5
        ```

    1. If the MD5 hashes do not match, you have the wrong private key file.

1. Verify the certificate is currently valid and not expired:

    ```bash
    openssl x509 -in redis-cert-chain.pem -noout -dates
    ```

### Install certificates

After creating and validating your certificates, install them on the Redis Software cluster:

1. Set restrictive file permissions for the private key:

    ```bash
    $ chmod 600 redis-key.pem
    $ chown redislabs:redislabs redis-key.pem
    ```

1. Set readable file permissions for the certificate:

    ```bash
    $ chmod 644 redis-cert-chain.pem
    $ chown redislabs:redislabs redis-cert-chain.pem
    ```

1. Replace the existing certificates with the new certificates using [`rladmin cluster certificate`]({{<relref "/operate/rs/references/cli-utilities/rladmin/cluster/certificate">}}):

    ```bash
    rladmin cluster certificate set <cert-name> \
        certificate_file /path/to/redis-cert-chain.pem \
        key_file /path/to/redis-key.pem
    ```

    Replace `<cert-name>` with the relevant certificate name:

    | Value | Description |
    |-------|-------------|
    | `api` | REST API certificate |
    | `cm` | Cluster Manager UI certificate |
    | `metrics_exporter` | Metrics exporter certificate |
    | `proxy` | Database endpoint proxy certificate |
    | `syncer` | Synchronization process certificate |

1. Check certificate status:

    ```sh
    rladmin status certificates
    ```

1. View certificate details:

    ```sh
    rladmin info cluster
    ```

### Troubleshooting

#### SSLV3_ALERT_UNSUPPORTED_CERTIFICATE error

If the certificate's extended key usage does not include TLS Web Client Authentication, the following error occurs:

```sh
[SSL: SSLV3_ALERT_UNSUPPORTED_CERTIFICATE] ssl/tls alert unsupported certificate
```

To fix this error:

1. Validate extended key usage:

    ```bash
    openssl x509 -in redis-cert-chain.pem -text -noout | grep -A 3 "Extended Key Usage"
    ```

2. If Client Authentication is missing, reissue the certificate:

    - For OpenSSL, add the following line to the configuration file.

        ```ini
        extendedKeyUsage = serverAuth, clientAuth
        ```

    - For Windows AD CS, modify the certificate template and add Client Authentication to **Application Policies**.

#### CERTIFICATE_VERIFY_FAILED error

If a `CERTIFICATE_VERIFY_FAILED` error occurs, the certificate chain is incomplete or in the wrong order.

To fix this error:

1. Verify the certificate chain order. Each certificate's `Issuer` should match the `Subject` of the next certificate.

    ```sh
    openssl crl2pkcs7 -nocrl -certfile redis-cert-chain.pem | \
        openssl pkcs7 -print_certs -text -noout | \
        grep -E "Subject:|Issuer:"
    ```

2. Rebuild the certificate chain in the correct order:

    ```sh
    -----BEGIN CERTIFICATE-----
    <Leaf/Domain Certificate>
    -----END CERTIFICATE-----
    -----BEGIN CERTIFICATE-----
    <Intermediate CA Certificate>
    -----END CERTIFICATE-----
    -----BEGIN CERTIFICATE-----
    <Root CA Certificate>
    -----END CERTIFICATE-----
    ```

#### Key_values_mismatch error

If a `key_values_mismatch` error occurs, the private key does not match the certificate.

Verify the private key matches the certificate:

1. Get the certificate modulus:

    ```sh
    openssl x509 -noout -modulus -in redis-cert-chain.pem | openssl md5
    ```

1. Get the key modulus:

    ```sh
    openssl rsa -noout -modulus -in redis-key.pem | openssl md5
    ```

1. If the MD5 hashes don't match, you have the wrong private key file. To fix this error, find the correct private key file.

#### Missing Subject Alternative Names

If a certificate only has a Common Name, but no Subject Alternative Names, modern TLS implementations might reject it.

To fix this issue, reissue the certificate with proper Subject Alternative Names, including all required DNS entries.

