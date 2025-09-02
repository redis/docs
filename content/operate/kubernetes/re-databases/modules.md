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

- Redis Enterprise operator deployed in your Kubernetes cluster
- Redis Enterprise Cluster (REC) running and in a healthy state
- Modules uploaded to the Redis Enterprise cluster (see [Check available modules](#check-available-modules))

## Available modules

Redis Enterprise includes several built-in modules:

- **RediSearch** (`search`) - Full-text search and secondary indexing
- **RedisJSON** (`ReJSON`) - JSON data type support
- **RedisTimeSeries** (`timeseries`) - Time series data structures
- **RedisBloom** (`bf`) - Probabilistic data structures (Bloom filters, etc.)
- **RedisGraph** (`graph`) - Graph database capabilities
- **RedisGears** (`rg`) - Programmable data processing engine

### Check available modules

Before configuring databases with modules, check which modules are available in your cluster:

```bash
kubectl get rec <cluster-name> -o jsonpath='{.status.modules}' | jq
```

This command shows the modules installed in the cluster along with their available versions.

## Install additional modules

If you need to install additional modules or specific versions, upload them using the Redis Enterprise API:

1. Get cluster credentials:

   ```bash
   kubectl get secret <cluster-name> -o jsonpath='{.data.username}' | base64 -d
   kubectl get secret <cluster-name> -o jsonpath='{.data.password}' | base64 -d
   ```

2. Port forward to the cluster API:

   ```bash
   kubectl port-forward service/<cluster-name> 9443:9443
   ```

3. Upload the module:

   ```bash
   curl -k -u <username>:<password> -X POST \
     -F 'module=@<path-to-module-file>' \
     https://localhost:9443/v2/modules
   ```

## Module configuration

#### Module parameters

Each module in the [`modulesList`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#specmoduleslist" >}}) supports the following fields:

- **name** (required): The module name (for example, "search", "ReJSON")
- **version** (optional for REDB, required for REAADB): Specific module version
- **config** (optional): Module-specific configuration parameters

#### Common module configurations

##### RediSearch

```yaml
modulesList:
  - name: search
    config: "MAXSEARCHRESULTS 10000 MAXAGGREGATERESULTS 5000 TIMEOUT 500"
```

##### RedisTimeSeries

```yaml
modulesList:
  - name: timeseries
    config: "RETENTION_POLICY 86400000 MAX_SAMPLE_PER_CHUNK 360"
```

##### RedisBloom

```yaml
modulesList:
  - name: bf
    config: "ERROR_RATE 0.01 INITIAL_SIZE 1000"
```

## Upgrade considerations

When upgrading Redis Enterprise clusters or the operator with modules, follow these guidelines:

#### Pre-upgrade planning

- **Check module compatibility**: Verify that your current module versions are compatible with the target Redis Enterprise version
- **Review module dependencies**: Some modules may have specific version requirements or dependencies
- **Document current configurations**: Record all module versions and configurations before upgrading
- **Test in non-production**: Always test module upgrades in a development or staging environment first

#### Module version management during upgrades

- **Upload required modules**: Ensure all necessary module versions are uploaded to the cluster before upgrading
- **Version pinning**: For Active-Active databases, explicitly specify module versions to prevent automatic updates
- **Compatibility matrices**: Consult the Redis Enterprise documentation for module compatibility matrices

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

## Best practices

#### Module version management

- For production environments, specify explicit module versions in Active-Active databases
- Use the cluster's available modules list to ensure compatibility
- Test module upgrades in non-production environments first

#### Resource planning

- Modules consume additional memory and CPU resources
- Plan cluster resources accordingly when using multiple modules
- Monitor module-specific metrics and performance

#### Configuration management

- Use module configuration parameters to optimize performance
- Document module configurations for consistency across environments
- Consider module-specific backup and recovery requirements

## Troubleshooting

#### Common issues

1. **Module not available error:**
   - Check if the module is installed: `kubectl get rec <cluster-name> -o jsonpath='{.status.modules}'`
   - Upload the module if missing using the API endpoint

2. **Version compatibility issues:**
   - Verify module version compatibility with your Redis Enterprise version
   - Check the Redis Enterprise documentation for supported module versions

3. **Configuration errors:**
   - Validate module configuration parameters
   - Check Redis Enterprise logs for specific error messages

#### Debugging commands

```bash
# Check cluster status and available modules
kubectl get rec <cluster-name> -o yaml

# Check database status
kubectl get redb <database-name> -o yaml

# View operator logs
kubectl logs -l name=redis-enterprise-operator

# Check cluster logs
kubectl logs <cluster-pod-name>
```

## Related information

- [Database controller]({{< relref "/operate/kubernetes/re-databases/db-controller" >}}) - Learn how to create and manage Redis Enterprise databases
- [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}) - Set up globally distributed Active-Active databases
- [Database connectivity]({{< relref "/operate/kubernetes/networking/database-connectivity" >}}) - Connect applications to your Redis Enterprise databases
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}) - Complete API specification for REDB resources
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}}) - API reference for Active-Active databases
- [Redis modules documentation](https://redis.io/docs/latest/develop/reference/modules/) - Official Redis modules documentation
