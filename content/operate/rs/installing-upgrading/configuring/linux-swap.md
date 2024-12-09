---
Title: Configure swap for Linux
alwaysopen: false
categories:
- docs
- operate
- rs
description: Turn off Linux swap space.
linkTitle: Linux swap configuration
weight: $weight
---
Linux operating systems use swap space, which is enabled by default, to help manage memory (pages) by
copying pages from RAM to disk. Due to the way Redis Enterprise Software
utilizes and manages memory, it is best to prevent OS swapping. For more details, see [memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit.md" >}}). The
recommendation is to turn off Linux swap completely in the OS.

When you install or build the OS on the machine intended to host your Redis Enterprise Software cluster, avoid configuring swap partitions if possible.

## Turn off swap

To turn off swap in the OS of an existing server, VM, or instance, you
must have `sudo` access or be a root user to run the following commands:

1. Turn off swap:

    ```sh
    sudo swapoff -a
    ```

1. Comment out the swap partitions configured in `/etc/fstab` so swap remains off even after a reboot:

    ```sh
    sudo sed -i.bak 's/^[^#].*swap.*/#&/' /etc/fstab
    ```
