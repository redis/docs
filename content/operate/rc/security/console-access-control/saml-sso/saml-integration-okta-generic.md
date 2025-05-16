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
aliases:
    - /operate/rc/security/access-control/saml-sso/saml-integration-okta-generic/
---

This guide shows how to configure [Okta](https://help.okta.com/en-us/Content/Topics/Security/Identity_Providers.htm) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

Learn how to use the generic application template. You can also refer to the [Org2Org]({{< relref "/operate/rc/security/access-control/saml-sso/saml-integration-okta-org2org" >}}) application template.

To learn more about Redis Cloud support for SAML, see [SAML single sign-on]({{< relref "/operate/rc/security/access-control/saml-sso" >}}).

Before completing this guide, you must [verify ownership of any domains]({{< relref "/operate/rc/security/access-control/saml-sso#verify-domain" >}}) you want to associate with your SAML setup.

## Step 1: Set up your demo identity provider (IdP)

To create the Okta SAML integration application:

1. Log in to the Okta admin console. Select **Applications > Create App Integration**.

   {{<image filename="images/rc/saml/okta_saml_app_int_1.png" >}}

1. Select **SAML 2.0**, then select **Next**.

   {{<image filename="images/rc/saml/okta_saml_app_int_2.png" >}}

1. Complete these fields for the SAML application **General Settings** section:

    * **App name**: Redis Cloud

    * **App logo**: Upload a Redis icon.

    Select **Next**.

    {{<image filename="images/rc/saml/okta_saml_app_int_3.png" >}}

1. In the **Configure SAML** tab, enter this data in the **General** section:

    * **Single sign-on URL**: `http://www.fake.com`. This is a temporary mock URL that you will modify later.
    * **Audience URI (SP Entity ID)**: `http://www.fake.com`. This is a temporary mock URL that you will modify later.
    * **Default RelayState**: `https://cloud.redis.io/#/login/?idpId=XXXXXX`. You will need to complete this URL with the `idpId` later. _Complete this field only if you need your SAML flow to be IdP initiated._
    * **Name ID forma**: `Unspecified`
    * **Application username**: `Okta username`
    * **Update application username on**: `Create and update`

    {{<image filename="images/rc/saml/okta_saml_app_int_4.png" >}}

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

    {{<image filename="images/rc/saml/okta_saml_app_int_5.png" >}}

    Select **Next**.

1. The last step is an optional feedback step for Okta. Select **I'm an Okta customer adding an internal app** and then select **Finish**.

    {{<image filename="images/rc/saml/okta_saml_app_int_6.png" >}}

1. Next, scroll down the page of your newly created app integration and select **View Setup Instructions**. A new browser window opens, providing the information you need to configure the IdP in Redis Cloud.

    {{<image filename="images/rc/saml/okta_saml_app_int_7.png" >}}

   Scroll down to **Applications > Applications**, and note down the following information:
   
    * **Identity Provider Single Sign-On URL**
    * **Identity Provider Issuer**
    * **X.509 Certificate**

    {{<image filename="images/rc/saml/okta_saml_app_int_8.png" >}}

   Once you save the information, close the window.

To modify the application user profile:

1. Go to **Directory > Profile Editor** in the left menu, and select **Redis Cloud User**.

    {{<image filename="images/rc/saml/okta_saml_app_int_9.png" >}}

1. Add the custom attribute to your user profile to specify which Redis Cloud role the user has and on which account. Select **Add Attribute**.

    {{<image filename="images/rc/saml/okta_saml_app_int_10.png" >}}

1. Add this information for the new custom attribute.

    * **Data type**: `string array`
    * **Display name**: `redisAccountMapping`
    * **Variable name**: `redisAccountMapping`
    * **Description**: `redisAccountMapping`
    * **Attribute required**: `Yes`
    * **Group priority**: `Combine values across groups`

    {{<image filename="images/rc/saml/okta_saml_app_int_11.png" >}}

1. Once you add the attribute, it appears in the list of attributes for the profile.

    {{<image filename="images/rc/saml/okta_saml_9.png" >}}

## Step 2: Create a group and assign the application

Now that your SAML IdP is configured, create an Okta group and assign users to the Redis Cloud application.

### Create the group

1. In the left menu, select **Directory > Groups**, then select **Add group**.

    {{<image filename="images/rc/saml/okta_saml_group_1.png" >}}

1. Complete **Name** and  **Description**, then click **Save**.
 
    {{<image filename="images/rc/saml/okta_saml_group_2.png" >}}

    {{<image filename="images/rc/saml/okta_saml_group_3.png" >}}

### Assign users to the group

1. Select the group, then select **Assign people**.

    {{<image filename="images/rc/saml/okta_saml_group_4.png" >}}

1. For each user you want to add to the group, highlight the user in the table and select **+**. You can also select **Add all** to add all users. Once you add all the users to your group, select **Save**.

    {{<image filename="images/rc/saml/okta_saml_group_5.png" >}}

### Assign the application to the group

Now that your group is populated with its users, you can assign the SAML integration application to your group. From **Applications > Applications > Redis Cloud**:

1. Select **Assign to groups** menu item.

    {{<image filename="images/rc/saml/okta_saml_group_6.png" >}}

1. In the **Redis Cloud User Group**, select **Assign**.

    {{<image filename="images/rc/saml/okta_saml_group_7.png" >}}

1. Define the Redis account mapping string default for this group and select **Save and Go Back**. The key-value pair consists of the lowercase role name (owner, member, manager, billing_admin, or viewer) and your **Redis Cloud Account ID** found in the [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}). Select **"Done"**.

    {{<image filename="images/rc/saml/okta_saml_group_8.png" >}}

    The mapping field has now been defined as a default for each member of the group.

    {{<image filename="images/rc/saml/okta_saml_group_9.png" >}}

