---
alwaysopen: false
categories:
- docs
- operate
- rs
description: "The Redis Enterprise Software (RS)\_Nagios plugin enables you to monitor\
  \ the status of RS\_related objects and alerts. The RS\_alerts can be related to\
  \ the cluster, nodes, or databases."
linkTitle: Nagios integration
title: Nagios integration with Redis Enterprise Software
weight: 90
---
The Redis Enterprise Software (RS) Nagios plugin enables you to monitor the status of RS related
objects and alerts. The RS alerts can be related to the cluster, nodes,
or databases.

The alerts that can be monitored via Nagios are the same alerts that can
be configured in the RS UI in the Settings ­\> Alerts page, or the
specific Database ­\> Configuration page.

All alert configurations (active / not active, setting thresholds, etc')
can only be done through the RS UI, they cannot be configured in Nagios.
Through Nagios you can only view the status and information of the
alerts.

The full list of alerts can be found in the plugin package itself (in
"/rlec_obj/rlec_services.cfg" file, more details below).

RS Nagios plugin support API password retrieval from Gnome keyring,
KWallet, Windows credential vault, Mac OS X Keychain, if present, or
otherwise Linux Secret Service compatible password store. With no
keyring service available, the password is saved with base64 encoding,
under the user home directory.

## Configuring the Nagios plugin

In order to configure the Nagios plugin you need to copy the files that
come with the package into your Nagios environment and place them in a
Nagios configuration directory. Or, alternatively you can copy parts of
the package configuration into your existing Nagios configuration.

If Keyring capabilities are needed to store the password, python keyring
package should be installed and used by following the below steps from
the operating system CLI on Nagios machine:

1. pip install keyring ­to install the package (See
    https://pip.pypa.io/en/stable/installing/ on how to install python
    pip if needed).
1. keyring set RS-Nagios ­\<RS user email\> to set the password.
    User email should be identical to the email used in Nagios
    configuration and the password should be set using the same user
    that run the Nagios server.

Then, you need to update the local parameters, such as hostnames,
addresses, and object IDs, to the values relevant for your
RS deployment.

Finally, you need to set the configuration for each node and database
you would like to monitor. More details below.

The RS Nagios package includes two components:

- The plugin itself ­- with suffix "rlec_nagios_plugin"
- Configuration files - with suffix "rlec_nagios_conf"

Below is the list of files included in these packages and instructions
regarding what updates need to be made to these flies.

Note : The instructions below assume you are running on Ubuntu, have a
clean Nagios installation, and the base Nagios directory is
"/usr/local/nagios/"

### Step 1

Copy the folder named "libexec" from the plugin folder and its contents
to "/usr/local/nagios/"

These files included in it are:

- check_rlec_alert
- check_rlec_node
- check_rlec_bdb
- email_stub
- rlecdigest.py

Note : The check_rlec_alert, check_rlec_node, check_rlec_bdb files
are the actual plugin implementation. You can run each of them with a
"­h" switch in order to retrieve their documentation and their expected
parameters.

### Step 2

Add the following lines to your "nagios.cfg":

- cfg_dir=/usr/local/nagios/etc/rlec_obj
- cfg_dir=/usr/local/nagios/etc/rlec_local
- resource_file=/usr/local/nagios/etc/rlec_resource.cfg

### Step 3

Copy the configuration files along with their folders to
"/usr/local/nagios/etc" and make the required updates, as detailed
below.

1. Under the "/etc" folder:
    1. "rlec_resource.cfg " ­ holds global variables definitions for
        the user and password to use to connect to RS. You should update
        the variables to the relevant user and password for your
        deployment.
    1. "rlec_local " folder
    1. "rlec_obj" folder
1. Under the "/rlec_local" folder:
    1. "cluster.cfg " ­ holds configuration details at the cluster
        level. If you would like to monitor more than one cluster then
        you need to duplicate the two existing entries in the file for
        each cluster.
        1. The first "define host" section defines a variable for the
            IP address of the cluster that is used in other
            configuration files.
            1. Update the "address" to the Cluster Name (FQDN) as
                defined in DNS, or the IP address of one of the nodes in
                the cluster.
            1. If you are configuring more than one RS then when
                duplicating this section you should make sure:
                1. The "name" is unique.
        1. In the second "define host" section:
            1. The "host_name " in each entry must be unique.
            1. The "display_name" in each entry can be updated to a
                user-friendly name that are shown in Nagios UI.
    1. "contacts.cfg " ­ holds configuration details who to send emails
        to. It should be updated to values relevant for your deployment.
        If this file already exists in your existing Nagios environment
        then you should update it accordingly.
    1. "databases.cfg" ­ holds configuration details of the databases
        to monitor. The "define host" section should be duplicated for
        every database to monitor.
        1. "host_name" should be a unique value.
        1. "display_name " should be updated to a user-friendly name
            to show in the UI.
        1. "_RLECID " should be the database's internal ID that can
            be retrieved from
            [`rladmin status`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status" >}}) command output.
    1. "nodes.cfg " ­ holds configuration details of the nodes in the
        cluster. The "define host" section should be duplicated for
        every node in the cluster.
        1. "host_name" should be a unique value.
        1. "display_name " should be updated to a user-friendly name
            to show in the UI.
        1. "address" should be updated to the DNS name mapped to the
            IP address of the node, or to the IP address itself.
        1. "_RLECID " should be the node's internal ID that can be
            retrieved
            from [`rladmin status`]({{< relref "/operate/rs/references/cli-utilities/rladmin/status" >}}) command output.
    1. Under the "/rlec_obj" folder:
        1. "rlec_cmd.cfg" ­ holds configuration details of how to
            activate the plugin. No need to make any updates to it.
        1. "rlec_groups.cfg" holds definitions of host groups. No need
            to make any updates to it.
        1. "rlec_services.cfg" holds definitions of all alerts that
            are monitored. No need to make any updates to it.
        1. "rlec_templates.cfg" holds general RS Nagios definitions.
            No need to make any updates to it.
