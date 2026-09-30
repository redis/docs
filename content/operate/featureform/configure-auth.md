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

Redis Feature Form authenticates users and services through an external OIDC identity provider, then enforces built-in role-based access control (RBAC) on their actions. Authentication is a deployment-wide concern configured at install time; authorization is per-workspace (with a small number of deployment-scoped exceptions) and managed at runtime through role bindings.

OpenID Connect (OIDC) is a standard identity layer that lets Feature Form delegate authentication to a separate identity provider (IdP). You operate an IdP yourself (such as Keycloak) or use a managed service (such as Okta); Feature Form reads the resulting JSON Web Tokens (JWTs) to enforce its own role checks.

A [workspace]({{< relref "/develop/ai/featureform/concepts#workspaces" >}}) isolates resources; RBAC bindings control who can act on it.

The sequence:

1. [Configure OIDC at deploy time](#configure-oidc-at-deploy-time)
2. [Register a CLI client](#register-a-cli-client)
3. [Sign in with the CLI](#sign-in-with-the-cli)
4. [Pick built-in roles for users and groups](#built-in-roles)
5. [Provision the first global admin](#provision-the-first-global-admin)
6. [Set up service accounts for non-human identities](#service-accounts-and-machine-credentials)
7. [Read the audit log](#audit)

## Authentication

### Configure OIDC at deploy time

Set Feature Form's OIDC parameters in the Helm chart's `auth` block. `auth.oidcClientID` is the audience that Feature Form requires in access tokens. `auth.oidcCLIClientID` is the separate client that users sign in through.

```yaml
auth:
  enabled: true
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcClientID: "featureform-api"

  oidcCLIClientID: "featureform-cli"
  oidcCLIScopes: "openid profile offline_access"
  oidcCLILoginMethods: "device_code"
  deploymentID: "acme-featureform-prod-us-west-2"
```

Configure the IdP to include the `featureform-api` audience in access tokens issued to `featureform-cli`. Otherwise, login can succeed at the IdP while Feature Form rejects the token.

Use a unique, stable `auth.deploymentID` for each environment. See [Deploy]({{< relref "/operate/featureform/deploy" >}}) for naming and lifecycle guidance.

For deployments where internal services reach the IdP at a different URL than external clients, use `oidcDiscoveryURL`, `oidcPublicIssuerURL`, and `oidcPublicDiscoveryURL` to split the discovery and issuer endpoints. The `oidcSkipIssuerCheck: true` flag disables issuer-claim validation. Use it only during local development.

Feature Form reads role information from JWT claims on each request. It checks the following claims, in order, for matches against built-in role IDs:

- `featureform_roles` (string or array)
- `roles` (string or array)
- `role` (string)
- `realm_access.roles` (array; Keycloak convention)

If any of those claims contain `global_admin`, Feature Form treats the user as a global admin for that token's lifetime without a database binding. This is the typical way operators bootstrap the first admin — see [Provision the first global admin](#provision-the-first-global-admin).

### Register a CLI client

Register a dedicated CLI client with the IdP. The client settings must match the login methods advertised through `auth.oidcCLILoginMethods`.

| Login method | IdP client requirements | Helm settings |
| --- | --- | --- |
| `device_code` | Use a public or native client with client authentication disabled. Enable the OAuth 2.0 Device Authorization Grant. No client secret or redirect URI is used. | Set `auth.oidcCLIClientID` and `auth.oidcCLILoginMethods: "device_code"`. |
| `authorization_code_pkce` | Enable the Authorization Code Grant and Proof Key for Code Exchange (PKCE) with the SHA-256 (`S256`) challenge method. Register the exact redirect URI used by the CLI. A public client is recommended. | Set `auth.oidcCLIClientID`, `auth.oidcCLILoginMethods: "authorization_code_pkce"`, and `auth.oidcCLIRedirectURI`. |

The IdP must allow every scope in `auth.oidcCLIScopes`. The default scopes are `openid profile offline_access`. The `offline_access` scope lets the CLI request a refresh token. Remove it when the IdP doesn't support offline access; users must sign in again after their access token expires.

If the IdP requires a confidential client for PKCE, provide its secret only at login through `FEATUREFORM_LOGIN_CLIENT_SECRET` or `--login-client-secret`. Don't put the CLI client secret in Helm values. The CLI doesn't persist the secret or the refresh token from that login.

In the Helm values file for the Feature Form release, use these settings to configure PKCE instead of device authorization:

```yaml
auth:
  oidcCLIClientID: "featureform-cli"
  oidcCLILoginMethods: "authorization_code_pkce"
  oidcCLIRedirectURI: "http://localhost:8080/callback"
```

### Sign in with the CLI

The `ff auth` commands handle login, session inspection, and token retrieval:

```bash
# Interactive login. Uses the first method advertised by Feature Form.
ff auth login

# Force a specific flow.
ff auth login --login-method device_code
ff auth login --login-method authorization_code_pkce

# Inspect the current session.
ff auth status
ff auth whoami

# Print the active access token (for use in tools that don't
# integrate with the CLI session).
ff auth token

# Clear the local session. Does not revoke tokens on the IdP.
ff auth logout
```

Pick a login method based on your environment:

- **device-code** for headless terminals or shared shells where a local browser callback can't be reached.
- **authorization_code_pkce** when a local browser callback works (typical for developer desktops).

Feature Form lists the methods in `auth.oidcCLILoginMethods`. The CLI selects the first advertised method it supports unless you pass `--login-method`. It doesn't retry another method when the IdP rejects the selected method.

Username and password login is not recommended for production environments. For production automation, use a service account instead of storing a user's password.

CLI sessions are stored in the CLI's local config (per profile). To skip interactive login entirely, set `FEATUREFORM_TOKEN` to a valid access token, or configure a service account with client credentials (see [Service accounts and machine credentials](#service-accounts-and-machine-credentials)).

### Troubleshoot CLI login

Inspect the authentication metadata provided by Feature Form through a reachable REST endpoint:

```bash
curl --fail --silent --show-error \
  https://api.example.com/api/v1/auth/metadata | python3 -m json.tool
```

If the REST API isn't public, port-forward the REST API service and query `http://localhost:8080/api/v1/auth/metadata` instead:

```bash
kubectl --namespace <namespace> port-forward \
  service/featureform-featureform-rest 8080:8080
```

Confirm that `cli_client_id`, `supported_login_methods`, `scopes`, and `audience` match the IdP client. For PKCE, also confirm `cli_redirect_uri`. Then inspect the IdP discovery document:

```bash
curl --fail --silent --show-error \
  https://idp.example.com/realms/featureform/.well-known/openid-configuration \
  | python3 -m json.tool
```

For device authorization, the document must contain `device_authorization_endpoint`. For PKCE, it must contain `authorization_endpoint` and `token_endpoint`, and have SHA-256 support in `code_challenge_methods_supported` when that field is present.

| Symptom | Check and action |
| --- | --- |
| `invalid_client` | Confirm `auth.oidcCLIClientID` exactly matches the IdP client. For a public client, turn off client authentication. For confidential PKCE, supply the current secret at login. |
| `unauthorized_client` | Enable the grant required by the selected method: Device Authorization Grant for `device_code`, or Authorization Code Grant with PKCE for `authorization_code_pkce`. |
| Feature Form doesn't show the requested login method | Set `auth.oidcCLILoginMethods` to a method supported by both the CLI and IdP, upgrade the release, and inspect the Feature Form metadata again. |
| Redirect URI mismatch | Make `auth.oidcCLIRedirectURI` exactly match a redirect URI registered for the IdP client, including its scheme, host, port, path, and query parameters. |
| `invalid_scope` | Allow every value in `auth.oidcCLIScopes` at the IdP, or remove unsupported optional scopes. |

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

- **Global** — Deployment-wide actions, such as creating workspaces. Only `global_admin` operates at this scope.
- **Workspace** — Actions inside a single workspace: providers, secret providers, apply, graph, catalog, serving metadata, and audit. A binding at this scope applies to one workspace only — grant the role again on each workspace a user needs.
- **Resource-constrained** — A narrower form of workspace scope that limits a binding to a specific set of resources. Used for the `model` role, which only sees serving and training-set reads for the resources it was bound to.

A binding pairs a role with a scope and a user, group, or service account. For example: "Alice has `workspace_admin` on workspace `7f2e4d8c-…`" or "the `payments-team` group has `global_admin`."

### Provision the first global admin

A fresh Feature Form deployment has no role bindings in its database. There is no dedicated Helm value for an initial admin, so plan your IdP claim mapping before installing. To get the first global admin in place, choose one of two paths:

**Map an IdP claim to `global_admin` (recommended for production).** Configure your IdP to issue a `featureform_roles` claim that contains `global_admin` for the appropriate user or group. Feature Form treats those tokens as global admin without a database binding, so the first admin can sign in and start granting roles to others immediately.

**Bind manually after the first login.** A user with no role can still authenticate; they just can't do anything yet. From a host that already has an access token for a privileged account, run:

```bash
ff rbac grant global_admin --global --user <user-principal-id>
```

This option requires that *some* identity already has `global_admin`, which makes it suitable only for redirecting access from a temporary IdP-claim admin to a database-bound one, or for environments where you can run `ff` commands with a bootstrap token issued out-of-band.

## Service accounts and machine credentials

Non-human identities—CI runners, model-serving processes, batch jobs—authenticate with a service account that holds a public key registered with Feature Form. Feature Form supports Ed25519 keys.

The end-to-end setup:

1. Register a service-account principal in your IdP.
2. Create a machine credential that registers the principal's public key with Feature Form.
3. Grant the service account a workspace role.
4. Use the resulting token in your automation.

Create a credential for a service account inside a workspace:

```bash
ff machine-credential create ci-runner-key \
  --workspace <workspace-id> \
  --service-account <service-account-principal-id> \
  --public-key "<key material>" \
  --algorithm Ed25519
```

The `ff machine-credential` command also has subcommands for `list`, `get`, `rotate`, `revoke`, and `usage` (for audit-style usage records). All of them require the `machine_credential.write` or `machine_credential.read` permission on the target workspace.

Grant the service account a workspace role the same way you would a user — use `--service-account <id>` instead of `--user <id>`:

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
- `--event-type <type>` — filter by event name.

Common event types include:

- `workspace.create`, `workspace.update`, `workspace.delete`
- `rbac.grant`, `rbac.revoke`
- `provider.write`, `secret_provider.write`
- `apply.write`
- `machine_credential.create`, `machine_credential.rotate`, `machine_credential.revoke`

Each event includes the scope, workspace ID (if applicable), actor ID, event type, and creation timestamp. Reading the log requires the `audit.read` permission; deployment-scope reads additionally require `global_admin`.

## Next steps

- [Deploy]({{< relref "/operate/featureform/deploy" >}}) — chart acquisition and install with OIDC enabled.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create workspaces, grant roles, and verify bindings.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect Postgres, Redis, S3, and other backends after auth is set up.
- [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) — background on workspaces and the resource graph.
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — end-to-end verification.
