---
Title: Install a module on a cluster
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Install on a cluster
weight: 10
---

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) comes packaged with several modules that provide additional Redis capabilities such as [search and query]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search">}}), [JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}}), [time series]({{<relref "/operate/oss_and_stack/stack-with-enterprise/timeseries">}}), and [probabilistic data structures]({{<relref "/operate/oss_and_stack/stack-with-enterprise/bloom">}}). As of version 8.0, Redis Enterprise Software includes multiple feature sets, compatible with different Redis database versions. You can view the installed modules, their versions, and their minimum compatible Redis database versions from **Cluster > Modules** in the Cluster Manager UI.

To use other modules or upgrade an existing module to a more recent version, you need to install the new module package on your cluster.

{{<warning>}}
Some module versions are not supported or recommended for use with Redis Enterprise Software.
{{</warning>}}

## Module package requirements

The module must be packaged as a `.zip` file containing:

- **module.json**: A metadata file with module information including:
  - `module_name`: The actual module name
  - `version`: Numeric version
  - `semantic_version`: Semantic version string (for example, "1.0.0")
  - `min_redis_version`: Minimum compatible Redis version
  - `commands`: List of commands the module provides
  - `capabilities`: List of module capabilities

- **Module binary**: The compiled `.so` file for the target platform

## Get packaged modules

To install or upgrade a module on a [Redis Enterprise Software]({{< relref "/operate/rs" >}}) cluster, you need a module package.

