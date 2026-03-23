---
title: Featureform architecture
description: Understand the main components and external dependencies of a Featureform deployment.
linkTitle: Architecture
weight: 10
---

Featureform is deployed on Kubernetes and integrates with external systems for metadata storage, certificate management, ingress, and offline feature computation.

## Main components

A typical deployment includes the following Featureform services:

- Metadata server
- API server
- Feature server
- Dashboard
- Coordinator

These services run on Kubernetes and are installed through the Featureform Helm chart.

## External dependencies

Featureform depends on several external systems:

- PostgreSQL for metadata storage
- Redis for online feature serving
- an offline data system such as Snowflake, BigQuery, or Databricks or Spark
- Kubernetes ingress and load balancing for external access
- TLS certificate management for secure traffic

## Kubernetes model

Featureform is designed to run as an application on an existing Kubernetes cluster. The platform team is responsible for cluster networking, storage, ingress, image pull credentials, and secure access to required external systems.

The current deployment material includes:

- a Helm chart for teams that already have Kubernetes infrastructure
- request-only Terraform examples for teams that need AWS-focused deployment guidance

## Deployment choices

- Use [Helm]({{< relref "/operate/featureform/deploy-with-helm" >}}) when you already have a Kubernetes cluster and supporting infrastructure.
- If you need Terraform examples for AWS deployments, see [Request Terraform examples for AWS]({{< relref "/operate/featureform/deploy-with-terraform-aws" >}}).

## Related information

- [Prerequisites]({{< relref "/operate/featureform/prerequisites" >}})
- [Deployment methods]({{< relref "/operate/featureform/deployment-methods" >}})
- [User-facing Featureform docs]({{< relref "/develop/ai/featureform/" >}})
