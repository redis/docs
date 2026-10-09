---
Title: Troubleshooting
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Solve and report simple problems with RDI
group: di
hideListLinks: false
linkTitle: Troubleshooting
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 50
url: '/integrate/redis-data-integration/1.19.1/troubleshooting/'
---

The following sections explain how you can get extra information from
Redis Data Integration (RDI) to help you solve problems that you may encounter. Redis support may
also ask you to provide this information to help you resolve issues.

## Debug information during installation {#install-debug}

If the installer fails with an error, then try installing again with the
log level set to `DEBUG`:

```bash
./install.sh --log-level DEBUG
```

This gives you more detail about the installation steps and can often
help you to pinpoint the source of the error.

## RDI logs

By default, RDI records the following logs in the host VM file system at
`/opt/rdi/logs` (or whichever path you specified during installation);

| Filename | Phase |
| :-- | :-- |
| `rdi_collector-collector-initializer.log` | Initializing the collector. |
| `rdi_collector-debezium-ssl-init.log` | Establishing the connector SSL connections to the source and RDI database (if you are using SSL). |
| `rdi_collector-collector-source.log` | Collector [change data capture (CDC)](/content/integrate/redis-data-integration/1.19.1/architecture/_index.md) operations. |
| `rdi_rdi-rdi-operator.log` | Main [RDI control plane](/content/integrate/redis-data-integration/1.19.1/architecture/_index.md#how-rdi-is-deployed) component. |
| `rdi_processor-processor.log` | RDI stream processing. |

Logs are recorded at the minimum `INFO` level in a simple format that
log analysis tools can use.

> [!NOTE]
> Often during the initial sync phase, the collector source log will contain a message
> saying RDI is out of
> memory. This is not an error but an informative message to say that RDI
> is applying *backpressure* to the collector. See
> [Backpressure mechanism](/content/integrate/redis-data-integration/1.19.1/architecture/_index.md#backpressure-mechanism)
> in the Architecture guide for more information.

## Recover from unavailable source log history {#unavailable-source-history}

If the collector cannot resume from its saved position, check the collector source log
for unavailable or expired source log history. This differs from a missing offset,
which is expected on first deployment or after a reset.

With `initial`, the collector can fail rather than start a new snapshot when the saved
position is unavailable. With `when_needed`, it can automatically snapshot the current
selected data and resume streaming. A new snapshot after a restart can therefore
indicate that the source history was no longer available. See
[Choose a snapshot mode](/content/integrate/redis-data-integration/1.19.1/data-pipelines/pipeline-config.md#choose-a-snapshot-mode)
for the connector-specific behavior.

Before you use a new snapshot to recover, check for
[missed deletes and stale target records](/content/integrate/redis-data-integration/1.19.1/data-pipelines/pipeline-config.md#missed-deletes).
A snapshot does not replay lost history or delete target records that are absent from
the source. Resetting the pipeline also leaves target records in place.

If the saved position is unavailable, work with Redis support to plan a target cleanup
or rebuild before relying on the target as a complete copy. Check whether the target
contains data from other sources or applications before deleting any records. To reload
existing source rows, configure a mode that takes a data snapshot, then
[reset the pipeline](/content/integrate/redis-data-integration/1.19.1/data-pipelines/deploy.md#reset-a-pipeline).
Review the source's log retention so the required history remains available during
future interruptions.

## Dump support package

If you need to send a comprehensive set of forensics data to Redis support,
run the
[`redis-di dump-support-package`](/content/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-dump-support-package.md)
command from the CLI.

This command gathers the following data:

- All the internal RDI components and their status
- All internal RDI configuration
- List of secret names used by RDI components (but not the secrets themselves)
- RDI logs
- RDI component versions
- Text of the `config.yaml` file
- Text of the Job configuration files
- Rejected records along with the reason for their rejection (should not exist in production)
