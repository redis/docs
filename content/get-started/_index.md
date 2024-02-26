---
linkTitle: Get started
title: Get started
type: develop
description: Learn how to get started with Redis
hideListLinks: true
         
---
Redis is an [in-memory data store]({{< relref "/develop/get-started/data-store" >}}) used by millions of developers as a cache, [vector database]({{< relref "/develop/get-started/vector-database" >}}), [document database]({{< relref "/develop/get-started/document-database" >}}), [streaming engine]({{< relref "/develop/data-types/streams" >}}), and message broker. Redis has built-in replication and different levels of [on-disk persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}). It supports complex [data types]({{< relref "/develop/data-types/" >}}) (e.g., strings, hashes, lists, sets, sorted sets, and JSON), with atomic operations defined on those data types.

This document describes how to get started with Redis based on your role as a developer or operator. 

## Developer

The following quick start guides will show you how to use Redis for the following specific purposes:

- [Data structure store]({{< relref "/develop/get-started/data-store" >}})
- [Document database]({{< relref "/develop/get-started/document-database" >}})
- [Vector database]({{< relref "/develop/get-started/vector-database" >}})

As a developer, you might also be interested in data integration, libraries, and frameworks:

- [Redis Data Integration]({{< relref "/integrate/redis-data-integration/" >}})
- [Redis vector library for Python]({{< relref "/integrate/redisvl/" >}})
- [Redis Cloud with Amazon Bedrock]({{< relref "/integrate/amazon-bedrock/" >}})
- [Object-mapping for .NET]({{< relref "/integrate/redisom-for-net/" >}})
- [Spring Data Redis for Java]({{< relref "/integrate/spring-framework-cache/" >}})

You can find a complete list of integrations on the [integrations and frameworks hub]({{< relref "/integrate/" >}}).

Want to learn more? Learn how to [develop]({{< relref "/develop/" >}}) applications with Redis.


## Operator 

You can deploy Redis ...

- as a service by using [Redis Cloud]({{< relref "/operate/rc/" >}}), the fastest way to deploy Redis on your preferred cloud platform.
- by installing [Redis Enterprise Software]({{< relref "/operate/rs/" >}}) in an on-premises data center or on Cloud infrastructure.
- on a variety Kubernetes distributions by using the [Redis Enterprise operator for Kubernetes]({{< relref "/operate/kubernetes/" >}}).
- by installing [Redis OSS/Stack]({{< relref "/operate/oss_and_stack/" >}}).

The following guides will help you to get started with your preferred deployment method.

Get started with **[Redis Cloud]({{< relref "/operate/rc/" >}})** by creating a subscription:

- The [Redis Cloud quick start]({{< relref "/operate/rc/rc-quickstart" >}}) helps you create a free subscription and your first database.  (Start here if you're new.)
- [Create a Fixed subscription]({{< relref "/operate/rc/subscriptions/create-fixed-subscription" >}}) for databases with a memory limit up to 12 GB.
- [Create a Flexible subscription]({{< relref "/operate/rc/subscriptions/create-flexible-subscription" >}}) that suits your workload and offers seamless scaling.

Install a **[Redis Enterprise Software]({{< relref "/operate/rs/" >}})** cluster:

- [Redis Enterprise on Linux quick start]({{<relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- [Redis Enterprise on Docker quick start]({{<relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}})
- [Get started with Redis Enterprise's Active-Active feature]({{<relref "/operate/rs/databases/active-active/get-started" >}})
- [Install and upgrade Redis Enterprise]({{<relref "/operate/rs/installing-upgrading">}})

Leverage **[Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/" >}})** to simply deploy a Redis Enterprise cluster on Kubernetes:

- [Deploy Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [Deploy Redis Enterprise for Kubernetes with OpenShift]({{< relref "/operate/kubernetes/deployment/openshift/" >}})

Run **[Redis OSS and Stack]({{< relref "/operate/oss_and_stack/" >}})** on your local machine:

- [Run Redis Stack on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}})
- [Install Redis Stack on Linux]({{< relref "/operate/oss_and_stack/install/install-stack/linux" >}})
- [Install Redis OSS on Linux]({{< relref "/operate/oss_and_stack/install/install-redis/install-redis-on-linux" >}})

As an operator, you might also be interested in the following provisioning and observability integrations: 

- [Pulumi provider for Redis Cloud]({{< relref "/integrate/pulumi-provider-for-redis-cloud/" >}})
- [Terraform provider for Redis Cloud]({{< relref "/integrate/terraform-provider-for-redis-cloud/" >}})
- [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud" >}})
- [Prometheus and Grafana with Redis Enterprise]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}})

You can find a complete list of integrations on the [integrations and frameworks hub]({{< relref "/integrate/" >}}).

Want to learn more? Learn how to [operate]({{< relref "/operate/" >}}) your Redis deployment.