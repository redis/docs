---
Title: Configure modules
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy Redis Enterprise databases with modules using the Redis Enterprise operator for Kubernetes.
linkTitle: Configure modules
weight: 15
---

Redis Enterprise modules extend Redis functionality with additional data types, commands, and capabilities. The Redis Enterprise operator supports deploying databases with modules through the `RedisEnterpriseDatabase` (REDB) and `RedisEnterpriseActiveActiveDatabase` (REAADB) custom resources.

## Prerequisites

Before you begin, verify that you have:

- [Redis Enterprise operator deployed]({{< relref "/operate/kubernetes/deployment/quick-start" >}}) in your Kubernetes cluster
- [Redis Enterprise Cluster (REC)]({{< relref "/operate/kubernetes/re-clusters" >}}) running and in a healthy state
- Modules uploaded to the Redis Enterprise cluster (see [Check available modules](#check-available-modules))

## Available modules

Redis Enterprise includes several built-in modules:

| Module | Name | Description |
|--------|------|-------------|
| **[RediSearch]({{< relref "/develop/interact/search-and-query" >}})** | `search` | Full-text search and secondary indexing |
| **[RedisJSON]({{< relref "/develop/data-types/json" >}})** | `ReJSON` | JSON data type support |
| **[RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}})** | `timeseries` | Time series data structures |
| **[RedisBloom]({{< relref "/develop/data-types/probabilistic" >}})** | `bf` | Probabilistic data structures (Bloom filters, etc.) |

### Check available modules

Before configuring databases with modules, check which modules are available in your cluster:

```bash
kubectl get rec <cluster-name> -o jsonpath='{.status.modules}' | jq
```

This command shows the modules installed in the cluster along with their available versions.

{{< note >}}
Use the `NAME` field instead of the `DISPLAY_NAME` field when configuring databases with modules.
{{< /note >}}

## Install additional modules

If you need to install additional modules or specific versions, upload them using the Redis Enterprise API. See [Upload module v2]({{< relref "/operate/rs/references/rest-api/requests/modules/#post-module-v2" >}}) for more information.

## Module configuration

Each module in the [`modulesList`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#specmoduleslist" >}}) supports the following fields:

- **name** (required): The module name (for example, "search", "ReJSON")
- **version** (optional): Specific module version. For Active-Active databases, if specified for one participating cluster, it must be specified for all participating clusters. If omitted, modules will auto-update.
- **config** (optional): Module-specific configuration parameters

For detailed module configuration options and parameters, see [Redis modules]({{< relref "/develop/reference/modules" >}}).

## Upgrade considerations

When upgrading Redis Enterprise clusters or the operator with modules, follow these guidelines:

#### Pre-upgrade planning

- **Check module compatibility**: Verify that your current module versions are compatible with the target Redis Enterprise version. Check each module's [`min_redis_version`](https://redis.io/docs/latest/operate/rs/references/rest-api/objects/module/) requirement.
- **Review module dependencies**: Some modules may have specific version requirements or dependencies
- **Document current configurations**: Record all module versions and configurations before upgrading
- **Test in non-production**: Always test module upgrades in a development or staging environment first

#### Module version management during upgrades

- **Upload required modules**: Ensure all necessary module versions are uploaded to the cluster before upgrading
- **Version consistency**: For Active-Active databases, ensure module versions are consistent across all participating clusters. If you specify a version for one cluster, specify the same version for all clusters. Omit versions to allow auto-updates.
- **Compatibility requirements**: Consult the Redis Enterprise documentation for module compatibility matrices and verify each module's [`min_redis_version`](https://redis.io/docs/latest/operate/rs/references/rest-api/objects/module/) requirement

#### Upgrade sequence

1. **Upload new module versions** (if required) to the cluster before upgrading Redis Enterprise
2. **Upgrade the Redis Enterprise cluster** following standard upgrade procedures
3. **Verify module functionality** after the cluster upgrade completes
4. **Update database configurations** if new module versions require configuration changes

#### Post-upgrade verification

- **Check module status**: Verify all modules are loaded correctly: `kubectl get rec <cluster-name> -o jsonpath='{.status.modules}'`
- **Test module functionality**: Validate that module-specific commands and features work as expected
- **Monitor performance**: Watch for any performance changes after the upgrade
- **Update documentation**: Record the new module versions and any configuration changes

For detailed upgrade procedures, see [Upgrade Redis Enterprise clusters]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}}).

## Related information

- [Database controller]({{< relref "/operate/kubernetes/re-databases/db-controller" >}}) - Learn how to create and manage Redis Enterprise databases
- [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}) - Set up globally distributed Active-Active databases
- [Database connectivity]({{< relref "/operate/kubernetes/networking/database-connectivity" >}}) - Connect applications to your Redis Enterprise databases
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) - Complete API specification for REDB resources
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}}) - API reference for Active-Active databases
- [Redis modules documentation](https://redis.io/docs/latest/develop/reference/modules/) - Official Redis modules documentation
