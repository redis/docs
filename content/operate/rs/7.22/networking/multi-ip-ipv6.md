---
Title: Manage IP addresses
alwaysopen: false
categories:
- docs
- operate
- rs
description: Information and requirements for using multiple IP addresses or IPv6
  addresses with Redis Enterprise Software.
linkTitle: Manage IP addresses
weight: $weight
url: '/operate/rs/7.22/networking/multi-ip-ipv6/'
---
Redis Enterprise Software supports servers, instances, and VMs with
multiple IPv4 or IPv6 addresses.

## Traffic overview

Redis Enterprise Software traffic is divided into internal traffic and external traffic:

- "Internal traffic" refers to internal cluster communications, such as communications between the nodes for cluster management.

- "External traffic" refers to communications between clients and databases and connections to the Cluster Manager UI.

When only one IP address exists on a machine that serves as a Redis Enterprise node, it is used for both internal and external traffic.

## Multiple IP addresses

During node configuration on a machine with multiple IP addresses, you must assign one address for internal traffic and one or more other addresses for external traffic.

If the cluster uses IPv4 for internal traffic, all communication between cluster nodes uses IPv4 addresses. If the cluster uses IPv6 for internal traffic, all communication between cluster nodes uses IPv6 addresses.

To update IP address configuration after cluster setup, see [Change internal IP address](#change-internal-ip-address) or [Configure external IP addresses](#configure-external-ip-addresses).

## Enable IPv6 for internal traffic

IPv6 for internal communication is supported only for new clusters with Redis Enterprise Software version 7.4.2 or later.

If the server has only IPv6 interfaces, IPv6 is automatically used for internal and external traffic. Otherwise, internal traffic uses IPv4 by default. 

To use IPv6 for internal traffic on a machine with both IPv4 and IPv6 interfaces, set `use_internal_ipv6` to `true` when you create a cluster using the [bootstrap REST API request]({{< relref "/operate/rs/7.22/references/rest-api/requests/bootstrap#post-bootstrap" >}}):

```sh
POST /v1/bootstrap/create_cluster
{
    "action": "create_cluster",
    "cluster": { 
        "name": "cluster.fqdn" 
    },
    "credentials": {
       "username": "admin_username",
       "password": "admin_password"
    },
    "node": {
       "identity": {
          "addr": "2001:DB8::/32",
          "external_addr": ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
          "use_internal_ipv6": true
       },
    },
    ...
}
```

When other IPv6 nodes join a cluster that has `use_internal_ipv6` enabled, they automatically use IPv6 for internal traffic. Do not manually set `use_internal_ipv6` when joining a node to an existing IPv6 cluster, or a `NodeBootstrapError` can occur if the values do not match.

If you try to add a node without an IPv6 interface to a cluster that has `use_internal_ipv6` enabled, a `NodeBootstrapError` occurs.

The host file `/etc/hosts` on each node in the cluster must include the following entry:

```sh
::1 localhost
```

## Change internal IP address

Before you change an internal IP address, consider the following:

- Verify the address is valid and bound to an active interface on the node. Failure to do so prevents the node from coming back online and rejoining the cluster.

- Joining a node that only has IPv4 network interfaces to a master node with IPv6 enabled causes a `NodeBootstrapError`.

- Joining a node that only has IPv6 network interfaces to a master node that does not have IPv6 enabled causes a `NodeBootstrapError`.

- You cannot change the internal address from IPv4 to IPv6 or IPv6 to IPv4 in a running cluster. You can only change the internal address within the same protocol as the cluster.

If you need to update the internal IP address in the OS, one option is to remove that node from the cluster, change the IP address, and then add the node back into the cluster.

Alternatively, you can use the following steps to update a node's internal IP address without removing it from the cluster:

1. Turn the node into a replica using [`rladmin`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/node/enslave" >}}):

    ```sh
    rladmin node <ID> enslave demote_node
    ```

1. Deactivate the `rlec_supervisor` service on the node:

    ```sh
    systemctl disable rlec_supervisor 
    ```

1. Restart the node.

1. Follow the operating system vendor's instructions to change the node's IP address.

1. From a different cluster node, use [`rladmin node addr set`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/node/addr" >}}) to update the first node's IP address:

    ```sh
    rladmin node <ID> addr set <IP address>
    ```

1. Enable the `rlec_supervisor` service on the node:

    ```sh
    systemctl enable rlec_supervisor 
    ```

1. Restart `rlec_supervisor` or restart the node.


    ```sh
    systemctl start rlec_supervisor
    ```

1. Verify the node rejoined the cluster:

    ```sh
    rladmin status nodes
    ```

Repeat this procedure for other cluster nodes to change their internal IP addresses.

## Configure external IP addresses

You can configure external addresses that are not bound to an active interface, but are otherwise mapped or configured to route traffic to the node (such as AWS Elastic IPs or a load balancer VIP).

You can use [rladmin node external_addr]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/node/external-addr" >}}) to change a node's external IP addresses.

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
cluster]({{< relref "/operate/rs/7.22/clusters/add-node.md" >}})
during the node bootstrap process,
when prompted to provide an IP of an existing node in the cluster,
if you use the node's IP, provide the node's internal IP address.
{{< /note >}}

## Known limitations

- Using IPv6 for internal traffic is supported only for new clusters running Redis Enterprise Software version 7.4.2 or later.

- Changing an existing cluster's internal traffic from IPv4 to IPv6 is not supported.

- All nodes must use the same protocol for internal traffic.

- If a Redis Enterprise node's host machine has both IPv4 and IPv6 addresses, internal communication within the node initially uses IPv4 until the bootstrap process finishes.
