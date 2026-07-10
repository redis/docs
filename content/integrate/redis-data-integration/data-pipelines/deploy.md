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
weight: 50
---

The sections below explain how to deploy a pipeline after you have created the required
[configuration]({{< relref "/integrate/redis-data-integration/data-pipelines" >}}).

## Set secrets

Before you deploy your pipeline, you must set the authentication secrets for the
source and target databases. Each secret has a name that you pass to the
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
command to set the secret value.
You can then refer to these secrets in the `config.yaml` file using the syntax "`${SECRET_NAME}`"
(the sample
[config.yaml file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#example" >}})
shows these secrets in use).

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

{{< note >}}
{{< embed-md "rdi-tls-secrets.md" >}}
{{< /note >}}
  
### Set secrets with the CLI

Use [`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
to set secrets for any installation type (VM, Kubernetes, or Redis Cloud).

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

By default, `set-secret` waits for the pipeline to apply the change before returning. When you set
several secrets at once, set all but the last one with `--wait=false` to avoid a timeout while the
pipeline is only partially updated. See [Wait for changes to complete](#wait) below for details.

### Manage secrets with the CLI

Along with `set-secret`, the CLI has commands to list, inspect, and delete secrets. Because the API
never returns secret values, these commands show only the secret keys and whether they are set, not
the stored values.

```bash
# List all the secrets of a pipeline and whether each one is set
redis-di list-secrets

# Show a single secret and whether it is set
redis-di describe-secret SOURCE_DB_PASSWORD

# Delete a secret (prompts for confirmation unless you add --force)
redis-di delete-secret SOURCE_DB_CACERT
```

See the reference pages for
[`list-secrets`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-secrets" >}}),
[`get-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-secret" >}}),
[`describe-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe-secret" >}}),
and [`delete-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete-secret" >}})
for the full list of options.

### Set secrets for K8s/Helm deployment using Kubectl command

{{< note >}}It is strongly recommended to manage secrets with the `redis-di` CLI rather than with
`kubectl` directly. The CLI applies the correct labels automatically, validates the secret keys, and
works the same way across all installation types.{{< /note >}}

For a Kubernetes/Helm deployment, you can also use [`kubectl create secret generic`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_create/kubectl_create_secret_generic/)
to set secrets instead of the CLI. The general pattern of the commands is:

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

Secrets that you create directly with `kubectl` must also be labeled so that the RDI operator
discovers them as pipeline secrets. Each secret needs the following labels, where the
`app.kubernetes.io/instance` label is the pipeline name (`default` for the default pipeline):

| Label | Value |
| :-- | :-- |
| `app.kubernetes.io/name` | `pipeline` |
| `app.kubernetes.io/instance` | `default` |
| `product` | `rdi` |

Apply the labels to each secret with [`kubectl label`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_label/):

```bash
kubectl label secret source-db --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi
kubectl label secret target-db --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi

# With source TLS or mTLS
kubectl label secret source-db-ssl --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi

# With target TLS or mTLS
kubectl label secret target-db-ssl --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi
```

## Deploy a pipeline

When you have created your configuration, including the [jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}), you are
ready to deploy. Use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy a pipeline:

```bash
redis-di deploy --dir <path to pipeline folder>
```

RDI first validates the configuration and then deploys it if it is correct. You can control the
validation and what happens after deployment with the following options:

- `--dry-run`: Validate the configuration without deploying it. Off by default.
- `--validate-tables`: Validate the configuration against the source and target databases, for
  example that the tables it references exist. On by default; pass `--validate-tables=false` to skip
  this check, which is useful when the databases are not reachable at deploy time.
- `--validate-cdc`: Additionally validate that the source database is correctly configured for
  [change data capture (CDC)]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}).
  Off by default; enable it with `--validate-cdc`.
- `--start`: Start the pipeline as soon as it is deployed. On by default; pass `--start=false` to
  deploy the pipeline without starting it, then start it later with
  [`redis-di start`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-start" >}}).

See the [`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
reference page for the full list of options.

You can also use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to configure and deploy pipelines for both VM and K8s installations.

## Display the pipeline status

Once a pipeline is deployed, use the
[`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
command (also available as `redis-di status`) to display its status. This combines the pipeline
configuration with its runtime status, showing its overall state, its sources and targets, its jobs
and components, and its per-stream statistics and performance metrics.

```bash
redis-di describe
```

To watch the status update live, pair the command with `watch`:

```bash
watch -n 1 redis-di describe
```

For a shorter overview, [`redis-di list`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list" >}})
prints a one-line summary of the pipeline, and
[`redis-di get`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get" >}})
does the same for a single pipeline. See the
[`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
reference page for details.

## Start and stop a pipeline

Use [`redis-di stop`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-stop" >}})
to pause a running pipeline and
[`redis-di start`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-start" >}})
to resume it. Stopping a pipeline halts data processing without deleting the pipeline or its
configuration, so you can start it again later from where it left off.

```bash
redis-di stop
redis-di start
```

## Reset a pipeline

Use [`redis-di reset`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-reset" >}})
to return a pipeline to initial full-sync mode. This reloads a fresh
[snapshot]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}) of the source
data and then resumes change data capture (CDC), which is useful when the source and target have
drifted out of sync.

```bash
redis-di reset
```

## Undeploy a pipeline

To remove a pipeline, use the
[`redis-di delete`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete" >}})
command. This stops the pipeline and deletes it, along with its configuration and status, from RDI.
The secrets you set for the pipeline are not affected.

```bash
redis-di delete <pipeline>
```

Because deleting a pipeline is destructive, the command asks for confirmation unless you add the
`--force` option. If you omit the pipeline name, the `default` pipeline is deleted.

## Wait for changes to complete {#wait}

The commands that change a pipeline's state, namely `deploy`, `delete`, `start`, `stop`, `reset`,
`set-secret`, and `delete-secret`, do not return as soon as the API accepts the request. By default,
they wait for the pipeline to finish transitioning to the expected state, polling its status until it
succeeds, reaches an error, or the `--timeout` (2 minutes by default) elapses. This is usually what
you want: the command reflects the real outcome, so a script can rely on the change having taken
effect and can fail fast if it did not.

In some cases, though, a pipeline needs *several* changes before it can transition to a healthy state,
and waiting after each individual change would time out. The clearest example is rotating both the
username and the password of a database: if you set only the username with the default `--wait=true`,
the pipeline tries to reconnect with the new username and the old password, fails, and the command
times out after two minutes with the pipeline in a broken state.

To avoid this, set all the related secrets, or at least all of them except the last, with
`--wait=false`, so the pipeline applies them together and only the final command waits for it to
become healthy:

```bash
redis-di set-secret SOURCE_DB_USERNAME newUsername --wait=false
redis-di set-secret SOURCE_DB_PASSWORD newPassword
```

The same applies to any set of changes that are only valid together.