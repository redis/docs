---
title: Join an existing workspace
description: Verify that a principal can see and use an existing Featureform workspace.
linkTitle: Join a workspace
weight: 30
---

Use this page when a workspace already exists and you need to confirm that the intended principal can proceed with setup, apply, or serving.

## 1. Verify identity

```bash
ff auth whoami
ff rbac whoami
```

## 2. Confirm the workspace is visible

```bash
ff workspace list
ff workspace get --name demo-workspace
```

## 3. Confirm the effective binding

```bash
ff rbac list --workspace <workspace-id>
```

You should see the expected user, group, or service-account binding for that workspace.

## Common failures

- `permission denied` on provider or apply commands usually means missing workspace write access.
- `workspace not found` usually means the wrong deployment, wrong transport, or wrong workspace name.
- Missing resources after apply can indicate transport or state-backend mismatch in non-durable environments.

## Read next

[Configure secret providers]({{< relref "/develop/ai/featureform/how-to/secrets/configure-secret-providers" >}})
