---
Title: Multi-IP and IPv6
alwaysopen: false
categories:
- docs
- operate
- rs
description: Information and requirements for using multiple IP addresses or IPv6
  addresses with Redis Enterprise Software.
linkTitle: Multi-IP and IPv6
weight: $weight
---
Redis Enterprise Software (RS) supports server/instances/VMs with
multiple IP addresses, as well as IPv6 addresses.

## Traffic overview

RS related traffic can be logically and physically divided into internal
traffic and external traffic:

- "Internal traffic" refers to internal cluster communications, such
    as communications between the nodes for cluster management purposes.
- "External traffic" refers to communications between the clients and
    the databases, as well as connections to the management UI in the
    browser.

When only one IP address exists on a machine that serves as an RS node,
it is used for both internal and external traffic.

## Multiple IP addresses

When more than one IP address exists on an RS node:

- One of the IPv4 addresses is used for internal traffic
- Other IP addresses may only be used for external traffic

As part of the node configuration process, if the machine has multiple
IP addresses, you are required to assign one of the machine's IPv4
addresses for internal traffic use, and assign one or more IPv4/IPv6
addresses for external traffic.

If at a later stage you would like to update the IP address allocation,
run the relevant commands in [`rladmin` command-line interface
(CLI)]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}).

## Change internal IP address

When manually configuring an internal address for a node, make sure the address is valid and bound to an active interface on the node. Failure to do so prevents the node from coming back online and rejoining the
cluster.

To update a node's internal IP address:

1. Turn the node into a replica using [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin/node/enslave" >}}):

    ```sh
    rladmin node <ID> enslave demote_node
    ```

1. Deactivate the `rlec_supervisord` service on the node:

    ```sh
    systemctl disable rlec_supervisord 
    ```

1. Restart the node.

1. Follow the operating system vendor's instructions to change the node's IP address.

1. From a different cluster node, use [`rladmin node addr set`]({{< relref "/operate/rs/references/cli-utilities/rladmin/node/addr" >}}) to update the first node's IP address:

    ```sh
    rladmin node <ID> addr set <IP address>
    ```

1. Enable the `rlec_supervisord` service on the node:

    ```sh
    systemctl enable rlec_supervisord 
    ```

1. Restart `rlec_supervisord` or restart the node.


    ```sh
    systemctl start rlec_supervisord
    ```

1. Verify the node rejoined the cluster:

    ```sh
    rladmin status nodes
    ```

Repeat this procedure for other cluster nodes to change their internal IP addresses.

## Configure external IP addresses

You can configure external addresses that are not bound to an active interface, but are otherwise mapped or configured to route traffic to the node (such as AWS Elastic IPs or a load balancer VIP).

You can use [rladmin node external_addr]({{< relref "/operate/rs/references/cli-utilities/rladmin/node/external-addr" >}}) to change a node's external IP addresses.

Add an external IP address:

```sh
rladmin node <ID> external_addr add <IP address>
```

Set one or more external IP addresses:

```sh
rladmin node <ID> external_addr set <IP address 1> <IP address N>
```


Remove an external IP address:

```sh
rladmin node <ID> external_addr remove <IP address>
```

{{< note >}}
While [joining a new node to a
cluster]({{< relref "/operate/rs/clusters/add-node.md" >}})
during the node bootstrap process,
when prompted to provide an IP of an existing node in the cluster,
if you use the node's IP, provide the node's internal IP address.
{{< /note >}}
