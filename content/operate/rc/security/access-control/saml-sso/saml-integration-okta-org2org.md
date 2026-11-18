---
Title: Okta SAML integration guide (Org2Org)
alwaysopen: false
categories:
- docs
- operate
- rc
description: This integration guide shows how to set up Okta as a SAML single sign
  on provider for your Redis Cloud account.
linkTitle: Okta integration (Org2Org)
weight: 10
bannerText: Specific identity provider details may be different than shown in this guide. Always consult your [identity provider's docs](https://help.okta.com/en-us/Content/Topics/Security/Identity_Providers.htm) for the latest information.
---

This guide shows how to configure [Okta](https://help.okta.com/en-us/Content/Topics/Security/Identity_Providers.htm) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

This guide shows how to use the Org2Org application template. You can also use the [Generic](/content/operate/rc/security/access-control/saml-sso/saml-integration-okta-generic.md) application template.

To learn more about Redis Cloud support for SAML, see [SAML single sign-on](/content/operate/rc/security/access-control/saml-sso/_index.md).

Before completing this guide, you must [verify ownership of any domains](/content/operate/rc/security/access-control/saml-sso/_index.md#verify-domain) you want to associate with your SAML setup.

## Step 1: Set up your identity provider 

### Create the Okta SAML integration application

Create an Okta "Org2Org" SAML integration appliction. 

1. Sign in to the Okta admin console.

1. From the left menu, select **Applications**.

1. Select **Browse App Catalog**.

1. Locate and select **Okta Org2Org**.

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_1.png)

1. Once you have found the application, click "Add".

    ![Data transformaiton Pipeline](/images/rc/saml/okta_saml_2.png)

1. Enter this field for the **Org2Org** application **General Settings** section and select **Next**:

   * **Application label**: `Redis Cloud`

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_3.png)

1. Enter the following fields in the **Sign-On Options > Attributes** section:

    * **Name**: `redisAccountMapping`
    * **Name Format**: `Basic`
    * **Value**: `appuser.redisAccountMapping`

    > [!WARNING]
    > To ensure the role mapping will not take effect, don't skip entering `appuser.redisAccountMapping` in the **Value** field.
    >


    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_4.png)

1. Next, select **View Setup Instructions**. A new browser window opens, providing the information needed to configure the IdP in Redis Cloud.

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_5.png)

1. Scroll down to section 6 in the page, and note the following information:

   * **IdP Issuer URI**
   * **IdP Single Sign-On Url**
   * **IdP Signature Certificate**: Click the link and download the certificate to your hard drive

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_6.png)

    Once you capture the information, close the window, return to the Okta admin console, and select **Done**.

### Modify the application user profile

1. In the left menu, select **Directory > Profile Editor**, then select **Redis Cloud User**.

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_7_customer.png)

1. Select **Add Attribute** to add a custom attribute to the user profile and specify the Redis Cloud role.

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_7_5_customer.png)

1. Add this information for the new custom attribute:

   * **Data type**: `string array`
   * **Display name**: `redisAccountMapping`
   * **Variable nam**: `redisAccountMapping`
   * **Description**: `redisAccountMapping`
   * **Attribute required**: `Yes`
   * **Group priority**: `Combine values across groups`

    ![Okta Add Attribute form for redisAccountMapping, required and combining values across groups](/images/rc/saml/okta_saml_app_int_11.png)

1. Once you add the attribute, it appears in the list of profile attributes.

    ![Okta profile attribute list including the newly added redisAccountMapping attribute](/images/rc/saml/okta_saml_9.png)

1. Add a Redis Cloud icon to the application because it's easier for users to identify the application. Select the pencil icon on the application logo and upload a Redis image using these steps:

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_10_customer.png)

    ![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_11_customer.png)

## Step 2: Create a group and assign the application {#createtestuser}

Now that our SAML IdP is configured, create an Okta group and assign the Redis Cloud application.

### Create the group

1. In the left menu, select **Directory > Groups**, then select **Add group**.

    ![Okta Directory Groups page with the Add group button](/images/rc/saml/okta_saml_group_1.png)

1. Enter **Name** and **Description**.

    ![Okta Add group dialog with the name and description both set to Redis Cloud User Group](/images/rc/saml/okta_saml_group_2.png)

    ![Okta Groups list with the Redis Cloud User Group highlighted](/images/rc/saml/okta_saml_group_3.png)

### Assign users to the group

1. Select the group, then select **Assign people**.

    ![Okta group page with the Assign people button](/images/rc/saml/okta_saml_group_4.png)

1. For each user you want to add to the group, highlight the user in the table and select **+**. You can also add all users by selecting **Add all**. After you add all the users to your group, select **Save**.

    ![Okta Assign people dialog with users selected and the add button](/images/rc/saml/okta_saml_group_5.png)

### Assign application to the group

Now that your group is populated with its users, assign the SAML integration application to your group. 

1. From the menu, select **Applications > Applications > Redis Cloud**. Then, select **Assign to groups**.

    ![Okta Redis Cloud application page with the Assign to groups option](/images/rc/saml/okta_saml_group_6.png)

