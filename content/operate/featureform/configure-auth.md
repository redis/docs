---
Title: Configure authentication and RBAC
aliases:
- /operate/featureform/auth/
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Configure deployment-wide authentication and RBAC for Redis Feature Form.
linkTitle: Configure auth and RBAC
weight: 70
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Redis Feature Form authenticates users and services through an external OIDC identity provider, then authorizes their actions through built-in RBAC roles. Authentication is a deployment-wide concern configured at install time; authorization is per-workspace (with a small number of deployment-scoped exceptions) and managed at runtime through role bindings.

A [workspace]({{< relref "/develop/ai/featureform/concepts#workspaces" >}}) isolates resources; RBAC bindings control who can act on it.

## Authentication

### Configure OIDC at deploy time

Set Feature Form's OIDC parameters in the Helm chart's `auth` block. At minimum, you need an issuer URL and a server-side client ID:

```yaml
auth:
  enabled: true
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcClientID: "featureform-server"

  # CLI client. Defaults to "featureform-cli".
  oidcCLIClientID: "featureform-cli"

  # Comma-separated list. Restricts which flows the CLI offers.
  # Supported values: device_code, authorization_code_pkce
  oidcCLILoginMethods: "device_code,authorization_code_pkce"

  # Required only if you use authorization_code_pkce. Must be
  # registered with the IdP for the CLI client.
  oidcCLIRedirectURI: "http://localhost:8080/callback"
```

For deployments where internal services reach the IdP at a different URL than external clients, use `oidcDiscoveryURL`, `oidcPublicIssuerURL`, and `oidcPublicDiscoveryURL` to split the discovery and issuer endpoints. The `oidcSkipIssuerCheck: true` flag disables issuer-claim validation and should only be used during local development.

Feature Form reads role information from JWT claims on each request. It checks the following claims, in order, for matches against built-in role IDs:

- `featureform_roles` (string or array)
- `roles` (string or array)
- `role` (string)
- `realm_access.roles` (array; Keycloak convention)

If any of those claims contain `global_admin`, the user is treated as a global admin for that token's lifetime without a database binding. This is the typical way operators bootstrap the first admin—see [Provision the first global admin](#provision-the-first-global-admin).

### Sign in with the CLI

The `ff auth` commands handle login, session inspection, and token retrieval:

```bash
# Interactive login. Defaults to device-code flow if the IdP
# supports it; falls back to authorization_code_pkce otherwise.
ff auth login

# Force a specific flow.
ff auth login --login-method device_code
ff auth login --login-method authorization_code_pkce

# Non-interactive password grant (CI, scripts).
ff auth login --username alice@example.com --password-stdin

# Inspect the current session.
ff auth status
ff auth whoami

# Print the active access token (for use in tools that don't
# integrate with the CLI session).
ff auth token

# Clear the local session. Does not revoke tokens on the IdP.
ff auth logout
```

CLI sessions are stored per profile on the local machine. To skip interactive login entirely, set `FEATUREFORM_TOKEN` to a valid access token, or configure a service account with client credentials (see [Service accounts and machine credentials](#service-accounts-and-machine-credentials)).

## RBAC

### Built-in roles

Feature Form has five built-in RBAC roles. The role ID in the left column is the literal string used in `ff rbac grant`.

Each built-in role is a fixed set of finer-grained permissions—the underlying checks the authorization service runs on each request. For the full permission catalog, see [Reference > Permissions]({{< relref "/develop/ai/featureform/reference#permissions" >}}).

| Role ID | Scope | What it grants |
| --- | --- | --- |
| `viewer` | Workspace | Read-only access to workspace metadata, the resource graph, the catalog, providers, and serving metadata. |
| `operator` | Workspace | Everything a viewer has, plus writing providers, planning and applying changes, reading served features, and controlling scheduler workflows. |
| `workspace_admin` | Workspace | Full administration of a single workspace—membership, audit, updates, deletion—plus everything an operator has. |
| `global_admin` | Global | Workspace creation, plus full administration across every workspace in the deployment. |
| `model` | Resource-constrained | Read access to a specific set of feature views, training sets, and serving data—nothing else. Used for model-team service accounts. |


### Role scopes

Every role applies at a defined breadth—deployment-wide, a single workspace, or a specific set of resources within a workspace. Feature Form has three scopes, and each role works at exactly one:

- **Global** Deployment-wide actions, such as creating workspaces. Only `global_admin` operates at this scope.
- **Workspace** Actions inside a single workspace: providers, secret providers, apply, graph, catalog, serving metadata, and audit. A binding at this scope applies to one workspace only—grant the role again on each workspace a user needs.
- **Resource-constrained** A narrower form of workspace scope that limits a binding to a specific set of resources. Used for the `model` role, which only sees serving and training-set reads for the resources it was bound to.

A binding pairs a role with a scope and a user, group, or service account. For example: "Alice has `workspace_admin` on workspace `7f2e4d8c-…`" or "the `payments-team` group has `global_admin`."

### Provision the first global admin

A fresh Feature Form deployment has no role bindings in its database. To get the first global admin in place, choose one of two paths:

**Map an IdP claim to `global_admin` (recommended for production).** Configure your IdP to issue a `featureform_roles` claim that contains `global_admin` for the appropriate user or group. Feature Form treats those tokens as global admin without a database binding, so the first admin can sign in and start granting roles to others immediately.

**Bind manually after the first login.** A user with no role can still authenticate; they just can't do anything yet. From a host that already has an access token for a privileged account, run:

```bash
ff rbac grant global_admin --global --user <user-principal-id>
```

This option requires that *some* identity already has `global_admin`, which makes it suitable only for redirecting access from a temporary IdP-claim admin to a database-bound one, or for environments where you can run `ff` commands with a bootstrap token issued out-of-band.

There is no dedicated Helm value for an initial admin. Plan your IdP claim mapping before installing.

## Service accounts and machine credentials

Non-human identities—CI runners, model-serving processes, batch jobs—authenticate with a service account that holds a public key registered with Feature Form. Feature Form supports Ed25519 keys today.

Create a credential for a service account inside a workspace:

```bash
ff machine-credential create ci-runner-key \
  --workspace <workspace-id> \
  --service-account <service-account-principal-id> \
  --public-key "<key material>" \
  --algorithm Ed25519
```

The `ff machine-credential` command also has subcommands for `list`, `get`, `rotate`, `revoke`, and `usage` (for audit-style usage records). All of them require the `machine_credential.write` or `machine_credential.read` permission on the target workspace.

Grant the service account a workspace role the same way you would a user—use `--service-account <id>` instead of `--user <id>`:

```bash
ff rbac grant operator \
  --workspace <workspace-id> \
  --service-account ci-runner
```

## Audit

Feature Form records authorization-relevant events in an audit log. List events with:

```bash
ff audit list \
  --workspace <workspace-id> \
  --event-type workspace.delete \
  --page-size 50
```

Useful filters:

- `--workspace <id>` — scope to one workspace.
- `--global` — only deployment-scoped events. Requires `global_admin`.
- `--principal-id <id>` — events for a specific user, group, or service account.
- `--event-type <type>` — filter by event name (`workspace.create`, `rbac.grant`, `apply.write`, and so on).

Each event includes the scope, workspace ID (if applicable), actor ID, event type, and creation timestamp. Reading the log requires the `audit.read` permission; deployment-scope reads additionally require `global_admin`.

## Next steps

- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) for the commands that create workspaces, grant roles, and verify bindings.
- [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) for background on workspaces and the resource graph.
