---
linkTitle: Get Started
title: Get Started
description: Learn how to get started with Redis
hideListLinks: true
         
---

Redis is an in-memory and persistent on-disk data structure store that achieves high write and read speed by using key value pairs for storage. Values can contain more complex data types (strings, hashes, lists, sets, and sorted sets), with atomic operations defined on those data types. The
two on-disk storage formats, Redis Database Backup (RDB) and Append Only File (AOF) are compact and always generated in an append-only fashion. 

This document describes how to get started with Redis based on your role as a developer or operator. 

## Developer

Redis can be used as a database, cache, streaming engine, message broker, and more. The following quick start guides will show you how to use Redis for the following specific purposes:

- [Data structure store](/docs/develop/get-started/data-store)
- [Document database](/docs/develop/get-started/document-database)
- [Vector database](/docs/develop/get-started/vector-database)

## Operator 

You can run Redis Enterprise Software in an on-premises data center or on your preferred cloud platform. You can also deploy on a variety of Kubernetes distributions both on-prem and in the cloud by using the Redis Enterprise operator for Kubernetes.

Build a small-scale cluster with the Redis Enterprise Software container image.
- [Linux quickstart]({{<relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- [Docker quickstart]({{<relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart">}})
- [Get started with Active-Active]({{<relref "/operate/operate/rs/databases/active-active/get-started">}})

[Install & set up]({{<relref "/operate/rs/installing-upgrading">}}) a Redis Enterprise Software cluster.

Create a new Redis Cloud subscription:
- The [Redis Cloud quick start]({{<relref "/operate/rc/rc-quickstart.md">}}) helps you create a free subscription and your first database.  (Start here if you're new.)
- [Create a Fixed subscription]({{<relref "/operate/rc/subscriptions/create-fixed-subscription.md">}})
- [Create a Flexible subscription]({{<relref "/operate/rc/subscriptions/create-flexible-subscription.md">}})
- To create an Annual subscription, contact [support](https://redis.com/company/support).

Redis Enterprise for Kubernetes provides a simple way to get a Redis Enterprise cluster on Kubernetes and enables more complex deployment scenarios:
- [Deploy Redis Enterprise Software for Kubernetes](/docs/operate/kubernetes/deployment/quick-start/)
- [Deploy Redis Enterprise for Kubernetes with OpenShift](/docs/operate/kubernetes/deployment/openshift/)

## Integrations

Redis Enterprise supports integrations for ingest, write-behind, large language machine learning models (LLMs), visualizing metrics, and provisioning infrastructure as code.

### Ingest and write-behind

You can use Redis Data Integration (RDI) to ingest data in near real-time, so that Redis becomes part of the data fabric without additional integration efforts. RDI can also map and transform Redis types and models to downstream types and models if an application needs fast writes and reads for some queries, but has to provide data to other downstream services that need them in different models for other uses.

- Create an ingest pipeline using the [Ingest quickstart](/docs/integrate/rdi/quickstart/ingest-guide/)
- Create a write-behind pipeline using the [Write-behind quickstart](/docs/integrate/rdi/quickstart/write-behind-guide/)

### LLMs 

You can use Amazon Bedrock with Redis Enterprise Cloud to build LLM applications. This integration offers a robust, scalable, and efficient solution for developers, streamlining the use of LLMs with Redis as a vector database. 

- [Use Redis Cloud with Amazon Bedrock](/docs/integrate/rc/cloud-integrations/aws-marketplace/aws-bedrock/)

### Visualizing metrics

You can use Prometheus and Grafana to collect and visualize your Redis Cloud metrics.

- [Use Prometheus and Grafana with Redis Cloud](/docs/integrate/rc/cloud-integrations/prometheus-integration/)

### Provisioning infrastructure as code

You can use the Redis Cloud Terraform Provider to create a subscription and a database. Alternatively, you can use the Redis Cloud Pulumi provider to create a Flexible subscription and a database in TypeScript, Python, C#, Java, Go, or YAML.

-[Get started with Terraform](/docs/integrate/rc/cloud-integrations/terraform/get-started/)
-[The Redis Cloud Pulumi provider](/docs/integrate/rc/cloud-integrations/pulumi/)
 
