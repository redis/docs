---
title: Featureform prerequisites
description: Review the platform, networking, certificate, and registry prerequisites for Featureform.
linkTitle: Prerequisites
weight: 20
---

Before you deploy Featureform, verify that your platform can satisfy the infrastructure, access, and operational requirements in this checklist.

## Kubernetes

You need:

- a Kubernetes cluster running version 1.27 or later
- sufficient worker-node capacity for the Featureform services
- `kubectl` access for the team performing the installation

Supported environments can include managed Kubernetes offerings or self-managed clusters, as long as the cluster can support ingress, storage, and the required networking.

## Networking

Your deployment should provide:

- ingress and load balancing for external HTTPS and gRPC access
- private connectivity from Featureform to PostgreSQL and any offline data systems
- outbound access for image pulls and any required external services
- HTTP/2-capable load balancing where gRPC communication depends on it

If you are deploying on AWS, the example deployment uses public subnets for ingress and private subnets for worker nodes.

## PostgreSQL

Featureform requires PostgreSQL for metadata storage. Before installation, decide whether you will:

- provision a new PostgreSQL instance as part of your infrastructure workflow
- connect Featureform to an existing PostgreSQL deployment

Record the host, port, database name, and credentials before installation.

## TLS

Decide which certificate approach you will use:

- public certificates, such as Let's Encrypt, for production-facing environments
- self-signed certificates for testing and isolated environments
- customer-managed certificates if your organization has an existing PKI process

## Registry credentials

Featureform images require registry access. Make sure the Kubernetes namespace that will run Featureform has valid image pull credentials before installation.

{{< note >}}
If your pods cannot pull images, verify the registry secret before troubleshooting the application itself.
{{< /note >}}

## Required tools

Install the following tools based on your deployment method:

- `kubectl`
- `helm` version 3 or later
- `terraform` if you are using the Terraform path
- your cloud provider CLI if your cluster access depends on it

## Optional platform dependencies

Some deployments also add:

- `cert-manager` for certificate automation
- Prometheus or another metrics system for monitoring
- ArgoCD or other GitOps tooling if your organization standardizes on declarative delivery

## What to read next

- [Deployment methods]({{< relref "/operate/featureform/deployment-methods" >}})
- [Deploy with Helm]({{< relref "/operate/featureform/deploy-with-helm" >}})
