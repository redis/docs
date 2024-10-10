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

Redis Enterprise for Kubernetes gives you the speed and durability of [Redis Enterprise](https://redis.io/redis-enterprise/advantages/), along with the flexibility and ease of use Kubernetes (K8s) provides. Redis Enterprise for Kubernetes uses a custom operator and custom controllers to bring the best of Redis Enterprise to Kubernetes platforms.

The image below illustrates the components of a single-namespace deployment.

{{< image filename="/images/k8s/k8s-arch-v4.png" >}}

## Operator

An operator is a custom extension of the Kubernetes API used to manage complex, stateful processes and resources. The operator uses controllers to manage Redis Enterprise's custom resources (CR).

## Namespace

The Redis Enterprise operator is deployed into a namespace. Only one operator and one RedisEnterpriseCluster can reside in each namespace. Namespaces create a logical separation between resources. Several of the resources used in your deployment are limited to a namespace, while others are cluster-wide.

Redis Enterprise for Kubernetes supports multi-namespace deployment options. Databases residing in one namespace, can be monitored and managed by an operator.

## Custom resources

Custom resources extend the Kubernetes API to allow Redis users to manage their databases the Kubernetes way. Custom resources are created and managed with YAML configuration files.

This [declarative configuration method](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/) lets you define a desired state for your resources, and the operator will make changes to reach that state. This simplifies installing, updating, and scaling (both horizontally and vertically).

The operator continually monitors custom resources for changes, and acts to reconcile differences between your declared desired state and the actual state of your resources.

## Custom resource definitions

A cluster-wide resource called a custom resource defintion (CRD) specifies which settings are configurable via a custom resource configuration file. Any setting not defined by the CRD is not managed by the operator. Changes to these settings can be made just as they are in Redis Enterprise Software.

Settings that are managed by the operator will be overwritten if changed by a method besides the custom resource YAML files. Be aware that changes made in the management UI will be overwritten by the operator if that setting is defined by the CRD.

## RedisEnterpriseCluster REC

## RedisEnterpriseDatabase REDB

{{< image filename="/images/k8s/k8s-node-arch.png">}}

## Active-Active databases

### RedisEnterpriseRemoteCluster RERC

### RedisEnterpriseActiveActiveDatabase REAADB

## Services Rigger

## Security

secrets

## Storage

PVCs, network attached

## Metrics

