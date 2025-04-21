---
Title: Set up a quorum node
alwaysopen: false
categories:
- docs
- operate
- rs
description: To reduce infrastructure costs, you can set up a quorum-only node with minimal resources.
linktitle: Set up a quorum node
weight: 30
---

Clusters require an odd number of nodes to maintain [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) and avoid [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) scenarios when making decisions. If you need to add another node to a cluster for quorum but want to provision fewer resources and reduce infrastructure costs, you can set up a quorum node instead of a regular node.

Quorum nodes participate in cluster quorum decisions and can act as a tiebreaker. However, they do not host database shards or endpoints, which reduces their resource requirements. A quorum node should have at least 2 cores and 8 GB of RAM. See the [hardware requirements]({{<relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements">}}) for more details and considerations.

## Enable quorum_only setting

1. Run [`rladmin status nodes`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status#status-nodes">}}) and find a node with no shards.

   In the following example, nodes without shards have `0/100` for the `SHARDS` column.

   ```bash
   $ rladmin status nodes
   CLUSTER NODES:
   NODE:ID    ROLE      ADDRESS             EXTERNAL_ADDRESS        HOSTNAME                SHARDS    CORES         FREE_RAM            PROVISIONAL_RAM        VERSION           STATUS
   node:1     master    192.0.2.0                                   3d99db1fdf4b            0/100     2             6.33GB/7.79GB       4.93GB/6.39GB          7.8.6-36          OK
   node:2     slave     198.51.100.0                                b87cc06c830f            2/100     2             6.44GB/7.79GB       1.04GB/6.39GB          7.8.6-36          OK
   *node:3    slave     203.0.113.0                                 fc7a3d332458            0/100     2             6.45GB/7.79GB       4.93GB/6.39GB          7.8.6-36          OK
   ```

2. Enable `quorum_only` for the node using [`rladmin tune node`]({{<relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-node">}}):
   ```bash
   $ rladmin tune node <node-id> quorum_only enabled
   ```

3. Rerun `rladmin status nodes` to verify the quorum node shows  `0/0` for `SHARDS` and `0KB/0KB` for `PROVISIONAL_RAM`.

   ```sh
   $ rladmin status nodes
   CLUSTER NODES:
   NODE:ID    ROLE      ADDRESS             EXTERNAL_ADDRESS        HOSTNAME                SHARDS    CORES         FREE_RAM            PROVISIONAL_RAM        VERSION           STATUS
   node:1     master    192.0.2.0                                   3d99db1fdf4b            0/100     2             6.33GB/7.79GB       4.93GB/6.39GB          7.8.6-36          OK
   node:2     slave     198.51.100.0                                b87cc06c830f            2/100     2             6.44GB/7.79GB       1.04GB/6.39GB          7.8.6-36          OK
   *node:3    slave     203.0.113.0                                 fc7a3d332458            0/0       2             6.45GB/7.79GB       0KB/0KB                7.8.6-36          OK
   ```
