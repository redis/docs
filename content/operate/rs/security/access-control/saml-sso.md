---
Title: SAML single sign-on
alwaysopen: false
categories:
- docs
- operate
- rs
description: Set up single sign-on with SAML for the Redis Enterprise Software Cluster Manager UI.
hideListLinks: true
linkTitle: SAML SSO
weight: 60
---


Redis Enterprise Software supports both [IdP-initiated](#idp-initiated-sso) and [SP-initiated](#sp-initiated-sso) [single sign-on (SSO)](https://en.wikipedia.org/wiki/Single_sign-on) with [SAML (Security Assertion Markup Language)](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) for the Cluster Manager UI. Redis Enterprise Software uses SAML 2.0, which is the latest SAML version and an industry standard.

You cannot use [SCIM (System for Cross-domain Identity Management)](https://en.wikipedia.org/wiki/System_for_Cross-domain_Identity_Management) to provision Redis Enterprise Software users. However, Redis Enterprise Software supports just-in-time (JIT) user provisioning, which means Redis Enterprise Software automatically creates a user account the first time a new user signs in with SSO.

## SSO overview

When single sign-on is activated, users can sign in to the Redis Enterprise Software Cluster Manager UI using their [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider) instead of usernames and passwords. If [SSO is enforced](#enforce-sso), non-admin users can no longer sign in with their previous usernames and passwords and must use SSO instead.

Before users can sign in to the Cluster Manager UI with SSO, the identity provider admin needs to set up these users on the IdP side with matching email addresses.

With just-in-time (JIT) user provisioning, Redis Enterprise Software automatically creates user accounts for new users assigned to the SAML application in your identity provider when they sign in to the Cluster Manager UI for the first time. For these users, you must configure the `redisRoleMapping` attribute in your identity provider to assign appropriate roles for [role-based access control]({{<relref "/operate/rs/security/access-control/">}}) during account creation.

### IdP-initiated SSO

With IdP-initiated single sign-on, you can select the Redis Enterprise Software application after you sign in to your [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider). This redirects you to the Redis Enterprise Software Cluster Manager UI and signs you in.

### SP-initiated SSO

You can also initiate single sign-on from the Redis Enterprise Software Cluster Manager UI. This process is known as [service provider (SP)](https://en.wikipedia.org/wiki/Service_provider)-initiated single sign-on.

On the Redis Enterprise Software Cluster Manager UI's sign-in screen, click **Sign in with SSO**.

- If you already have an active SSO session with your identity provider, this signs you in.

- Otherwise, the SSO flow redirects you to your identity provider's sign in screen. Enter your IdP user credentials to sign in. This redirects you back to the Redis Enterprise Software Cluster Manager UI and automatically signs you in.

Authentication requests expire after 3 minutes.

## IdP requirements

You can use any identity provider to integrate with Redis Enterprise Software as long as it supports the following:

- [SAML](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) 2.0 protocol.

- Signed SAML responses since Redis Enterprise Software will not accept any unsigned SAML responses.

- HTTP-Redirect binding for SP-initiated SSO.

- HTTP-POST binding for SAML assertions.

## Set up SAML SSO

To set up SAML single sign-on for a Redis Enterprise Software cluster:

1. [Upload the service provider certificate and private key](#upload-sp-certificate).

1. [Download the service provider metadata](#download-sp-metadata).

1. [Set up a SAML app](#set-up-app) to integrate Redis Enterprise Software with your identity provider.

1. [Download identity provider metadata](#download-idp-metadata).

1. [Configure SAML identity provider in Redis Enterprise Software](#configure-idp-metadata).

1. [Assign the SAML app to existing users](#assign-saml-app-to-existing-users).

1. [Activate SSO](#activate-sso).

### Upload SP certificate

1. Create a service provider certificate for Redis Enterprise Software. See [Create certificates ]({{<relref "/operate/rs/security/certificates/create-certificates#create-certificates">}}) for instructions.

1. Upload the service provider certificate and key to the Redis Enterprise Software cluster:

    {{< multitabs id="upload-sp-cert"
    tab1="Cluster Manager UI"
    tab2="REST API" >}}

1. Sign in to the Redis Enterprise Software Cluster Manager UI using admin credentials.

1. Go to **Access Control > Single Sign-On**.

    <img src="../../../../../images/rs/screenshots/access-control/sso/sso-before-config.png" alt="The single sign-on configuration screen.">

1. In the **Service Provider (Redis) metadata** section, find **Service-provider's public certificate + private key** and click **Upload**.

1. Enter or upload the private key and certificate for your service provider.

1. Click **Upload** to save.

-tab-sep-

To upload a certificate using the REST API, use an [update cluster certificates]({{<relref "/operate/rs/references/rest-api/requests/cluster/certificates#put-cluster-certificates">}}) request.

```sh
PUT https://<host>:<port>/v1/cluster/certificates
{
  "certificates": [
    {
      "name": "<cert_name>",
      "certificate": "sso_service",
      "key": "<key>"
    }
  ]
}
```

    {{< /multitabs >}}

### Download SP metadata

You need to download the service provider metadata for Redis Enterprise Software and use it to configure the SAML integration app for your identity provider.

{{< multitabs id="download-sp-metadata"
tab1="Cluster Manager UI"
tab2="REST API" >}}

To download the service provider's metadata using the Cluster Manager UI:

1. Go to **Access Control > Single Sign-On**.

1. In the **Service Provider (Redis) metadata** section, click the following buttons to download the service provider files needed to set up a SAML app:

    1. **Public certificate**

    1. **Metadata file**

    <img src="../../../../../images/rs/screenshots/access-control/sso/sp-metadata-after-cert-upload.png" alt="The service provider Redis metadata section.">

1. Optionally copy the following values for future SAML app setup in the identity provider. You can also find these values in the service provider's metadata file.

    1. **SP entity ID**: `https://<cluster-FQDN>/sp`

    1. **Assertion Consumer Service (ACS)**: `https://<cluster-FQDN>:8443/cluster/sso/saml/acs`

    1. **Single Logout Service**: `https://<cluster-FQDN>:8443/cluster/sso/saml/slo`

-tab-sep-

To download the service provider's metadata using the REST API, use a [get SAML service provider metadata]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#get-cluster-sso-saml-metadata">}}) request.

```sh
GET https://<host>:<port>/v1/cluster/sso/saml/metadata/sp
```

{{< /multitabs >}}

Here's an abridged example of the service provider metadata XML:

```xml
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" validUntil="2025-12-25T20:38:29" cacheDuration="PT2589134S" entityID="https://<cluster-FQDN>:8443/sp" ID="<ID>">
    ...
    <md:SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        ...
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://<cluster-FQDN>:8443/cluster/sso/saml/slo"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://<cluster-FQDN>:8443/cluster/sso/saml/acs" index="1"/>
        <md:AttributeConsumingService index="1">
            <md:ServiceName xml:lang="en">Redis Cluster Enterprise - <cluster-FQDN></md:ServiceName>
            <md:ServiceDescription xml:lang="en">Redis Cluster Enterprise SSO</md:ServiceDescription>
            <md:RequestedAttribute Name="firstName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="firstName" isRequired="true"/>
            <md:RequestedAttribute Name="lastName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="lastName" isRequired="true"/>
            <md:RequestedAttribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="email" isRequired="true"/>
            <md:RequestedAttribute Name="redisRoleMapping" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" FriendlyName="redisRoleMapping"/>
        </md:AttributeConsumingService>
    </md:SPSSODescriptor>
</md:EntityDescriptor>
```

See [Metadata for the OASIS Security
Assertion Markup Language (SAML)
V2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf) for more information about the metadata fields.

{{< note >}}
Redis Enterprise Software metadata expiration time is equivalent to the SSO service certificate's expiration time. The service provider metadata will only change if the service address used for the Assertion Consumer Service (ACS) and the single logout (SLO) URL is modified.
{{< /note >}}

### Set up SAML app {#set-up-app}

Set up a SAML app to integrate Redis Enterprise Software with your identity provider:

1. Sign in to your identity provider's admin console.

1. Create or add a SAML integration app for the service provider Redis Enterprise Software. For detailed setup instructions, see your identity provider's documentation.

1. Configure the SAML app with the service provider metadata.

    - Some identity providers let you upload the XML file directly. 
    
    - Others require you to manually configure the service provider app with specific metadata fields, such as:
    
        | Setting | Value | Description |
        |---------|-------|-------------|
        | Audience URI (SP Entity ID) | `https://<cluster-FQDN>:8443/sp` | Unique URL that identifies the Redis Enterprise Software service provider.<br /><br />Copy the **SP entity ID** from the **Access Control > Single Sign-On** page in the Cluster Manager UI or `EntityDescriptor`'s `entityID` in the metadata XML. |
        | Single sign-on URL | <span class="break-all">`https://<cluster-FQDN>:8443/cluster/sso/saml/acs`</span> | The service provider endpoint where the identity provider sends a SAML assertion that authenticates a user.<br /><br />Copy the **Assertion Consumer Service (ACS)** from the **Access Control > Single Sign-On** page in the Cluster Manager UI or `AssertionConsumerService`'s `Location` in the metadata XML. |
        | Name ID format | EmailAddress | |
        | Application username | Email | |

1. For the signature certificate, upload the Service Provider (Redis) public certificate.

1. Enable signed requests.

1. Optionally, you can enable single log-out (SLO) to allow users to automatically sign out of the the identity provider when they sign out of the Redis Enterprise Software Cluster Manager UI. Copy the **Single Logout Service** from the **Access Control > Single Sign-On** page in the Cluster Manager UI (`https://<cluster-FQDN>:8443/cluster/sso/saml/slo`) and configure it in the SAML app.

    {{< note >}}
Redis Enterprise Software only supports SP-initiated logout, where the user logs out from the Redis Enterprise Software Cluster Manager UI. IdP-initiated logout requests are not supported.
    {{< /note >}}

1. Set up your SAML service provider app so the SAML assertion contains the following attributes:

    | Attribute name (case-sensitive) | Description |
    |-------------------------------------------|-------------|
    | firstName | User's first name |
    | lastName | User's last name |
    | email | User's email address (used as the username in the Redis Enterprise Software Cluster Manager UI) |
    | redisRoleMapping | String array that includes the role UID for role-based access control in Redis Enterprise Software. Only used for just-in-time (JIT) user provisioning. If a user already exists in Redis Enterprise Software, this attribute is ignored and their existing roles are preserved. |

    {{<note>}}
To confirm the identity provider's SAML assertions contain the required attributes, you can use a SAML-tracer web developer tool to inspect them.
    {{</note>}}

1. Set up any additional configuration required by your identity provider to ensure you can configure the `redisRoleMapping` attribute for SAML users.

    If your identity provider lets you configure custom attributes with workflows or group rules, you can set up automation to configure the `redisRoleMapping` field automatically instead of manually.

### Download IdP metadata

After you create the SAML app in your identity provider, retrieve the following information:

| Setting | Description |
|---------|-------------|
| Issuer (IdP entity ID) | The unique entity ID for the identity provider |
| IdP server URL | The identity provider's HTTPS URL for SAML SSO |
| Single logout URL | The URL used to sign out of the identity provider and connected apps (optional) |
| Assertion signing certificate | Public SHA-256 certificate used to validate SAML assertions from the identity provider |

You will use this certificate and metadata to configure the identity provider metadata in Redis Enterprise Software. To find these metadata values, see your identity provider's documentation.

### Configure IdP metadata in Redis Enterprise Software {#configure-idp-metadata}

After you set up the SAML integration app, you need to configure the identity provider metadata in your Redis Enterprise Software cluster.

{{< multitabs id="configure-idp-metadata"
tab1="Cluster Manager UI"
tab2="REST API" >}}

1. Sign in to the Redis Enterprise Software Cluster Manager UI using admin credentials.

1. Go to **Access Control > Single Sign-On**.

1. In the **Identity Provider metadata** section, click **Edit**.

1. Enter the **Identity Provider metadata** settings. 

    <img src="../../../../../images/rs/screenshots/access-control/sso/edit-idp-metadata.png" alt="The identity provider metadata dialog.">

1. Click **Save**.

-tab-sep-

1. Upload your SAML app's assertion signing certificate using an [update cluster certificates]({{<relref "/operate/rs/references/rest-api/requests/cluster/certificates#put-cluster-certificates">}}) REST API request.

    ```sh
    PUT https://<host>:<port>/v1/cluster/certificates
    {
      "certificates": [
        {
          "name": "<cert_name>",
          "certificate": "sso_issuer",
          "key": "<key>"
        }
      ]
    }
    ```

1. Configure the identity provider metadata using an [update SSO configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#put-cluster-sso">}}) REST API request.

    ```sh
    PUT https://<host>:<port>/v1/cluster/sso
    {
      "protocol": "saml2",
      "issuer": {
        "id": "urn:sso:example:idp",
        "login_url": "https://idp.example.com/sso/saml",
        "logout_url": "https://idp.example.com/sso/slo"
      }
    }
    ```

{{< /multitabs >}}

### Assign SAML app to existing users

In the identity provider's admin console:

1. Create user profiles in the identity provider for existing Redis Enterprise Software users. Make sure each user's email address matches in the identity provider and Redis Enterprise Software.

    {{<note>}}
You do not need to configure the `redisRoleMapping` attribute for existing Redis Enterprise Software users. Their current roles will be preserved, and the `redisRoleMapping` attribute is ignored if provided.
    {{</note>}}

2. Assign the new SAML integration app to each user.

See your identity provider's documentation for detailed instructions.

### Activate SSO {#activate-sso}

After you finish the required SAML SSO configuration between your identity provider and Redis Enterprise Software cluster, you can activate SSO.

{{< multitabs id="activate-sso"
tab1="Cluster Manager UI"
tab2="REST API" >}}

To activate single sign-on using the Cluster Manager UI:

1. Go to **Access Control > Single Sign-On**.

1. Click **Activate SSO**.

-tab-sep-

To activate single sign-on using the REST API, use an [update SSO configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#put-cluster-sso">}}) request.

```sh
PUT https://<host>:<port>/v1/cluster/sso
{
    "control_plane": true
}
```

{{< /multitabs >}}

## Add new users with JIT provisioning

After single sign-on is activated for Redis Enterprise Software, you can create new Redis Enterprise Software users on the identity provider side using just-in-time (JIT) provisioning.

1. In the identity provider's admin console, create a new user profile with a valid email address. See your identity provider's documentation for detailed instructions.

1. Configure the `redisRoleMapping` and assign a Redis Enterprise Software role UID to the user.

    {{<note>}}
To see a list of available role UIDs in your cluster, use a REST API request to [get all roles]({{<relref "/operate/rs/references/rest-api/requests/roles#get-all-roles">}}):

```sh
GET https://<host>:<port>/v1/roles
```
    {{</note>}}

1. Assign the new SAML integration app to the user.

1. Redis Enterprise Software will create a new user with the mapped role the first time the new user signs in to the Cluster Manager UI using SSO.


## Enforce SSO

If SSO is enforced for the cluster, non-admin users can no longer sign in with their previous usernames and passwords and must use SSO instead.

{{< multitabs id="enforce-sso"
tab1="Cluster Manager UI"
tab2="REST API" >}}

To enforce single sign-on using the Cluster Manager UI:

1. Go to **Access Control > Single Sign-On**.

1. Find **Fallback behavior** and click **Edit**.

1. Select **Enforce SSO-only login**.

    <img src="../../../../../images/rs/screenshots/access-control/sso/enforce-sso.png" alt="Enforce SSO-only login is selected.">

1. Click **Save**.

-tab-sep-

To enforce single sign-on using the REST API, use an [update SSO configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#put-cluster-sso">}}) request.

```sh
PUT https://<host>:<port>/v1/cluster/sso
{
    "enforce_control_plane": true
}
```

{{< /multitabs >}}

## Update configuration {#update-config}

If you change certain metadata or configuration settings after you set up SSO, such as the assertion signing certificate, remember to do the following:

1. [Update the SAML SSO configuration](#configure-idp-metadata) with the new values.

1. [Download the updated service provider metadata](#download-sp) and use it to update the Redis Enterprise Software service provider app.

{{<warning>}}
Changes to the service address will break the existing SSO integration and require configuration updates on the identity provider's side.
{{</warning>}}

## Deactivate SSO

{{< multitabs id="deactivate-sso"
tab1="Cluster Manager UI"
tab2="REST API" >}}

To deactivate single sign-on using the Cluster Manager UI:

1. Go to **Access Control > Single Sign-On**.

1. Click **Deactivate SSO**.

1. Click **Confirm**.

-tab-sep-

To deactivate single sign-on using the REST API, use an [update SSO configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#put-cluster-sso">}}) request.

```sh
PUT https://<host>:<port>/v1/cluster/sso
{
    "control_plane": false
}
```

{{< /multitabs >}}
