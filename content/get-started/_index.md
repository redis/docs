---
description: Get started with Redis Community Edition
hideListLinks: true
linkTitle: Community Edition
title: Community Edition
type: develop
---
Redis is an [in-memory data store]({{< relref "/develop/get-started/data-store" >}}) used by millions of developers as a cache, [vector database]({{< relref "/develop/get-started/vector-database" >}}), [document database]({{< relref "/develop/get-started/document-database" >}}), [streaming engine]({{< relref "/develop/data-types/streams" >}}), and message broker. Redis has built-in replication and different levels of [on-disk persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}). It supports complex [data types]({{< relref "/develop/data-types/" >}}) (for example, strings, hashes, lists, sets, sorted sets, and JSON), with atomic operations defined on those data types.

You can install Redis from source or from an executable/distribution for your OS.

* Install Redis on Linux using [APT]({{< relref "/operate/oss_and_stack/install/install-stack/apt" >}}), [RPM]({{< relref "/operate/oss_and_stack/install/install-stack/rpm" >}}), or [Snap]({{< relref "/operate/oss_and_stack/install/install-stack/snap" >}})
* [Install Redis on macOS]({{< relref "/operate/oss_and_stack/install/install-stack/homebrew" >}})
* [Run Redis on Windows using Docker]({{< relref "/operate/oss_and_stack/install/install-stack/windows" >}})
* [Run Redis on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}})
* [Install Redis from Source]({{< relref "/operate/oss_and_stack/install/build-stack" >}})
* [Install Redis with Redis Stack and Redis Insight]({{< relref "/operate/oss_and_stack/install/archive/install-stack" >}})

## Use cases

The following quick start guides will show you how to use Redis for the following specific purposes:

- [Data structure store]({{< relref "/develop/get-started/data-store" >}})
- [Document database]({{< relref "/develop/get-started/document-database" >}})
- [Vector database]({{< relref "/develop/get-started/vector-database" >}})
- [AI agents and chatbots]({{< relref "/develop/get-started/redis-in-ai" >}})
- [Retrieval Augmented Generation (RAG) with Redis]({{< relref "/develop/get-started/rag" >}})

## Data integration tools, libraries, and frameworks
- [Client API libraries]({{< relref "/develop/clients" >}})
- [Redis Data Integration]({{< relref "/integrate/redis-data-integration/" >}})
- [Redis vector library for Python]({{< relref "/integrate/redisvl/" >}})
- [Redis Cloud with Amazon Bedrock]({{< relref "/integrate/amazon-bedrock/" >}})
- [Object-mapping for .NET]({{< relref "/integrate/redisom-for-net/" >}})
- [Spring Data Redis for Java]({{< relref "/integrate/spring-framework-cache/" >}})

You can find a complete list of integrations on the [integrations and frameworks hub]({{< relref "/integrate/" >}}).

To learn more, refer to the [develop with Redis]({{< relref "/develop/" >}}) documentation.

## Deployment options

You can deploy Redis with the following methods:

- As a service by using [Redis Cloud]({{< relref "/operate/rc/" >}}), the fastest way to deploy Redis on your preferred cloud platform.
- By installing [Redis Enterprise Software]({{< relref "/operate/rs/" >}}) in an on-premises data center or on Cloud infrastructure.
- On a variety Kubernetes distributions by using the [Redis Enterprise operator for Kubernetes]({{< relref "/operate/kubernetes/" >}}).

The following guides will help you to get started with your preferred deployment method.

Get started with **[Redis Cloud]({{< relref "/operate/rc/" >}})** by creating a database:

- The [Redis Cloud quick start]({{< relref "/operate/rc/rc-quickstart" >}}) helps you create a free database.  (Start here if you're new.)
- [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) with a memory limit up to 12 GB.
- [Create a Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) that suits your workload and offers seamless scaling.

Install a **[Redis Enterprise Software]({{< relref "/operate/rs/" >}})** cluster:

- [Redis Enterprise on Linux quick start]({{<relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- [Redis Enterprise on Docker quick start]({{<relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}})
- [Get started with Redis Enterprise's Active-Active feature]({{<relref "/operate/rs/databases/active-active/get-started" >}})
- [Install and upgrade Redis Enterprise]({{<relref "/operate/rs/installing-upgrading">}})

Leverage **[Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/" >}})** to simply deploy a Redis Enterprise cluster on Kubernetes:

- [Deploy Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [Deploy Redis Enterprise for Kubernetes with OpenShift]({{< relref "/operate/kubernetes/deployment/openshift/" >}})

To learn more, refer to the [Redis products]({{< relref "/operate/" >}}) documentation.

## Provisioning and observability tools 

- [Pulumi provider for Redis Cloud]({{< relref "/integrate/pulumi-provider-for-redis-cloud/" >}})
- [Terraform provider for Redis Cloud]({{< relref "/integrate/terraform-provider-for-redis-cloud/" >}})
- [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud" >}})
- [Prometheus and Grafana with Redis Enterprise]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}})

You can find a complete list of integrations on the [libraries and tools hub]({{< relref "/integrate/" >}}).


