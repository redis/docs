---
Title: Plan a self-managed Agent Playbooks deployment
alwaysopen: false
categories:
- docs
- operate
- iris
description: Choose storage, tenant, embedding, network, and credential settings before deploying Agent Playbooks.
linkTitle: Plan your deployment
weight: 10
hideListLinks: true
---

Choose the deployment's tenant, storage, and embedding configuration before you create playbooks.

## Deployment decisions

| Decision | What to plan |
| --- | --- |
| Tenant | Choose one `tenantId` for the deployment. Application grants must name that tenant. |
| Storage | Provision separate metadata and content Redis deployments. |
| Embeddings | Configure explicit provider, model, and dimension choices. Each playbook selects one at creation. |
| API exposure | Keep administrative services private. Expose the data plane to approved applications through your platform's network controls. |
| Credentials | Choose chart-generated service credentials or externally managed Secret references. Give applications separate scoped API keys. |
| Operator identity | Choose bootstrap tokens or OpenID Connect (OIDC) access for human operators. |
| Extraction | If you extract FAQ proposals from Redis Agent Memory, plan a durable queue, a generation model, workload identity, and network paths between both products. |

## Choose an embedding model

Each playbook's embedding identity is immutable. To change its model or dimensions, create a new playbook and migrate the content.

Set up the model in [Embedding configuration]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#embedding-configuration" >}}).

## Plan API exposure

The chart creates `ClusterIP` services. Your platform owns ingress, network policy, and TLS termination.

Keep the control plane and Identity Service private to approved operators and services. Applications use the data plane with playbook-scoped keys.

Use certificate-verified connections for production dependencies. Configure custom service endpoints and private CA trust through [Helm values]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#helm-values" >}}).

## Plan capacity and recovery

The published chart starts one replica of each service and leaves `resources` unset. These defaults are not a production sizing recommendation. Assign resource requests and limits, and leave capacity for old and new pods during upgrades.

Plan coordinated storage backups and configuration recovery in [Operations]({{< relref "/operate/iris/agent-playbook/self-managed/operations#back-up-the-deployment" >}}).

<!-- TODO: Add qualified production sizing and availability guidance for the launch release. -->
