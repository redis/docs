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


Redis Enterprise Software supports both [IdP-initiated](#idp-initiated-sso) and [SP-initiated](#sp-initiated-sso) [single sign-on (SSO)](https://en.wikipedia.org/wiki/Single_sign-on) with [SAML (Security Assertion Markup Language)](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) for the Cluster Manager UI.

You cannot use [SCIM (System for Cross-domain Identity Management)](https://en.wikipedia.org/wiki/System_for_Cross-domain_Identity_Management) to provision Redis Enterprise Software users. However, Redis Enterprise Software supports just-in-time (JIT) user provisioning, which means Redis Enterprise Software automatically creates a user account the first time a new user signs in with SSO.

## SAML SSO overview

When SAML SSO is enabled, the [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider) admin handles SAML user management instead of the Redis Enterprise Software.

You can use any identity provider to integrate with Redis Enterprise Software as long as it supports the SAML protocol.

After you activate SAML SSO, all existing local users except for admin users are required to use SAML SSO to sign in. Before they can sign in to Redis Enterprise Software Cluster Manager UI, the identity provider admin needs to set up these users on the IdP side and configure the `redisRoleMapping` attribute to map them to the appropriate Redis Enterprise Software roles.

### IdP-initiated SSO

With IdP-initiated single sign-on, you can select the Redis Enterprise Software application after you sign in to your [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider). This redirects you to the Redis Enterprise Software Cluster Manager UI and signs you in.

### SP-initiated SSO

You can also initiate single sign-on from the Redis Enterprise Software Cluster Manager UI. This process is known as [service provider (SP)](https://en.wikipedia.org/wiki/Service_provider)-initiated single sign-on.

1. From the Redis Enterprise Software Cluster Manager UI's sign-in screen, select **SSO**.

1. Enter the email address associated with your user account.

1. Select the **Login** button.

    - If you already have an active SSO session with your identity provider, this signs you in.

    - Otherwise, the SSO flow redirects you to your identity provider's sign in screen. Enter your IdP user credentials to sign in. This redirects you back to the Redis Enterprise Software Cluster Manager UI and automatically signs you in.

## Set up SAML SSO

To set up SAML single sign-on for a Redis Enterprise Software cluster:

1. [Upload the new service provider certificate and private key](#upload-sp-certificate).

1. [Download the service provider metadata](#download-sp-metadata).

1. [Set up a SAML app](#set-up-app) to integrate Redis Enterprise Software with your identity provider.

1. [Configure SAML identity provider in Redis Enterprise Software](#configure-idp).

1. [Download service provider metadata](#download-sp) and upload it to your identity provider.

1. [Activate SAML SSO](#activate-saml-sso).


Flow from HLD: <!--TODO: need to confirm which setup flow to keep-->

1. Upload new SP certificate and private key (PUT /v1/cluster/certificates /sso_service/)

1. Export the metadata (GET /v1/cluster/sso/saml/metadata)

1. Upload new IdP public certificate (PUT /v1/cluster/certificates /sso_issuer/)

1. Set the IdP metadata, fallback behavior and enable SSO (PUT /v1/cluster/sso)

### Upload SP certificate

1. Create a service provider certificate for Redis Enterprise Software. See [Create certificates ]({{<relref "/operate/rs/security/certificates/create-certificates#create-certificates">}}) for instructions.

1. Upload the service provider certificate and key to the Redis Enterprise Software cluster:

    {{< multitabs id="upload-sp-cert"
    tab1="Cluster Manager UI"
    tab2="REST API" >}}

1. Sign in to the Redis Enterprise Software Cluster Manager UI using admin credentials.

1. Go to **Access Control > Single Sign-On**.

1. In the **Service Provider (Redis) metadata** section, find **Service-provider's public certificate + private key** and click **Upload**.

1. Enter or upload the private key and certificate for your service provider.

1. Click **Upload** to save.

-tab-sep-

To replace a certificate using the REST API, use an [update cluster certificates]({{<relref "/operate/rs/references/rest-api/requests/cluster/certificates">}}) request.

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

1. Optionally copy the following values for future SAML app setup in the identity provider. You can also find these values in the service provider's metadata file.

    1. **SP entity ID**: `https://<cluster-FQDN>/sp`

    1. **Assertion Consumer Service (ACS)**: `https://<cluster-FQDN>:8443/cluster/sso/saml/acs`

    1. **Single Logout Service**: `https://<cluster-FQDN>:8443/cluster/sso/saml/slo`

-tab-sep-

To download the service provider's metadata using the REST API, use a [get SAML service provider metadata]({{<relref "/operate/rs/references/rest-api/requests/cluster/sso#get-cluster-sso-saml-metadata">}}) request.

```sh
GET https://<host>:<port>/v1/cluster/sso/saml/metadata
```

{{< /multitabs >}}

Here's an abridged example of the service provider metadata XML:

```xml
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" validUntil="2025-12-25T20:38:29" cacheDuration="PT2589134S" entityID="https://<cluster-FQDN>/sp" ID="<ID>">
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

### Set up SAML app {#set-up-app}

Set up a SAML app to integrate Redis Enterprise Software with your identity provider:

1. Sign in to your identity provider's admin console.

1. Create or add a SAML integration app for the service provider Redis Enterprise Software. For detailed setup instructions, see your identity provider's documentation, and make sure you configure the following SAML settings:

    | Setting | Value | Description |
    |---------|-------|-------------|
    | Single sign-on URL | <span class="break-all">`https://<cluster-FQDN>:8443/cluster/sso/saml/acs`</span> |  |
    | Audience URI (SP Entity ID) | `https://<cluster-FQDN>/sp` | Copy the **SP entity ID** from the **Access Control > Single Sign-On** page in the Cluster Manager UI or  |
    | Name ID format | EmailAddress | |
    | Application username | Email | |

1. For **Signature certificate**, upload the Service Provider (Redis) certificate (the public SSO certificate that’s uploaded in the Redis SW SSO page)

1. Enable **Signed requests**.

1. Optionally **Enable Single Logout** if you wish to configure SLO, Single Logout URL should be taken from the Redis SW). **Single Logout Service** in the Cluster Manager UI `https://<cluster-FQDN>:8443/cluster/sso/saml/slo`

1. Set up your SAML service provider app so the SAML assertion contains the following attributes:

    | Attribute name (case-sensitive) | Description |
    |-------------------------------------------|-------------|
    | firstName | User's first name |
    | lastName | User's last name |
    | email | User's email address (used as the username in the Redis Enterprise Software Cluster Manager UI) |
    | redisRoleMapping | Key-value pair of a lowercase role name (owner, member, manager, billing_admin, or viewer) (Configured later, not during this step, so I probably need to move this) |

    For `redisRoleMapping`, you can add the same user to multiple SAML-enabled accounts using one of these options:

    - A single string that contains a comma-separated list of account/role pairs

        ```xml
        <saml2:Attribute Name="redisRoleMapping" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
            <saml2:AttributeValue xsi:type="xs:string" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                12345=owner,54321=manager
            </saml2:AttributeValue>
        </saml2:Attribute>
        ```

    - Multiple strings, where each represents a single account/role pair

        ```xml
        <saml2:Attribute Name="redisRoleMapping" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
            <saml2:AttributeValue xsi:type="xs:string" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                12345=owner
            </saml2:AttributeValue>
            <saml2:AttributeValue xsi:type="xs:string" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                54321=manager
            </saml2:AttributeValue>
        </saml2:Attribute>
        ```

    {{<note>}}
To confirm the identity provider's SAML assertions contain the required attributes, you can use a SAML-tracer web developer tool to inspect them.
    {{</note>}}

1. Set up any additional configuration required by your identity provider to ensure you can configure the `redisRoleMapping` attribute for SAML users.

    If your identity provider lets you configure custom attributes with workflows or group rules, you can set up automation to configure the `redisRoleMapping` field automatically instead of manually.

### Download IdP metadata

After you create the SAML app in your identity provider, retrieve the following information:

1. Copy or download your SAML app's assertion signing certificate.

1. Copy the following metadata fields:

    | Issuer | You need this in Redis SW as Issuer (IdP entity ID) |
    | Sign on URL | You need this in Redis SW as IdP server URL | 
    | Single Logout URL | Optional |

You will use this certificate and metadata to configure the identity provider metadata in Redis Enterprise Software.

### Configure SSO in Redis Enterprise Software {#configure-idp}

After you set up the SAML integration app and create a SAML user in your identity provider, you need to configure your Redis Enterprise Software cluster to set up SSO.

1. Sign in to Redis Enterprise Software Cluster Manager UI with the email address associated with the SAML user you set up with your identity provider.

1. Go to **Access Control > Single Sign-On**.

1. Configure the **Identity Provider metadata** settings. 

    {{<image filename="images/rc/access-management-saml-config.png"  alt="SAML Single Sign-On configuration screen.">}}

    To do so, you need the following metadata values from your identity provider:

    | Setting | Description |
    |---------|-------------|
    | **Issuer (IdP entity ID)** | The unique entity ID for the identity provider |
    | **IdP server URL** | The identity provider's HTTPS URL for SAML SSO |
    | **Single logout URL** | The URL used to sign out of the identity provider and connected apps (optional) |
    | **Assertion signing certificate** | Public SHA-256 certificate used to validate SAML assertions from the identity provider |

    To find these metadata values, see your identity provider's documentation.

1. Select **Enable**.

1. From the **SAML activation** dialog box, select **Continue**.

### Download service provider metadata {#download-sp}

<!--TODO: This section is mostly duplicated. Do I need to combine this with the section up above?-->

You need to download the service provider metadata for Redis Enterprise Software and use it to finish configuring the SAML integration app for your identity provider:

1. Select the **Download** button to download the service provider [metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf) in XML format.

1. Sign in to your identity provider's admin console.

1. Configure the Redis Enterprise Software service provider app with the downloaded XML.

    - Some identity providers let you upload the XML file directly. 
    
    - Others require you to manually configure the service provider app with specific metadata fields, such as:
    
        | XML attribute | Value | Description |
        |---------------|-------|-------------|
        | EntityDescriptor's **entityID** | https://auth.redis.com/saml2/service-provider/\<ID\> | Unique URL that identifies the Redis Enterprise Software service provider |
        | AssertionConsumerService's **Location** |  https://auth.redis.com/sso/saml2/\<ID\> | The service provider endpoint where the identity provider sends a SAML assertion that authenticates a user  |
        
    To learn more about how to configure service provider apps, see your identity provider's documentation.

### Configure user profiles

<!--TODO: I need to review this again and fix this section-->

Configure user profiles in the identify provider admin console. See your identity provider's documentation for detailed instructions, and make sure you add and map the following attributes to the user profiles for your identity provider and the SAML app:

| Attribute name | Type |
|----------------|--------|
| redisRoleMapping | string array |

1. For admin users, set redisRoleMapping to `["1"]` for the identity provider user profile.

1. Assign the SAML app to the admin user, and add `1` as the `redisRoleMapping`.

1. Add redisRoleMapping as a new attribute statement in the SAML app configuration.

1. For users who are not admins, assign a redisRoleMapping other than 1. Check the available roles in your Redis Enterprise Software cluster.

### Activate SAML SSO {#activate-saml-sso}

After you finish the required SAML SSO configuration between your identity provider and Redis Enterprise Software cluster, you can test and activate SSO.

If SSO is enforced for the cluster, non-admin users can no longer sign in with their previous username and password and must use SSO instead.

To activate SAML SSO:

1. Sign out of any active SSO sessions with your identity provider.

1. In the Redis Enterprise Software Cluster Manager UI, go to **Access Control > Single Sign-On** and click **Activate SSO**.


1. Sign in with your identity provider.

1. When redirected to the Redis Enterprise Software sign-in screen, you can either:

    - Sign in with your local credentials as usual.

    - Enter the email address associated with the SAML user configured in your identity provider, then click **Sign in with SSO**.

## Update configuration {#update-config}

If you change certain metadata or configuration settings after you set up SSO, such as the assertion signing certificate, remember to do the following:

1. [Update the SAML SSO configuration](#configure-idp) with the new values.

1. [Download the updated service provider metadata](#download-sp) and use it to update the Redis Enterprise Software service provider app.

## Deactivate SAML SSO

To deactivate SAML SSO:

1. Go to **Access Control > Single Sign-On**.

1. TBA
