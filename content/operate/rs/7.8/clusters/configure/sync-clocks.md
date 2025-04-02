---
Title: Synchronize cluster node clocks
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sync node clocks to avoid problems with internal custer communication.
linktitle: Sync node clocks
weight: 30
url: '/operate/rs/7.8/clusters/configure/sync-clocks/'
---
To avoid problems with internal cluster communications that can impact your data integrity,
make sure that the clocks on all of the cluster nodes are synchronized using Chrony and/or NTP.

When you install Redis Enterprise Software,
the install script checks if Chrony or NTP is running.
If they are not, the installation process asks for permission to configure a scheduled Cron job.
This should make sure that the node's clock is always synchronized.
If you did not confirm configuring this job during the installation process,
you must use the Network Time Protocol (NTP) regularly to make sure that all server clocks are synchronized.

To synchronize the server clock, run the command that is appropriate for your operating system.

## Set up NTP synchronization

To set up NTP synchronization, see the following sections for instructions for specific operating systems.

### Ubuntu 18.04 and Ubuntu 20.04

1. Install Chrony, a replacement for NTP:
   ```sh
   sudo apt install chrony
   ```
   
1. Edit the Chrony configuration file:
   ```sh
   sudo nano /etc/chrony/chrony.conf
   ```

1. Add `server pool.ntp.org` to the file, replace `pool.ntp.org` with your own NTP server, then save.

1. Restart the Chrony service: 
   ```sh
   sudo systemctl restart chrony
   ```

1. Check the Chrony service status:
   ```sh
   sudo systemctl status chrony
   ```
   
For more details, refer to the official [Ubuntu 20.04 documentation](https://ubuntu.com/server/docs/network-ntp).

### RHEL 7

1. Install Chrony, a replacement for NTP:
   ```sh
    sudo yum install chrony
   ```

1. Edit the Chrony configuration file:
   ```sh
   sudo nano /etc/chrony.conf
   ```

1. Add `server pool.ntp.org` to the file, replace `pool.ntp.org` with your own NTP server, then save.

1. Enable and start the Chrony service:
   ```sh 
   sudo systemctl enable chronyd && sudo systemctl start chronyd
   ```

1. Check the Chrony service status:
   ```sh
   sudo systemctl status chronyd
   ```

For more details, refer to the official [RHEL 7 documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/system_administrators_guide/ch-configuring_ntp_using_the_chrony_suite#sect-Using_chrony).

### RHEL 8 and RHEL 9

1. Install Chrony, a replacement for NTP:
   ```sh
   sudo dnf install chrony
   ```

1. Edit the Chrony configuration file:
   ```sh
   sudo nano /etc/chrony.conf
   ```

1. Add `server pool.ntp.org` to the file, replace `pool.ntp.org` with your own NTP server, then save.

1. Enable and start the Chrony service:
   ```sh
   sudo systemctl enable chronyd && sudo systemctl start chronyd
   ```

1. Check the Chrony service status:
   ```sh
   sudo systemctl status chronyd
   ```

For more details, refer to the official [RHEL 8 and 9 documentation](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_basic_system_settings/configuring-time-synchronization_configuring-basic-system-settings).

### Amazon Linux 2

1. Install Chrony, a replacement for NTP:
   ```sh
   sudo yum install chrony
   ```

1. Edit the Chrony configuration file:
   ```sh
    sudo nano /etc/chrony.conf
   ```

1. Add `server pool.ntp.org` to the file, replace `pool.ntp.org` with your own NTP server, then save.

1. Enable and start the Chrony service:
   ```sh
   sudo systemctl enable chronyd && sudo systemctl start chronyd
   ```

1. Check the Chrony service status:
   ```sh
   sudo systemctl status chronyd
   ```

For more details, refer to the official [Amazon Linux 2 documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/set-time.html).

If you are using Active-Active databases, you must use [Network Time Service (ntpd)]({{< relref "/operate/rs/7.8/databases/active-active/_index.md#network-time-service-ntp-or-chrony" >}})
to synchronize OS clocks consistently across clusters to handle conflict resolution according to the OS time.
