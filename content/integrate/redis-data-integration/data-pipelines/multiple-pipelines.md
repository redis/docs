---
Title: Multiple pipelines in one RDI installation
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to run several independent pipelines in one RDI installation.
group: di
linkTitle: Multiple pipelines
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 6
---

One RDI installation can run several pipelines side by side. Each pipeline has its own
configuration, jobs, secrets, and data plane components, which are its collectors and its
stream processor. Each pipeline also keeps its own keys in the RDI database. You can deploy,
start, stop, reset, and delete a pipeline without affecting the others, and a pipeline that
fails does not affect the others either. All the pipelines share the RDI control plane and the
RDI database. See
[How RDI is deployed](/content/integrate/redis-data-integration/architecture/_index.md#how-rdi-is-deployed)
for a description of these components.

> [!NOTE]
> You must use the `redis-di` CLI or RDI API v2 to manage a pipeline other than `default`.
> RDI API v1 manages only the `default` pipeline. See the
> [RDI API migration guide](/content/integrate/redis-data-integration/reference/api-migration.md)
> for more information.

## Choose between pipelines and sources

A single pipeline can capture changes from several source databases. See
[Multiple sources in one pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md).
Use several sources in one pipeline when their data goes to the same target and you manage
it as a unit. Use separate pipelines when:

- The data goes to different target databases. A pipeline writes to a single target.
- You want to stop, reset, or reconfigure some of the data without interrupting the rest.
  Resetting or removing a single source stops the whole pipeline while the operation runs,
  and RDI reports the whole pipeline in an error state when a single source fails.
- You need different processor settings, such as a different
  [`processors.type`](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md#processors),
  since the `processors` section applies to every source of a pipeline.

## Name your pipelines

Every pipeline has a name, which identifies it in CLI commands, in API paths, and in the
resources that RDI creates for it. A pipeline name must:

- Be 3 to 22 characters long.
- Start with a lowercase letter.
- Contain only lowercase letters, digits, and dashes.
- End with a letter or a digit.
- Not contain two consecutive dashes.

The name `rdi` is reserved and cannot be used for a pipeline. You can't rename a pipeline.
To move a pipeline to a new name, export its configuration with
[`redis-di export`](/content/integrate/redis-data-integration/reference/cli/redis-di-export.md),
set its secrets for the new pipeline, deploy the configuration as the new pipeline, and delete
the old one. The new pipeline starts with a new
[initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md).

The pipeline named `default` is special in two ways:

- The CLI targets it whenever you omit the pipeline name.
- Its resources and keys have the same names as in earlier RDI versions, so a pipeline that
  you created before upgrading keeps working unchanged.

A new RDI installation has no pipeline, not even `default`, until you create one. See
[Create a pipeline](#create-a-pipeline).

The optional [`metadata.name`](/content/integrate/redis-data-integration/reference/config-yaml-reference.md#metadata)
property in `config.yaml` is a display name of up to 100 characters. It is not related to the
pipeline name.

The pipeline name appears in the resources that RDI creates for the pipeline. RDI adds the
pipeline name and two dashes to the name of each Kubernetes resource of a pipeline other than
`default`, so pipeline, source, and secret provider names cannot contain consecutive dashes. The
following table lists the names for a pipeline named `orders` with a source named `mysql` and a
secret provider named `my-vault`, next to the names for the `default` pipeline.

| Resource | `default` pipeline | `orders` pipeline |
| :-- | :-- | :-- |
| Source credentials secret | `mysql-db` | `orders--mysql-db` |
| Source TLS secret | `mysql-db-ssl` | `orders--mysql-db-ssl` |
| Target credentials secret | `target-db` | `orders--target-db` |
| Target TLS secret | `target-db-ssl` | `orders--target-db-ssl` |
| SecretProviderClass | `my-vault` | `orders--my-vault` |
| Collector deployment | `collector-mysql` | `orders--collector-mysql` |
| Change data streams | `data:{rdi}:mysql.<qualified_table_name>` | `data:{<hash_tag>}:mysql.<qualified_table_name>` |
| Dead-letter queue streams | `dlq:data:{rdi}:mysql.<qualified_table_name>` | `dlq:data:{<hash_tag>}:mysql.<qualified_table_name>` |
| Collector metrics endpoint path on a VM installation | `/collector-mysql/metrics` | `/orders/collector-mysql/metrics` |
| Flink processor metrics endpoint path on a VM installation | `/processor/metrics` | `/orders/processor/metrics` |
| Classic processor metrics endpoint path on a VM installation | `/metrics` | `/orders/metrics-exporter/metrics` |
| `pipeline` label of the collector and stream processor metrics on a Helm installation | `default` | `orders` |

The secret references in `config.yaml` do not contain the pipeline name. A source named
`mysql` references `${MYSQL_DB_USERNAME}` and `${MYSQL_DB_PASSWORD}` in every pipeline, and
each pipeline resolves them from its own secrets.

`<hash_tag>` is the Redis [hash tag](/content/operate/oss_and_stack/reference/cluster-spec.md#hash-tags)
that RDI assigns to the pipeline when you create it. The keys of a pipeline in the RDI database
all share its hash tag. The hash tag of the `default` pipeline is always `rdi`. For any other
pipeline, it is the pipeline name followed by an underscore and a short generated suffix, such
as `orders_f2t`. RDI chooses the suffix so that new pipelines are spread approximately evenly
across the shards of a sharded RDI database. To find the hash tag of a pipeline, run:

```bash
kubectl -n rdi get pipeline orders -o jsonpath='{.spec.hashTag}'
```

## Create a pipeline

Create a pipeline with an empty configuration first, and then deploy its configuration with
[`redis-di deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md):

```bash
redis-di deploy orders --empty
redis-di deploy orders --dir <path to pipeline folder>
```

An empty pipeline is stopped and has no collectors or stream processor. Creating it first lets
RDI validate the configuration against the source and target databases when you deploy it,
because RDI runs these checks through a component of the pipeline, which starts only once the
pipeline exists. You can also create the pipeline and deploy its configuration in one step with
`redis-di deploy orders --dir <path to pipeline folder>`, but RDI then checks only the
configuration itself. If you omit the name, the commands act on the `default` pipeline. See
[Deploy a pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#deploy-a-pipeline)
for the other `deploy` options.

With RDI API v2, create a pipeline with `POST /api/v2/pipelines`, passing the name in the
request body, or with `PUT /api/v2/pipelines/{name}`. See the
[API reference](/content/integrate/redis-data-integration/reference/api-reference.md) for details.

Create pipelines only with the CLI or the API. RDI assigns the hash tag of a pipeline when the API
creates it, so a `Pipeline` resource that you create directly with `kubectl` gets the hash tag
of the `default` pipeline, and its keys collide with the keys of that pipeline.

In a [high availability](/content/integrate/redis-data-integration/installation/install-vm.md#installing-with-high-availability)
setup, create pipelines on the primary instance. The secondary instance rejects requests that
create a pipeline.

> [!WARNING]
> If you upgraded RDI from an earlier version, finish upgrading all the RDI instances before you
> create a pipeline other than `default`, and do not downgrade RDI after you create one. See
> [Upgrading to RDI 2.2.0](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-220).

## Set secrets for each pipeline

Every secret belongs to one pipeline. Name the pipeline with the `-p` or `--pipeline` option of
[`redis-di set-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-secret.md):

```bash
redis-di set-secret USERNAME --db mysql <username> -p orders
redis-di set-secret PASSWORD --db mysql <password> -p orders
redis-di set-secret PASSWORD --db target <password> -p orders
```

The other secret commands, such as
[`redis-di list-secrets`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-secrets.md)
and [`redis-di delete-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-secret.md),
take the same option. Without it, they manage the secrets of the `default` pipeline. See
[Set secrets](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
for the available secret keys.

You can set the secrets of a pipeline before you create it, so that the pipeline can connect to
its databases as soon as you deploy it. The secrets take effect once the pipeline exists. The
only exception is the scope-prefixed `SOURCE_DB_*` keys, which require an existing pipeline
with exactly one source. Deleting a pipeline does not delete its secrets. In a high availability
setup, set the secrets of every pipeline on both instances, because RDI does not replicate
secrets between them.

If you create the secrets of a pipeline other than `default` with `kubectl`, add the pipeline
name and two dashes to the secret names, and set the `app.kubernetes.io/instance` label to the
pipeline name. The keys inside the secrets do not change. For example, for a source named
`mysql` of the `orders` pipeline:

```bash
kubectl create secret generic orders--mysql-db --namespace=rdi \
--from-literal=MYSQL_DB_USERNAME=yourUsername \
--from-literal=MYSQL_DB_PASSWORD=yourPassword \
--save-config --dry-run=client -o yaml | kubectl apply -f -
kubectl label secret orders--mysql-db --namespace=rdi --overwrite \
  app.kubernetes.io/name=pipeline \
  app.kubernetes.io/instance=orders \
  product=rdi
```

See [Set secrets for K8s/Helm deployment using Kubectl command](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets-for-k8shelm-deployment-using-kubectl-command)
for the full list of secrets and keys.

RDI creates a separate SecretProviderClass for each pipeline that declares a
[secret provider](/content/integrate/redis-data-integration/reference/config-yaml-reference.md#secret-providers),
so two pipelines can declare secret providers with the same name. The `config.yaml` file
still refers to the provider by the name it has in the `secret-providers` section.

## Select the pipeline in commands

The pipeline commands
[`deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md),
[`start`](/content/integrate/redis-data-integration/reference/cli/redis-di-start.md),
[`stop`](/content/integrate/redis-data-integration/reference/cli/redis-di-stop.md),
[`reset`](/content/integrate/redis-data-integration/reference/cli/redis-di-reset.md),
[`delete`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete.md),
[`get`](/content/integrate/redis-data-integration/reference/cli/redis-di-get.md), and
[`describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)
take the pipeline name as an optional argument. The commands that manage the secrets,
dead-letter queues, jobs, and metric collections of a pipeline take it with the `-p` or
`--pipeline` option:

```bash
redis-di describe orders
redis-di list-dlqs -p orders
redis-di list-jobs -p orders
```

All these commands target the `default` pipeline when you omit the name, and there is no
setting to change this. Pass the name to every command that should act on another pipeline.
[`redis-di list`](/content/integrate/redis-data-integration/reference/cli/redis-di-list.md)
lists all the pipelines with their status.

RDI API v2 requests include the pipeline name in the path, as in
`GET /api/v2/pipelines/{name}/status`. `GET /api/v2/pipelines` lists all the pipelines.

## Start, stop, reset, and delete a pipeline

Each lifecycle command acts only on the pipeline you name, while the other pipelines keep
running:

```bash
redis-di stop orders
redis-di start orders
redis-di reset orders
```

Resetting a pipeline deletes only that pipeline's data from the RDI database and takes a new
[initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md) of its
sources. Add `--source` to act on a single source of the pipeline, for example
`redis-di reset orders --source mysql`. See
[Start, stop, and reset a single source](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md#start-stop-and-reset-a-single-source)
for details.

Use [`redis-di delete`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete.md)
to delete a pipeline. Any pipeline can be deleted, including `default`:

```bash
redis-di delete orders
```

RDI removes the pipeline's components and deletes its keys from the RDI database. The keys of
the other pipelines are not affected. The secrets of the pipeline are kept, so remove them with
`redis-di delete-secret <key> --db <database> -p orders` if you no longer need them. The records
that the pipeline wrote to the target database are not deleted either. See
[Delete a pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#delete-a-pipeline)
for the command options.

## Write to the same or different targets

Each pipeline has a target database, which can be a separate database or the same database
that another pipeline writes to. When pipelines share a target database, make sure their jobs
write to different keys, for example by using a different key prefix in each pipeline. RDI
validates the jobs of each pipeline separately, so it does not detect keys that two pipelines
both write, and each pipeline overwrites the other's changes to such a key.

> [!WARNING]
> Flushing the target of a pipeline, for example with
> `POST /api/v2/pipelines/{name}/flush-target/{target_name}`, deletes all the data in the target
> database, including the records of every other pipeline that writes to it.

## Monitor each pipeline

Use [`redis-di list`](/content/integrate/redis-data-integration/reference/cli/redis-di-list.md)
for a one-line summary of every pipeline, and
[`redis-di describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)
with a pipeline name for the details of one pipeline, including its components and their
metrics endpoints. Each pipeline has its own status, so a pipeline in an error state does not
change the status of the others.

The metrics of each pipeline are separate:

- On a VM installation, the metrics endpoint paths of a pipeline other than `default` start
  with the pipeline name, for example `/orders/collector-mysql/metrics`,
  `/orders/processor/metrics` for the Flink processor, and `/orders/metrics-exporter/metrics`
  for the classic processor. The metrics themselves carry no `pipeline` label. For example,
  the `name` label of the Debezium collector metrics holds the source name, which can be the
  same in several pipelines. When you create a pipeline, add a scrape job for each of its
  endpoints to your Prometheus server, with a `pipeline` label, as shown in
  [VM installation](/content/integrate/redis-data-integration/observability.md#vm-installation).
- On a Helm installation, the ServiceMonitors of the Debezium collector, the Flink collector,
  the Flink processor, and the classic processor metrics exporter add a `pipeline` label with
  the pipeline name, for example `pipeline="orders"`, or `pipeline="default"` for the
  `default` pipeline.
- The `rdi_operator_pipeline_phase` operator metric reports the phase of each pipeline, with
  the pipeline name in its `name` label.

See [Accessing the metrics](/content/integrate/redis-data-integration/observability.md#accessing-the-metrics)
for the full list of endpoints.

The [support package](/content/integrate/redis-data-integration/observability.md#dump-support-package)
contains the diagnostics of every pipeline, in a separate `pipelines/<pipeline>` directory for
each one.

## Configure ingresses for several pipelines

On a Helm installation, the ingresses of the data plane components are disabled by default. The
ingress settings under `operator.dataPlane` in your Helm values file apply to every pipeline,
since there are no per-pipeline ingress settings. For a pipeline other than `default`, RDI adds
`/<pipeline>` to the beginning of the path prefix of each data plane ingress, so the ingresses
of different pipelines do not claim the same paths. For example, with the default path prefix
`/processor`, the Flink processor ingress of the `orders` pipeline serves the Flink web UI at
`/orders/processor`, and, if `operator.dataPlane.flinkProcessor.metricsAggregator.enabled` is
`true`, its metrics at `/orders/processor/metrics`.

An empty or `/` path prefix stays unchanged, with one exception. The ingress of the classic
processor metrics exporter, under `operator.dataPlane.metricsExporter`, has an empty path prefix
by default. If you set no hosts for it, RDI replaces the empty prefix of a pipeline other than
`default` with `/<pipeline>/metrics-exporter`, so the classic processor metrics of the `orders`
pipeline are at `/orders/metrics-exporter/metrics`.

If you use an empty or `/` path prefix together with hosts and more than one pipeline, include
the `$PIPELINE` variable in the ingress hosts to give each pipeline its own host:

```yaml
operator:
  dataPlane:
    flinkProcessor:
      ingress:
        enabled: true
        hosts:
          - $PIPELINE-processor.example.com
        pathPrefix: ""
```

RDI replaces `$PIPELINE` with the pipeline name, so the host of the `orders` pipeline is
`orders-processor.example.com`. For the `default` pipeline, RDI removes `$PIPELINE` together
with an adjacent dash, or else an adjacent dot, so its host is `processor.example.com`. The
`$PIPELINE` variable is available in the ingress hosts of the Debezium collector, the Flink
collector, the Flink processor, and the classic processor metrics exporter, but not in their
path prefixes.

On a VM installation, RDI configures these ingresses for you, so you do not need to change them.
