---
title: Self-managed Redis Iris
description: Deploy and operate Redis Iris services on your own Kubernetes cluster.
linkTitle: Self-managed
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 20
---

A self-managed Redis Iris deployment runs the Iris services on your own Kubernetes cluster, with Redis databases you provide. Each service needs a license key from Redis. Contact your Redis representative or [contact sales](https://redis.io/contact/).

## Deploy Redis Iris

<!-- TODO: document the Redis Iris Helm chart here when its 1.0.0 release publishes. It deploys the Identity Service, Agent Memory, Agent Playbooks, and the Redis Iris UI as one release, then SSO, Agent Playbooks extraction, Lens, Context Gateway, and Intent Router. Move shared settings out of the service guides into this section. -->

Deploy each service with its own Helm chart, as its guide describes.

## Shared components

- **Identity Service.** It issues and checks the agent keys that applications use to call each service. Each service guide covers connecting to it. The [Agent Memory guide](/content/operate/iris/self-managed/agent-memory/_index.md) also covers installing the `iris-identity-service` chart as its own release.
- **Redis Iris UI and single sign-on (SSO).** <!-- TODO: add the operator guides for the Redis Iris UI chart and SSO. --> Operator guides for the UI and SSO aren't published yet.

## Services

- [Redis Agent Memory](/content/operate/iris/self-managed/agent-memory/_index.md)
- [Redis Context Gateway](/content/operate/iris/self-managed/context-gateway/_index.md)
- [Redis Intent Router](/content/operate/iris/self-managed/intent-router/_index.md)

<!-- TODO: add Agent Playbooks when #4256 merges, and Lens (MOD-18980), as subsections of this section. -->

To create services and agent keys from a terminal after you deploy, use the [iris CLI](/content/operate/iris/cli.md).
