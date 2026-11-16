---
title: Identity Service
description: Issue and check the agent keys that applications and agents present to Redis Iris services.
linkTitle: Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 29
hideListLinks: true
---

The Identity Service issues the agent keys that applications and agents present to Redis Iris services, and checks those keys for each service's data plane. It keeps the keys and their grants, and no service data.

## Deployment options

### Redis Cloud

On Redis Cloud, agent keys are managed for you: there is no Identity Service to deploy. Create each service's agent keys in the Redis Cloud console.

### Self-managed

The [`redis-iris` suite chart](/content/operate/iris/self-managed/_index.md) always installs the Identity Service, and registers each service you enable with it.

[Start with the self-managed guide](/content/operate/iris/identity-service/self-managed/_index.md).
