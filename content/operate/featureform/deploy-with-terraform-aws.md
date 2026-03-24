---
title: Request Terraform examples for AWS
description: Learn when to request AWS Terraform examples for Featureform from your Redis account team.
linkTitle: Request Terraform examples for AWS
weight: 50
---

Use this page if you need AWS-focused Terraform examples for a Featureform deployment.

Terraform examples are not published in the docs. If you need them, contact your Redis account team.

## When to request Terraform examples

Terraform examples are useful when you need guidance for an AWS deployment that includes:

- EKS cluster infrastructure
- networking
- PostgreSQL provisioning or connection settings
- DNS and certificate-related settings
- Featureform Helm installation

## Before you begin

Gather the following inputs:

- AWS region and environment name
- whether you will create a new PostgreSQL instance or use an existing one
- whether you will use a raw load balancer URL or create a DNS record
- Docker registry credentials for Featureform images
- certificate approach for the environment

## What to prepare for the conversation

Be ready to describe the main environment decisions:

- `create_rds`: create a PostgreSQL instance or use an existing database
- `create_dns_record`: use a custom Route53 record or rely on the load balancer URL
- `enable_argo`: install optional GitOps-related components

Use the simplest path for first deployments unless your organization already has stricter platform requirements.

## What to do now

1. Review the [prerequisites]({{< relref "/operate/featureform/prerequisites" >}}) for Kubernetes, PostgreSQL, networking, TLS, and registry access.
2. Decide whether you need a self-serve Helm deployment or AWS Terraform examples.
3. If you need Terraform examples, contact your Redis account team with your AWS requirements and the environment decisions listed above.

## AWS-specific notes

AWS Terraform examples typically assume:

- EKS as the Kubernetes platform
- Route53 for optional DNS
- RDS for optional PostgreSQL creation
- AWS networking patterns with public ingress and private worker nodes

Treat those as the concrete example, not as a requirement that every Featureform deployment use AWS.

{{< note >}}
If you already have a Kubernetes platform and PostgreSQL in place, [Deploy with Helm]({{< relref "/operate/featureform/deploy-with-helm" >}}) is usually the simpler path.
{{< /note >}}

## After installation

Continue with [Verify your installation]({{< relref "/operate/featureform/verify-your-installation" >}}).
