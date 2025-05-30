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

## Customize storage paths

When you install Redis Enterprise Software to custom directories, you can specify custom storage paths for persistent and ephemeral storage during [cluster setup]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) or when [adding nodes]({{< relref "/operate/rs/clusters/add-node" >}}).


1. Specify the custom file location with the `--var-dir` option when you install Redis Enterprise Software:

    ```sh
    sudo ./install.sh --var-dir <path>
    ```

2. Grant the `redislabs` user access to the custom directories:
   ```sh
   $ sudo chown -R redislabs:redislabs /path/to/custom/storage
   $ sudo chmod -R 755 /path/to/custom/storage
   ```

3. Confirm the storage path is properly mounted:
   ```sh
   $ df -h /path/to/custom/storage
   $ mount | grep /path/to/custom/storage
   ```

4. Verify the directory exists and is accessible:
   ```sh
   ls -l /path/to/custom/storage
   ```

For more information about storage requirements, see [Persistent and ephemeral node storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

## Limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use custom installation directories.

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.
