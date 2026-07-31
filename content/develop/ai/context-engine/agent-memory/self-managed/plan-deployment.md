---
Title: Plan a self-managed Agent Memory deployment
alwaysopen: false
categories:
- docs
- develop
- ai
description: Choose a self-managed Redis Agent Memory deployment mode before installing the Helm chart.
linkTitle: Plan a deployment
weight: 10
hideListLinks: true
---

Choose the deployment mode before you create Redis databases, configuration
Secrets, or Helm values.

## Deployment modes

{{< table-scrollable >}}
| Mode | What it deploys | Redis databases | Data Plane auth | Start here |
| --- | --- | --- | --- | --- |
| Static stores | Data Plane and, when enabled, Agent Memory workers. Stores are declared directly in `memory-dataplane.config.yaml`. | Store Redis. Job Redis when workers are enabled. | Disabled at the Agent Memory layer. Protect access with Kubernetes, ingress, gateway, or service-mesh controls. | [Deploy with static stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-static" >}}) |
| Control Plane managed stores | Data Plane, Control Plane, and, when enabled, Agent Memory workers. Stores and agent keys are managed at runtime. | Store Redis, Metadata Redis, and Job Redis when workers are enabled. | Auth-disabled Data Plane or Agent Memory agent keys. | [Deploy with Control Plane managed stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-control-plane" >}}) |
{{< /table-scrollable >}}

## Mode rules

Do not combine static `metadata.stores` with Control Plane managed store
metadata in the same Data Plane config. Static stores do not use Metadata Redis.
Control Plane managed stores use `metadata.source: live` and require Metadata
Redis.

Agent-key authentication requires Control Plane managed stores because the Data
Plane reads agent-key records and store grants from Metadata Redis.

The walkthroughs in this section use `redis-agent-memory` as the Helm release
name. If you choose a different release name, update release-derived service and
deployment names in the verification commands.

## Before you deploy

1. Review [prerequisites]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/prerequisites" >}}).
1. Prepare the appropriate [Data Plane configuration]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/data-plane-configuration" >}}).
1. Follow either [Deploy with static stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-static" >}}) or [Deploy with Control Plane managed stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-control-plane" >}}).
