---
Title: Configure Okta
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Configure Okta applications and Redis Feature Form settings for OIDC sign-in and resource-server authentication.
linkTitle: Configure Okta
weight: 80
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Use Okta as the identity provider (IdP) for Redis Feature Form. This page configures sign-in for the `ff` command-line interface (CLI) and the dashboard in one of two ways:

- [Paired OpenID Connect (OIDC) sign-in](#configure-paired-oidc-sign-in) through the Okta org authorization server. Feature Form validates Okta ID tokens.
- [Resource-server authentication](#configure-resource-server-authentication) through an Okta custom authorization server. Feature Form validates Okta access tokens through token introspection.

For how each method works and the full set of Helm settings, see [Configure authentication and RBAC](/content/operate/featureform/configure-auth.md). Machine credentials don't use Okta; see [Service accounts and machine credentials](/content/operate/featureform/configure-auth.md#service-accounts-and-machine-credentials).

## Configure paired OIDC sign-in

You create two Okta applications, one for the CLI and one for the dashboard, then point Feature Form at them:

| Okta value | Feature Form setting |
| --- | --- |
| Org authorization server issuer, `https://<your-okta-domain>` | `auth.oidcIssuerURL` |
| CLI application client ID | `auth.oidcCLIClientID` and `auth.interactive.clientIDs` |
| Dashboard application client ID | `dashboard.auth.oidcClientID` and `auth.interactive.clientIDs` |
| Dashboard application client secret | `FEATUREFORM_OIDC_CLIENT_SECRET` in the dashboard Secret |

### Prerequisites

- Permission to create app integrations and assign users in the Okta Admin Console.
- Your Okta domain, such as `<your-okta-domain>`.
- The public hostname of the Feature Form dashboard, such as `<dashboard-host>`.

### Create the CLI application

1. In the Okta Admin Console, go to **Applications > Applications** and select **Create App Integration**.
2. Select **OIDC - OpenID Connect** as the sign-in method and **Native Application** as the application type.
3. Under **Grant type**, select **Device Authorization** and **Refresh Token**.
4. Under **Assignments**, assign the users or groups that use Feature Form.
5. Save the application. Confirm that it doesn't require client authentication.
6. Copy the **Client ID**. This is `<cli-client-id>`.

### Create the dashboard application

1. Select **Create App Integration** again.
2. Select **OIDC - OpenID Connect** as the sign-in method and **Web Application** as the application type.
3. Under **Grant type**, select **Authorization Code**.
4. Under **Sign-in redirect URIs**, enter `https://<dashboard-host>/api/auth/callback/oidc`.
5. Under **Assignments**, assign the same users or groups as the CLI application.
6. Save the application.
7. Copy the **Client ID** and **Client secret**. These are `<dashboard-client-id>` and `<dashboard-client-secret>`.

### Add a groups claim

Skip this step if you grant roles only to individual users.

To bind Feature Form roles to Okta groups, configure both applications to return group names in a `groups` claim:

1. Open the application and select the **Sign On** tab.
2. In the **OpenID Connect ID Token** section, select **Edit**.
3. Set **Groups claim type** to **Filter**, enter `groups` as the claim name, and add a filter that matches the groups Feature Form should see.
4. Save, then repeat for the other application.

The Helm values in [Configure Feature Form](#configure-feature-form) request the `groups` scope and read the claim from Okta's UserInfo response. See [Okta's groups claim guide](https://developer.okta.com/docs/guides/customize-tokens-groups-claim/main/) for filter syntax.

### Create the dashboard Secret

The dashboard needs two secrets:

- `FEATUREFORM_OIDC_CLIENT_SECRET` is the dashboard application's client secret from Okta. The dashboard uses it to exchange sign-in authorization codes for tokens.
- `FEATUREFORM_DASHBOARD_AUTH_SECRET` is a random value that you generate. It isn't an Okta value. After a user signs in, the dashboard stores their session, including their Okta tokens, in an encrypted browser cookie, and uses this value as the encryption key. Changing it signs out every dashboard user.

Create a restricted environment file with these entries. Generate the session secret with a command such as `openssl rand -base64 32`:

```text
FEATUREFORM_OIDC_CLIENT_SECRET=<dashboard-client-secret>
FEATUREFORM_DASHBOARD_AUTH_SECRET=<random-session-secret>
```

Create the Secret in the Feature Form release namespace:

```bash
kubectl --namespace <namespace> create secret generic featureform-dashboard-auth \
  --from-env-file=<path-to-dashboard-secret-env-file>
```

### Configure Feature Form

Add these settings to the values file you created in [Deploy](/content/operate/featureform/deploy.md#3-create-a-values-file). That file supplies `auth.deploymentID`, the public endpoints, state, license, and ingress settings:

```yaml
auth:
  interactive:
    enabled: true
    clientIDs:
      - "<cli-client-id>"
      - "<dashboard-client-id>"
    groups:
      source: "userinfo"
      claim: "groups"
  oidcIssuerURL: "https://<your-okta-domain>"
  oidcCLIClientID: "<cli-client-id>"
  oidcCLIScopes: "openid profile offline_access groups"
  oidcCLILoginMethods: "device_code"
  bootstrapGlobalAdmins:
    - principalType: user
      principalID: "<okta-user-id>"

dashboard:
  enabled: true
  auth:
    oidcClientID: "<dashboard-client-id>"
    oidcScopes: "openid profile email groups"
    url: "https://<dashboard-host>"
    existingSecret: featureform-dashboard-auth
```

- `auth.oidcIssuerURL` is the org authorization server issuer: your Okta domain with `https://` and no path or trailing slash.
- The `auth.oidcCLI*` settings configure the CLI. Feature Form advertises them to the CLI at sign-in, so the CLI needs no separate Okta configuration. `auth.oidcCLIClientID` is the CLI application's client ID, `auth.oidcCLIScopes` lists the scopes the CLI requests, and `auth.oidcCLILoginMethods: "device_code"` matches the **Device Authorization** grant on the CLI application.
- If you skipped [Add a groups claim](#add-a-groups-claim), remove `auth.interactive.groups` and the `groups` scope from both scope settings.
- Expose the dashboard at `<dashboard-host>` as described in [Configure external access](/content/operate/featureform/deploy.md#configure-external-access).

Okta uses each user's Okta user ID as the ID token subject. Both applications use the same org authorization server, so a user has the same principal ID in the CLI and the dashboard, and one role binding covers both. Copy the first admin's user ID from the Okta Admin Console or the Okta Users API.

To make the members of an Okta group global admins instead, bootstrap the group by its exact name:

```yaml
auth:
  bootstrapGlobalAdmins:
    - principalType: group
      principalID: "<okta-group-name>"
```

Install or upgrade the release with the updated values file as described in [Render and install the release](/content/operate/featureform/deploy.md#4-render-and-install-the-release).

### Verify sign-in

1. Sign in with the CLI:

    ```bash
    ff --server grpc.example.com:443 auth login --profile production
    ```

    The CLI prints an Okta verification URL and code. Open the URL, enter the code, and sign in.

2. Confirm the principal:

    ```bash
    ff rbac whoami
    ```

    The output shows `principal_type` `user` and a `principal_id` that equals your Okta user ID, plus any role bindings that apply to you or your groups.

3. Open `https://<dashboard-host>` in a browser and sign in with Okta.

### Troubleshoot Okta sign-in

| Symptom | Check and action |
| --- | --- |
| Helm reports that `auth.interactive.clientIDs` must include a client ID | Add both the CLI and dashboard client IDs to `auth.interactive.clientIDs`. |
| `unauthorized_client` during CLI login | Enable the **Device Authorization** grant on the CLI application. |
| Okta reports that the user isn't assigned to the application | Assign the user, or one of their groups, to both applications. |
| Okta reports a redirect URI error during dashboard sign-in | Make the dashboard application's sign-in redirect URI exactly `https://<dashboard-host>/api/auth/callback/oidc`, and set `dashboard.auth.url` to `https://<dashboard-host>`. |
| `invalid_scope` | Remove scopes Okta doesn't allow for the application from `auth.oidcCLIScopes` and `dashboard.auth.oidcScopes`. |
| Sign-in succeeds, then commands return `Unauthenticated` | Confirm that `auth.oidcIssuerURL` exactly equals the `issuer` in `https://<your-okta-domain>/.well-known/openid-configuration`. |
| Group bindings have no effect | Confirm that both applications have a `groups` claim whose filter matches the group, that both scope settings include `groups`, and that the group name in the binding matches the Okta group name exactly. |

For other sign-in failures, see [Troubleshoot CLI login](/content/operate/featureform/configure-auth.md#troubleshoot-cli-login).

## Configure resource-server authentication

You create an Okta custom authorization server that issues access tokens for Feature Form, sign-in applications for the CLI and dashboard, and a separate application that Feature Form uses to introspect tokens:

| Okta value | Feature Form setting |
| --- | --- |
| Custom authorization server issuer, `https://<your-okta-domain>/oauth2/<authorization-server-id>` | `auth.oidcIssuerURL` |
| Custom authorization server audience | `auth.resourceServer.audience` |
| CLI application client ID | `auth.oidcCLIClientID` |
| Dashboard application client ID | `dashboard.auth.oidcClientID` |
| Dashboard application client secret | `FEATUREFORM_OIDC_CLIENT_SECRET` in the dashboard Secret |
| Introspection application client ID | `auth.resourceServer.introspection.clientID` |
| Introspection application client secret | The introspection Secret |

### Resource-server prerequisites

- Permission to manage authorization servers, create app integrations, and assign users in the Okta Admin Console.
- Your Okta domain, such as `<your-okta-domain>`.
- The public hostname of the Feature Form dashboard, such as `<dashboard-host>`.

### Configure the custom authorization server

1. In the Okta Admin Console, go to **Security > API > Authorization Servers**.
2. Select **Add Authorization Server**. Enter a name, and set **Audience** to a value that isn't any application's client ID, such as `api://featureform`. This is `<featureform-audience>`.
3. Save the authorization server and copy its **Issuer** URL. This is `<okta-issuer>`, in the form `https://<your-okta-domain>/oauth2/<authorization-server-id>`.

Add the access policy after you create the sign-in applications in the next step.

### Create the sign-in applications

Create the CLI and dashboard applications as described in [Create the CLI application](#create-the-cli-application) and [Create the dashboard application](#create-the-dashboard-application). Skip [Add a groups claim](#add-a-groups-claim).

Then allow only these applications to get tokens from the custom authorization server:

1. Open the custom authorization server and select the **Access Policies** tab.
2. Select **Add New Access Policy**. Assign it to the CLI and dashboard applications only.
3. Add a rule to the policy that allows the **Authorization Code** and **Device Authorization** grant types. Don't allow **Client Credentials**.

Feature Form treats every token with `<featureform-audience>` as a user. Keeping other applications and machine grants out of the policy prevents them from authenticating as users. For automation, use [machine credentials](/content/operate/featureform/configure-auth.md#service-accounts-and-machine-credentials).

### Create the introspection application

1. Go to **Applications > Applications** and select **Create App Integration**.
2. Select **API Services** and save the application.
3. Confirm that **Client authentication** is set to **Client secret**.
4. Copy the **Client ID** and **Client secret**. These are `<introspection-client-id>` and `<introspection-client-secret>`.

Feature Form uses this application only to call the authorization server's introspection endpoint. Don't add it to the access policy.

### Create the resource-server Secrets

Create the dashboard Secret as described in [Create the dashboard Secret](#create-the-dashboard-secret).

Put `<introspection-client-secret>` in a restricted file, then create the introspection Secret in the Feature Form release namespace:

```bash
kubectl --namespace <namespace> create secret generic featureform-introspection \
  --from-file=client-secret=<path-to-introspection-client-secret-file>
```

### Configure Feature Form for resource-server authentication

Add these settings to the values file you created in [Deploy](/content/operate/featureform/deploy.md#3-create-a-values-file):

```yaml
auth:
  oidcIssuerURL: "<okta-issuer>"
  oidcCLIClientID: "<cli-client-id>"
  oidcCLILoginMethods: "device_code"
  resourceServer:
    enabled: true
    audience: "<featureform-audience>"
    validation: "introspection"
    introspection:
      clientID: "<introspection-client-id>"
      existingSecret: featureform-introspection
      secretKey: client-secret
      authMethod: "client_secret_basic"
  bootstrapGlobalAdmins:
    - principalType: user
      principalID: "<okta-username>"

dashboard:
  enabled: true
  auth:
    oidcClientID: "<dashboard-client-id>"
    url: "https://<dashboard-host>"
    existingSecret: featureform-dashboard-auth
```

- `auth.oidcIssuerURL` is the custom authorization server's issuer, not your Okta domain.
- `auth.oidcCLIClientID` and `auth.oidcCLILoginMethods` configure the CLI, as in [Configure Feature Form](#configure-feature-form). The CLI requests the default scopes, `openid profile offline_access`.
- Feature Form reads the introspection endpoint from the authorization server's discovery document, so `auth.resourceServer.introspection.endpoint` isn't needed.

The subject of an Okta access token is the user's Okta username, not the Okta user ID that paired sign-in uses. Set the first admin's `principalID` to their Okta username, exactly as it appears in the Okta Admin Console. Role bindings made for paired sign-in don't apply to resource-server principals.

Install or upgrade the release with the updated values file as described in [Render and install the release](/content/operate/featureform/deploy.md#4-render-and-install-the-release).

### Verify resource-server sign-in

1. Sign in with the CLI:

    ```bash
    ff --server grpc.example.com:443 auth login --profile production
    ```

    The CLI prints an Okta verification URL and code. Open the URL, enter the code, and sign in.

2. Confirm the principal:

    ```bash
    ff rbac whoami
    ```

    The output shows `principal_type` `user` and a `principal_id` that equals your Okta username.

3. Open `https://<dashboard-host>` in a browser and sign in with Okta.

### Troubleshoot resource-server sign-in

| Symptom | Check and action |
| --- | --- |
| Okta reports that policy evaluation failed, or returns `access_denied`, during sign-in | Add the application to the custom authorization server's access policy, and allow its grant type in the policy rule. |
| Sign-in succeeds, then commands return `Unauthenticated` | Confirm that `auth.oidcIssuerURL` exactly equals the custom authorization server's issuer, and that `auth.resourceServer.audience` exactly equals its audience. |
| Commands return `Unavailable` | Confirm the introspection application's client ID and secret, and that its client authentication is **Client secret**. Confirm that the server pods can reach `<okta-issuer>`. |
| Feature Form logs a warning that the resource audience equals a client ID | Change the authorization server's audience and `auth.resourceServer.audience` to a value that isn't a client ID. |
| `ff rbac whoami` shows a `principal_id` with no role bindings | Bind roles to the Okta username that `ff rbac whoami` reports. Bindings for the Okta user ID apply only to paired sign-in. |

For other sign-in failures, see [Troubleshoot CLI login](/content/operate/featureform/configure-auth.md#troubleshoot-cli-login).
