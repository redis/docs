---
Title: Self-managed Agent Playbooks prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare Kubernetes, Redis, provider access, and license material for a self-managed Agent Playbooks deployment.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

## Required software and access

| Requirement | Purpose |
| --- | --- |
| Kubernetes cluster and `kubectl` | Run the services and create Secrets in the deployment namespace. |
| [Helm 3](https://docs.helm.sh/docs/v3/intro/install/) | Install `redis-ai/redis-agent-playbook` from `https://helm.redis.io/ai`. Check `helm version --short`. |
| Bash, curl, and jq | Run the administrative API examples. Use a curl version that supports `--fail-with-body`. |
| License | A Playbooks license or an Iris suite license that includes Playbooks. Contact your Redis representative. |
| Embedding provider credentials | Configure a provider and model that the deployment can reach. |

<!-- TODO: Confirm the supported Kubernetes versions, platforms, and production sizing for the launch release. -->

## Redis databases

The chart consumes existing Redis deployments. It does not provision them.

| Redis deployment | Requirements | Use |
| --- | --- | --- |
| Metadata | Core Redis commands and Lua scripting. | Playbook configuration and Identity Service records. |
| Content | JSON and Search capabilities, including vector indexes. | Authored content, proposals, and retrieval. |

Use physically separate deployments for metadata and content. Different database numbers or credentials on the same Redis endpoint do not satisfy this requirement.

The Identity Service can use the metadata deployment with a separate Redis user. Prepare authenticated Redis URLs and trust the issuing certificate authority when using `rediss://`.

## Images and network access

Chart `0.1.0-alpha.3` supplies these image tags:

| Component | Image |
| --- | --- |
| Control plane | `redislabs/iris-agent-playbook-control:0.1.0-alpha.3` |
| Data plane | `redislabs/iris-agent-playbook-data:0.1.0-alpha.3` |
| Identity Service | `redislabs/iris-identity-service:0.9.0` |

The published release images target `linux/amd64`. Confirm that your cluster can run them. The Identity Service has its own version; do not replace its tag with the Playbook tag.

Allow chart downloads, image pulls, Redis connections, and data-plane access to the embedding provider. For a disconnected installation, mirror the release images and use a downloaded chart package. Configure the corresponding image repositories and `imagePullSecrets` in [Helm values]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#helm-values" >}}).

## Secrets

Prepare the files and Secrets described in [Configuration]({{< relref "/operate/iris/agent-playbook/self-managed/configuration" >}}). Storage URLs, provider credentials, and license material belong in Secrets, not Helm values or source control.

For externally managed credentials or GitOps rendering, [supply four distinct service credentials]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#supply-service-credentials" >}}).
