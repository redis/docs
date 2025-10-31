---
Title: Deployment
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy Redis Enterprise for Kubernetes using the Redis Enterprise operator on various Kubernetes distributions.
hideListLinks: true
linkTitle: Deployment
weight: 11
url: '/operate/kubernetes/7.22/deployment/'
---

Deploy Redis Enterprise for Kubernetes by using the Redis Enterprise operator. The operator provides a simple way to deploy and manage Redis Enterprise clusters on various Kubernetes distributions, both on-premises and in the cloud.

The Redis Enterprise operator uses custom resource definitions (CRDs) to manage Redis Enterprise clusters (REC) and databases (REDB) as native Kubernetes resources. This approach enables GitOps workflows and Kubernetes-native operations.

## Quick start

Get started quickly with a basic Redis Enterprise deployment:

- [Deploy Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/7.22/deployment/quick-start" >}}) - Step-by-step guide for most Kubernetes distributions
- [Deploy on OpenShift]({{< relref "/operate/kubernetes/7.22/deployment/openshift" >}}) - Specific instructions for OpenShift environments

## Deployment methods

Choose the deployment method that best fits your environment:

- [Deploy with Helm]({{< relref "/operate/kubernetes/7.22/deployment/helm" >}}) - Use Helm charts for simplified deployment and management
- [Deploy with operator bundle]({{< relref "/operate/kubernetes/7.22/deployment/quick-start" >}}) - Direct deployment using kubectl and operator manifests

## Container images

Understand the container images used by the Redis Enterprise operator:

- [Container images]({{< relref "/operate/kubernetes/7.22/deployment/container-images" >}}) - Details about Redis Enterprise container images and registries

## Compatibility

Before installing, verify compatibility with your environment:

- [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/7.22/reference/supported_k8s_distributions" >}}) - Check which Redis Enterprise operator version supports your Kubernetes distribution

## Prerequisites

Before deploying Redis Enterprise for Kubernetes, ensure you have:

- A Kubernetes cluster running a [supported distribution]({{< relref "/operate/kubernetes/7.22/reference/supported_k8s_distributions" >}})
- Minimum of three worker nodes for high availability
- Kubernetes client (kubectl) configured to access your cluster
- Access to container registries (DockerHub, Red Hat Container Catalog, or private registry)
- Sufficient resources as outlined in [sizing recommendations]({{< relref "/operate/kubernetes/7.22/recommendations/sizing-on-kubernetes" >}})

## Next steps

After deployment, you can:

- [Create a Redis Enterprise cluster (REC)]({{< relref "/operate/kubernetes/7.22/re-clusters" >}})
- [Create Redis Enterprise databases (REDB)]({{< relref "/operate/kubernetes/7.22/re-databases" >}})
- [Configure networking]({{< relref "/operate/kubernetes/7.22/networking" >}})
- [Set up security]({{< relref "/operate/kubernetes/7.22/security" >}})