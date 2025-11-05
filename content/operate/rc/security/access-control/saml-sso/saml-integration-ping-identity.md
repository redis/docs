---
Title: PingIdentity SAML integration guide
alwaysopen: false
categories:
- docs
- operate
- rc
description: This integration guide shows how to set up PingIndentity as a SAML single
  sign-on provider for your Redis Cloud account.
linkTitle: PingIdentity integration
weight: 10
bannerText: Specific identity provider details may be different than shown in this guide. Always consult your identity provider's docs for the latest information.
---

This guide shows how to configure [PingIdentity](https://docs.pingidentity.com/p/en-us/makeitwork#top) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

To learn more about Redis Cloud support for SAML, see [SAML single sign-on]({{< relref "/operate/rc/security/access-control/saml-sso" >}}).

Before completing this guide, you must [verify ownership of any domains]({{< relref "/operate/rc/security/access-control/saml-sso#verify-domain" >}}) you want to associate with your SAML setup.

## Step 1: Set up your identity provider (IdP)

### Add the `redisAccountMapping` attribute

1. Log in into your Ping Identity account. Open **Administrators > Identities > User Attributes** and select **Add Attribute**.

    {{<image filename="images/rc/saml/ping_identity_saml_1.png" >}}

2. Select the **DECLARED** attribute type.

    {{<image filename="images/rc/saml/ping_identity_saml_2.png" >}}

3. Fill in the fields with the following values:

    * **Name**: `redisAccountMapping`
    * **Display name**: `redisAccountMapping`
    * **Description**: `redisAccountMapping`

    {{<image filename="images/rc/saml/ping_identity_saml_3.png" >}}

    Select **Save and Close**. Then, verify that the attribute was created successfully.

    {{<image filename="images/rc/saml/ping_identity_saml_4.png" >}}

### Add the user who will activate SAML in Service Manager (Redis Cloud)

1. Go to **Administrators > Identities > Users** and select **Add User**.

    {{<image filename="images/rc/saml/ping_identity_saml_5.png" >}}

1. Fill in the following information:

    * **redisAccountMapping**: `{accountID}={role}`
     
    **accountID** is the account ID from [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}) and **role** represents the role that the user will be assigned in Redis Cloud console (owner, member, manager, billing_admin, or viewer):

    {{<image filename="images/rc/saml/ping_identity_saml_6.png" >}}

    Save and check that the user was added successfully.

### Create the Ping Identity SAML application

1. Go to **Administrators > Connections > Applications** and select **+** to add a new application.

    {{<image filename="images/rc/saml/ping_identity_saml_7.png" >}}

1. Choose a name for the application, select **SAML Application Type** and select **Configure**.

    {{<image filename="images/rc/saml/ping_identity_saml_8.png" >}}

1. In the ACS URLs and Entity ID field add for now some dummy data, like https://example.com
   
    * This data will be updated with the correct data in a subsequent step.

    {{<image filename="images/rc/saml/ping_identity_saml_9.png" >}}

    Select **Save**.

1. Go to the **Configuration** tab and save the following information:
   
    * Issuer ID
    * Single Logout Service
    * Single Signon Service

    This information will be needed once we configure SAML in the Redis Cloud console.

    * Select **Download Metadata**. An XML file will be downloaded. Open it and copy the certificate, which is required for the configuration in Redis Cloud console.

    {{<image filename="images/rc/saml/ping_identity_saml_10.png" >}}

5. Go to the **Attribute Mappings** tab. Add the following attributes:

    * saml_subject
    * Email
    * FirstName
    * LastName
    * redisAccountMapping

    {{<image filename="images/rc/saml/ping_identity_saml_11.png" >}}

## Step 2: Configure SAML support in Redis Cloud

Now that we have our Ping Identity IdP server ready, we need to configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in access management

To activate SAML, you must have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, you will see the **Single Sign-On** tab.

1. Fill in the information you copied previously, including:

    * **Issuer (IdP Entity ID)**: `Issuer ID`
    * **IdP server URL**: `Single Signon Service`
    * **Single logout URL**: `Single Logout Service`
    * **Assertion signing certificate**: Certificate info you copied from the Ping Identity XML file

    Also add:

    * **Email domain binding**: The domain used in your company's email addresses

    {{<image filename="images/rc/saml/sm_saml_1.png" >}}

    Select **Enable** and wait a few seconds for the status to change.

1. You will then be able to **Download** the service provider (SP) metadata. Save the file to your local hard disk.

    {{<image filename="images/rc/saml/sm_saml_3.png" >}}

1. Open the file in any text editor. Save the following text from the metadata:

    * **EntityID**: The unique name of the service provider (SP)

    {{<image filename="images/rc/saml/sm_saml_4.png" >}}

    * **Location**: The location of the assertion consumer service

    {{<image filename="images/rc/saml/sm_saml_5.png" >}}

## Step 3: Finish SAML configuration in Ping Identity

1. In Ping Identity, go to **Administrators > Connections > Applications** and select your application name. Select the **Configuration** tab and select **Edit**.

    This is where we had entered mock data. We will now enter the correct data for this step:

    * Paste **EntityID** information in the **Entity ID** field.

    * Paste **Location** link in the ACS URLS field.

    * For the **Sign on URL** field, add URL `https://cloud.redis.io/#/login/?idpId=`, where you need to add the ID from the Reply URL ID, for example, `https://cloud.redis.io/#/login/?idpId=0oa5pwatz2JfpfCb91d7`.

    Select **Save**.

    {{<image filename="images/rc/saml/ping_identity_saml_13.png" >}}

1. Select the slider to enable the app.

    {{<image filename="images/rc/saml/ping_identity_saml_14.png" >}}

## Step 4: Return to Redis Cloud console

1. Return to the Redis Cloud console and select **Activate**.

    {{<image filename="images/rc/saml/sm_saml_8.png" >}}

1. A popup appears, explaining that to test the SAML connection, you need to log in with credentials of a user defined in Ping Federate. Select **Continue** to go to the Ping Federate login screen.

1. The Ping Federate login screen will appear. Enter the credentials and select **Sign In**.

    {{<image filename="images/rc/saml/ping_identity_saml_20.png" >}}

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

{{<image filename="images/rc/button-sign-in-sso.png" width="50px" alt="Sign in with SSO button">}}

## IdP-initiated SSO

`https://cloud.redis.io/#/login/?idpId=`

1. In Ping Identity, go to **Administrators > Connections > Applications** and select your application name. Select the **Configuration** tab and select **Edit**.

1. Go to **Target Application URL** and enter: **https://{enviroment}/#/login/?idpId={idpId}**, where idpId is the ID found in the Location field, after the last '/'

1. Select **Save**.

    {{<image filename="images/rc/saml/ping_identity_saml_16.png" >}}

1. Go to **https://apps.pingone.com/{environment}/myapps/#**, where environment is the environment ID, found in **Administrators -> Environment** for your app.

    {{<image filename="images/rc/saml/ping_identity_saml_17.png" >}}

   You are redirected to the Redis Cloud console.

