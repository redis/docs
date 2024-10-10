---
Title: Redis Enterprise for Kubernetes architecture
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Overview of the architecture and components of Redis Enterprise for Kubernetes.
hideListLinks: true
linkTitle: Architecture
weight: 1
---

Redis Enterprise gives you redis's speed at scale with added durability.
Kubernetes (K8s) is flexible, scalable, and automates management while reducing overhead. Redis Enterprise for Kubernetes lets you manage your Redis clusters and databases with declarative configuration files, and lets you use the advantages of Kubernetes to manage your resources. Redis Enterprise for Kubernetes uses a custom operator and custom controllers to bring the best of Redis Enterprise to Kubernetes platforms.

Redis Enterprise for Kubernetes provides custom resource definitions (CRDs) that allows you to to create custom resources to manage your clusters and databases. The RedisEnterpriseCluster (REC) resource creates and manages a Redis Enterprise cluster within the same namespace. The RedisEnterpriseDatabase (REDB) resource creates and manages your Redis Enterprise database.

overview diagram

Declarative configuration management... configuration YAML files - https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/
Automated upgrades, creation, scaling, declare state you want and K8s manages details
where is my database ... just like RS multiple databases are hosted by a redis node, just happens to be within a pod
db diagram
Once its up, it's just RS except...
Credentials management - secrets
Storage - k8s way - network attached
Active-active
multi-namespace
flexible deployment
more information?
https://redis.io/redis-enterprise/advantages/