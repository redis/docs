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

Before you deploy your pipeline, you must set the authentication secrets for the source
and target databases. Every secret belongs to one database: a source, identified by its
name in `config.yaml`, or the target. You name that database with the `--db` option of the
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
command.

The table below lists the available secret keys. The username and password are required, 
while the other keys are only relevant for TLS/mTLS connections.

| Secret key | Description |
| :-- | :-- |
| `USERNAME` | Username for the database |
| `PASSWORD` | Password for the database |
| `CACERT` | (For TLS only) CA certificate |
| `CERT` | (For mTLS only) Client certificate |
| `KEY` | (For mTLS only) Private key |
| `KEY_PASSWORD` | (For mTLS only) Private key password |

You can reference a secret in `config.yaml` using an environment variable that is derived from
the secret key and the database name. The variable name consists of the database name in 
uppercase (with each dash replaced by an underscore), followed by `_DB_`, followed by the key.
For example, if you set `PASSWORD` with `--db mysql` the corresponding environment variable
is `MYSQL_DB_PASSWORD`, which the source references as  
`${MYSQL_DB_PASSWORD}`. If you set `PASSWORD` with `--db target`, the environment variable is `TARGET_DB_PASSWORD`. The sample
[config.yaml file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config#example" >}})
shows these references in use, and
[Multiple sources in one pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/multiple-sources" >}})
covers the source naming rules.

{{< note >}}The older scope-prefixed keys like `SOURCE_DB_PASSWORD` or `TARGET_DB_PASSWORD` 
are still accepted, and are used without specifying `--db`. A `SOURCE_DB_*` key requires the 
pipeline to have exactly one source. These keys are deprecated and will be 
removed in a future release, so all usage should migrate to the new keys.{{< /note >}}

{{< note >}}
{{< embed-md "rdi-tls-secrets.md" >}}
{{< /note >}}
  
### Set secrets with the CLI

Use [`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})
to set secrets for any installation type (VM, Kubernetes, or Redis Cloud).

The command lines for a source named `mysql` are shown below. If your pipeline has multiple sources, you should run the command once for each source, using the appropriate database name.

```bash
# For username and password
redis-di set-secret USERNAME --db mysql yourUsername
redis-di set-secret PASSWORD --db mysql yourPassword

# With source TLS, in addition to the above
redis-di set-secret CACERT --db mysql /path/to/myca.crt

# With source mTLS, in addition to the above
redis-di set-secret CERT --db mysql /path/to/myclient.crt
redis-di set-secret KEY --db mysql /path/to/myclient.key
# Use this only if the private key is password-protected
redis-di set-secret KEY_PASSWORD --db mysql yourKeyPassword
```

The corresponding command lines for target secrets are:

```bash
# For username and password
redis-di set-secret USERNAME --db target yourUsername
redis-di set-secret PASSWORD --db target yourPassword

# With target TLS, in addition to the above
redis-di set-secret CACERT --db target /path/to/myca.crt

# With target mTLS, in addition to the above
redis-di set-secret CERT --db target /path/to/myclient.crt
redis-di set-secret KEY --db target /path/to/myclient.key
# Use this only if the private key is password-protected
redis-di set-secret KEY_PASSWORD --db target yourKeyPassword
```

By default, `set-secret` waits for the pipeline to apply the change before returning. When you set
several secrets at once, set all but the last one with `--wait=false` to avoid a timeout while the
pipeline is only partially updated. See [Wait for changes to complete](#wait) below for details.

### Manage secrets with the CLI

Along with `set-secret`, the CLI has commands to list, inspect, and delete secrets. Because the API
never returns secret values, these commands show only the secret keys and whether they are set, not
the stored values.

```bash
# List all the secrets of a pipeline, with the database each one belongs to
redis-di list-secrets

# List only the secrets of one database
redis-di list-secrets --db mysql

# Show a single secret and whether it is set
redis-di describe-secret PASSWORD --db mysql

# Delete a secret (prompts for confirmation unless you add --force)
redis-di delete-secret CACERT --db mysql
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

Where `<DB>` is `<source-name>-db` for the secrets of a source, or `target-db` for target secrets. 
The examples below use a source named `mysql`, so its secret is `mysql-db`.

If you use TLS or mTLS for either the source or target databases, you also need to create the 
`<source-name>-db-ssl` and/or `target-db-ssl` K8s secrets that contain the certificates used 
to establish secure connections. The general pattern of the commands is:

```bash
kubectl create secret generic <DB>-ssl \
--namespace=rdi \
--from-file=<FILE-NAME>=<FILE-PATH>
```

The specific command lines for source secrets are as follows:

```bash
# Without source TLS
# Create or update mysql-db secret
kubectl create secret generic mysql-db --namespace=rdi \
--from-literal=MYSQL_DB_USERNAME=yourUsername \
--from-literal=MYSQL_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With source TLS
# Create of update mysql-db secret
kubectl create secret generic mysql-db --namespace=rdi \
--from-literal=MYSQL_DB_USERNAME=yourUsername \
--from-literal=MYSQL_DB_PASSWORD=yourPassword \
--from-literal=MYSQL_DB_CACERT=/etc/certificates/mysql_db/ca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update mysql-db-ssl secret
kubectl create secret generic mysql-db-ssl --namespace=rdi \
--from-file=ca.crt=/path/to/myca.crt \
--save-config --dry-run=client -o yaml | kubectl apply -f -

# With source mTLS
# Create or update mysql-db secret
kubectl create secret generic mysql-db --namespace=rdi \
--from-literal=MYSQL_DB_USERNAME=yourUsername \
--from-literal=MYSQL_DB_PASSWORD=yourPassword \
--from-literal=MYSQL_DB_CACERT=/etc/certificates/mysql_db/ca.crt \
--from-literal=MYSQL_DB_CERT=/etc/certificates/mysql_db/client.crt \
--from-literal=MYSQL_DB_KEY=/etc/certificates/mysql_db/client.key \
--from-literal=MYSQL_DB_KEY_PASSWORD=yourKeyPassword \ # add this only if the private key is password-protected
--save-config --dry-run=client -o yaml | kubectl apply -f -
# Create or update mysql-db-ssl secret
kubectl create secret generic mysql-db-ssl --namespace=rdi \
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

Note that the certificate paths contained in the `CACERT`, `CERT`, and `KEY` secrets are internal to RDI, so you *must* use the values shown in the example above. Each source has its own certificate directory, named after the source (for example, a source named `mysql` uses `/etc/certificates/mysql_db/`). You should only change the certificate paths when you create the `<source-name>-db-ssl` and `target-db-ssl` secrets.

You must also label any secrets that you create directly with `kubectl` so that the RDI operator
discovers them as pipeline secrets. Each secret requires the following labels, where the
`app.kubernetes.io/instance` label corresponds to the pipeline name (the name is just
`default` for the default pipeline):

| Label | Value |
| :-- | :-- |
| `app.kubernetes.io/name` | `pipeline` |
| `app.kubernetes.io/instance` | `default` |
| `product` | `rdi` |

Apply the labels to each secret with [`kubectl label`](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_label/):

```bash
kubectl label secret mysql-db --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi
kubectl label secret target-db --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=default \
  product=rdi

# With source TLS or mTLS
kubectl label secret mysql-db-ssl --namespace=rdi --overwrite \
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

To act on a single source instead of the whole pipeline, add `--source`:

```bash
redis-di stop --source mysql
redis-di start --source mysql
```

Note that a source can only run if its parent pipeline is running. See
[Multiple sources in one pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/multiple-sources" >}}) for more information.

## Reset a pipeline

Use [`redis-di reset`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-reset" >}})
to return a pipeline to initial full-sync mode. This reloads a fresh
[snapshot]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}) of the source
data and then resumes change data capture (CDC), which is useful when the source and target have
drifted out of sync.

```bash
redis-di reset
```

Add `--source` to reset a single source and leave the others untouched:

```bash
redis-di reset --source mysql
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
redis-di set-secret USERNAME --db mysql newUsername --wait=false
redis-di set-secret PASSWORD --db mysql newPassword
```

The same applies to any set of changes that are only valid together.