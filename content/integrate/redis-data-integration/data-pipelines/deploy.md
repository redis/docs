---
Title: Deploy a pipeline
aliases: /integrate/redis-data-integration/ingest/data-pipelines/data-type-handling/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to deploy an RDI pipeline
group: di
linkTitle: Deploy
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

The sections below explain how to deploy a pipeline after you have created the required
[configuration]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}).

## Set secrets

Before you deploy your pipeline, you must set the authentication secrets for the
source and target databases. Each secret has a corresponding property name that
you can pass to the
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
command (VM deployment) or
[`kubectl create secret generic`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret_generic/)
(K8s deployment) to set the property's value. You can then refer to these properties
in `config.yaml` using the syntax "`${PROPERTY_NAME}`"
(the sample [config.yaml file](#the-configyaml-file) shows these properties in use).

The table below shows the property name for each secret. Note that the
username and password are required for the source and target, but the other
secrets are only relevant to TLS/mTLS connections.

| Property name | Description |
| :-- | :-- |
| `SOURCE_DB_USERNAME` | Username for the source database |
| `SOURCE_DB_PASSWORD` | Password for the source database |
| `SOURCE_DB_CACERT` | (For TLS only) Source database trust certificate |
| `SOURCE_DB_KEY` | (For mTLS only) Source database private key |
| `SOURCE_DB_CERT` | (For mTLS only) Source database public key |
| `SOURCE_DB_KEY_PASSWORD` | (For mTLS only) Source database private key password |
| `TARGET_DB_USERNAME` | Username for the target database |
| `TARGET_DB_PASSWORD` | Password for the target database |
| `TARGET_DB_CACERT` | (For TLS only) Target database trust certificate |
| `TARGET_DB_KEY` | (For mTLS only) Target database private key |
| `TARGET_DB_CERT` | (For mTLS only) Target database public key |
| `TARGET_DB_KEY_PASSWORD` | (For mTLS only) Target database private key password |

### Set secrets for VM deployment

Use
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
to set secrets for a VM deployment. For example, you would use the
following command line to set the source database username to `myUserName`:

```bash
redis-di set-secret SOURCE_DB_USERNAME myUserName
```

### Set secrets for K8s/Helm deployment
 
Use the provided `scripts/rdi-secret.sh` shell script to set the specified secrets. The general pattern to use it is:
```bash
scripts/rdi-secret.sh set <SECRET-KEY> <SECRET-VALUE>
```

The script offers functionality to retrieve a specific secret, as well as the capability to list all available secrets within the system:
```bash
# Get specific secret
scripts/rdi-secret.sh set <SECRET-KEY>

# List all secrets
scripts/rdi-secret.sh list
```

When you create secrets for TLS or mTLS, ensure that all certificates and keys are in `PEM` format. The only exception to this is that for PostgreSQL, the private key `SOURCE_DB_KEY` secret (the `client.key` file) must be in `DER` format. If you have a key in `PEM` format, you must convert it to `DER` before creating the `SOURCE_DB_KEY` secret using the command:

```bash
openssl pkcs8 -topk8 -inform PEM -outform DER -in /path/to/myclient.key -out /path/to/myclient.pk8 -nocrypt
```

This command assumes that the private key is not encrypted.  See the [`openssl` documentation](https://docs.openssl.org/master/) to learn how to convert an encrypted private key.
  
The specific command lines for source secrets are as follows:

```bash
# Without source TLS
scripts/rdi-secret.sh set SOURCE_DB_USERNAME yourUsername
scripts/rdi-secret.sh set SOURCE_DB_PASSWORD yourPassword
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get SOURCE_DB_USERNAME
scripts/rdi-secret.sh get SOURCE_DB_PASSWORD

# With source TLS
scripts/rdi-secret.sh set SOURCE_DB_USERNAME yourUsername
scripts/rdi-secret.sh set SOURCE_DB_PASSWORD yourPassword
scripts/rdi-secret.sh set SOURCE_DB_CACERT /path/to/myca.crt
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get SOURCE_DB_USERNAME
scripts/rdi-secret.sh get SOURCE_DB_PASSWORD
scripts/rdi-secret.sh get SOURCE_DB_CACERT

# With source mTLS
scripts/rdi-secret.sh set SOURCE_DB_USERNAME yourUsername
scripts/rdi-secret.sh set SOURCE_DB_PASSWORD yourPassword
scripts/rdi-secret.sh set SOURCE_DB_CACERT /path/to/myca.crt
scripts/rdi-secret.sh set SOURCE_DB_CERT /path/to/myclient.crt
scripts/rdi-secret.sh set SOURCE_DB_KEY /path/to/myclient.key
scripts/rdi-secret.sh set SOURCE_DB_KEY_PASSWORD yourKeyPassword # add this only if SOURCE_DB_KEY is password-protected
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get SOURCE_DB_USERNAME
scripts/rdi-secret.sh get SOURCE_DB_PASSWORD
scripts/rdi-secret.sh get SOURCE_DB_CACERT
scripts/rdi-secret.sh get SOURCE_DB_CERT
scripts/rdi-secret.sh get SOURCE_DB_KEY
scripts/rdi-secret.sh get SOURCE_DB_KEY_PASSWORD
```

The corresponding command lines for target secrets are:

```bash
# Without source TLS
scripts/rdi-secret.sh set TARGET_DB_USERNAME yourUsername
scripts/rdi-secret.sh set TARGET_DB_PASSWORD yourPassword
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get TARGET_DB_USERNAME
scripts/rdi-secret.sh get TARGET_DB_PASSWORD

# With source TLS
scripts/rdi-secret.sh set TARGET_DB_USERNAME yourUsername
scripts/rdi-secret.sh set TARGET_DB_PASSWORD yourPassword
scripts/rdi-secret.sh set TARGET_DB_CACERT /path/to/myca.crt
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get TARGET_DB_USERNAME
scripts/rdi-secret.sh get TARGET_DB_PASSWORD
scripts/rdi-secret.sh get TARGET_DB_CACERT

# With source mTLS
scripts/rdi-secret.sh set TARGET_DB_USERNAME yourUsername
scripts/rdi-secret.sh set TARGET_DB_PASSWORD yourPassword
scripts/rdi-secret.sh set TARGET_DB_CACERT /path/to/myca.crt
scripts/rdi-secret.sh set TARGET_DB_CERT /path/to/myclient.crt
scripts/rdi-secret.sh set TARGET_DB_KEY /path/to/myclient.key
scripts/rdi-secret.sh set TARGET_DB_KEY_PASSWORD yourKeyPassword # add this only if TARGET_DB_KEY is password-protected
# Verify that the secrets are created/updated
scripts/rdi-secret.sh get TARGET_DB_USERNAME
scripts/rdi-secret.sh get TARGET_DB_PASSWORD
scripts/rdi-secret.sh get TARGET_DB_CACERT
scripts/rdi-secret.sh get TARGET_DB_CERT
scripts/rdi-secret.sh get TARGET_DB_KEY
scripts/rdi-secret.sh get TARGET_DB_KEY_PASSWORD
```

## Deploy a pipeline

When you have created your configuration, including the [jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#job-files" >}}), they are
ready to deploy. Use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to configure and deploy pipelines for both VM and K8s installations.

For VM installations, you can also use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy a pipeline:

```bash
redis-di deploy --dir <path to pipeline folder>
```


