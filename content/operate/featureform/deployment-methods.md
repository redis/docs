---
title: Featureform deployment methods
description: Choose between the self-serve Helm path and request-only Terraform examples for Featureform.
linkTitle: Deployment methods
weight: 30
---

Choose the deployment method that fits your environment and the amount of infrastructure you want the workflow to manage.

## Deploy with Helm

Use Helm when:

- you already have a Kubernetes cluster
- you already manage PostgreSQL, ingress, certificates, and network access
- you want direct control over chart values and Kubernetes objects

This option fits teams that already have an established Kubernetes platform.

See [Deploy with Helm]({{< relref "/operate/featureform/deploy-with-helm" >}}).

## Request Terraform examples for AWS

Request Terraform examples when:

- you want AWS-focused example infrastructure
- your target environment is AWS
- you want example guidance for cluster, networking, database, and application deployment together

Terraform examples are not published as part of the docs. If you need them, contact your Redis account team.

See [Request Terraform examples for AWS]({{< relref "/operate/featureform/deploy-with-terraform-aws" >}}).

## Summary

- Choose Helm if your organization already has Kubernetes platform standards.
- Contact your Redis account team if you need AWS Terraform examples.
- In both cases, confirm prerequisites before installation and complete the verification steps after deployment.
