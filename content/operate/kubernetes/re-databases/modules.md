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

**Limitations:**

- **Active-Active databases**: User-defined modules are not supported with Active-Active databases. Only bundled modules (RediSearch, RedisJSON, RedisTimeSeries, RedisBloom) can be used with Active-Active databases.

- **Redis on Flash**: User-defined modules are fully supported with Redis on Flash databases.

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

### Module version selection

When multiple versions of a module are available in the cluster, Redis Enterprise selects the appropriate version based on the `compatible_redis_version` field in the module's manifest file (`module.json`). This field must match the Redis OSS version that the database is using.

For example, if your database uses Redis 7.2, Redis Enterprise selects the module version whose `compatible_redis_version` is `7.2`. If no matching version is found, the module cannot be loaded.

### Upgrade with bundled modules

For databases using bundled modules (RediSearch, RedisJSON, RedisTimeSeries, RedisBloom):

- **Redis 8 and later**: Bundled modules are automatically enabled and upgraded when you upgrade the database to Redis version 8 or later. You don't need to take any additional action. The module version is automatically selected based on the database's Redis version.

- **Redis versions earlier than 8**: Bundled modules are upgraded automatically when you upgrade the Redis Enterprise cluster. The bundled module versions are tied to the Redis Enterprise version, and the appropriate version is selected based on the database's Redis version.

### Upgrade with user-defined modules

For databases using user-defined modules, you must take additional steps during cluster upgrades:

1. Set `autoUpgradeRedisEnterprise` to `false` in your REC spec before upgrading.

1. Add or update the `userDefinedModules` list in the REC spec with the new module versions before or during the cluster upgrade. Ensure that the new module versions include a `compatible_redis_version` field that matches the Redis version your databases will use after the upgrade.

1. After the cluster upgrade completes, you can re-enable `autoUpgradeRedisEnterprise` if desired.

For detailed upgrade instructions, see the following:

- [Upgrade a Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})
- [Upgrade Redis Enterprise on OpenShift]({{< relref "/operate/kubernetes/upgrade/openshift-cli" >}})

## Troubleshooting

This section covers common issues you might encounter when working with user-defined modules.

### Module validation errors

Module validation errors occur when the operator can't validate a user-defined module. Common causes include incorrect URLs, authentication failures, or invalid module manifests.

**Symptoms:**

- REC status shows validation errors
- Events indicate module download or validation failures
- Databases fail to create with module-related errors

**Diagnosis:**

Check the REC status for validation errors:

```sh
kubectl describe rec <cluster-name>
```

Look for error messages related to modules in the Events section.

**Resolution:**

1. **Verify the module URL is accessible:**

    ```sh
    curl -I <module-url>
    ```

2. **Check credentials secret exists and has correct values:**

    ```sh
    kubectl get secret <credentials-secret-name> -o yaml
    ```

3. **Verify the module manifest (`module.json`) is valid:**

    Download the module zip file and check that it contains a valid `module.json` file with required fields: `module_name`, `display_name`, `semantic_version`, `commands`, and `compatible_redis_version`.

4. **Ensure the `name` field in the REC spec matches the module manifest:**

    The `name` must match either `module_name` or `display_name` from the module's `module.json` file. See [Module naming requirements](#module-naming-requirements) for details.

### Bootstrap failures

Bootstrap failures occur when the Redis Enterprise cluster fails to start due to module-related issues.

**Symptoms:**

- REC pods fail to reach Running state
- Operator logs show module-related errors during bootstrap
- Cluster remains in a non-ready state

**Diagnosis:**

Check the operator logs:

```sh
kubectl logs -l name=redis-enterprise-operator -n <namespace>
```

Check the REC pod logs:

```sh
kubectl logs <rec-pod-name> -n <namespace>
```

**Resolution:**

1. **Remove problematic modules from the REC spec:**

    Edit the REC and remove or comment out the problematic module from the `userDefinedModules` list:

    ```sh
    kubectl edit rec <cluster-name>
    ```

2. **Wait for the cluster to recover:**

    ```sh
    kubectl get rec <cluster-name> -w
    ```

3. **Fix the module configuration and re-add it:**

    After the cluster is running, correct the module URL, credentials, or manifest issues, then add the module back to the REC spec.

### Module not found errors

Module not found errors occur when you try to create a database that uses a module that isn't defined in the REC.

**Symptoms:**

- REDB creation fails with admission webhook errors
- Error message indicates the module is not found in the REC
- Database remains in a pending or failed state

**Diagnosis:**

Check the REDB creation error:

```sh
kubectl describe redb <database-name>
```

Verify which modules are defined in the REC:

```sh
kubectl get rec <cluster-name> -o jsonpath='{.spec.userDefinedModules}' | jq
```

**Resolution:**

1. **Add the missing module to the REC:**

    See [Add user-defined modules to the REC](#add-user-defined-modules-to-the-rec) for detailed instructions.

2. **Wait for the module to be validated:**

    ```sh
    kubectl describe rec <cluster-name>
    ```

    Look for successful validation in the Events section.

3. **Retry database creation:**

    After the module is available in the REC, the database creation should succeed automatically, or you can delete and recreate the REDB.

## Related information

- [Redis modules documentation]({{< relref "/develop/reference/modules" >}}) - Official Redis modules documentation
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) - Complete API specification for REDB resources
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}}) - API reference for Active-Active databases

### Redis Software documentation

- [Add modules to a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) - Install module packages on Redis Enterprise Software clusters
- [Enable modules for a database]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}) - Add modules to databases in Redis Enterprise Software
- [Upgrade modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) - Upgrade module versions in Redis Enterprise Software
- [Module lifecycle]({{< relref "/operate/oss_and_stack/stack-with-enterprise/modules-lifecycle" >}}) - Module versioning and end-of-life schedule
