---
title: Configure secret providers
description: Verify the built-in env provider or register another supported secret backend in Featureform.
linkTitle: Configure secret providers
weight: 10
---

Use this page to confirm which secret backend a workspace will use and to register additional backends when `env` is not enough.

## Check the built-in `env` provider

```bash
ff secret-provider list --workspace demo-workspace
ff secret-provider get env --workspace demo-workspace
```

## Register another secret provider

Environment provider:

```bash
ff secret-provider register local-env \
  --workspace demo-workspace \
  --type env \
  --env-prefix FF_
```

Vault:

```bash
ff secret-provider register vault-main \
  --workspace demo-workspace \
  --type vault \
  --vault-address https://vault.example.com \
  --vault-token-path /var/run/secrets/vault-token
```

Kubernetes:

```bash
ff secret-provider register k8s-main \
  --workspace demo-workspace \
  --type k8s \
  --k8s-namespace featureform \
  --k8s-secret-name provider-secrets
```

AWS Secrets Manager:

```bash
ff secret-provider register aws-main \
  --workspace demo-workspace \
  --type aws \
  --aws-region us-west-2
```

## Update or delete

```bash
ff secret-provider update local-env \
  --workspace demo-workspace \
  --env-prefix PROD_

ff secret-provider delete local-env \
  --workspace demo-workspace \
  --yes
```
