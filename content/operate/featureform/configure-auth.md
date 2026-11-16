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

Redis Feature Form authenticates every request, then enforces built-in role-based access control (RBAC) on the authenticated principal. Authentication is a deployment-wide concern configured at install time; authorization is per-workspace (with a small number of deployment-scoped exceptions) and managed through role bindings.

People sign in through an external OpenID Connect (OIDC) or OAuth 2.0 identity provider (IdP), such as Keycloak or Okta. Scripts and services authenticate with Feature Form machine credentials. Feature Form never grants access based on roles or other claims from the IdP: every permission comes from a Feature Form role binding.

A [workspace]({{< relref "/develop/ai/featureform/concepts#workspaces" >}}) isolates resources; RBAC bindings control who can act on it.

The sequence:

1. [Choose authentication methods](#choose-authentication-methods)
2. [Configure paired OIDC sign-in](#configure-paired-oidc-sign-in) or [resource-server authentication](#configure-resource-server-authentication)
3. [Prepare the identity provider](#prepare-the-identity-provider)
4. [Sign in with the CLI](#sign-in-with-the-cli)
5. [Pick built-in roles for users and groups](#built-in-roles)
6. [Provision the first global admin](#provision-the-first-global-admin)
7. [Set up machine credentials for non-human identities](#service-accounts-and-machine-credentials)
8. [Read the audit log](#audit)

For step-by-step IdP configuration, see [Configure Okta]({{< relref "/operate/featureform/configure-okta" >}}).

## Authentication

### Choose authentication methods

Enable at least one method in the Helm chart's `auth` block. You can enable more than one.

| Method | Use it for | Helm setting |
| --- | --- | --- |
| Paired OIDC sign-in | People who use the `ff` command-line interface (CLI), the Python SDK, or the dashboard. Feature Form validates an OIDC ID token from the IdP. | `auth.interactive.enabled: true` |
| Resource-server authentication | People who use the CLI, the Python SDK, or the dashboard, when the IdP issues access tokens for a Feature Form API audience. Feature Form validates each access token through the IdP's token introspection endpoint. | `auth.resourceServer.enabled: true` |
| Machine credentials | Scripts, continuous integration (CI) jobs, and model-serving processes | `auth.machineAuthEnabled: true` |

Each method validates its own credentials. A request that carries an ID token always uses paired sign-in. When a credential fails validation, Feature Form rejects the request; it never retries the request with another method.

When you enable both paired sign-in and resource-server authentication, the CLI and dashboard use paired sign-in by default.

### Configure paired OIDC sign-in

With paired OIDC sign-in, clients send both the OIDC ID token and the access token on every request. Feature Form verifies the ID token's signature, issuer, audience, and expiry. It then calls the IdP's UserInfo endpoint with the access token and requires the UserInfo subject to match the ID token's `sub` claim. The validated `sub` becomes the user's principal ID.

Feature Form doesn't need to read the access token itself, so it works with IdPs that issue opaque access tokens or access tokens intended for another API.

Set the paired OIDC parameters in the Helm chart's `auth` block:

```yaml
auth:
  interactive:
    enabled: true
    clientIDs:
      - "featureform-cli"
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcCLIClientID: "featureform-cli"
  oidcCLIScopes: "openid profile offline_access"
  oidcCLILoginMethods: "device_code"
  deploymentID: "acme-featureform-prod-us-west-2"
```

- `auth.interactive.clientIDs` lists every client that signs users in. Feature Form accepts an ID token only when its audience is in this list. It must include `auth.oidcCLIClientID` and, when the dashboard is enabled, `dashboard.auth.oidcClientID`. Helm rendering fails otherwise.
- `auth.oidcIssuerURL` is the exact `issuer` value from the IdP's discovery document. It must be an HTTPS URL.
- `auth.oidcCLIClientID`, `auth.oidcCLIScopes`, and `auth.oidcCLILoginMethods` are advertised to the CLI. See [Register a CLI client](#register-a-cli-client).

Use a unique, stable `auth.deploymentID` for each environment. See [Deploy]({{< relref "/operate/featureform/deploy" >}}) for naming and lifecycle guidance.

Browsers, CLI hosts, and Feature Form pods must all reach the IdP at the same issuer URL. Feature Form reads `<issuer>/.well-known/openid-configuration` from that URL and uses the signing-key and UserInfo endpoints it advertises.

The server doesn't accept requests until it has read the IdP's discovery document. See [Plan for identity provider availability]({{< relref "/operate/featureform/deploy#plan-for-identity-provider-availability" >}}).

### Prepare the identity provider

Register a separate client with the IdP for each application that signs users in. Each client must issue ID tokens, so `openid` must be among its requested scopes.

| Client | IdP client requirements | Helm settings |
| --- | --- | --- |
| CLI and Python SDK | A public or native client with client authentication disabled, configured for the [login method](#register-a-cli-client) you advertise. | `auth.oidcCLIClientID`, plus the same ID in `auth.interactive.clientIDs`. |
| Dashboard | A confidential web client that uses the Authorization Code grant, with the redirect URI `https://<dashboard-host>/api/auth/callback/oidc`. | `dashboard.auth.oidcClientID`, plus the same ID in `auth.interactive.clientIDs`. Store its client secret in the [dashboard Secret]({{< relref "/operate/featureform/deploy#dashboard-requirements" >}}). |

Each user's principal ID is the `sub` claim that the IdP puts in ID tokens for that client. Some IdPs issue a different subject for the same person in each client. In that case, the dashboard and CLI identities are separate principals, and each needs its own role bindings. Before production, sign in through every client and compare `ff rbac whoami` results. Never grant roles by email address.

### Map IdP groups

Group bindings work only when you tell Feature Form where to read group names. Configure a source and a top-level claim name:

```yaml
auth:
  interactive:
    groups:
      source: "userinfo"
      claim: "groups"
```

- `source` is `id_token` or `userinfo`. Feature Form reads groups from that source only.
- `claim` is the literal name of a top-level claim that contains an array of group names.

Group names are compared exactly, including case and whitespace. A missing or malformed claim grants no group access, but authentication still succeeds. Configure the IdP to include the claim, and add any scope it requires, such as `groups`, to `auth.oidcCLIScopes` and `dashboard.auth.oidcScopes`.

Feature Form caches authentication results for up to `auth.cacheTTLSeconds` (default `60`), never past the ID token's expiry. After you remove a user from a group in the IdP, the change takes effect when the cached result expires for `userinfo` groups, and when the ID token expires for `id_token` groups. Removing a group membership doesn't revoke a role bound directly to the user.

### Configure resource-server authentication

With resource-server authentication, clients send only an OAuth access token that the IdP issued for Feature Form's API audience. Feature Form validates every token through the IdP's OAuth 2.0 token introspection endpoint ([RFC 7662](https://www.rfc-editor.org/rfc/rfc7662.html)), using a client dedicated to introspection. It accepts a token only when the introspection response:

- reports the token as active;
- has an `aud` value that includes `auth.resourceServer.audience`; and
- has a `token_type` of `Bearer`, when the response includes `token_type`.

An inactive or expired token, a different audience, or another token type returns HTTP `401` or gRPC `Unauthenticated`. When Feature Form can't complete introspection, for example because the endpoint is unreachable, rejects the introspection client, or returns an unexpected response, the request returns HTTP `503` or gRPC `Unavailable`.

Store the introspection client's secret in a Secret in the release namespace. Put the secret in a restricted file, then create the Secret:

```bash
kubectl --namespace <namespace> create secret generic featureform-introspection \
  --from-file=client-secret=<path-to-introspection-client-secret-file>
```

Set the resource-server parameters in the Helm chart's `auth` block:

```yaml
auth:
  oidcIssuerURL: "https://idp.example.com/realms/featureform"
  oidcCLIClientID: "featureform-cli"
  oidcCLIScopes: "openid profile offline_access"
  oidcCLILoginMethods: "device_code"
  resourceServer:
    enabled: true
    audience: "featureform-resource"
    validation: "introspection"
    introspection:
      clientID: "featureform-introspection"
      existingSecret: featureform-introspection
      secretKey: client-secret
      authMethod: "client_secret_basic"
  deploymentID: "acme-featureform-prod-us-west-2"
```

- `auth.oidcIssuerURL` is the exact `issuer` value from the IdP's discovery document. Feature Form reads the introspection endpoint from that document.
- `auth.resourceServer.audience` is the audience the IdP puts in access tokens for Feature Form. See [Choose the audience](#choose-the-audience).
- `auth.resourceServer.introspection.clientID` is a client that Feature Form uses only to call the introspection endpoint. Don't reuse the CLI or dashboard client.
- `auth.resourceServer.introspection.existingSecret` and `secretKey` name the Secret and key that hold the introspection client's secret.
- `auth.resourceServer.introspection.authMethod` is how Feature Form authenticates to the introspection endpoint: `client_secret_basic` or `client_secret_post`. Use a method the IdP supports for the introspection client. When the discovery document lists supported introspection authentication methods, the list must include this one. Feature Form doesn't try the other method.
- To use an introspection endpoint other than the one in the discovery document, set `auth.resourceServer.introspection.endpoint` to its HTTPS URL.
- `auth.oidcCLIClientID`, `auth.oidcCLIScopes`, and `auth.oidcCLILoginMethods` are advertised to the CLI, along with the audience. See [Register a CLI client](#register-a-cli-client).

Register the CLI and dashboard clients with the IdP as described in [Prepare the identity provider](#prepare-the-identity-provider), and configure the IdP to issue their access tokens for the Feature Form audience. Set the dashboard client in `dashboard.auth.oidcClientID`. `auth.interactive.clientIDs` applies only to paired sign-in.

#### Choose the audience

Use an audience that isn't the client ID of any OAuth client, such as `featureform-resource` or `api://featureform`, and configure the IdP to put it only in access tokens. Some introspection endpoints report ID tokens and refresh tokens as active, and an ID token's `aud` always contains the client it was issued to. An audience that equals a client ID would let those tokens authenticate. Feature Form logs a warning at startup when the audience equals the CLI client ID or a client in `auth.interactive.clientIDs`.

#### Resource-server principals

By default, Feature Form treats every accepted token as a user whose principal ID is the `sub` value in the introspection response. Feature Form can't tell whether a token was issued to a person or to a machine client, so allow only your sign-in applications to obtain tokens for the audience. For automation, use [machine credentials](#service-accounts-and-machine-credentials).

The access-token `sub` can differ from the ID-token `sub` for the same person. If you enable both paired sign-in and resource-server authentication, sign in with each method, compare the `ff rbac whoami` results, and bind roles to each principal ID.

To classify tokens as users or service accounts, name a top-level claim that the IdP sets on every token, and map its values to principal types:

```yaml
auth:
  resourceServer:
    principalTypeClaim: "principal_type"
    principalTypeMapping:
      human: user
      machine: service_account
    serviceAccountIDClaim: "client_id"
```

- Set `principalTypeClaim` and `principalTypeMapping` together. Each mapping value is `user` or `service_account`.
- A mapping to `service_account` requires `serviceAccountIDClaim`, the claim whose value becomes the service account's principal ID. Users keep `sub` as their principal ID.
- Once classification is on, a token whose claim is missing or has an unmapped value fails authentication.
- The IdP must set these claims from the authenticated client or user, never from request parameters or attributes that users can edit.
- With `client_id` as the service-account ID claim, every token issued to one application authenticates as the same service account.

Turning classification on or off, or changing these claims, changes principal IDs. Grant roles to the new principal IDs before you change the configuration.

#### Map groups from introspection

To bind roles to IdP groups, read group names from the introspection response:

```yaml
auth:
  resourceServer:
    groups:
      source: "introspection"
      claim: "groups"
```

The source must be `introspection`. `claim` is the literal name of a top-level claim that contains an array of group names. Group names are compared exactly, and a missing or malformed claim grants no group access but doesn't block authentication.

#### Cache introspection results

By default, Feature Form introspects every request. To reduce load on the IdP, set `auth.resourceServer.introspection.cacheTTLSeconds` to a value from `1` to `60`. Feature Form caches only successful results and never past the token's expiry. A revoked token, or a user's changed group membership, can keep working until its cached result expires. Role bindings are checked on every request, so granting or revoking a role takes effect immediately.

### Register a CLI client

Register a dedicated CLI client with the IdP. The client settings must match the login methods advertised through `auth.oidcCLILoginMethods`. When it's empty, Feature Form advertises `device_code`.

| Login method | IdP client requirements | Helm settings |
| --- | --- | --- |
| `device_code` | Use a public or native client with client authentication disabled. Enable the OAuth 2.0 Device Authorization Grant. No client secret or redirect URI is used. | Set `auth.oidcCLIClientID` and `auth.oidcCLILoginMethods: "device_code"`. |
| `authorization_code_pkce` | Enable the Authorization Code Grant and Proof Key for Code Exchange (PKCE) with the SHA-256 (`S256`) challenge method. Register the exact redirect URI used by the CLI. A public client is recommended. | Set `auth.oidcCLIClientID`, `auth.oidcCLILoginMethods: "authorization_code_pkce"`, and `auth.oidcCLIRedirectURI`. |

The IdP must allow every scope in `auth.oidcCLIScopes`. The default scopes are `openid profile offline_access`. Keep `openid`; paired sign-in requires an ID token. The `offline_access` scope lets the CLI request a refresh token. The IdP must also return a new ID token when the CLI refreshes the session. Otherwise, users must sign in again when their ID token expires.

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

CLI sessions are stored in the CLI's local config (per profile). A paired session holds both the ID token and the access token. A resource-server session holds the access token.

When both paired sign-in and resource-server authentication are enabled, `ff auth login` uses paired sign-in. To sign in with resource-server authentication instead, pass `--credential-mode resource_token`.

A token from `ff auth token` or `FEATUREFORM_TOKEN` is sent alone, without an ID token. Feature Form accepts it only through resource-server authentication. For automation, use a [machine credential](#service-accounts-and-machine-credentials) instead.

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

Confirm that `default_login_credential_mode` is `id_token_pair` when paired sign-in is enabled, or `resource_token` when only resource-server authentication is enabled. Confirm that `issuer_url`, `cli_client_id`, `supported_login_methods`, and `scopes` match the IdP client. For PKCE, also confirm `cli_redirect_uri`. For resource-server authentication, also confirm `audience`. Then inspect the IdP discovery document:

```bash
curl --fail --silent --show-error \
  https://idp.example.com/realms/featureform/.well-known/openid-configuration \
  | python3 -m json.tool
```

The document's `issuer` must exactly equal `auth.oidcIssuerURL`, and it must contain `userinfo_endpoint` and `jwks_uri`. For device authorization, the document must contain `device_authorization_endpoint`. For PKCE, it must contain `authorization_endpoint` and `token_endpoint`, and have SHA-256 support in `code_challenge_methods_supported` when that field is present.

| Symptom | Check and action |
| --- | --- |
| `invalid_client` | Confirm `auth.oidcCLIClientID` exactly matches the IdP client. For a public client, turn off client authentication. For confidential PKCE, supply the current secret at login. |
| `unauthorized_client` | Enable the grant required by the selected method: Device Authorization Grant for `device_code`, or Authorization Code Grant with PKCE for `authorization_code_pkce`. |
| Feature Form doesn't show the requested login method | Set `auth.oidcCLILoginMethods` to a method supported by both the CLI and IdP, upgrade the release, and inspect the Feature Form metadata again. |
| Redirect URI mismatch | Make `auth.oidcCLIRedirectURI` exactly match a redirect URI registered for the IdP client, including its scheme, host, port, path, and query parameters. |
| `invalid_scope` | Allow every value in `auth.oidcCLIScopes` at the IdP, or remove unsupported optional scopes. |
| `credential pair required; upgrade the client and sign in again` | The request carried only an access token, such as one from `ff auth token` or `FEATUREFORM_TOKEN`, and resource-server authentication isn't enabled. Run `ff auth login` again. For automation, use a [machine credential](#service-accounts-and-machine-credentials). |
| Login succeeds, then every command returns `Unauthenticated` | For paired sign-in, confirm the client ID is in `auth.interactive.clientIDs` and the IdP's `issuer` equals `auth.oidcIssuerURL`. For resource-server authentication, confirm the IdP issues the CLI's access tokens with `auth.resourceServer.audience` in `aud`. Then run `ff auth login` again. |
| Commands return `Unavailable` with resource-server authentication | Feature Form couldn't complete token introspection. Confirm that the server pods can reach the introspection endpoint, and that `auth.resourceServer.introspection.clientID`, its secret, and `authMethod` match the introspection client at the IdP. |
| Sign-in works but commands return `PermissionDenied` | Authentication succeeded. Run `ff rbac whoami` and grant a role to the reported `principal_id`. |

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

A binding pairs a role with a scope and a user, group, or service account. For example: "Alice has `workspace_admin` on workspace `7f2e4d8c-…`" or "the `payments-team` group has `global_admin`." Group bindings require [group mapping](#map-idp-groups).

### Provision the first global admin

A fresh Feature Form deployment has no role bindings. Name the first global admins in Helm values before installing:

```yaml
auth:
  bootstrapGlobalAdmins:
    - principalType: user
      principalID: "<admin-subject>"
```

At startup, before it accepts requests, Feature Form grants global `global_admin` to each entry and records the grant in the audit log. Restarts and additional replicas don't create duplicate grants.

- `principalType` is `user`, `group`, or `service_account`. A `group` entry requires [group mapping](#map-idp-groups). A `service_account` entry requires `auth.machineAuthEnabled: true`.
- `principalID` is the exact principal ID. For a user, that's the ID token's `sub` claim for the client the admin signs in with. Get it from the IdP's user record, or have the admin sign in and run `ff rbac whoami`, then read `principal_id`.

Bootstrap only adds grants. Removing an entry doesn't revoke its grant, and a revoked grant whose entry is still configured returns on the next restart. To remove an admin, delete the entry from your values, upgrade the release, then revoke the grant:

```bash
ff rbac revoke global_admin --global --user <user-principal-id>
```

After the first admin signs in, grant other roles with `ff rbac grant`:

```bash
ff rbac grant global_admin --global --user <user-principal-id>
```

Anyone who can change the release's Helm values can create a global admin through this setting. Protect the values file accordingly.

## Service accounts and machine credentials

Non-human identities—CI runners, model-serving processes, batch jobs—authenticate with a machine credential: an Ed25519 public key registered with Feature Form for a service-account principal. The automation keeps the private key and signs a short-lived JSON Web Token (JWT), called an assertion, for each request. Service-account principals exist only in Feature Form; you don't register them with the IdP.

Machine credentials are disabled by default. Enable them in the Helm chart's `auth` block:

```yaml
auth:
  machineAuthEnabled: true
  machineAudience: "featureform-api"
```

`auth.machineAudience` is the audience that every assertion must carry. It defaults to `featureform-api`.

The end-to-end setup:

1. Generate a key pair.
2. Register the public key as a machine credential.
3. Grant the service account a role.
4. Sign an assertion for each request.

### Register a machine credential

Generate an Ed25519 key pair with OpenSSL 1.1.1 or later. Keep the private key out of source control:

```bash
(
  set -e
  set -C  # Refuse to overwrite existing files
  umask 077
  openssl genpkey -algorithm Ed25519 > machine-private.pem
  openssl pkey -in machine-private.pem -pubout > machine-public.pem
)
```

As a `global_admin`, register the public key for a service account in a workspace. The command prints the credential's UUID, which becomes the assertion's key ID:

```bash
ff --output json machine-credential create ci-runner-key \
  --workspace <workspace-id> \
  --service-account ci-runner \
  --public-key "$(cat machine-public.pem)" \
  --algorithm Ed25519 \
  | jq -er '.id'
```

To register a credential that isn't tied to a workspace, pass `--global` instead of `--workspace`. Registering a credential grants no access. Grant the service account a role the same way you would a user — use `--service-account <id>` instead of `--user <id>`:

```bash
ff rbac grant operator \
  --workspace <workspace-id> \
  --service-account ci-runner
```

The `ff machine-credential` command also has subcommands for `list`, `get`, `rotate`, `revoke`, and `usage` (when the credential last authenticated). Creating and rotating a credential requires `global_admin`.

### Sign and use an assertion

An assertion is a JWT signed with the EdDSA algorithm and the private key. It must meet these requirements:

| Field | Requirement |
| --- | --- |
| `kid` header | The credential's UUID. |
| `aud` | The value of `auth.machineAudience`. |
| `iat` and `exp` | Both present, no more than 15 minutes apart. |
| `jti` | A new random value for every assertion. Feature Form rejects a reused `jti`. |
| `sub` | Optional. If set, it must equal the service account's principal ID. |

Each assertion is single-use, so sign a new one for every request, including retries. This Python signer uses the [PyJWT](https://pyjwt.readthedocs.io/) package, installed with `pip install 'PyJWT[crypto]'`. Save it as `machine_assertion.py` next to the private key:

```python
import os
import time
import uuid
from pathlib import Path

import jwt

PRIVATE_KEY = Path(__file__).with_name("machine-private.pem").read_bytes()


def new_assertion() -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": "ci-runner",
            "aud": os.environ.get("MACHINE_AUDIENCE", "featureform-api"),
            "iat": now,
            "exp": now + 60,
            "jti": str(uuid.uuid4()),
        },
        PRIVATE_KEY,
        algorithm="EdDSA",
        headers={"kid": os.environ["MACHINE_CREDENTIAL_ID"]},
    )


if __name__ == "__main__":
    print(new_assertion())
```

Pass the assertion as a bearer token. `ff rbac whoami` reports a `service_account` principal:

```bash
export MACHINE_CREDENTIAL_ID=<credential-uuid>
ff --grpc-server grpc.example.com:443 \
  --token "$(python machine_assertion.py)" rbac whoami
```

In the Python SDK, pass the signing function as `token_provider` so that every call, including pagination, gets a new assertion:

```python
from featureform import Client, Config
from machine_assertion import new_assertion

config = Config(base_url="grpc.example.com:443", token_provider=new_assertion)

with Client(config=config, transport="grpc") as client:
    for workspace in client.workspaces.list():
        print(workspace.id, workspace.name)
```

Rotate the key with `ff machine-credential rotate <credential-uuid> --public-key "$(cat machine-public-next.pem)"`. Revoke it with `ff machine-credential revoke <credential-uuid>`. After revocation, every new assertion fails authentication.

### Bootstrap a machine administrator

To administer a fresh deployment without a human sign-in, register a global machine credential and its `global_admin` grant in Helm values:

```yaml
auth:
  machineAuthEnabled: true
  bootstrapGlobalAdmins:
    - principalType: service_account
      principalID: platform-bot
  bootstrapMachineCredentials:
    - id: "<lowercase-uuid-v4>"
      name: platform-key
      principalID: platform-bot
      publicKeyFrom:
        secretKeyRef:
          name: <public-key-secret-name>
          key: <public-key-file-name>
```

- `id` becomes the assertion's `kid`. It must be a random, lowercase, hyphenated version 4 UUID, such as the output of `uuidgen | tr '[:upper:]' '[:lower:]'`.
- Provide the public key in exactly one way: inline PEM in `publicKey`, or a reference to a key in a Secret (`publicKeyFrom.secretKeyRef`) or ConfigMap (`publicKeyFrom.configMapKeyRef`) in the release namespace.
- Registering a credential grants nothing on its own. Pair it with a `service_account` entry in `auth.bootstrapGlobalAdmins`.

Feature Form registers each credential once. Startup fails if a configured entry's key, principal, or name differs from the stored credential with the same `id`. Rotate keys through `ff machine-credential rotate` instead. Feature Form reads referenced keys only at startup, so restart the server after changing a referenced Secret or ConfigMap.

Bootstrap never reactivates a revoked credential. To retire a bootstrap identity, revoke its credential, then remove both the credential entry and its `auth.bootstrapGlobalAdmins` entry.

## Audit

Feature Form keeps an append-only audit log of access changes at deployment (global) and workspace scope. Each change and its audit event are saved together, so every successful grant, revocation, or credential change has a matching event.

### Audit event types

| Event type | Recorded when |
| --- | --- |
| `rbac.binding.granted`, `rbac.binding.revoked` | A role is granted to or revoked from a user, group, or service account. |
| `rbac.model_resource.granted`, `rbac.model_resource.revoked` | A model resource binding is added or removed. |
| `machine_credential.created`, `machine_credential.rotated`, `machine_credential.revoked` | A machine credential is registered, rotated, or revoked. |

Grants from `auth.bootstrapGlobalAdmins` and credentials from `auth.bootstrapMachineCredentials` are recorded with the actor `featureform-bootstrap`.

Each event has these fields:

| Field | Description |
| --- | --- |
| `id` | Event ID. |
| `scope` | `global` or `workspace`. |
| `workspace_id` | The workspace, for workspace-scoped events. |
| `actor_type`, `actor_id` | The user, group, or service account that made the change. |
| `event_type` | One of the event types above. |
| `target_type`, `target_id` | The changed object—`role_binding`, `model_resource_binding`, or `machine_credential`—and its ID. |
| `metadata` | Details of the change, such as the role and the principal it was granted to. |
| `created_at` | When the change was made, as an RFC 3339 timestamp. |

For example, this event records a user revoking the `operator` role from a service account:

```json
{
  "id": "<event-id>",
  "scope": "workspace",
  "workspace_id": "<workspace-id>",
  "actor_type": "user",
  "actor_id": "<admin-user-id>",
  "event_type": "rbac.binding.revoked",
  "target_type": "role_binding",
  "target_id": "<role-binding-id>",
  "metadata": {
    "role": "operator",
    "principal_id": "ci-runner",
    "principal_type": "service_account"
  },
  "created_at": "2026-10-28T14:02:11Z"
}
```

### List audit events

List events with `ff audit list`:

```bash
ff --output json audit list \
  --workspace <workspace-id> \
  --event-type rbac.binding.revoked
```

Filters:

- `--workspace <id>` — events in one workspace.
- `--global` — deployment-scoped events only.
- `--principal-id <id>` — changes made by a specific user, group, or service account (the actor).
- `--event-type <type>` — events of one type.
- `--page-size <n>` — the number of events to return.

Events are returned newest first, 100 by default. The default table output shows the ID, scope, workspace, actor, event type, and time. Use `--output json` or `--output yaml` to include the target and metadata.

The REST API serves the same events from `GET /api/v1/workspaces/<workspace-id>/audit-logs` and, for deployment-scoped events, `GET /api/v1/audit-logs`. Both accept the query parameters `principal_id`, `actor_type`, `event_type`, `target_type`, `target_id`, and `page_size`, plus `since` and `until` as RFC 3339 timestamps. The gRPC API serves them through `AuditService`.

Reading workspace events requires the `audit.read` permission in that workspace, which `workspace_admin` includes. Reading deployment-scoped events requires `global_admin`.

### Review current access

The audit log records changes. To review the access in effect now:

- `ff rbac list --workspace <workspace-id>` lists the role bindings in a workspace.
- `ff rbac effective --workspace <workspace-id> --service-account <id> --explain` shows a principal's effective permissions and the bindings that grant them. Use `--user` or `--group` for other principal types.
- `ff machine-credential list --workspace <workspace-id>` lists a workspace's machine credentials and their status. `ff machine-credential usage <credential-uuid>` reports when a credential last authenticated successfully.
- `GET /api/v1/workspaces/<workspace-id>/access-summary` returns counts of principals, role bindings, model resource bindings, and active and revoked machine credentials, plus the number of access changes in the last seven days and the time of the most recent change.

### Audit log limits

- The audit log records access changes only. It doesn't record sign-ins, denied requests, resource reads or writes such as `ff apply`, or feature serving requests. For aggregate serving volume, latency, and errors, export server metrics as described in [Configure observability]({{< relref "/operate/featureform/deploy#configure-observability" >}}).
- Deleting a workspace deletes its audit events. Export any events you need to keep before you delete a workspace.

## Next steps

- [Deploy]({{< relref "/operate/featureform/deploy" >}}) — chart acquisition and install with OIDC enabled.
- [Configure Okta]({{< relref "/operate/featureform/configure-okta" >}}) — set up Okta for paired sign-in or resource-server authentication.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create workspaces, grant roles, and verify bindings.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect Postgres, Redis, S3, and other backends after auth is set up.
- [Concepts]({{< relref "/develop/ai/featureform/concepts" >}}) — background on workspaces and the resource graph.
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — end-to-end verification.