1. In the **Redis Cloud User Group**, select **Assign**.

    ![Okta Assign Redis Cloud to groups dialog with Assign next to Redis Cloud User Group](/images/rc/saml/okta_saml_group_7.png)

1. Now, define the Redis account mapping string default for this group and select **Save and go back**. The key-value pair consists of the lowercase role name (owner, member, manager, billing_admin, or viewer) and your **Redis Cloud Account ID** found in the [account settings](/content/operate/rc/accounts/account-settings.md). Select **"Done"**.

    ![Okta assignment dialog with the redisAccountMapping default for the group and Save and go back](/images/rc/saml/okta_saml_group_8.png)

    The mapping field is now defined as a default for each member of the group. 

    ![Okta Redis Cloud application listing the group with its redisAccountMapping default set](/images/rc/saml/okta_saml_group_9.png)

### Editing the mapping field for the group

To modify the Redis mapping field, select the pencil icon of the Redis Cloud group in the "Redis Cloud" application screen.

![Okta Redis Cloud application with the pencil icon next to the group, for editing its mapping](/images/rc/saml/okta_saml_group_10.png)

You can modify the mapping field for the whole group on the edit screen that appears.

![Okta Edit Group Assignment dialog for changing the mapping field of the whole group](/images/rc/saml/okta_saml_group_11.png)

### Editing the mapping field for a specific user

To override the Redis mapping field at an individual user level, select the **People** menu, then select the pencil icon of the person whos field you want to modify.

![Use the Okta admin console to locate the Org2Org application template.](/images/rc/saml/okta_saml_group_12.png)

Set the user's **Assignment master** to `Administrator` to enable group policy overrides. Select **Save**.

![Okta Edit User Assignment dialog with Assignment master set to Administrator](/images/rc/saml/okta_saml_group_13.png)

The user's **Type** is set to `Individual`.

![Okta Redis Cloud application list showing a user whose type is Individual](/images/rc/saml/okta_saml_group_14.png)

On the screen that appears, select the pencil icon of the user to modify the Redis mapping field.

![Okta Redis Cloud application Assignments tab with the pencil icon circled next to an individual user](/images/rc/saml/okta_saml_group_15.png)

![Okta Edit User Assignment with redisAccountMapping set to 123456=owner,456789=member and Save](/images/rc/saml/okta_saml_group_16.png)

## Step 3: Configure SAML support in Redis Cloud

Now that you have a test IdP server and your user group ready, configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in access management

To activate SAML, you must have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, the **Single Sign-On** tab is enabled.

1. Add the information you saved previously in the **setup** form (step 1), including:

   * **Issuer (IdP Entity ID)**: IdP Issuer URI
   * **IdP server URL**: IdP Single Sign-On Url
   * **Assertion signing certificate**: Drag and drop the file you downloaded to disk in the form text area.

    ![Redis Cloud Access Management Single Sign-On tab with the SAML setup form and Enable button](/images/rc/saml/sm_saml_1.png)

1. Select **Enable** and wait a few seconds for the status to change. Then, download the service provider (SP) metadata. Save the file to your local hard disk.

    ![Redis Cloud panel for downloading the service provider (SP) metadata file](/images/rc/saml/sm_saml_3.png)

1. Open the file in any text editor. Save the following text from the metadata:

   * **EntityID**: Unique name of the service provider (SP)

    ![Service provider metadata XML with the entityID value circled](/images/rc/saml/sm_saml_4.png)

   * **Location**: Location of the assertion consumer service

    ![Service provider metadata XML with the Assertion Consumer Service Location value circled](/images/rc/saml/sm_saml_5.png)


1. Return to Okta, select **Applications > Redis Cloud > General**, then select **Edit**.

    ![Okta General tab for the Redis Cloud application with the Edit button, used to enter the SP values](/images/rc/saml/sm_saml_6.png)

1. Update this information in **Advanced Sign-on Settings**.

   * **Hub ACS URL**: Use the information that you copied for **Location**.
   * **Audience URI**: Use the information that you copied for **EntityID**.

    ![Okta SAML settings with the single sign-on URL and audience URI fields filled from the SP metadata](/images/rc/saml/sm_saml_7.png)


Select **Save**.

### IdP-initiated SSO

To use IdP-initiated SSO with identity providers, set the RelayState parameter to URL `https://cloud.redis.io/#/login/?idpId=<ID>`.

> [!NOTE]
> Replace `<ID>` so it matches the AssertionConsumerService Location URL ID (the content after the last forward slash "/"). To learn more about configuring service provider applications, see your identity provider's documentation.

### Return to Redis Cloud console

1. Return to Redis Cloud console and select **Activate**.

    ![Redis Cloud Activate SAML integration panel with the Activate button](/images/rc/saml/sm_saml_8.png)

   A popup appears, explaining that, to test the SAML connection, you need to log in with Okta credentials of the user defined in the Redis Cloud group. This user is part of the group to which you assigned the Redis Cloud application. Select **Continue** to go to the Okta login screen.

1. The Okta login screen appears. Enter the credentials and select **Sign In**.

    ![Okta sign-in screen shown after activating SAML from Redis Cloud](/images/rc/saml/sm_saml_10.png)

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

![Sign in with SSO button](/images/rc/button-sign-in-sso.png)
{width="50px"}