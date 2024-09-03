---
Title: Ingest troubleshooting
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Solve and report simple problems with RDI ingest
group: di
hideListLinks: false
linkTitle: Troubleshooting
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 50
---

The following sections explain how you can get extra information from
RDI to help you solve problems that you may encounter. Redis support may
also ask you to provide this information if you need to contact them.

## Debug information during installation {#install-debug}

If the installer fails with an error then try installing again with the
log level set to `DEBUG`:

```bash
./install.sh -l DEBUG   # Installer script
redis-di install -l DEBUG    # Install command
```

This gives you more detail about the installation steps and can often
help you to pinpoint the source of the error.

## RDI logs

By default, RDI records the following logs in the host VM file system at
`/opt/rdi/logs` (or whichever path you specified during installation);

| Filename | Phase |
| :-- | :-- |
| `rdi_collector-collector-initializer.log` | Initializing the Debezium collector. |
| `rdi_collector-debezium-ssl-init.log` | Establishing the Debezium SSL connections to the source and RDI database (if you are using SSL). |
| `rdi_collector-collector-source.log` | Debezium [change data capture (CDC)]({{< relref "/integrate/redis-data-integration/ingest/architecture" >}}) operations. |
| `rdi_rdi-rdi-operator.log` | RDI and Kubernetes deployment. |
| `rdi_processor-processor.log` | RDI stream processing. |

Logs are recorded at the minimum `INFO` level in a simple format that
log analysis tools can use.

{{< note >}}Sometimes the Debezium collector source log will contain a message saying that RDI is out of
memory. This is not an error but an informative message to say that RDI
is applying *backpressure* to Debezium. See
[Backpressure mechanism]({{< relref "/integrate/redis-data-integration/ingest/architecture#backpressure-mechanism" >}})
in the Architecture guide for more information.
{{< /note >}}

## Dump support package

If you ever need to send a comprehensive set of forensics data to Redis support then you should
run the
[`redis-di dump-support-package`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-dump-support-package" >}})
command from the CLI.

This command gathers the following data:

- All the internal RDI components and their status
- All internal RDI configuration
- List of secret names used by RDI components (but not the secrets themselves)
- RDI logs
- RDI component versions
- Output from the [`redis-di status`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-status" >}}) command
- Text of the `config.yaml` file
- Text of the Job configuration files
- [optional] RDI DLQ streams content
- Rejected records along with the reason for their rejection (should not exist in production)
