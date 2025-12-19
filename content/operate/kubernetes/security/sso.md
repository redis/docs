---
Title: Enable SSO authentication
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Enable SAML-based SSO authentication for Redis Enterprise for Kubernetes.
linkTitle: Enable SSO
weight: 94
---

Redis Enterprise Software supports SAML 2.0 single sign-on (SSO) for the Cluster Manager UI with both IdP-initiated and SP-initiated authentication. User accounts are automatically created on first sign-in using just-in-time (JIT) provisioning.

## IdP requirements

Your identity provider must support:

- SAML 2.0 protocol
- Signed SAML responses
- HTTP-Redirect binding for SP-initiated SSO
- HTTP-POST binding for SAML assertions

## Enable SSO

To enable SSO for your Redis Enterprise cluster (REC), follow these steps to configure SAML authentication.

### Prerequisites

Before enabling SSO, ensure you have:

1. A SAML 2.0-compatible identity provider (such as Okta, Azure AD, or similar)
2. Admin access to your identity provider
3. A TLS certificate and private key for the Service Provider (SP)

### Step 1: Upload Service Provider certificate and private key

The Service Provider certificate is used by the cluster to sign SAML requests and encrypt SAML responses.

1. Create a secret with your Service Provider certificate and private key:

    ```sh
    kubectl -n <rec-namespace> create secret generic sso-service-cert \
      --from-literal=name=sso_service \
      --from-file=certificate=<sp-cert-file> \
      --from-file=key=<sp-key-file>
    ```

    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include a `name` key explicitly set to `sso_service`.
    - Include a `certificate` key with the public certificate in PEM format.
    - Include a `key` key with the private key in PEM format.

    Replace the `<placeholders>` in the command above with your own values.

2. Configure the Service Provider certificate in the `RedisEnterpriseCluster` custom resource:

    ```yaml
    apiVersion: app.redislabs.com/v1
    kind: RedisEnterpriseCluster
    metadata:
      name: rec
    spec:
      nodes: 3
      certificates:
        ssoServiceCertificateSecretName: sso-service-cert
      sso:
        saml:
          spMetadataSecretName: sp-metadata  # Optional: store SP metadata in a secret
          serviceProvider:
            baseAddress: "https://redis-ui.example.com:443"  # Optional: customize base address
    ```

3. Apply the configuration:

    ```sh
    kubectl apply -f <rec-config-file>.yaml
    ```

#### Configure Service Provider base address (optional)

The base address is used to construct Service Provider URLs, such as the Assertion Consumer Service (ACS) URL and Single Logout (SLO) URL.

If not specified, the base address is automatically determined from the REC Cluster Manager UI service:
- If the UI service type is `LoadBalancer` (configured via `spec.uiServiceType`), the load balancer address is used.
- Otherwise, the cluster-internal DNS name is used (for example, `rec-ui.svc.cluster.local`).
- The port defaults to 8443 if not specified.

To explicitly set the base address, add it to the `serviceProvider` section:

```yaml
spec:
  sso:
    saml:
      serviceProvider:
        baseAddress: "https://redis-ui.example.com:443"
```

Format: `[<scheme>://]<hostname>[:<port>]`