### Edit the mapping field for the group

To modify the Redis mapping field, select the pencil icon of the Redis Cloud group in the **Redis Cloud** application screen.

{{<image filename="images/rc/saml/okta_saml_group_10.png" >}}

You can modify the mapping field for the whole group on the edit screen that appears.

{{<image filename="images/rc/saml/okta_saml_group_11.png" >}}

### Edit the mapping field for a specific user

To override the Redis mapping field at an individual user level, select the **People** menu, and then the pencil icon of the person whose field you want to modify.

{{<image filename="images/rc/saml/okta_saml_group_15.png" >}}

Set the user's **Assignment master** to **Administrator**, enabling the group's policy override. Select **Save**.

{{<image filename="images/rc/saml/okta_saml_group_13.png" >}}

The user's **Type** is set to `Individual`.

{{<image filename="images/rc/saml/okta_saml_group_14.png" >}}

On the screen that appears, select the pencil icon of the user to modify the Redis mapping field.

{{<image filename="images/rc/saml/okta_saml_group_15.png" >}}

Then, edit the user assignment.

{{<image filename="images/rc/saml/okta_saml_group_16.png" >}}

## Step 3: Configure SAML support in Redis Cloud

Now that you have a test IdP server ready as well as your user group, configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in Access Management

To activate SAML, you must have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, you will see the **Single Sign-On** tab.

1. Fill in the information you saved in step 6 in the **setup** form, including:

    * **IdP Server URL**: Identity Provider Single Sign-On URL
    * **Issuer**: Identity Provider Issuer
    * **Assertion signing certificate**: X.509 Certificate

    {{<image filename="images/rc/saml/sm_saml_1.png" >}}

1. Select **Enable** and wait a few seconds for the status to change. You are then able to download the service provider (SP) metadata. Save the file to your local hard disk.

    {{<image filename="images/rc/saml/sm_saml_3.png" >}}

1. Open the file in any text editor. Save the following text from the metadata:

    * **EntityID**: The unique name of the service provider (SP)

    {{<image filename="images/rc/saml/sm_saml_4.png" >}}

    * **Location**: The location of the assertion consumer service

    {{<image filename="images/rc/saml/sm_saml_5.png" >}}

1. Return to Okta, select **Applications > Redis Cloud > General** and select **Edit**.

    {{<image filename="images/rc/saml/okta_saml_app_int_12.png" >}}

1. Then, navigate to **Configure SAML** (step 2) and update the following information in **SAML Settings General**:

   * **Single sign-on URL**: Use the information that you copied for **Location**.
   * **Audience URI (SP Entity ID)**: Use the information that you copied for **EntityID**.
   * **Default RelayState**: Only needed if you want to have an IdP initiated flow. Take the ID from the location URL in step 3 (the content after the last forward slash "/") and append to the url (for example, `https://cloud.redis.io/#/login/?idpId=YOUR_LOCATION_ID`).

    {{<image filename="images/rc/saml/okta_saml_app_int_13.png" >}}

   Select **Next**, then select **Finish**.

### Return to Redis Cloud console

1. Return to Redis Cloud console and select **Activate**.

    {{<image filename="images/rc/saml/sm_saml_8.png" >}}

    A popup appears, stating that to test the SAML connection, you need to log in with Okta credentials of the user defined in the Redis Cloud group. This user is part of the group to which you assigned the Redis Cloud application. Select **Continue** to go to the Okta login screen.

1. The Okta login screen appears. Enter the credentials and select **Sign In**.

    {{<image filename="images/rc/saml/okta_saml_app_int_14.png" >}}

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

{{<image filename="images/rc/button-sign-in-sso.png" width="50px" alt="Sign in with SSO button">}}