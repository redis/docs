---
Title: Manage installation questions
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes Redis Enterprise Software installation questions and how to
  answer them automatically.
linkTitle: Manage install questions
weight: 25
url: '/operate/rs/7.8/installing-upgrading/install/manage-installation-questions/'
---

Several questions are displayed during the Redis Enterprise Software installation process.

Here, you'll find a list of these questions and learn how to automatically answer these questions to perform a silent install.

## Installation questions

Several questions appear during installation:

- **Linux swap file** - `Swap is enabled. Do you want to proceed? [Y/N]?`

    We recommend that you [disable Linux swap]({{< relref "/operate/rs/7.8/installing-upgrading/configuring/linux-swap.md" >}}) in the operating system configuration
    to give Redis Enterprise Software control of the memory allocation.

- **Automatic OS tuning** - `Do you want to automatically tune the system for best performance [Y/N]?`

    To allow the installation process to optimize the OS for Redis Enterprise Software, answer `Y`.
    The installation process prompts you for additional information.

    The `/opt/redislabs/sbin/systune.sh` file contains details about the tuning process.

- **Network time** - `Do you want to set up NTP time synchronization now [Y/N]?`

    Redis Enterprise Software requires that all cluster nodes have synchronized time.
    You can either let the installation process configure NTP
    or you can [configure NTP manually]({{< relref "/operate/rs/7.8/clusters/configure/sync-clocks.md" >}}).

- **Firewall ports** - `Would you like to open RedisLabs cluster ports on the default firewall zone [Y/N]?`

    Redis Enterprise Software requires that all nodes have [specific network ports]({{< relref "/operate/rs/7.8/networking/port-configurations.md" >}}) open.
    To open the ports, you can:

    - Answer `Y` to let the installation process open these ports.
    - Answer `N` and configure the firewall manually for [RHEL/CentOS firewall]({{< relref "/operate/rs/7.8/installing-upgrading/configuring/centos-rhel-firewall" >}}).
    - Answer `N` and configure the firewall on the node manually for your OS.

- **Installation verification (rlcheck)** - `Would you like to run rlcheck to verify proper configuration? [Y/N]?`

    Run the `rlcheck` installation verification to make sure that the installation completed successfully.
    If you want to run this verification at a later time, you can run:
    
    ```sh
    /opt/redislabs/bin/rlcheck
    ```

- **User already exists** - `The user 'redislabs' already exists, which may lead to problems if it wasn't configured correctly. Would you like to proceed with the installation? (Y/N)?`

- **Group already exists** - `The group 'redislabs' already exists, which may lead to problems if it wasn't configured correctly. Would you like to proceed with the installation? (Y/N)?`
 
## Answer install questions automatically

To perform a silent (or automated) install, answer the questions when you start the [install]({{< relref "/operate/rs/7.8/installing-upgrading/install/install-on-linux" >}}).  

### Answer yes to all questions

To automatically answer `yes` to all questions (which accepts the default values), run the [installation script]({{< relref "/operate/rs/7.8/installing-upgrading/install/install-script" >}}) with the `-y` parameter:

```bash
./install.sh -y
```

### Configure file to answer

Use an answer file to manage your response:

1. Create a text file to serve as an answer file.

    The answer file can contain any of the parameters for the installation questions and indicate the answer for each question with `yes` or `no`.

    For example:

    ```sh
    ignore_swap=no
    systune=yes
    ntp=no
    firewall=no
    rlcheck=yes
    ignore_existing_osuser_osgroup=no
    ```

    If you use `systune=yes`, the installation answers `yes` to all of the system tuning questions.

1. Run the [installation script]({{< relref "/operate/rs/7.8/installing-upgrading/install/install-script" >}}) with the `-c` command-line option and add the path to the answer file.

    For example:

    ```sh
    ./install.sh -c /home/user/answers
    ```

