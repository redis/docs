If port 53 is in use, the installation fails. This can occur in
default installations of Ubuntu 18.04 and 20.04 in which `systemd-resolved` (DNS server) is running.

To prevent this issue, change the system configuration to make this port available
before installation.

1. Edit `/etc/systemd/resolved.conf`: 

    ```sh
    sudo vi /etc/systemd/resolved.conf
    ```

1. Add `DNSStubListener=no` as the last line in the file and save the file.

1. Rename the current `/etc/resolv.conf` file:

    ```sh
    sudo mv /etc/resolv.conf /etc/resolv.conf.orig
    ```

1. Create a symbolic link for `/etc/resolv.conf`:

    ```sh
    sudo ln -s /run/systemd/resolve/resolv.conf /etc/resolv.conf
    ```

    {{< note >}}
You might encounter a temporary name resolution error (`sudo: unable to resolve host {hostname}: Temporary failure in name resolution`), which should be fixed when you restart `systemd-resolved` in the next step.
    {{< /note >}}

2. Restart the DNS service:

    ```sh
    sudo service systemd-resolved restart
    ```
