---
title: Featureform
description: Use Featureform with Redis to define, apply, inspect, and serve machine learning features.
linkTitle: Featureform
weight: 60
hideListLinks: true
bannerText: Featureform is currently in preview and subject to change. To request access to the Featureform Docker image, contact your Redis account team.
bannerChildren: true
---

Featureform helps teams define, manage, materialize, and serve machine learning features while keeping existing data systems in place. In the documented workflow, Redis acts as the low-latency online store for feature serving.

This section is organized around the way teams actually adopt Featureform: platform setup, workspace access, provider and secret registration, definitions-file authoring, apply, and serving.

## Get started

- [Get started overview]({{< relref "/develop/ai/featureform/get-started/overview" >}})
- [Quickstart feature workflow]({{< relref "/develop/ai/featureform/get-started/quickstart-feature-workflow" >}})

## Admin

- [Auth and RBAC overview]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/overview" >}})
- [Create a workspace and grant access]({{< relref "/develop/ai/featureform/admin/auth-and-rbac/create-a-workspace-and-grant-access" >}})
- [Deployment overview]({{< relref "/develop/ai/featureform/admin/deployment/overview" >}})
- [Deploy Featureform on Kubernetes]({{< relref "/develop/ai/featureform/admin/deployment/deploy-featureform-on-kubernetes" >}})

## Concepts

- [Resources and the workspace graph]({{< relref "/develop/ai/featureform/concepts/resources-and-workspace-graph" >}})
- [Providers and provider roles]({{< relref "/develop/ai/featureform/concepts/providers-and-provider-roles" >}})
- [Secrets and secret references]({{< relref "/develop/ai/featureform/concepts/secrets-and-secret-references" >}})
- [Serving and feature views]({{< relref "/develop/ai/featureform/concepts/serving-and-feature-views" >}})

## How-to

- [Configure secret providers]({{< relref "/develop/ai/featureform/how-to/secrets/configure-secret-providers" >}})
- [Register providers]({{< relref "/develop/ai/featureform/how-to/providers/register-providers" >}})
- [Apply a definitions file]({{< relref "/develop/ai/featureform/how-to/apply/apply-a-definitions-file" >}})
- [Inspect materialized locations]({{< relref "/develop/ai/featureform/how-to/catalog/inspect-materialized-locations" >}})
- [Serve features in Python]({{< relref "/develop/ai/featureform/how-to/serve/serve-features-in-python" >}})

## Tutorials

- [Work with a Python definitions file]({{< relref "/develop/ai/featureform/tutorials/work-with-a-python-definitions-file" >}})
- [Build your first feature workflow]({{< relref "/develop/ai/featureform/tutorials/build-your-first-feature-workflow" >}})

## Reference

- [gRPC services]({{< relref "/develop/ai/featureform/reference/api/grpc-services" >}})
- [ff CLI]({{< relref "/develop/ai/featureform/reference/cli/ff-cli" >}})
- [Python client and DSL]({{< relref "/develop/ai/featureform/reference/python/python-dsl" >}})
- [Roles and permissions]({{< relref "/develop/ai/featureform/reference/rbac/roles-and-permissions" >}})
