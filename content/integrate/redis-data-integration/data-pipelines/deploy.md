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

Use
[`kubectl create secret generic`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret_generic/)
to set secrets for a K8s/Helm deployment. The general pattern of the commands is

```bash
kubectl create secret generic <DB> \
--namespace=rdi \
--from-literal=<SECRET-NAME>=<SECRET-VALUE>
```

Where `<DB>` is either `source-db` for source secrets or `target-db` for target secrets.
The specific command lines for source secrets are as follows:

```bash
# Source username
kubectl create secret generic source-db --namespace=rdi \
--from-literal=SOURCE_DB_USERNAME=yourUsername \
--from-literal=SOURCE_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# Source TLS
kubectl create secret generic source-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# Source mTLS
kubectl create secret generic source-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--from-file=client.crt=/path/to/myclient.crt \
--from-file=client.key=/path/to/myclient.key \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

The corresponding command lines for target secrets are:

```bash
# Target credentials
kubectl create secret generic target-db --namespace=rdi \
--from-literal=TARGET_DB_USERNAME=yourUsername \
--from-literal=TARGET_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# Target TLS
kubectl create secret generic target-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# Target mTLS
kubectl create secret generic target-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--from-file=client.crt=/path/to/myclient.crt \
--from-file=client.key=/path/to/myclient.key \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

## Deploy a pipeline

When you have created your configuration, including the [jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#job-files" >}}), use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy them:

```bash
redis-di deploy --dir <path to pipeline folder>
```

You can also deploy a pipeline using [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}).
