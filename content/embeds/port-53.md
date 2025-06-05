If port 53 is in use, the installation fails. This issue can occur in default installations of certain operating systems in which `systemd-resolved` (DNS server) or `dnsmasq` is running.

To prevent this issue, change the system configuration to make this port available before installation.

To prevent `systemd-resolved` from using port 53:

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

To prevent `dnsmasq` from using port 53:

1. Stop the `dnsmasq` service if it's running:

    ```sh
    sudo systemctl stop dnsmasq
    ```

1. Prevent `dnsmasq` from starting automatically at system boot:

    ```sh
    sudo systemctl disable dnsmasq
    ```

1. Mask `dnsmasq` to prevent it from being started manually or by other services:

    ```sh
    sudo systemctl mask dnsmasq
    ```

1. Verify `dnsmasq` is no longer active and won't start at system boot:

    ```sh
    sudo systemctl status dnsmasq
    ```