Examples:
- `"https://redis-ui.example.com:443"` (recommended - explicit scheme)
- `"redis-ui.example.com:443"` (defaults to https://)
- `"http://redis-ui.example.com:9443"` (NOT recommended for production)

{{<warning>}}
Using `http://` is NOT recommended for production environments as it transmits sensitive SAML assertions in plaintext. Only use `http://` for testing or development purposes.
{{</warning>}}

**Usage guidelines:**
- **For LoadBalancer services:** Leave this field blank to use the default REC UI service, or set it explicitly to the LoadBalancer address for custom services.
- **For Ingress:** Set this to the ingress hostname and port (typically 443), for example, `"https://redis-ui.example.com:443"`.

### Step 2: Download Service Provider metadata

After applying the configuration, retrieve the Service Provider metadata to use when configuring your identity provider.

#### Option A: Retrieve from Kubernetes secret

If you configured `spMetadataSecretName` in Step 1, the operator creates a secret with the SP metadata:

```sh
kubectl -n <rec-namespace> get secret sp-metadata -o jsonpath='{.data.sp_metadata}' | base64 -d > sp-metadata.xml
```

{{<note>}}
This secret is only created when the cluster is configured to use Kubernetes secrets (`spec.clusterCredentialSecretType` is unset or set to `"kubernetes"`). When using Vault secrets, use Option B instead.
{{</note>}}

#### Option B: Retrieve from the API

You can obtain the SP metadata directly from the Redis Enterprise Server API:

```sh
kubectl -n <rec-namespace> exec -it <rec-pod-name> -c redis-enterprise-node -- \
  curl -k -u "<username>:<password>" \
  https://localhost:9443/v1/cluster/sso/saml/metadata/sp > sp-metadata.xml
```

Replace `<rec-pod-name>`, `<username>`, and `<password>` with your cluster details.

### Step 3: Set up SAML app in your identity provider

Use the Service Provider metadata from Step 2 to configure a SAML application in your identity provider.

1. Sign in to your identity provider's admin console (for example, Okta, Azure AD, Google Workspace).

2. Create a new SAML 2.0 application or integration.

3. Upload the `sp-metadata.xml` file or manually configure the SAML settings using values from the metadata:
   - **Entity ID (SP)**: Found in the `entityID` attribute of the metadata
   - **Assertion Consumer Service (ACS) URL**: Found in the `AssertionConsumerService` element's `Location` attribute
   - **Single Logout (SLO) URL**: Found in the `SingleLogoutService` element's `Location` attribute (if present)

4. Configure the SAML assertion to include the following attributes:
   - `email` - User's email address (required)
   - `firstName` - User's first name (optional)
   - `lastName` - User's last name (optional)
   - `redisRoleMapping` - Role mapping for JIT user provisioning (required for new users)

Refer to your identity provider's documentation for specific configuration steps.

### Step 4: Download identity provider metadata

After configuring the SAML app in your identity provider, download the identity provider metadata and certificate.

1. In your identity provider's admin console, locate the SAML app you created in Step 3.

2. Download the following:
   - **IdP metadata XML**: Contains the IdP configuration (entity ID, SSO URL, SLO URL)
   - **IdP certificate**: Public certificate used to verify SAML assertions

Save these files for use in Step 5.

### Step 5: Configure SAML identity provider in Redis Enterprise

Now configure the identity provider details in your Redis Enterprise cluster.

1. Create a secret with the Identity Provider certificate:

    ```sh
    kubectl -n <rec-namespace> create secret generic sso-issuer-cert \
      --from-literal=name=sso_issuer \
      --from-file=certificate=<idp-cert-file>
    ```

    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include a `name` key explicitly set to `sso_issuer`.
    - Include a `certificate` key with the IdP public certificate in PEM format.
    - **Not** include a `key` field (only the public certificate is needed).

    Replace `<idp-cert-file>` with the path to your IdP certificate file.

    {{<note>}}
While IdP metadata XML may contain the certificate, Redis Enterprise Server does not use it from there, so the certificate must be provided separately via this secret.
    {{</note>}}

2. Configure the IdP using one of the following options:

#### Option A: Use IdP metadata XML (recommended)

Using IdP metadata XML is the recommended approach as it's less error-prone.

1. Create a secret with the IdP metadata:

    ```sh
    kubectl -n <rec-namespace> create secret generic idp-metadata \
      --from-file=idp_metadata=<idp-metadata-file>.xml
    ```

    The secret must:
    - Reside within the same namespace as the `RedisEnterpriseCluster` custom resource.
    - Include an `idp_metadata` key with the IdP metadata XML content.
    - The XML can be plain text or base64-encoded; the operator handles encoding as needed.

    Replace `<idp-metadata-file>` with the path to your IdP metadata XML file.

2. Update the `RedisEnterpriseCluster` custom resource to add the IdP configuration:

    ```yaml
    spec:
      certificates:
        ssoServiceCertificateSecretName: sso-service-cert
        ssoIssuerCertificateSecretName: sso-issuer-cert
      sso:
        saml:
          idpMetadataSecretName: idp-metadata
          spMetadataSecretName: sp-metadata
          serviceProvider:
            baseAddress: "https://redis-ui.example.com:443"
    ```

3. Apply the updated configuration:

    ```sh
    kubectl apply -f <rec-config-file>.yaml
    ```

#### Option B: Manual issuer configuration

If IdP metadata XML is unavailable, you can manually configure the issuer settings.

1. Update the `RedisEnterpriseCluster` custom resource with the IdP details:

    ```yaml
    spec:
      certificates:
        ssoServiceCertificateSecretName: sso-service-cert
        ssoIssuerCertificateSecretName: sso-issuer-cert
      sso:
        saml:
          issuer:
            entityID: "urn:sso:example:idp"
            loginURL: "https://idp.example.com/sso/saml"
            logoutURL: "https://idp.example.com/slo/saml"  # optional
          spMetadataSecretName: sp-metadata
          serviceProvider:
            baseAddress: "https://redis-ui.example.com:443"
    ```

    Replace the values with your identity provider's configuration:

    - `entityID`: Identity Provider entity ID (issuer identifier)
    - `loginURL`: Identity Provider SSO login URL where SAML authentication requests are sent
    - `logoutURL`: Identity Provider single logout URL (optional)

2. Apply the updated configuration:

    ```sh
    kubectl apply -f <rec-config-file>.yaml
    ```

{{<note>}}
If both `idpMetadataSecretName` and `issuer` are provided, `idpMetadataSecretName` takes precedence and `issuer` is ignored.
{{</note>}}

### Step 6: Assign SAML app to users

In your identity provider's admin console, assign users to the SAML application you created in Step 3.

1. Navigate to the SAML app in your identity provider.

2. Assign existing users or groups to the application.

3. For new users who will use just-in-time (JIT) provisioning, ensure the `redisRoleMapping` attribute is configured with appropriate Redis Enterprise roles.

Refer to your identity provider's documentation for specific steps on assigning users to applications.

### Step 7: Activate SSO

Finally, activate SSO by enabling it in the `RedisEnterpriseCluster` custom resource.

1. Update the `RedisEnterpriseCluster` custom resource to enable SSO:

    ```yaml
    spec:
      certificates:
        ssoServiceCertificateSecretName: sso-service-cert
        ssoIssuerCertificateSecretName: sso-issuer-cert
      sso:
        enabled: true
        enforceSSO: false  # Set to true to disable local authentication for non-admin users
        saml:
          idpMetadataSecretName: idp-metadata
          spMetadataSecretName: sp-metadata
          serviceProvider:
            baseAddress: "https://redis-ui.example.com:443"
    ```

2. Apply the configuration:

    ```sh
    kubectl apply -f <rec-config-file>.yaml
    ```

3. Test SSO by accessing the Cluster Manager UI and clicking **Sign in with SSO**.

#### Enforce SSO (optional)

By default, both SSO and local username/password authentication are available. To enforce SSO-only authentication for non-admin users, set `enforceSSO` to `true`:

```yaml
spec:
  sso:
    enabled: true
    enforceSSO: true
```

When `enforceSSO` is set to `true`, local username/password authentication is disabled for non-admin users.

## Complete example

Here's a complete example of a `RedisEnterpriseCluster` resource with SSO enabled:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  certificates:
    ssoServiceCertificateSecretName: sso-service-cert
    ssoIssuerCertificateSecretName: sso-issuer-cert
  sso:
    enabled: true
    enforceSSO: false
    saml:
      idpMetadataSecretName: idp-metadata
      spMetadataSecretName: sp-metadata
      serviceProvider:
        baseAddress: "https://redis-ui.example.com:443"
```

Refer to the `RedisEnterpriseCluster` [API reference](https://github.com/RedisLabs/redis-enterprise-k8s-docs/blob/master/redis_enterprise_cluster_api.md#ssospec) for full details on the available fields.

## Next steps

After enabling SSO:

1. Configure users in your identity provider with matching email addresses
2. Set up the `redisRoleMapping` attribute in your identity provider to assign appropriate roles for new users
3. Test both IdP-initiated and SP-initiated SSO flows
4. Consider enforcing SSO to disable local authentication for non-admin users

For more information about Redis Enterprise Software security, see [Access control]({{< relref "/operate/rs/security/access-control/" >}}).
