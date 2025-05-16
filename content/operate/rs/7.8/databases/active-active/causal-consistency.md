---
Title: Enable causal consistency
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable causal consistency  in an Active-Active database.
linkTitle: Causal consistency
weight: 70
url: '/operate/rs/7.8/databases/active-active/causal-consistency/'
---
When you enable causal consistency in Active-Active databases,
the order of operations on a specific key are maintained across all Active-Active database instances.

For example, if operations A and B were applied on the same key and the effect of A was observed by the instance that initiated B before B was applied to the key.
All instances of an Active-Active database would then observe the effect of A before observing the effect of B.
This way, any causal relationship between operations on the same key is also observed and maintained by every replica.

### Enable causal consistency

When you create an Active-Active database, you can enable causal consistency in the Cluster Manager UI:

1. In the **Participating clusters** section of the **Create Active-Active database** screen, locate **Causal Consistency**:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/create-a-a-db-participating-clusters.png" alt="The Participating clusters section of the Create Active-Active database screen.">}}

1. Click **Change** to open the **Causal Consistency** dialog.

1. Select **Enabled**:

    {{<image filename="images/rs/screenshots/databases/active-active-databases/enable-causal-consistency.png" alt="Enabled is selected in the Causal Consistency dialog.">}}

1. Click **Change** to confirm your selection.

After database creation, you can only turn causal consistency on or off using the REST API or `crdb-cli`.
The updated setting only affects commands and operations received after the change.

### Causal consistency side effects

When the causal consistency option is enabled, each instance maintains the order of operations it received from another instance
and relays that information to all other N-2 instances,
where N represents the number of instances used by the Active-Active database.

As a result, network traffic is increased by a factor of (N-2).
The memory consumed by each instance and overall performance are also impacted when causal consistency is activated.

