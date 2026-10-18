---
Title: Self-managed Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, and operate Redis Agent Playbooks on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
---

The `redis-agent-playbook` Helm chart deploys the Playbook control plane, data plane, Identity Service, and optional extraction worker. You provide Redis databases, an embedding provider, and a Playbook license.

The chart version that matches these guides is not published yet. Set the chart version and image tags from the approved release manifest when it becomes available. Do not use the source chart's development version as a release version.

## What you deploy

| Component | Purpose | Service port |
| --- | --- | --- |
| Control plane | Create playbooks and manage their settings and lifecycle. | `9200` |
| Data plane | Author and retrieve FAQs and skills, review proposals, and serve MCP requests. | `9201` |
| Identity Service | Issue application API keys and manage their playbook grants. | `9200` |
| Extraction worker | Optionally propose FAQs from connected Redis Agent Memory sessions. | `9203` |
| Metadata Redis | Store playbook configuration and identity records. | Customer-provided |
| Content Redis | Store entries, proposals, and search indexes. | Customer-provided |

Metadata and content require physically separate Redis deployments. The chart does not install Redis or configure ingress and certificates.

## Get started

1. [Plan your deployment]({{< relref "/operate/iris/agent-playbook/self-managed/plan-deployment" >}}).
2. Review the [prerequisites]({{< relref "/operate/iris/agent-playbook/self-managed/prerequisites" >}}).
3. Prepare the [configuration]({{< relref "/operate/iris/agent-playbook/self-managed/configuration" >}}).
4. [Deploy the chart]({{< relref "/operate/iris/agent-playbook/self-managed/deploy" >}}).
5. [Load administrative credentials]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#read-the-bootstrap-credentials" >}}).
6. [Create a playbook and application keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}).
7. Optional: [Configure background FAQ extraction]({{< relref "/operate/iris/agent-playbook/self-managed/extraction" >}}).

## Manage the deployment

- [Operations]({{< relref "/operate/iris/agent-playbook/self-managed/operations" >}}) covers health checks, credential rotation, backups, and upgrades.
- [Authentication and access]({{< relref "/operate/iris/agent-playbook/self-managed/authentication" >}}) covers application keys and OpenID Connect (OIDC) operator access.
- The [control-plane API reference]({{< relref "/operate/iris/agent-playbook/self-managed/control-plane-api-reference" >}}) describes self-managed administration. The [data-plane API reference]({{< relref "/develop/ai/context-engine/agent-playbook/api-reference" >}}) describes developer operations.
