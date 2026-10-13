---
Title: Agent Playbooks authentication and access
alwaysopen: false
categories:
- docs
- operate
- iris
description: Separate administrative credentials from application API keys and grant access to self-managed playbooks.
linkTitle: Authentication and access
weight: 60
hideListLinks: true
---

Operators administer playbooks and API keys through separate services. Applications authenticate to the data plane with keys scoped to their playbooks.

| Caller | API | Credential |
| --- | --- | --- |
| Playbook administrator | Control plane, `/v1/playbooks` | Control-plane admin token. |
| Key administrator | Identity Service, `/v1/api-keys` | Identity Service control token. |
| Application or agent | Playbook data plane | API key with grants for the requested playbook. |

Keep both administrative tokens out of application configuration and model prompts.

## Read the bootstrap credentials

The [deploy procedure]({{< relref "/operate/iris/agent-playbook/self-managed/deploy" >}}) uses chart-generated credentials. An operator with permission to read Secrets can load the two administrative tokens into the current shell:

```bash
export PLAYBOOK_ADMIN_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-controlplane-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IDENTITY_CONTROL_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The Secret names assume `fullnameOverride: playbook`. If you supply credentials externally, load them from your secret manager instead.

Use these tokens to [create a playbook and application keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}). Give publishers `write` and `publish`; give runtime readers `read`. See [playbook grants]({{< relref "/develop/ai/context-engine/agent-playbook/concepts#playbooks" >}}) for all actions.

## Supply service credentials

By default, the chart generates four service credentials. It retains their Secrets and reuses the values during live Helm upgrades.

For GitOps or offline chart rendering, supply existing Secrets to avoid generating new credentials on each render. Use a different value for each of the four credentials.

| Credential | Helm Secret reference | Used by |
| --- | --- | --- |
| Control-plane admin token | `controlplane.adminToken.existingSecret` | Operators administering playbooks. |
| Control-plane internal token | `controlplane.internalToken.existingSecret` | Identity Service validating playbook grants. |
| Identity Service control token | `identityService.controlToken.existingSecret` | Operators administering application keys. |
| Identity Service runtime token | `identityService.runtimeToken.existingSecret` | Data plane validating application keys. |

Each block supports `secretKey` (default `token`), `autoGenerate`, and `existingSecretChecksum`. Set `autoGenerate: false` to require an externally managed Secret.

For example, provision four Secrets with a `token` key and add this overlay to `playbook-values.yaml`:

```yaml
controlplane:
  adminToken:
    existingSecret: playbook-controlplane-admin
    autoGenerate: false
  internalToken:
    existingSecret: playbook-controlplane-internal
    autoGenerate: false

identityService:
  controlToken:
    existingSecret: playbook-identity-control
    autoGenerate: false
  runtimeToken:
    existingSecret: playbook-identity-runtime
    autoGenerate: false
```

## Tenant and grant scope

Set each grant's `tenant` to the deployment's `tenantId` and scope it to a playbook and allowed actions. The [key examples]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples#create-application-keys" >}}) show the complete request.

Use separate publisher and reader keys. Rotation and revocation are covered in [Operations]({{< relref "/operate/iris/agent-playbook/self-managed/operations#rotate-or-revoke-application-keys" >}}).

<!-- TODO: Document the supported identity-provider and browser-administration setup after control-plane authentication is aligned with the launch chart. Chart 0.1.0-alpha.3 and current service source use different configuration paths. -->
