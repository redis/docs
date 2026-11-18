---
Title: Okta SAML integration guide (Generic)
alwaysopen: false
categories:
- docs
- operate
- rc
description: This integration guide shows how to set up Okta as a SAML single sign-on
  provider for your Redis Cloud account.
linkTitle: Okta integration (Generic)
weight: 10
bannerText: Specific identity provider details may be different than shown in this guide. Always consult your [identity provider's docs](https://help.okta.com/en-us/content/topics/security/identity_providers.htm) for the latest information.
---

This guide shows how to configure [Okta](https://help.okta.com/en-us/Content/Topics/Security/Identity_Providers.htm) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

Learn how to use the generic application template. You can also refer to the [Org2Org](/content/operate/rc/security/access-control/saml-sso/saml-integration-okta-org2org.md) application template.

To learn more about Redis Cloud support for SAML, see [SAML single sign-on](/content/operate/rc/security/access-control/saml-sso/_index.md).

Before completing this guide, you must [verify ownership of any domains](/content/operate/rc/security/access-control/saml-sso/_index.md#verify-domain) you want to associate with your SAML setup. To do this, you must add a DNS TXT record provided by Redis Cloud to each domain; SAML SSO can't be enabled until the domain is verified.

## Step 1: Set up your demo identity provider (IdP)

To create the Okta SAML integration application:

1. Log in to the Okta admin console. Select **Applications > Create App Integration**.

   ![Okta admin console Applications menu with the Create App Integration button](/images/rc/saml/okta_saml_app_int_1.png)

1. Select **SAML 2.0**, then select **Next**.

   ![Okta Create a new app integration dialog with SAML 2.0 selected](/images/rc/saml/okta_saml_app_int_2.png)

1. Complete these fields for the SAML application **General Settings** section:

    * **App name**: Redis Cloud

    * **App logo**: Upload a Redis icon.

    Select **Next**.

    ![Okta General Settings step for the app with the Next button](/images/rc/saml/okta_saml_app_int_3.png)

1. In the **Configure SAML** tab, enter this data in the **General** section:

    > [!NOTE]
    > Setting up SAML SSO is a two-part handshake. You first create the Okta application with temporary mock URLs so that Redis Cloud can generate its own service provider (SP) metadata. Later, in [Step 3](#step-3-configure-saml-support-in-redis-cloud), you return to this Okta application and replace these mock URLs with the real values from that Redis Cloud SP metadata.
    >

    * **Single sign-on URL**: `http://www.fake.com`. This is a temporary mock URL that you will modify later.
    * **Audience URI (SP Entity ID)**: `http://www.fake.com`. This is a temporary mock URL that you will modify later.
    * **Default RelayState**: `https://cloud.redis.io/#/login/?idpId=XXXXXX`. You will need to complete this URL with the `idpId` later. _Complete this field only if you need your SAML flow to be IdP initiated._
    * **Name ID forma**: `Unspecified`
    * **Application username**: `Okta username`
    * **Update application username on**: `Create and update`

    ![Okta SAML settings with Name ID format, application username and update username options](/images/rc/saml/okta_saml_app_int_4.png)

    Next, add __attribute statements__, which are required for the configuration:

    * **Attribute 1**:
      * **Name**: `redisAccountMapping`
      * **Name Format**: `Basic`
      * **Value**: `appuser.redisAccountMapping`

    * **Attribute 2**:
      * **Name**: `FirstName`
      * **Name Format**: `Basic`
      * **Value**: `user.firstName`

    * **Attribute 3**:
      * **Name**: `LastName`
      * **Name Format**: `Basic`
      * **Value**: `user.lastName`

    * **Attribute 4**:
      * **Name**: `Email`
      * **Name Format**: `Basic`
      * **Value**: `user.login`

    ![Okta attribute statements with the Email attribute mapped to user.login](/images/rc/saml/okta_saml_app_int_5.png)

    > [!NOTE]
    > The `redisAccountMapping` attribute is required. If it's missing or malformed, SAML activation and subsequent SAML logins fail.
    >

    Select **Next**.

1. The last step is an optional feedback step for Okta. Select **I'm an Okta customer adding an internal app** and then select **Finish**.

    ![Okta feedback step with I'm an Okta customer adding an internal app selected and Finish](/images/rc/saml/okta_saml_app_int_6.png)

1. Next, scroll down the page of your newly created app integration and select **View Setup Instructions**. A new browser window opens, providing the information you need to configure the IdP in Redis Cloud.

    ![Okta app integration page with the View Setup Instructions button](/images/rc/saml/okta_saml_app_int_7.png)

   Scroll down to **Applications > Applications**, and note down the following information:
   
    * **Identity Provider Single Sign-On URL**
    * **Identity Provider Issuer**
    * **X.509 Certificate**

    ![Okta setup instructions page listing the X.509 certificate](/images/rc/saml/okta_saml_app_int_8.png)

   Once you save the information, close the window.

You must also add `redisAccountMapping` as a custom attribute on the user profile itself, using the Profile Editor. The attribute statement you added above tells Okta which profile field (`appuser.redisAccountMapping`) to pass in the SAML assertion, but that field doesn't exist until you define it here. Without this step, Okta has no `redisAccountMapping` value to send, and Redis Cloud can't determine the user's role or account.

To modify the application user profile:

1. Go to **Directory > Profile Editor** in the left menu, and select **Redis Cloud User**.

    ![Okta Profile Editor with the Redis Cloud User profile selected](/images/rc/saml/okta_saml_app_int_9.png)

1. Add the custom attribute to your user profile to specify which Redis Cloud role the user has and on which account. Select **Add Attribute**.

    ![Okta Redis Cloud User profile with the Add Attribute button](/images/rc/saml/okta_saml_app_int_10.png)

1. Add this information for the new custom attribute.

    * **Data type**: `string array`
    * **Display name**: `redisAccountMapping`
    * **Variable name**: `redisAccountMapping`
    * **Description**: `redisAccountMapping`
    * **Attribute required**: `Yes`
    * **Group priority**: `Combine values across groups`

    ![Okta Add Attribute form for redisAccountMapping, required and combining values across groups](/images/rc/saml/okta_saml_app_int_11.png)

1. Once you add the attribute, it appears in the list of attributes for the profile.

    ![Okta profile attribute list including the newly added redisAccountMapping attribute](/images/rc/saml/okta_saml_9.png)

## Step 2: Create a group and assign the application

Now that your SAML IdP is configured, create an Okta group and assign users to the Redis Cloud application.

### Create the group

1. In the left menu, select **Directory > Groups**, then select **Add group**.

    ![Okta Directory Groups page with the Add group button](/images/rc/saml/okta_saml_group_1.png)

1. Complete **Name** and  **Description**, then click **Save**.
 
    ![Okta Add group dialog with the name and description both set to Redis Cloud User Group](/images/rc/saml/okta_saml_group_2.png)

    ![Okta Groups list with the Redis Cloud User Group highlighted](/images/rc/saml/okta_saml_group_3.png)

### Assign users to the group

1. Select the group, then select **Assign people**.

    ![Okta group page with the Assign people button](/images/rc/saml/okta_saml_group_4.png)

1. For each user you want to add to the group, highlight the user in the table and select **+**. You can also select **Add all** to add all users. Once you add all the users to your group, select **Save**.

    ![Okta Assign people dialog with users selected and the add button](/images/rc/saml/okta_saml_group_5.png)

### Assign the application to the group

Now that your group is populated with its users, you can assign the SAML integration application to your group. From **Applications > Applications > Redis Cloud**:

1. Select **Assign to groups** menu item.

    ![Okta Redis Cloud application page with the Assign to groups option](/images/rc/saml/okta_saml_group_6.png)

1. In the **Redis Cloud User Group**, select **Assign**.

    ![Okta Assign Redis Cloud to groups dialog with Assign next to Redis Cloud User Group](/images/rc/saml/okta_saml_group_7.png)

1. Define the Redis account mapping string default for this group and select **Save and Go Back**. The key-value pair consists of your **Redis Cloud Account ID** found in the [account settings](/content/operate/rc/accounts/account-settings.md) and the lowercase role name (owner, member, manager, billing_admin, or viewer) — for example, `1937217=viewer`. Select **"Done"**.

    > [!NOTE]
    > Role values must be lowercase. A value like `1937217=Viewer` or `1937217=VIEWER` is rejected.
    >

    ![Okta assignment dialog with the redisAccountMapping default for the group and Save and go back](/images/rc/saml/okta_saml_group_8.png)

    The mapping field has now been defined as a default for each member of the group.

    ![Okta Redis Cloud application listing the group with its redisAccountMapping default set](/images/rc/saml/okta_saml_group_9.png)

### Edit the mapping field for the group

To modify the Redis mapping field, select the pencil icon of the Redis Cloud group in the **Redis Cloud** application screen.

![Okta Redis Cloud application with the pencil icon next to the group, for editing its mapping](/images/rc/saml/okta_saml_group_10.png)

You can modify the mapping field for the whole group on the edit screen that appears.

![Okta Edit Group Assignment dialog for changing the mapping field of the whole group](/images/rc/saml/okta_saml_group_11.png)

### Edit the mapping field for a specific user

To override the Redis mapping field at an individual user level, select the **People** menu, and then the pencil icon of the person whose field you want to modify.

![Okta Redis Cloud application Assignments tab with the pencil icon circled next to an individual user](/images/rc/saml/okta_saml_group_15.png)

Set the user's **Assignment master** to **Administrator**, enabling the group's policy override. Select **Save**.

![Okta Edit User Assignment dialog with Assignment master set to Administrator](/images/rc/saml/okta_saml_group_13.png)

The user's **Type** is set to `Individual`.

![Okta Redis Cloud application list showing a user whose type is Individual](/images/rc/saml/okta_saml_group_14.png)

On the screen that appears, select the pencil icon of the user to modify the Redis mapping field.

![Okta Redis Cloud application Assignments tab with the pencil icon circled next to an individual user](/images/rc/saml/okta_saml_group_15.png)

Then, edit the user assignment.

![Okta Edit User Assignment with redisAccountMapping set to 123456=owner,456789=member and Save](/images/rc/saml/okta_saml_group_16.png)

## Step 3: Configure SAML support in Redis Cloud

Now that you have a test IdP server ready as well as your user group, configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in Access Management

To activate SAML, you must have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, you will see the **Single Sign-On** tab.

> [!NOTE]
> The user who activates SAML must have `ACCOUNT_ID=owner` in their `redisAccountMapping` value, where `ACCOUNT_ID` is the Redis Cloud account being configured. Activation fails if this user's mapping doesn't grant the owner role on that account.

1. Fill in the information you saved in step 6 in the **setup** form, including:

    * **IdP Server URL**: Identity Provider Single Sign-On URL
    * **Issuer**: Identity Provider Issuer
    * **Assertion signing certificate**: X.509 Certificate

    > [!NOTE]
    > Paste the X.509 certificate exactly as Okta provides it. Don't add `-----BEGIN CERTIFICATE-----`/`-----END CERTIFICATE-----` headers unless the Redis Cloud UI specifically asks for them.
    >

    ![Redis Cloud Access Management Single Sign-On tab with the SAML setup form and Enable button](/images/rc/saml/sm_saml_1.png)

1. Select **Enable** and wait a few seconds for the status to change. You are then able to download the service provider (SP) metadata. Save the file to your local hard disk.

    ![Redis Cloud panel for downloading the service provider (SP) metadata file](/images/rc/saml/sm_saml_3.png)

1. Open the file in any text editor. Save the following text from the metadata:

    * **EntityID**: The unique name of the service provider (SP)

    ![Service provider metadata XML with the entityID value circled](/images/rc/saml/sm_saml_4.png)

    * **Location**: The location of the assertion consumer service

    ![Service provider metadata XML with the Assertion Consumer Service Location value circled](/images/rc/saml/sm_saml_5.png)

1. Return to Okta, select **Applications > Redis Cloud > General** and select **Edit**.

    ![Okta Redis Cloud application General tab with the Edit button](/images/rc/saml/okta_saml_app_int_12.png)

1. Then, navigate to **Configure SAML** (step 2) and update the following information in **SAML Settings General**:

   * **Single sign-on URL**: Use the information that you copied for **Location**.
   * **Audience URI (SP Entity ID)**: Use the information that you copied for **EntityID**.
   * **Default RelayState**: Only needed if you want to have an IdP initiated flow. Take the ID from the location URL in step 3 (the content after the last forward slash "/") and append to the url (for example, `https://cloud.redis.io/#/login/?idpId=YOUR_LOCATION_ID`).

    ![Okta SAML settings with the single sign-on URL, audience URI and default RelayState fields](/images/rc/saml/okta_saml_app_int_13.png)

   Select **Next**, then select **Finish**.

### Return to Redis Cloud console

1. Return to Redis Cloud console and select **Activate**.

    ![Redis Cloud Activate SAML integration panel with the Activate button](/images/rc/saml/sm_saml_8.png)

    A popup appears, stating that to test the SAML connection, you need to log in with Okta credentials of the user defined in the Redis Cloud group. This user is part of the group to which you assigned the Redis Cloud application. Select **Continue** to go to the Okta login screen.

1. The Okta login screen appears. Enter the credentials and select **Sign In**.

    ![Okta sign-in screen shown when logging in to Redis Cloud with SAML](/images/rc/saml/okta_saml_app_int_14.png)

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

![Sign in with SSO button](/images/rc/button-sign-in-sso.png)
{width="50px"}