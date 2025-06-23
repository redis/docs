---
Title: SAML single sign-on
alwaysopen: false
categories:
- docs
- operate
- rc
description: Redis Cloud supports both IdP-initiated and SP-initiated single sign-on
  (SSO) with SAML (Security Assertion Markup Language). You can use any identity provider
  to integrate with Redis Cloud as long as it supports the SAML protocol, or you can
  refer to integration guides for a few specific providers.
hideListLinks: true
linkTitle: SAML SSO
weight: 20
---

Redis Cloud supports both [IdP-initiated](#idp-initiated-sso) and [SP-initiated](#sp-initiated-sso) [single sign-on (SSO)](https://en.wikipedia.org/wiki/Single_sign-on) with [SAML (Security Assertion Markup Language)](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language).

You cannot use [SCIM (System for Cross-domain Identity Management)](https://en.wikipedia.org/wiki/System_for_Cross-domain_Identity_Management) to provision Redis Cloud users. However, Redis Cloud supports just-in-time (JIT) user provisioning, which means Redis Cloud automatically creates a user account the first time a new user signs in with SAML SSO.

## SAML SSO overview

When SAML SSO is enabled, the [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider) admin handles SAML user management instead of the Redis Cloud account owner.

You can use any identity provider to integrate with Redis Cloud as long as it supports the SAML protocol. You can also refer to these integration guides for several popular identity providers:

  - [Auth0 SAML integration]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-auth0" >}})
  - [AWS IAM Identity Center SAML integration]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-aws-identity-center" >}})
  - [Azure Active Directory SAML integration]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-azure-ad" >}})
  - [Google Workspace integration]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-google" >}})
  - [Okta SAML integration (Generic)]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-okta-generic" >}})
  - [Okta SAML integration (Org2Org)]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-okta-org2org" >}})
  - [PingIdentity SAML integration]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-ping-identity" >}})

After you activate SAML SSO for a Redis Cloud account, all existing local users for the account, except for the user that set up SAML SSO, are converted to SAML users and are required to use SAML SSO to sign in. Before they can sign in to Redis Cloud, the identity provider admin needs to set up these users on the IdP side and configure the `redisAccountMapping` attribute to map them to the appropriate Redis Cloud accounts and [roles]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}).

### IdP-initiated SSO

