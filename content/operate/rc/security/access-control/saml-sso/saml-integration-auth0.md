---
Title: Auth0 SAML integration guide
alwaysopen: false
categories:
- docs
- operate
- rc
description: This integration guide shows how to configure Auth0 as a SAML single
  sign on provider for your Redis Cloud account.
linkTitle: Auth0 integration
weight: 10
bannerText: Specific identity provider details may be different than shown in this guide. Always consult your [identity provider's docs](https://auth0.com/docs) for the latest information.
---

This guide shows how to configure [Auth0](https://auth0.com/docs) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

To learn more about Redis Cloud support for SAML, see [SAML single sign-on]({{< relref "/operate/rc/security/access-control/saml-sso" >}}).

Before completing this guide, you must [verify ownership of any domains]({{< relref "/operate/rc/security/access-control/saml-sso#verify-domain" >}}) you want to associate with your SAML setup.

## Step 1: Set up your identity provider (IdP)

### Specify the SAML owner

1. Sign in to your Auth0 account and navigate to **User Management > Users**.
   * Select the SAML owner.
   * Verify the details.

    SAML assertion requires first and last name, which are not available in the default user profile. 

    {{<note>}}
Depending how they are created, users can have different profiles. 
    {{</note>}}

    {{<image filename="images/rc/saml/auth0_saml_1.png" >}}

1. Add `user_metadata` to fulfill the SAML assertion, then select **Save**. 
   
   {{<image filename="images/rc/saml/auth0_saml_2.png" >}}

   The key-value pair of `redisAccountMapping` consists of a lowercase role name (owner, member, manager, billing_admin, or viewer) and your Redis Cloud Account ID found in the [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}).

    ```json
    {
       "FirstName": "Test",
       "LastName": "User",
       "redisAccountMapping": "YOUR_REDIS_CLOUD_ID=owner"
    }
    ```

1. Open **Actions > Triggers** and select **`post-login`**.

    {{<image filename="images/rc/saml/auth0_saml_3.png" >}}

1. Select **Create Action** to create a new custom action.

    {{<image filename="images/rc/saml/auth0_saml_add-action.png" >}}

1. Provide a **name** for the action and select **Create**.

    {{<image filename="images/rc/saml/auth0_saml_create-action.png" >}}

1. Add the following code to the action:

    ```js
    exports.onExecutePostLogin = async (event, api) => {
        const um = event.user.user_metadata || {};
        const am = event.user.app_metadata || {};
        api.samlResponse.setAttribute('email', event.user.email);
        api.samlResponse.setAttribute(
            'firstName',
            um.FirstName || ''
        );
        api.samlResponse.setAttribute(
            'lastName',
            um.LastName || ''
        );
        const mapping = am.redisAccountMapping || um.redisAccountMapping;
        if (mapping) {
            api.samlResponse.setAttribute('redisAccountMapping', mapping);
        } else {
            api.access.deny('missing_redis_account_mapping', 'redisAccountMapping not set for user');
        }
    };
    ```

1. Select **Deploy** to save and deploy the action.

    {{<image filename="images/rc/saml/auth0_saml_4.png" >}}

1. Return to the **`post-login`** trigger and drag the action you just created to the trigger.

    {{<image filename="images/rc/saml/auth0_saml_action-trigger.png" >}}

    Select **Apply** to save your changes.

### Create and configure the SAML application

1. Open **Applications > Applications** and select **Create Application**.

    {{<image filename="images/rc/saml/auth0_saml_5.png" >}}

1. Provide a **name** for the Application and select **Single Page Web Applications**. Select **Create**.

    {{<image filename="images/rc/saml/auth0_saml_6.png" >}}

1. From the newly created application, go to **Settings > Advanced Settings > Certificates**.

    * Copy and save the **Signing Certificate**. You will need this information to configure SAML in admin console.

    {{<image filename="images/rc/saml/auth0_saml_7.png" >}}

    * We suggest that you update the default logo of the application to the Redis icon for better visibility. 

1. From the newly created application, go to **Addons** and enable **SAML 2 WEB APP**.

    {{<image filename="images/rc/saml/auth0_saml_8.png" >}}

1. From the **Usage** tab:

    * Copy and save the **Issuer** value.
    * Copy and save the **Identity Provider Login URL**.
    
    You will need both of these values, along with the certificate value you copied in the previous step, to configure SAML in the Redis Cloud console.

    {{<image filename="images/rc/saml/auth0_saml_9.png" >}}

## Step 2: Configure SAML support in Redis Cloud

Now that you have you Auth0 IdP server ready, configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in Access Management

To activate SAML, you need to have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, you will see the **Single Sign-On** tab.

1. Fill in the information you saved previously in the **setup** form. This includes:

    * **Issuer (IdP Entity ID)**: Issuer value from Auth0
    * **IdP server URL**: Identity Provider Login URL from Auth0
    * **Assertion signing certificate**: Certificate value from Auth0

    {{<image filename="images/rc/saml/sm_saml_1.png" >}}

    Once you click **Enable**, wait a few seconds for the status to change.

1. Download the service provider (SP) metadata. Save the file to your local hard disk.

    {{<image filename="images/rc/saml/sm_saml_3.png" >}}

1. Open the file in any text editor. Save the following text from the metadata:

    * **EntityID**: The unique name of the service provider (SP)

    {{<image filename="images/rc/saml/sm_saml_4.png" >}}

    * **Location** : The location of the assertion consumer service

    {{<image filename="images/rc/saml/sm_saml_5.png" >}}

## Step 3: Finish SAML configuration in Auth0

1. Return to the Auth0 SAML application and select **Addons > SAML 2 Web App > Settings**:

    {{<image filename="images/rc/saml/auth0_saml_10.png" >}}

    * Paste the **Location** link in **Application Callback URL** field.

    * Enter the following code in the **Settings** code area. Modify the `audience` variable with the `EntityID` value, and the `recipient` variable with the `Location` value from the metadata file you downloaded. 

    ```json
    {
      "audience": "<EntityID>",
      "recipient": "<Location>",
      "passthroughClaimsWithNoMapping": false,
      "nameIdentifierProbes": [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ]
    }
    ```
    Scroll down and select **Enable** to apply the configuration.

### IdP initiated SSO

To use IdP-initiated SSO with certain identity providers, you also need to set the `RelayState` parameter to this URL: 

`https://cloud.redis.io/#/login/?idpId=<ID>`

{{< note >}}
Replace `ID` so it matches the `AssertionConsumerService` Location URL ID (the content after the last forward slash "/"). To learn more about how to configure service provider apps, see your identity provider’s documentation.
{{</ note >}}

## Step 4: Return to the Redis Cloud console

1. Return to the Redis Cloud console and select **Activate**.

    {{<image filename="images/rc/saml/sm_saml_8.png" >}}

   A popup appears, explaining that, in order to test the SAML connection, we need to login with credentials of a user defined in Auth0. Select **Continue** to go to the Auth0 login screen.

1. The Auth0 login screen appears. Enter the credentials and select **Sign In**.

    {{<image filename="images/rc/saml/auth0_saml_12.png" >}}

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

{{<image filename="images/rc/button-sign-in-sso.png" width="50px" alt="Sign in with SSO button">}}
