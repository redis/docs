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

Redis Enterprise modules extend Redis functionality with additional data types, commands, and capabilities. Redis Enterprise versions 8.0.2 and later include several bundled modules that are automatically enabled for compatible database types. You can also add user-defined modules for additional functionality.

## Prerequisites

Before you begin, verify the following:

- [Redis Enterprise operator deployed]({{< relref "/operate/kubernetes/deployment/quick-start" >}}) in your Kubernetes cluster
- [Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/re-clusters" >}}) running and in a healthy state

## Bundled modules

Redis Enterprise includes several bundled modules that extend Redis functionality with additional data types, commands, and capabilities. Starting with Redis Enterprise version 8.0.2, these modules are automatically included and immediately available for use.

### Available bundled modules

| Module | Name | Description | Capabilities |
|--------|------|-------------|--------------|
| **[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})** | `search` | Full-text search and secondary indexing | Query, aggregation, full-text search, vector similarity search |
| **[RedisJSON]({{< relref "/develop/data-types/json" >}})** | `ReJSON` | JSON data type support | Store, update, and query JSON documents |
| **[RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}})** | `timeseries` | Time series data structures | Ingest and query time series data with downsampling and aggregation |
| **[RedisBloom]({{< relref "/develop/data-types/probabilistic" >}})** | `bf` | Probabilistic data structures | Bloom filters, Cuckoo filters, Count-Min Sketch, Top-K |

{{< note >}}
When configuring databases with modules, use the `NAME` field (for example, `search` or `ReJSON`) instead of the `DISPLAY_NAME` field.
{{< /note >}}

### Automatic enablement in Redis 8 and later

For databases created with or upgraded to Redis version 8 or later, bundled modules are automatically enabled based on the database type. You don't need to specify them in the `spec.moduleList` field unless you want to use a specific version.

{{<embed-md "rs-8-enabled-modules.md">}}

For databases using Redis versions earlier than 8, explicitly specify bundled modules in the `spec.moduleList` field when you create the database.

### Check available module versions

To see which bundled module versions are available in your cluster, run the following command:

```bash
kubectl get rec <cluster-name> -o jsonpath='{.status.modules}' | jq
```

This command displays all modules (both bundled and user-defined) installed in the cluster and their available versions.

### Bundled vs. user-defined modules

The following table shows the key differences between bundled and user-defined modules:

| Aspect | Bundled modules | User-defined modules |
|--------|----------------|---------------------|
| **Installation** | Pre-installed with Redis Enterprise | Must be added to the REC spec |
| **Availability** | Immediately available | Available after you add them to the REC |
| **Versions** | Bundled with the Redis Enterprise version | Specified by URL in the REC spec |
| **Examples** | RediSearch, RedisJSON, RedisTimeSeries, RedisBloom | RedisGears, custom modules |
| **Redis 8 and later behavior** | Automatically enabled for compatible database types | Must be explicitly specified |

## User-defined modules

User-defined modules are custom Redis modules that extend Redis functionality beyond the bundled modules. User-defined modules can include third-party modules like RedisGears or custom in-house modules developed for specific use cases.

### Add user-defined modules to the REC

To use user-defined modules with your databases, first add them to the Redis Enterprise cluster (REC) custom resource. This enables the operator to validate the modules and make them available for database creation.

{{< warning >}}
Add user-defined modules to the REC **before** you create any databases that use them. The admission controller validates that modules exist in the REC before allowing REDB creation.
{{< /warning >}}

1. Edit your REC custom resource:

    ```sh
    kubectl edit rec <cluster-name>
    ```

2. Add the `userDefinedModules` section to the `spec`:

    ```yaml
    spec:
      userDefinedModules:
        - name: "custom-module"
          source:
            https:
              url: "https://modules.company.com/custom-module-v1.0.zip"
              credentialsSecret: "module-repo-creds"
    ```

3. If your module repository requires authentication, create a secret with your credentials:

    ```sh
    kubectl create secret generic module-repo-creds \
      --from-literal=username=<your-username> \
      --from-literal=password=<your-password>
    ```

### Module naming requirements

The `name` field in the REC spec must match either the `module_name` or `display_name` value from the module's manifest file (`module.json` inside the module zip file). This enables the operator to validate the module.

For example, if your module manifest contains the following:

```json
{
  "module_name": "rg",
  "display_name": "RedisGears",
  "semantic_version": "1.2.5"
}
```

You can use either `"rg"` or `"RedisGears"` as the `name` value in your REC spec.

{{< note >}}
If the names don't match, the operator can't validate the module. This can lead to preventable errors during database creation or upgrades.
{{< /note >}}

### Edit user-defined modules

To modify the user-defined modules list, complete the following steps:

1. Edit the REC custom resource:

    ```sh
    kubectl edit rec <cluster-name>
    ```

1. Update the `userDefinedModules` section:
   - **Add new modules**: Append them to the list.
   - **Update module URLs**: Change the `url` field for existing modules.
   - **Update credentials**: Change the `credentialsSecret` reference.

1. Save your changes. The operator validates and applies the updates.

{{< warning >}}
Don't remove modules that are currently in use by any database. The operator rejects the change and puts the REC into an error state.
{{< /warning >}}

{{< note >}}
Changes to the `userDefinedModules` list trigger a rolling restart of the Redis Enterprise cluster pods. Plan module updates during a maintenance window to minimize potential impact on your databases.
{{< /note >}}

### Verify user-defined modules

After you add user-defined modules to the REC, verify that they're available:

```sh
kubectl get rec <cluster-name> -o jsonpath='{.spec.userDefinedModules}' | jq
```

You can also check the REC status for validation errors:

```sh
kubectl describe rec <cluster-name>
```

Look for events or status messages related to module validation in the output.

## Upgrade with modules

The upgrade process differs depending on whether you use bundled modules or user-defined modules.

### Upgrade with bundled modules

For databases using bundled modules (RediSearch, RedisJSON, RedisTimeSeries, RedisBloom):

- **Redis 8 and later**: Bundled modules are automatically enabled and upgraded when you upgrade the database to Redis version 8 or later. You don't need to take any additional action.

- **Redis versions earlier than 8**: Bundled modules are upgraded automatically when you upgrade the Redis Enterprise cluster. The bundled module versions are tied to the Redis Enterprise version.

### Upgrade with user-defined modules

For databases using user-defined modules, you must take additional steps during cluster upgrades:

1. Set `autoUpgradeRedisEnterprise` to `false` in your REC spec before upgrading.

1. Add or update the `userDefinedModules` list in the REC spec with the new module versions before or during the cluster upgrade.

1. After the cluster upgrade completes, you can re-enable `autoUpgradeRedisEnterprise` if desired.

For detailed upgrade instructions, see the following:

- [Upgrade a Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})
- [Upgrade Redis Enterprise on OpenShift]({{< relref "/operate/kubernetes/upgrade/openshift-cli" >}})

## Related information

- [Redis modules documentation]({{< relref "/develop/reference/modules" >}}) - Official Redis modules documentation
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) - Complete API specification for REDB resources
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}}) - API reference for Active-Active databases

### Redis Software documentation

- [Add modules to a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) - Install module packages on Redis Enterprise Software clusters
- [Enable modules for a database]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}) - Add modules to databases in Redis Enterprise Software
- [Upgrade modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) - Upgrade module versions in Redis Enterprise Software
- [Module lifecycle]({{< relref "/operate/oss_and_stack/stack-with-enterprise/modules-lifecycle" >}}) - Module versioning and end-of-life schedule
