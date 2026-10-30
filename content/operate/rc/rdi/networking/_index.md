---
Title: Networking
alwaysopen: false
categories:
- docs
- operate
- rc
description: Network reference for connecting a Data Integration pipeline to your source database.
hideListLinks: true
linkTitle: Networking
weight: 4
---

Configure connectivity for each source in your Data Integration pipeline. Sources can share an Amazon Web Services (AWS) PrivateLink endpoint service or use separate services. They can also use public endpoints where the [source requirements](/content/operate/rc/rdi/_index.md#prerequisites) permit them.

## Workspaces, sources, and targets

Create one Data Integration workspace for each Pro subscription that needs a pipeline. A workspace can run several pipelines. Each pipeline has its own sources, processor, and target Redis database in that subscription. The pipelines share the workspace's network range, RDI database, and virtual private cloud (VPC) endpoints.

Redis Cloud manages the workspace and its VPC endpoints. A public source uses an Internet Protocol (IP) address or hostname. For a customer-managed source, you manage the endpoint service, Network Load Balancer (NLB), and database access rules. The endpoint service must be in the same AWS region as the workspace.

### Share connectivity across pipelines

Sources in different pipelines can reuse the workspace's VPC endpoint for the same endpoint service. In this example, the `orders` and `inventory` pipelines share one endpoint, but use different NLB listener ports to reach different databases. The `orders` pipeline also has a public source. All resources use the same AWS region.

<div style="overflow-x: auto;" role="region" aria-label="Pipelines sharing workspace connectivity" tabindex="0">

```mermaid {width="100%"}
---
config:
  elk:
    nodePlacementStrategy: NETWORK_SIMPLEX
  flowchart:
    minNodeWidth: 60
    wrappingWidth: 140
    padding: 6
    diagramPadding: 4
---
graph TB
    subgraph subscription["Redis Cloud Pro subscription — Redis manages"]
        subgraph workspace["Data Integration workspace"]
            subgraph orders["Pipeline: orders"]
                sourceA1["Source<br/>orders-db"]
                sourceA2["Source<br/>catalog-db"]
                processorA["Processor"]
                sourceA1 -.-> processorA
                sourceA2 -.-> processorA
            end
            subgraph inventory["Pipeline: inventory"]
                sourceB1["Source<br/>inventory-db"]
                processorB["Processor"]
                sourceB1 -.-> processorB
            end
            endpoint["Shared VPC endpoint"]
            sourceA1 -->|Port 5432| endpoint
            sourceB1 -->|Port 5433| endpoint
        end
        targetA["Redis target<br/>orders"]
        targetB["Redis target<br/>inventory"]
        processorA -->|Write| targetA
        processorB -->|Write| targetB
    end
    subgraph customer["Your AWS networks — you manage"]
        shared["Endpoint service / NLB<br/>Two listeners"]
        db1["Orders database"]
        db2["Inventory database"]
        shared -->|Listener 5432| db1
        shared -->|Listener 5433| db2
    end
    publicDb["Catalog database<br/>Public IP or hostname"]
    endpoint -->|PrivateLink| shared
    sourceA2 -->|Public connection| publicDb
```

</div>

Source boxes represent configured sources. Solid arrows show initiated network connections. Dotted arrows show the logical data path from each source to its pipeline's processor through the shared RDI database, which the diagram omits. Each processor writes to its pipeline's target. The listener ports are examples. A listener can forward to a different database port.

### Connect several subscriptions to the same source

To write to targets in different subscriptions, create a workspace and pipeline in each subscription. You can reuse the same customer endpoint service and NLB, but each workspace needs its own VPC endpoint connection.

```mermaid {width="100%"}
graph TB
    subgraph subA["Redis Cloud Pro subscription A"]
        subgraph workspaceA["Workspace A"]
            sourceA["Pipeline: orders<br/>Source: orders-db"] --> endpointA["VPC endpoint A"]
        end
    end
    subgraph subB["Redis Cloud Pro subscription B"]
        subgraph workspaceB["Workspace B"]
            sourceB["Pipeline: reporting<br/>Source: orders-db"] --> endpointB["VPC endpoint B"]
        end
    end
    subgraph customer["Your AWS network — you manage"]
        service["Endpoint service / NLB"] --> db["Orders database"]
    end
    endpointA -->|PrivateLink| service
    endpointB -->|PrivateLink| service
```

## Choose your connectivity setup

| Your setup | What you configure |
|:--|:--|
| Several databases behind one NLB | Use a separate listener port and target group for each database. Enter the same endpoint service name for each source, with its matching listener port. Redis Cloud reuses the workspace's endpoint for that service. |
| Sources in different pipelines use the same endpoint service | Configure the service name for each source. The pipelines share the workspace's VPC endpoint for that service; adding a pipeline does not require a separate endpoint connection. |
| Databases in separate networks | Use separate endpoint services when one NLB cannot privately reach all databases. Configure the matching service for each source. Your source networks do not need to connect to each other. |
| The same source feeds several subscriptions | You can reuse your endpoint service and NLB. Each workspace needs its own VPC endpoint connection. Allow the principal shown for each workspace and accept each new connection. Configure and test the source in each pipeline. |
| Private and public sources in one pipeline | Choose connectivity separately for each source. For public sources, allow the outbound IP addresses shown in that workspace's console. |

Sharing an endpoint service does not share source configuration. Each source still needs its own connection details, credentials, and data selection. A second subscription does not reuse the first workspace's VPC endpoint.

## Set up customer-managed PrivateLink

1. [Create the NLB and endpoint service](/content/operate/rc/rdi/setup.md#set-up-connectivity). For shared connectivity, add a listener and target group for each database.
1. Allow the Redis Cloud principal shown in the console for each workspace that will connect.
1. [Configure each source](/content/operate/rc/rdi/define.md#source-connectivity) with its endpoint service name. Use the matching listener port in the source configuration.
1. Accept each new endpoint connection in your AWS endpoint service. Sources sharing an existing workspace endpoint do not need a new acceptance.
1. Share each source's [credentials](/content/operate/rc/rdi/setup.md#share-source-database-credentials).
1. Select **Test source** for every source.

You manage routes from the NLB to its database targets, database access rules, and target updates after failover. See the [AWS PrivateLink reference](/content/operate/rc/rdi/networking/aws-privatelink.md) for address visibility, databases outside the VPC, and failover.

## Managed source providers

MongoDB Atlas manages its endpoint service. Follow the [Atlas setup steps](/content/operate/rc/rdi/setup.md#set-up-connectivity): give Redis Cloud the Atlas service ID, then register the returned VPC endpoint ID in Atlas. Repeat the handshake for each workspace connection.

Provider requirements still apply. Snowflake is in Preview and must be hosted on AWS. Supabase AWS PrivateLink connectivity is not supported. Check the [source requirements](/content/operate/rc/rdi/_index.md#prerequisites) and [source setup instructions](/content/operate/rc/rdi/setup.md) before choosing connectivity.
