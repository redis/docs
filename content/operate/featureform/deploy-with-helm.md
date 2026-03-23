---
title: Deploy Featureform with Helm
description: Install Featureform on an existing Kubernetes cluster with Helm.
linkTitle: Deploy with Helm
weight: 40
---

Use this path when you already have a Kubernetes cluster and want to install Featureform directly with the Helm chart.

## Before you begin

Confirm that you already have:

- a Kubernetes cluster running 1.27 or later
- PostgreSQL available for Featureform metadata
- ingress or load-balancer capacity for external access
- TLS plan and certificate approach
- image pull credentials for the Featureform registry

See [Prerequisites]({{< relref "/operate/featureform/prerequisites" >}}) for the full checklist.

## Installation flow

The Helm-based deployment generally follows this sequence:

1. Create the target namespace.
2. Create any required image pull secrets.
3. Install or confirm supporting components such as `cert-manager`.
4. Prepare a values file with your hostname, PostgreSQL settings, certificate settings, and ingress configuration.
5. Install the Featureform chart.
6. Verify pods, certificates, and external access.

## Example sequence

```bash
kubectl create namespace featureform

kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<registry-username> \
  --docker-password=<registry-password> \
  --docker-email=<registry-email> \
  --namespace=featureform
```

Install `cert-manager` if your environment uses it for certificate automation, then install the Featureform chart with your values file.

## Values to prepare

At minimum, prepare values for:

- external hostname
- certificate mode
- PostgreSQL connection
- ingress behavior
- registry secret usage

Review the chart values in the source material and align them with your environment standards before installation.

## After installation

Continue with [Verify your installation]({{< relref "/operate/featureform/verify-your-installation" >}}).