- For versions of official Redis modules that are not available from the [Redis download center](https://redis.io/downloads/), [contact support](https://redis.io/support/).

- For custom-packaged modules, download a [custom-packaged module](https://redislabs.com/community/redis-modules-hub/) from the developer.

- User-defined modules are downloaded automatically if you [add them during bootstrapping](#bootstrap-user-defined-module).

## Add user-defined modules during bootstrapping (Redis Software v8.0.6 and later) {#bootstrap-user-defined-module}

As of Redis Enterprise Software version 8.0.6, you can include `user_defined_modules` in REST API requests to [initiate boostrap operations]({{<relref "/operate/rs/references/rest-api/requests/bootstrap#post-bootstrap">}}) such as `create_cluster`, `join_cluster`, or `recover_cluster`. Each node in the cluster independently downloads and installs the specified modules during its bootstrap process.

`user_defined_modules` has the following JSON schema:

```json
{
  "user_defined_modules": [
    {
      "name": "string (required)",
      "location": {
        "location_type": "http | https (required)",
        "url": "string (required)",
        "credentials": {
          "username": "string (optional)",
          "password": "string (optional)"
        }
      }
    }
  ]
}
```

### Best practices

- Use `https` instead of `http` for secure module downloads.

- Include version numbers in module URLs.

- Use the same `user_defined_modules` configuration for all nodes in a cluster.

- If using authenticated downloads, ensure credentials are properly secured.

- Ensure modules are compatible with the Redis database version running on your cluster.

- Verify modules work correctly before deploying to production environments.

### Example requests

{{< multitabs id="bootstrap-modules" 
        tab1="Create cluster"
        tab2="Join cluster"
        tab3="Recover cluster" >}}

The following example creates a cluster with multiple modules:


```sh
POST /v1/bootstrap/create_cluster
{
  "action": "create_cluster",
  "credentials": {
    "username": "admin@example.com",
    "password": "your-secure-password"
  },
  "cluster": {
    "name": "my-cluster.example.com"
  },
  "user_defined_modules": [
    {
      "name": "ModuleA",
      "location": {
        "location_type": "https",
        "url": "https://private-repo.example.com/enterprise-module-2.0.0.zip",
        "credentials": {
          "username": "download-user",
          "password": "download-password"
        }
      }
    },
    {
      "name": "ModuleB",
      "location": {
        "location_type": "https",
        "url": "https://modules.example.com/module-b-2.5.0.zip"
      }
    },
    {
      "name": "ModuleC",
      "location": {
        "location_type": "http",
        "url": "http://internal-server.local/module-c-1.2.0.zip"
      }
    }
  ]
}
```

-tab-sep-

The following example joins a node to a cluster with multiple modules:

```sh
POST /v1/bootstrap/join_cluster
{
  "action": "join_cluster",
  "credentials": {
    "username": "admin@example.com",
    "password": "your-secure-password"
  },
  "cluster": {
    "name": "my-cluster.example.com",
    "nodes": ["192.168.1.10", "192.168.1.11"]
  },
  "user_defined_modules": [
    {
      "name": "ModuleA",
      "location": {
        "location_type": "https",
        "url": "https://private-repo.example.com/enterprise-module-2.0.0.zip",
        "credentials": {
          "username": "download-user",
          "password": "download-password"
        }
      }
    },
    {
      "name": "ModuleB",
      "location": {
        "location_type": "https",
        "url": "https://modules.example.com/module-b-2.5.0.zip"
      }
    },
    {
      "name": "ModuleC",
      "location": {
        "location_type": "http",
        "url": "http://internal-server.local/module-c-1.2.0.zip"
      }
    }
  ]
}
```

-tab-sep-

The following example recovers a cluster with multiple modules:

```sh
POST /v1/bootstrap/recover_cluster
{
  "action": "recover_cluster",
  "recovery_filename": "/path/to/backup.rdb",
  "credentials": {
    "username": "admin@example.com",
    "password": "your-secure-password"
  },
  "user_defined_modules": [
    {
      "name": "ModuleA",
      "location": {
        "location_type": "https",
        "url": "https://private-repo.example.com/enterprise-module-2.0.0.zip",
        "credentials": {
          "username": "download-user",
          "password": "download-password"
        }
      }
    },
    {
      "name": "ModuleB",
      "location": {
        "location_type": "https",
        "url": "https://modules.example.com/module-b-2.5.0.zip"
      }
    },
    {
      "name": "ModuleC",
      "location": {
        "location_type": "http",
        "url": "http://internal-server.local/module-c-1.2.0.zip"
      }
    }
  ]
}
```

{{< /multitabs >}}

### Troubleshooting

#### Error handling

Download failures do not fail the bootstrap process. If a module fails to download or install, a warning is logged and the bootstrap process continues with the remaining modules.

Warnings are recorded in the bootstrap status with:
- `warning_type`: `"module_download_failed"`
- `message`: Error description
- `details`: `{"module_name": "<name>"}`

#### Module download failed

Check the bootstrap logs for detailed error messages:

```
Failed to download and install custom module '<name>': <error details>
```

Common causes:
- Invalid URL
- Network connectivity issues
- Authentication failures
- Module package format issues

#### Module compatibility errors

After processing user-defined modules, the system validates that all custom modules are compatible with existing databases in the cluster. This validation:

1. Checks which custom modules are used by existing databases.

1. Verifies that compatible module versions are available on the node.

1. Fails the bootstrap process if incompatible modules are detected.

If the bootstrap process fails with an `incompatible_modules` error:

1. Verify the module version is compatible with existing databases.

1. Ensure the module binary exists and is accessible.

#### Missing module.json

If you see `"module.json missing"` errors:

1. Verify the zip file contains a valid `module.json` at the root level.

1. Verify the JSON is properly formatted.

## Add a user-defined module to a cluster (Redis Software v8.0.x and later) {#add-user-defined-module-to-cluster}

To add a custom module to a cluster running Redis Enterprise Software version 8.0.x or later, use the following REST API requests:

1. [Upload the custom module configuration]({{< relref "/operate/rs/references/rest-api/requests/modules/user-defined#post-user-defined-module" >}}). Replace the values in the following example with your own.

    ```sh
    POST https://<host>:<port>/v2/modules/user-defined
    {
      "module_name": "TestModule",
      "version": 1,
      "semantic_version": "0.0.1",
      "display_name": "test module",
      "commands": [
        {
          "command_arity": -1,
          "command_name": "module.command",
          "first_key": 1,
          "flags": ["write"],
          "last_key": 1,
          "step": 1
        }
      ],
      "command_line_args": "",
      "capabilities": ["list", "of", "capabilities"],
      "min_redis_version": "2.1"
    }
    ```

1. For each node in the cluster, [upload the custom module artifact]({{< relref "/operate/rs/references/rest-api/requests/modules/user-defined#post-local-user-defined-artifacts" >}}):

    ```sh
    POST https://<host>:<port>/v2/local/modules/user-defined/artifacts
    "module=@/tmp/custom-module.zip"
    ```

    The *module* parameter specifies the full path of the module artifact and must be submitted as form-data. In addition, the module artifact must be available and accessible to the server processing the request.

## Add a module to a cluster (Redis Software v7.22.x and earlier) {#add-a-module-to-a-cluster}

Use one of the following methods to add a module to a cluster running Redis Enterprise Software version 7.22.x or earlier:

{{< multitabs id="install-modules" 
        tab1="Cluster Manager UI"
        tab2="REST API" >}}

To add a module to the cluster using the Cluster Manager UI:

1. Go to **Cluster > Modules**.

1. Select **Upload module**.

1. Use the file browser to add the packaged module.

-tab-sep-

To add a module to the cluster using the REST API:

1. Copy the module package to a node in the cluster.

1. Add the module to the cluster with a [`POST` request to the `/v2/modules`]({{< relref "/operate/rs/references/rest-api/requests/modules#post-module-v2" >}}) endpoint:

    ```sh
    POST https://<host>:<port>/v2/modules
    "module=@/tmp/redisearch.Linux-ubuntu16.04-x86_64.2.2.6.zip"
    ```

    Here, the *module* parameter specifies the full path of the module package and must be submitted as form-data. In addition, the package must be available and accessible to the server processing the request.

1. If the module installation succeeds, the `POST` request returns a [JSON object]({{< relref "/operate/rs/references/rest-api/objects/module" >}}) that represents the new module. If it fails, it may return a JSON object with an `error_code` and `description` with more details.

{{< /multitabs >}}

For RedisGears, follow these [installation instructions]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/installing-redisgears" >}}) instead.

{{<warning>}}
We recommend consulting [Redis support](https://redis.io/support/) before you upgrade a module on the cluster, especially if the cluster is used in production.
{{</warning>}}

## Next steps

- Create a database and [enable the new module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}).
- [Upgrade a module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}) to the new version.
