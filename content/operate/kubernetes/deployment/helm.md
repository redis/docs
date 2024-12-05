---
Title: Install the Redis Enterprise Helm chart
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Install the Redis Enterprise operator using helm charts.
linkTitle: Helm
weight: 11
---

## Prerequisites
K8s 1.23 LINK TO SUPPORTED DISTROS, ADD SPECIFICS OF REQUIRED REDB, RHEL9 AND MODULE VERSIONS
HELM 3.10

## Install

1. Add repo with `helm repo add`
1. Install chart with new namespace `helm install`
To install with Openshift, add --set openshift.mode=true
To monitor install use --debug flag

To install from local directory: 

1. Download tgz file
1. helm install from local directory

## Configuration

Install with values file

Install and override specific default values

## Uninstall


1. Delete any custom resources managed by the operator in the following order. LINK TO UNINSTALL PAGE, POSSIBLY EMBED
    ```sh
    kubectl delete redb <name>
    kubectl delete rerc <name>
    kubectl delete reaadb <name>
    kubectl delete rec <name>
    ```

## Known limitations
