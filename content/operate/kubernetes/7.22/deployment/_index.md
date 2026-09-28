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

- [Deploy Redis Enterprise for Kubernetes](/content/operate/kubernetes/7.22/deployment/quick-start.md) - Step-by-step guide for most Kubernetes distributions
- [Deploy on OpenShift](/content/operate/kubernetes/7.22/deployment/openshift/_index.md) - Specific instructions for OpenShift environments

## Deployment methods

Choose the deployment method that best fits your environment:

- [Deploy with Helm](/content/operate/kubernetes/7.22/deployment/helm.md) - Use Helm charts for simplified deployment and management
- [Deploy with operator bundle](/content/operate/kubernetes/7.22/deployment/quick-start.md) - Direct deployment using kubectl and operator manifests

## Container images

Understand the container images used by the Redis Enterprise operator:

- [Container images](/content/operate/kubernetes/7.22/deployment/container-images.md) - Details about Redis Enterprise container images and registries

## Compatibility

Before installing, verify compatibility with your environment:

- [Supported Kubernetes distributions](/content/operate/kubernetes/7.22/reference/supported_k8s_distributions.md) - Check which Redis Enterprise operator version supports your Kubernetes distribution

## Prerequisites

Before deploying Redis Enterprise for Kubernetes, ensure you have:

- A Kubernetes cluster running a [supported distribution](/content/operate/kubernetes/7.22/reference/supported_k8s_distributions.md)
- Minimum of three worker nodes for high availability
- Kubernetes client (kubectl) configured to access your cluster
- Access to container registries (DockerHub, Red Hat Container Catalog, or private registry)
- Sufficient resources as outlined in [sizing recommendations](/content/operate/kubernetes/7.22/recommendations/sizing-on-kubernetes.md)

## Next steps

After deployment, you can:

- [Create a Redis Enterprise cluster (REC)](/content/operate/kubernetes/7.22/re-clusters/_index.md)
- [Create Redis Enterprise databases (REDB)](/content/operate/kubernetes/7.22/re-databases/_index.md)
- [Configure networking](/content/operate/kubernetes/7.22/networking/_index.md)
- [Set up security](/content/operate/kubernetes/7.22/security/_index.md)