With IdP-initiated single sign-on, you can select the Redis Cloud application after you sign in to your [identity provider (IdP)](https://en.wikipedia.org/wiki/Identity_provider). This redirects you to the [Redis Cloud console](https://cloud.redis.io/#/login) and signs you in to your SAML user account.

### SP-initiated SSO

You can also initiate single sign-on from the [Redis Cloud console](https://cloud.redis.io/#/login). This process is known as [service provider (SP)](https://en.wikipedia.org/wiki/Service_provider)-initiated single sign-on.

1. From the Redis Cloud console's [sign-in screen](https://cloud.redis.io/#/login), select **SSO**.

    {{<image filename="images/rc/button-sign-in-sso.png" width="50px" alt="Sign in with SSO button">}}

1. Enter the email address associated with your SAML user account.

1. Select the **Login** button.

    - If you already have an active SSO session with your identity provider, this signs you in to your SAML user account.

    - Otherwise, the SSO flow redirects you to your identity provider's sign in screen. Enter your IdP user credentials to sign in. This redirects you back to the Redis Cloud console and automatically signs in to your SAML user account.

### Multi-factor authentication

The account owner remains a local user and should set up [multi-factor authentication (MFA)]({{< relref "/operate/rc/security/access-control/multi-factor-authentication" >}}) to help secure their account. After SAML activation, the account owner can set up additional local bypass users with MFA enabled.

If MFA enforcement is enabled, note that Redis Cloud does not enforce MFA for SAML users since the identity provider handles MFA management and enforcement.

## Set up SAML SSO

To set up SAML single sign-on for a Redis Cloud account:

1. [Verify domain ownership in Redis Cloud](#verify-domain).

1. [Set up a SAML app](#set-up-app) to integrate Redis Cloud with your identity provider.

1. [Configure SAML identity provider in Redis Cloud](#configure-idp).

1. [Download service provider metadata](#download-sp) and upload it to your identity provider.

1. [Activate SAML SSO](#activate-saml-sso).

### Verify domain ownership in Redis Cloud {#verify-domain}

Before you set up SAML SSO in Redis Cloud, you must verify that you own the domain(s) associated with your SAML setup.

1. Sign in to [Redis Cloud](https://cloud.redis.io/#/login) with the email address associated with the SAML user you set up with your identity provider.

1. Select **Access Management** from the [Redis Cloud console](https://cloud.redis.io) menu.

1. Select **Single Sign-On**.

1. Select the **Setup SAML SSO** button:

    {{<image filename="images/rc/button-access-management-sso-setup.png" width="120px" alt="Setup SSO button">}}

1. From the **SAML** screen of the [Redis Cloud console](https://cloud.redis.io), you must verify you own the domains associated with your SAML configuration. Select **Add domain** to open the **Manage domain bindings** panel.

    {{<image filename="images/rc/saml-button-add-domain.png" width="120px" alt="Add domain button">}}

    {{<image filename="images/rc/saml-manage-domain-bindings.png" width="80%" alt="The Manage domain bindings panel">}}

1. Select **Copy** to copy the provided TXT DNS record. For each domain you want to associate with your SAML setup, add the copied TXT record to its DNS records. 

1. Select **Add domain** to add a domain. 

    {{<image filename="images/rc/saml-button-add-domain.png" width="120px" alt="Add domain button">}}

1. Enter the domain name and select {{<image filename="images/rc/saml-button-confirm.png#no-click" width="20px" alt="Confirm domain" class="inline">}} to save it, or select {{<image filename="images/rc/saml-button-cancel.png#no-click" width="20px" alt="Cancel" class="inline">}} to cancel.

    {{<image filename="images/rc/saml-enter-domain.png" width="80%" alt="Enter domain name in the Domain field.">}}

1. After you save the domain name, its status is **Pending**. Select **Verify** to verify it. 

    {{<image filename="images/rc/saml-domain-pending.png" width="80%" alt="The Manage domain bindings panel, with a pending domain">}}

    We'll check the domain's DNS records for the provided TXT record. If the TXT record does not exist or we can't resolve your domain, we won't be able to verify the domain and users with that domain won't be able to sign in using SAML SSO. 
    
    Select {{<image filename="images/rc/icon-delete-teal.png#no-click" width="25px" alt="delete domain" class="inline">}} to delete a domain if it was added by mistake.

    If we find the TXT record, the domain's status will change to **Verified**.

    You can select **Add domain** to add another domain.

1. Select **Close** to close the domain binding panel.

    {{<image filename="images/rc/saml-button-close.png" width="100px" alt="Close button">}}

After you verify at least one domain, you can select **Manage domains** to open the **Manage domain bindings** panel again and add or verify more domains.

### Set up SAML app {#set-up-app}

Set up a SAML app to integrate Redis Cloud with your identity provider:

1. Sign in to your identity provider's admin console.

1. Create or add a SAML integration app for the service provider Redis Cloud.

1. Set up your SAML service provider app so the SAML assertion contains the following attributes:

    | Attribute&nbsp;name<br />(case-sensitive) | Description |
    |-------------------------------------------|-------------|
    | FirstName | User's first name |
    | LastName | User's last name |
    | Email | User's email address (used as the username in the Redis Cloud console) |
    | redisAccountMapping | Key-value pair of a lowercase [role name]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}) (owner, member, manager, billing_admin, or viewer) and the user's Redis Cloud **Account number** found in the [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}) |

    For `redisAccountMapping`, you can add the same user to multiple SAML-enabled accounts using one of these options:

    - A single string that contains a comma-separated list of account/role pairs

        ```xml
        <saml2:Attribute Name="redisAccountMapping" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
            <saml2:AttributeValue xsi:type="xs:string" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                12345=owner,54321=manager
            </saml2:AttributeValue>
        </saml2:Attribute>
        ```

    - Multiple strings, where each represents a single account/role pair

        ```xml
        <saml2:Attribute Name="redisAccountMapping" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
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

1. Set up any additional configuration required by your identity provider to ensure you can configure the `redisAccountMapping` attribute for SAML users.

    If your identity provider lets you configure custom attributes with workflows or group rules, you can set up automation to configure the `redisAccountMapping` field automatically instead of manually.

### Configure SAML in Redis Cloud {#configure-idp}

After you set up the SAML integration app and create a SAML user in your identity provider, you need to configure your Redis Cloud account to set up SAML SSO.

1. Sign in to [Redis Cloud](https://cloud.redis.io/#/login) with the email address associated with the SAML user you set up with your identity provider.

1. Select **Access Management** from the [Redis Cloud console](https://cloud.redis.io) menu.

1. Select **Single Sign-On**.

1. [Verify at least one domain](#verify-domain) if you haven't.

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

    {{<image filename="images/rc/saml-enable-button.png" width="100px" alt="Enable button">}}

1. From the **SAML activation** dialog box, select **Continue**.

### Download service provider metadata {#download-sp}

Next, you need to download the service provider metadata for Redis Cloud and use it to finish configuring the SAML integration app for your identity provider:

1. Select the **Download** button to download the service provider [metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf) in XML format.

1. Sign in to your identity provider's admin console.

1. Configure the Redis Cloud service provider app with the downloaded XML.

    - Some identity providers let you upload the XML file directly. 
    
    - Others require you to manually configure the service provider app with specific metadata fields, such as:
    
        | XML attribute | Value | Description |
        |---------------|-------|-------------|
        | EntityDescriptor's **entityID** | https://<nobr>auth.redis.com</nobr>/saml2/<nobr>service-provider</nobr>/\<ID\> | Unique URL that identifies the Redis Cloud service provider |
        | AssertionConsumerService's **Location** | <nobr> https://<nobr>auth.redis.com</nobr>/sso/saml2/\<ID\> | The service provider endpoint where the identity provider sends a SAML assertion that authenticates a user  |

    - To use [IdP-initiated SSO](#idp-initiated-sso) with certain identity providers, you also need to set the RelayState parameter to the following URL:
    
        ```sh
        https://cloud.redis.io/#/login/?idpId=<ID>
        ```

       > Replace `<ID>` so it matches the `AssertionConsumerService Location` URL's ID.
        
    To learn more about how to configure service provider apps, see your identity provider's documentation.

### Activate SAML SSO {#activate-saml-sso}

After you finish the required SAML SSO configuration between your identity provider and Redis Cloud account, you can test and activate SAML SSO.

All users associated with the account, excluding the local user you used to set up SAML SSO, are converted to SAML users on successful activation. They can no longer sign in with their previous sign-in method and must use SAML SSO instead. However, you can add local bypass users after SAML SSO activation to allow access to the account in case of identity provider downtime or other issues with SAML SSO.

To activate SAML SSO:

1. Sign out of any active SSO sessions with your identity provider.

1. For **Activate SAML integration**, select the **Activate** button.

1. From the **Logout notification** dialog, select **Continue**. This redirects you to your configured identity provider's sign-in screen.

1. Sign in with your identity provider.

1. When redirected to the Redis Cloud sign-in screen, you can either:

    - Sign in with your local credentials as usual.

    - Select **SSO** and enter the email address associated with the SAML user configured in your identity provider. Your user converts to a SAML user in Redis Cloud. Don't use this method if you want your user account to remain a local bypass user.

    {{<note>}}
If you see a **SAML activation failed** notification when redirected to the Redis Cloud sign-in screen, sign in with your local user credentials and review the SAML configuration for issues.
    {{</note>}}

After you activate SAML SSO, [add a few local bypass users]({{< relref "/operate/rc/security/access-control/access-management#manage-team-access" >}}) from the **Team** tab. Local bypass users should [set up MFA]({{< relref "/operate/rc/security/access-control/multi-factor-authentication" >}}) for additional security.

## Update configuration {#update-config}

If you change certain metadata or configuration settings after you set up SAML SSO, such as the assertion signing certificate, remember to do the following:

1. [Update the SAML SSO configuration](#configure-idp) with the new values.

1. [Download the updated service provider metadata](#download-sp) and use it to update the Redis Cloud service provider app.

## Link other accounts

After you set up SAML SSO for one account, you can link other accounts you own to the existing SAML configuration. This lets you use the same SAML configuration for SSO across multiple accounts.

To link other accounts to an existing SAML SSO configuration:

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/) with the account that has an existing SAML configuration.

1. Go to **Access Management > Single Sign-On**. 

1. Select **Get token**.

    {{<image filename="images/rc/saml/popup-saml-get-token.png" alt="Get Token popup">}}

    Select **Copy** to copy the linking token.

1. Sign in to the account that you want to link to the SAML configuration. Go to **Access Management > Single Sign-On** and then enter the copied token into the **Join an existing SAML configuration** text box. Select the arrow to confirm.

    After you do this, the owner of the original account will receive a request to link the new account to the SAML configuration.

1. Sign in with the original account and select **Access Management > Single Sign-On**. You should see the new account in the **Unlinked accounts** list.

    {{<note>}}
To see and interact with the Redis Cloud account in the **Unlinked accounts** list, you must be an owner of the account. If you are not an owner, the account will not be displayed in the section.
    {{</note>}}

1. Select **Link account**.

    {{<image filename="images/rc/saml/button-saml-link-account.png" alt="The Link Account button" width=150px >}}

1. In the **Convert existing users** dialog, select **Confirm conversion** to finish linking the accounts.

## Deactivate SAML SSO

Before you can deactivate SAML SSO for an account, you must sign in to the account as a local (non-SAML) user with the owner role assigned.

Deactivating SAML SSO for an account also removes any existing SAML-type users associated with the account.

To deactivate SAML SSO for a specific account:

1. In the [Redis Cloud console](https://cloud.redis.io), select your name to display your available accounts.

1. If the relevant account is not already selected, select it from the **Switch account** list.

1. Go to **Access Management > Single Sign-On**.

1. Select **Deactivate SAML**. This only deactivates SAML SSO for the current account. Other linked accounts continue to use this SAML SSO configuration.

1. Select **Deactivate** to confirm deactivation.

## Deprovision SAML users

When a user is removed from your identity provider, their access to Redis Cloud should also be removed.  

When you have revoked a user’s access to Redis Cloud, they cannot access the Redis Cloud console, but their API keys remain active. You can [delete an API key]({{< relref "/operate/rc/api/get-started/manage-api-keys#delete-a-user-key" >}}) to remove access.

To deprovision SAML users upon deletion, the identity provider admin can set up a webhook to automatically make the appropriate Cloud API requests. For more information about managing users with API requests, see [Users]({{< relref "/operate/rc/api/api-reference#tag/Users" >}}) in the Redis Cloud API documentation.
