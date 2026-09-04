---
Title: Plan a self-managed LangCache deployment
alwaysopen: false
categories:
- docs
- operate
- iris
description: Choose a self-managed LangCache deployment mode before installing the Helm chart.
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
| Static caches | Data Plane only. Caches are declared directly in `dataplane.config.yaml`. | Cache Redis. | Disabled by default. Protect access with Kubernetes, ingress, gateway, or service-mesh controls, or enable the legacy per-cache token auth described in [Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}). | [Deploy with static caches]({{< relref "/operate/iris/langcache/self-managed/deploy-static" >}}) |
| Control Plane managed caches | Data Plane, Control Plane, and (for agent-key auth) the shared Identity Service. Caches are created and managed at runtime. | Cache Redis and Metadata Redis. | Agent-key authentication through the Identity Service. | [Deploy with Control Plane managed caches]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}}) |
{{< /table-scrollable >}}

## Mode rules

Do not combine static `metadata.caches` with Control Plane managed cache
metadata in the same Data Plane process. Static caches do not use Metadata
Redis. Control Plane managed caches use `metadata.loader: live` and require
Metadata Redis.

Static caches use one embedding contract per cache, configured directly in
`dataplane.config.yaml`. Control Plane managed caches use one embedding
contract for the whole deployment: the Control Plane and Data Plane must be
configured with the same provider, model, and dimensions, and cache creation
cannot override it or supply per-cache embedding credentials.

The walkthroughs in this section use `langcache` as the Helm release name for
the Data Plane. If you choose a different release name, update
release-derived service and deployment names in the verification commands.

## Before you deploy

1. Review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}}).
1. Prepare the appropriate [Data Plane configuration]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration" >}}).
1. Follow either [Deploy with static caches]({{< relref "/operate/iris/langcache/self-managed/deploy-static" >}}) or [Deploy with Control Plane managed caches]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}}).
