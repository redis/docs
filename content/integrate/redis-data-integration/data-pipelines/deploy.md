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
source and target databases. Each secret has a name that you can pass to the
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
command (VM deployment) or the `rdi-secret.sh` script (K8s deployment) to set the secret value. 
You can then refer to these secrets in the `config.yaml` file using the syntax "`${SECRET_NAME}`"
(the sample [config.yaml file]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#the-configyaml-file" >}}) shows these secrets in use).

The table below lists all valid secret names. Note that the
username and password are required for the source and target, but the other
secrets are only relevant for TLS/mTLS connections.

| Secret name | Description |
| :-- | :-- |
| `SOURCE_DB_USERNAME` | Username for the source database |
| `SOURCE_DB_PASSWORD` | Password for the source database |
| `SOURCE_DB_CACERT` | (For TLS only) Source database CA certificate |
| `SOURCE_DB_CERT` | (For mTLS only) Source database client certificate |
| `SOURCE_DB_KEY` | (For mTLS only) Source database private key |
| `SOURCE_DB_KEY_PASSWORD` | (For mTLS only) Source database private key password |
| `TARGET_DB_USERNAME` | Username for the target database |
| `TARGET_DB_PASSWORD` | Password for the target database |
| `TARGET_DB_CACERT` | (For TLS only) Target database CA certificate |
| `TARGET_DB_CERT` | (For mTLS only) Target database client certificate |
| `TARGET_DB_KEY` | (For mTLS only) Target database private key |
| `TARGET_DB_KEY_PASSWORD` | (For mTLS only) Target database private key password |

{{< note >}}When creating secrets for TLS or mTLS, ensure that all certificates and keys are in `PEM` format. The only exception to this is that for PostgreSQL, the private key `SOURCE_DB_KEY` secret must be in `DER` format. If you have a key in `PEM` format, you must convert it to `DER` before creating the `SOURCE_DB_KEY` secret using the command:

```bash
openssl pkcs8 -topk8 -inform PEM -outform DER -in /path/to/myclient.pem -out /path/to/myclient.pk8 -nocrypt
```

This command assumes that the private key is not encrypted. See the [`openssl` documentation](https://docs.openssl.org/master/) to learn how to convert an encrypted private key.
{{< /note >}}
  
### Set secrets for VM deployment

Use [`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
to set secrets for a VM deployment. 

The specific command lines for source secrets are as follows:

```bash
# For username and password
redis-di set-secret SOURCE_DB_USERNAME yourUsername
redis-di set-secret SOURCE_DB_PASSWORD yourPassword

# With source TLS, in addition to the above
redis-di set-secret SOURCE_DB_CACERT /path/to/myca.crt

# With source mTLS, in addition to the above
redis-di set-secret SOURCE_DB_CERT /path/to/myclient.crt
redis-di set-secret SOURCE_DB_KEY /path/to/myclient.key
# Use this only if SOURCE_DB_KEY is password-protected
redis-di set-secret SOURCE_DB_KEY_PASSWORD yourKeyPassword 
```

The corresponding command lines for target secrets are:

```bash
# For username and password
redis-di set-secret TARGET_DB_USERNAME yourUsername
redis-di set-secret TARGET_DB_PASSWORD yourPassword

# With target TLS, in addition to the above
redis-di set-secret TARGET_DB_CACERT /path/to/myca.crt

# With target mTLS, in addition to the above
redis-di set-secret TARGET_DB_CERT /path/to/myclient.crt
redis-di set-secret TARGET_DB_KEY /path/to/myclient.key
# Use this only if TARGET_DB_KEY is password-protected
redis-di set-secret TARGET_DB_KEY_PASSWORD yourKeyPassword
```

### Set secrets for K8s/Helm deployment using the rdi-secret.sh script

Use the `rdi-secret.sh` script to set secrets for a K8s/Helm deployment. To use this script, unzip the archive that contains the RDI Helm chart and navigate to the resulting folder. The `rdi-secret.sh` script is located in the `scripts` subfolder. The general pattern for using this script is:

```bash
scripts/rdi-secret.sh set <SECRET-NAME> <SECRET-VALUE>
```

The script also lets you retrieve a specific secret or list all the secrets that have been set:

```bash
# Get specific secret
scripts/rdi-secret.sh get <SECRET-NAME>

# List all secrets
scripts/rdi-secret.sh list
```

The specific command lines for source secrets are as follows:

```bash
# For username and password
scripts/rdi-secret.sh set SOURCE_DB_USERNAME yourUsername
scripts/rdi-secret.sh set SOURCE_DB_PASSWORD yourPassword

# With source TLS, in addition to the above
scripts/rdi-secret.sh set SOURCE_DB_CACERT /path/to/myca.crt

# With source mTLS, in addition to the above
scripts/rdi-secret.sh set SOURCE_DB_CERT /path/to/myclient.crt
scripts/rdi-secret.sh set SOURCE_DB_KEY /path/to/myclient.key
# Use this only if SOURCE_DB_KEY is password-protected
scripts/rdi-secret.sh set SOURCE_DB_KEY_PASSWORD yourKeyPassword 
```

The corresponding command lines for target secrets are:

```bash
# For username and password
scripts/rdi-secret.sh set TARGET_DB_USERNAME yourUsername
scripts/rdi-secret.sh set TARGET_DB_PASSWORD yourPassword

# With target TLS, in addition to the above
scripts/rdi-secret.sh set TARGET_DB_CACERT /path/to/myca.crt

# With target mTLS, in addition to the above
scripts/rdi-secret.sh set TARGET_DB_CERT /path/to/myclient.crt
scripts/rdi-secret.sh set TARGET_DB_KEY /path/to/myclient.key
# Use this only if TARGET_DB_KEY is password-protected
scripts/rdi-secret.sh set TARGET_DB_KEY_PASSWORD yourKeyPassword
```

### Set secrets for K8s/Helm deployment using Kubectl command

In some scenarios, you may prefer to use [`kubectl create secret generic`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret_generic/)
to set secrets for a K8s/Helm deployment. The general pattern of the commands is:

```bash
kubectl create secret generic <DB> \
--namespace=rdi \
--from-literal=<SECRET-NAME>=<SECRET-VALUE>
```

Where `<DB>` is either `source-db` for source secrets or `target-db` for target secrets.

If you use TLS or mTLS for either the source or target databases, you also need to create the `source-db-ssl` and/or `target-db-ssl` K8s secrets that contain the certificates used to establish secure connections. The general pattern of the commands is:

```bash
kubectl create secret generic <DB>-ssl \
--namespace=rdi \
--from-file=<FILE-NAME>=<FILE-PATH>
```

The specific command lines for source secrets are as follows:

```bash
# Without source TLS
# Create or update source-db secret
kubectl create secret generic source-db --namespace=rdi \
--from-literal=SOURCE_DB_USERNAME=yourUsername \
--from-literal=SOURCE_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With source TLS
# Create of update source-db secret
kubectl create secret generic source-db --namespace=rdi \
--from-literal=SOURCE_DB_USERNAME=yourUsername \
--from-literal=SOURCE_DB_PASSWORD=yourPassword \
--from-literal=SOURCE_DB_CACERT=/etc/certificates/source_db/ca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update source-db-ssl secret
kubectl create secret generic source-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With source mTLS
# Create or update source-db secret
kubectl create secret generic source-db --namespace=rdi \
--from-literal=SOURCE_DB_USERNAME=yourUsername \
--from-literal=SOURCE_DB_PASSWORD=yourPassword \
--from-literal=SOURCE_DB_CACERT=/etc/certificates/source_db/ca.crt \
--from-literal=SOURCE_DB_CERT=/etc/certificates/source_db/client.crt \
--from-literal=SOURCE_DB_KEY=/etc/certificates/source_db/client.key \
--from-literal=SOURCE_DB_KEY_PASSWORD=yourKeyPassword \ # add this only if SOURCE_DB_KEY is password-protected
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update source-db-ssl secret
kubectl create secret generic source-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--from-file=client.crt=/path/to/myclient.crt \
--from-file=client.key=/path/to/myclient.key \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

The corresponding command lines for target secrets are:

```bash
# Without target TLS
# Create or update target-db secret
kubectl create secret generic target-db --namespace=rdi \
--from-literal=TARGET_DB_USERNAME=yourUsername \
--from-literal=TARGET_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With target TLS
# Create of update target-db secret
kubectl create secret generic target-db --namespace=rdi \
--from-literal=TARGET_DB_USERNAME=yourUsername \
--from-literal=TARGET_DB_PASSWORD=yourPassword \
--from-literal=TARGET_DB_CACERT=/etc/certificates/target_db/ca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update target-db-ssl secret
kubectl create secret generic target-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With target mTLS
# Create or update target-db secret
kubectl create secret generic target-db --namespace=rdi \
--from-literal=TARGET_DB_USERNAME=yourUsername \
--from-literal=TARGET_DB_PASSWORD=yourPassword \
--from-literal=TARGET_DB_CACERT=/etc/certificates/target_db/ca.crt \
--from-literal=TARGET_DB_CERT=/etc/certificates/target_db/client.crt \
--from-literal=TARGET_DB_KEY=/etc/certificates/target_db/client.key \
--from-literal=TARGET_DB_KEY_PASSWORD=yourKeyPassword \ # add this only if TARGET_DB_KEY is password-protected
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update target-db-ssl secret
kubectl create secret generic target-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--from-file=client.crt=/path/to/myclient.crt \
--from-file=client.key=/path/to/myclient.key \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

Note that the certificate paths contained in the secrets `SOURCE_DB_CACERT`, `SOURCE_DB_CERT`, and `SOURCE_DB_KEY` (for the source database) and `TARGET_DB_CACERT`, `TARGET_DB_CERT`, and `TARGET_DB_KEY` (for the target database) are internal to RDI, so you *must* use the values shown in the example above. You should only change the certificate paths when you create the `source-db-ssl` and `target-db-ssl` secrets.

## Deploy a pipeline

When you have created your configuration, including the [jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#job-files" >}}), you are
ready to deploy. Use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to configure and deploy pipelines for both VM and K8s installations.

For VM installations, you can also use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy a pipeline:

```bash
redis-di deploy --dir <path to pipeline folder>
```