---
Title: Set up a quorum node
alwaysopen: false
categories:
- docs
- operate
- rs
description: To reduce infrastucture costs, you can set up a quorum-only node with minimal resources.
linktitle: Set up a quorum node
weight: 30
---

Clusters require an odd number of nodes to maintain [quorum](https://en.wikipedia.org/wiki/Quorum_(distributed_computing)) and avoid [split-brain](https://en.wikipedia.org/wiki/Split-brain_(computing)) scenarios when making decisions. If you need to add another node to a cluster for quorum but want to provision less resources to reduce infrastructure costs, you can set up a quorum node instead of a regular node.

Quorum nodes only participate in voting for cluster quorum decisions and can act as a tiebreaker.

Because quorum nodes do not host database shards or endpoints, they have lower resource requirements. A quorum node should have at least 2 cores and 8 GB of RAM. See [hardware requirements]({{<relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements">}}) for more details and considerations.

## Enable quorum_only setting

1. Run `rladmin status node` and find a node with no shards:

   ```bash
   rladmin status node
   ```

2. Enable `quorum_only` for the node using [`rladmin tune node`]({{<relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-node">}}):
   ```bash
   rladmin tune node <quorum-node-id> quorum_only enabled
   ```

3. Rerun `rladmin status node` to verify. The quorum node will show:
   - `0/0` shards  
   - `0KB/0KB` provisional RAM  
