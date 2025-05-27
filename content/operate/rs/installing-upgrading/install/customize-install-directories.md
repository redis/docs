---
Title: Customize installation directories
alwaysopen: false
categories:
- docs
- operate
- rs
description: Customize Redis Enterprise Software installation directories.
linkTitle: Customize install locations
weight: 30
---

When you install Redis Enterprise Software on Red Hat Enterprise Linux, you can customize the installation directories.

The files are installed in the `redislabs` directory located in the path that you specify.

{{< note >}}
Custom installation is required if you plan to specify custom storage paths for persistent or ephemeral storage during cluster setup. If you install Redis Enterprise Software to default directories, you cannot specify custom storage paths during cluster creation.
{{< /note >}}

## Considerations

- When you install with custom directories, the installation does not run as an RPM file.

- If a `redislabs` directory already exists in the path that you specify, the installation fails.

- All nodes in a cluster must be installed with the same file locations.

- Custom installation directories are not supported for databases using Auto Tiering.

- [Configure different mount points for data and log directories](#config-diff-data-log-dirs).

## Specify file locations

You can specify these file locations:

| Files               | Installer flag | Example parameter | Example file location |
| ------------------- | -------------- | ----------------- | --------------------- |
| Binaries files      | --install-dir  | /opt              | /opt/redislabs        |
| Configuration files | --config-dir   | /etc/opt          | /etc/opt/redislabs    |
| Data and log files  | --var-dir      | /var/opt          | /var/opt/redislabs    |

These files are not in the custom directories:

- OS files
    - /etc/cron.d/redislabs
    - /etc/firewalld/services
    - /etc/firewalld/services/redislabs-clients.xml
    - /etc/firewalld/services/redislabs.xml
    - /etc/ld.so.conf.d/redislabs_ldconfig.conf.tmpl
    - /etc/logrotate.d/redislabs
    - /etc/profile.d/redislabs_env.sh
    - /usr/lib/systemd/system/rlec_supervisor.service.tmpl
    - /usr/share/selinux/mls/redislabs.pp
    - /usr/share/selinux/targeted/redislabs.pp

- Installation reference files
    - /etc/opt/redislabs/redislabs_custom_install_version
    - /etc/opt/redislabs/redislabs_env_config.sh

To specify directories during [installation]({{< relref "/operate/rs/installing-upgrading/install/install-on-linux" >}}), include installer flags as [command-line options]({{< relref "/operate/rs/installing-upgrading/install/install-script" >}}) when you run the `install.sh` script. For example:

```sh
sudo ./install.sh --install-dir <path> --config-dir <path> --var-dir <path>
```

## Configure different mount points for data and log directories {#config-diff-data-log-dirs}

To configure different mount points for data and log directories, use symbolic links:

1. Create a symbolic link for the data directory:

    ```sh
    ln -s /var/opt/redislabs/data </path/to/data/mount/point>
    ```

1. Create a symbolic link for the log directory:

    ```sh
    ln -s /var/opt/redislabs/log </path/to/log/mount/point>
    ```

## Custom storage paths

When you install Redis Enterprise Software to custom directories, you can specify custom storage paths for persistent and ephemeral storage during [cluster setup]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) or when [adding nodes]({{< relref "/operate/rs/clusters/add-node" >}}).

### Prerequisites for custom storage paths

Before specifying custom storage paths during cluster setup:

1. Install Redis Enterprise Software to custom directories using the `--install-dir`, `--config-dir`, and `--var-dir` flags.

2. Ensure proper permissions: The custom storage directories must have full permissions for the `redislabs` user and group (`redislabs:redislabs`).

3. Verify mount points: Custom storage paths must be properly mounted and accessible.

### Troubleshooting custom storage paths

If you encounter the error "path entered is not mounted. Please correct" when specifying custom storage paths:

1. Verify the installation method: Ensure Redis Enterprise Software was installed using custom directories. If you used the default installation (`sudo ./install.sh` without custom directory flags), you cannot specify custom storage paths.

2. Check directory permissions: Ensure the `redislabs` user has full access to the specified directories:
   ```sh
   sudo chown -R redislabs:redislabs /path/to/custom/storage
   sudo chmod -R 755 /path/to/custom/storage
   ```

3. Verify mount points: Confirm the storage path is properly mounted:
   ```sh
   df -h /path/to/custom/storage
   mount | grep /path/to/custom/storage
   ```

4. Check directory existence: Ensure the directory exists and is accessible:
   ```sh
   ls -la /path/to/custom/storage
   ```

For more information about storage requirements, see [Persistent and ephemeral node storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

## Limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use custom installation directories.

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.
