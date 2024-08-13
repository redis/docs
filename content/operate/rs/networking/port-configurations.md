---
Title: Network port configurations
alwaysopen: false
categories:
- docs
- operate
- rs
description: This document describes the various network port ranges and their uses.
linkTitle: Network ports
weight: $weight
---

All Redis Enterprise Software deployments span multiple physical/virtual nodes. You'll need to keep several ports open between these nodes. This document describes the various port ranges and their uses.

{{< note >}}
Whenever you create a new database, you must verify that the ports assigned to the new database's endpoints are open. The cluster will not perform this verification for you.
{{< /note >}}

## Ports and port ranges used by Redis Enterprise Software

Redis Enterprise Software's port usage falls into three general categories:

- Internal: For traffic between or within cluster nodes
- External: For traffic from client applications or external monitoring resources
- Active-Active: For traffic to and from clusters hosting Active-Active databases

| Protocol | Port | Configurable | Connection source | Description |
|----------|------|--------------|-------------------|-------------|
| TCP | 8001 | <span title="Not configurable">&#x274c; No</span> | Internal, External | Traffic from application to Redis Enterprise Software [Discovery Service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}) |
| TCP | 8070 | <span title="Not configurable">&#x274c; No</span> | External | Metrics exported and managed by the web proxy |
| TCP | 3349, 8000, 8071, 9125 | <span title="Not configurable">&#x274c; No</span> | Internal | Internal metrics ports |
| TCP | 8443 | <span title="Configurable">&#x2705; Yes</span> | Internal, External | Secure (HTTPS) access to the management web UI |
| TCP | 9081 | <span title="Configurable">&#x2705; Yes</span> | Internal | CRDB coordinator for Active-Active management (internal) |
| TCP | 9443 (Recommended), 8080 | <span title="Configurable">&#x2705; Yes</span> | Internal, External, Active-Active | REST API traffic, including cluster management and node bootstrap |
| TCP | 10050 | <span title="Not configurable">&#x274c; No</span> | Internal | Zabbix monitoring |
| TCP | 10000-10049, 10051-19999 | <span title="Configurable">&#x2705; Yes</span> | Internal, External, Active-Active | Database traffic |
| UDP | 53, 5353 | <span title="Not configurable">&#x274c; No</span> | Internal, External | DNS/mDNS traffic |
| ICMP | * | <span title="Not configurable">&#x274c; No</span> | Internal | Connectivity checking between nodes |
| TCP | 1968 | <span title="Not configurable">&#x274c; No</span> | Internal | Proxy traffic |
| TCP | 3333-3345, 36379, 36380 | <span title="Not configurable">&#x274c; No</span> | Internal | Internode communication |
| TCP | 20000-29999 | <span title="Not configurable">&#x274c; No</span> | Internal | Database shard traffic |
| TCP | 8002, 8004, 8006 | <span title="Configurable">&#x2705; Yes</span> | Internal | Default system health monitoring (envoy admin, envoy management server, gossip envoy admin)|
| TCP | 8444, 9080 | <span title="Not configurable">&#x274c; No</span> | Internal | Traffic between web proxy and cnm_http/cm |

## Change port configuration

### Reserve ports

Redis Enterprise Software reserves some ports by default (`system_reserved_ports`). To reserve other ports or port ranges and prevent the cluster from assigning them to database endpoints, configure `reserved_ports` using one of the following methods:

- [rladmin cluster config]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}})

    ```sh
    rladmin cluster config reserved_ports <list of ports/port ranges>
    ```

    For example:

    ```sh
    rladmin cluster config reserved_ports 11000 13000-13010
    ```

- [Update cluster settings]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}) REST API request

    ```sh
    PUT /v1/cluster
    { "reserved_ports": ["list of ports/port ranges"] }
    ```

    For example:

    ```sh
    PUT /v1/cluster
    { "reserved_ports": ["11000", "13000-13010"] }
    ```

### Change the Cluster Manager UI port

The Redis Enterprise Software Cluster Manager UI uses port 8443, by default. You can change this to a custom port as long as the new port is not in use by another process.

To change this port, run:

```sh
rladmin cluster config cm_port <new-port>
```

After changing the Redis Enterprise Software web UI port, you must connect any new node added to the cluster to the UI with the custom port number:
`https://newnode.mycluster.example.com:`**`<nonstandard-port-number>`**

### Change the envoy  ports

For system health monitoring, Redis uses the following ports by default:

- Port 8002 for envoy admin

- Port 8004 for envoy management server

- Port 8006 for gossip envoy admin

You can change each envoy port to a custom port using the [`rladmin cluster config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}) command as long as the new port is not in use by another process. When you change `envoy_admin_port`, expect a restart of envoy.

To change the envoy admin port, run:

```sh
$ rladmin cluster config envoy_admin_port <new-port>
Updating envoy_admin_port... restarting now
```

To change the envoy management server port, run:

```sh
$ rladmin cluster config envoy_mgmt_server_port <new-port>
Cluster configured successfully
```

To change the gossip envoy admin port, run:

```sh
$ rladmin cluster config gossip_envoy_admin_port <new-port>
Cluster configured successfully
```

### Change the REST API port

For the REST API, Redis Enterprise Software uses port 9443 (secure) and port 8080 (not secure), by default. You can change this to a custom port as long as the new port is not in use by another process.

To change these ports, run:

```sh
rladmin cluster config cnm_http_port <new-port>
```

```sh
rladmin cluster config cnm_https_port <new-port>
```

### Ubuntu conflicts with port 53

{{<embed-md "port-53.md">}}


### Update `sysctl.conf` to avoid port collisions

{{<embed-md "port-collision-avoidance.md">}}


## Configure HTTPS

### Require HTTPS for API endpoints

By default, the Redis Enterprise Software API supports communication over HTTP and HTTPS. However, you can turn off HTTP support to ensure that API requests are encrypted.

Before you turn off HTTP support, make sure you migrate any scripts or proxy configurations that use HTTP to the encrypted API endpoint to prevent broken connections.

To turn off HTTP support for API endpoints, run:

```sh
rladmin cluster config http_support disabled
```

After you turn off HTTP support, traffic sent to the unencrypted API endpoint is blocked.


### HTTP to HTTPS redirection
Starting with version 6.0.12, you cannot use automatic HTTP to HTTPS redirection.
To poll metrics from the `metrics_exporter` or to access the Cluster Manager UI, use HTTPS in your request. HTTP requests won't be automatically redirected to HTTPS for those services. 

## Nodes on different VLANs

Nodes in the same cluster must reside on the same VLAN. If you can't
host the nodes on the same VLAN, then you must open [all ports]({{< relref "/operate/rs/networking/port-configurations.md" >}}) between them.
