---
Title: Create a support package
alwaysopen: false
categories:
- docs
- operate
- rs
description: Create a support package that gathers essential information to help debug
  issues.
linkTitle: Create support package
toc: 'true'
weight: $weight
---
If you encounter any issues that you are not able to resolve yourself
and need to [contact Redis support](https://redis.com/company/support/) for assistance, you can create a
support package that gathers all essential information to help debug
your issues.

{{< note >}}
The process of creating the support package can take several minutes and generates load on the system.
{{< /note >}}

## Cluster Manager UI method

To create a support package from the Cluster Manager UI:

1. In the navigation menu, select **Support**.

    {{<image filename="images/rs/screenshots/create-support-package.png"  width="60%" alt="Select Support and create a support package.">}}

1. Select **Proceed**.

1. In the **Create support package** dialog, select **Run process**.

1. The package is created and downloaded by your browser.

## Command-line method

If package creation fails with `internal error` or if you cannot access the UI, create a support package for the cluster from the command line on any node in the cluster using the [`rladmin cluster debug_info`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/debug_info" >}}) command: 

```sh
/opt/redislabs/bin/rladmin cluster debug_info
```

- If `rladmin cluster debug_info` fails for lack of space in the `/tmp` directory, you can:

    1. Change the storage location where the support package is saved: 
    
        ```sh
        rladmin cluster config debuginfo_path <path>
        ```

        The `redislabs` user must have write access to the storage location on all cluster nodes.

    1. On any node in the cluster, run:
        
        ```sh
        rladmin cluster debug_info
        ```

- If `rladmin cluster debug_info` fails for another reason, you can create a support package for the cluster from the command line on each node in the cluster with the command: 

    ```sh
    /opt/redislabs/bin/debuginfo
    ```

Upload the tar file to [Redis support](https://redis.com/company/support/). The path to the archive is shown in the command output.

## REST API method

You can also use [`debuginfo` REST API requests]({{< relref "/operate/rs/references/rest-api/requests/debuginfo" >}}) to create and download support packages.

To download debug info for all nodes:

```sh
GET /v1/debuginfo/all
```

To download debug info from all nodes that relates to a specific database, replace `<uid>` in the following request with the database ID:

```sh
GET /v1/debuginfo/all/bdb/<uid>
```
