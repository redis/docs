---
Title: Microsoft Entra (formerly Azure Active Directory) SAML integration guide
alwaysopen: false
categories:
- docs
- operate
- rc
description: This integration guide shows how to set up Microsoft Entra as a SAML single sign on provider for your Redis Cloud account.
linkTitle: Microsoft Entra integration
weight: 10
bannerText: Specific identity provider details may be different than shown in this guide. Always consult your [identity provider's docs](https://learn.microsoft.com/en-us/entra/identity/) for the latest information.
---

This guide shows how to configure [Microsoft Entra](https://learn.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-architecture) (formerly Azure Active Directory) as a SAML single sign-on identity provider (IdP) for your Redis Cloud account.

To learn more about Redis Cloud support for SAML, see [SAML single sign on]({{< relref "/operate/rc/security/access-control/saml-sso" >}}).

Before completing this guide, you must [verify ownership of any domains]({{< relref "/operate/rc/security/access-control/saml-sso#verify-domain" >}}) you want to associate with your SAML setup.

## Step 1: Set up your identity provider (IdP)

To create the Microsoft Entra SAML Toolkit integration application:

1. Sign in to your Microsoft Azure account.

1. From the main menu, select **Microsoft Entra ID > Enterprise Applications**. Select **New application** to add a new application.

    {{<image filename="images/rc/saml/ad_saml_1.png" >}}

1. Select **Microsoft Entra SAML Toolkit** from the list of apps.

    {{<image filename="images/rc/saml/ad_saml_2.png" >}}

1. Name the application **Redis Cloud** and then select **Create**. 

    {{<image filename="images/rc/saml/ad_saml_3.png" >}}

1. Select **Properties** and upload the Redis logo. 

    {{<image filename="images/rc/saml/ad_saml_17.png" >}}

    Select **Save**.

1. Once you've created the application, go to the **Application Overview** and select **Set up single sign on**.

    {{<image filename="images/rc/saml/ad_saml_4.png" >}}

1. Select **SAML** as the single sign-on method.

    {{<image filename="images/rc/saml/ad_saml_5.png" >}}

1. Go to **Step 1** in the configuration screen and select **Edit**.

    Enter some mock data in the required fields.

    {{<image filename="images/rc/saml/ad_saml_8.png" >}}

    Select **Save** to save your changes.

1. Go to **Step 3** in the configuration screen.

   * Certificate (Base 64) is required to complete SAML configuration in the Redis Cloud console. Select **Download** to download it.

     {{<image filename="images/rc/saml/ad_saml_7.png" >}}

1. Go to **Step 4** in the configuration screen, and note down or copy the following information:

   * **Login URL** is used as the "IdP server URL" in the SAML configuration in admin console.
   * **Microsoft Entra Identifier** is used as the "Issuer (IdP Entity ID)" in the SAML configuration in admin console.
  
    {{<image filename="images/rc/saml/ad_saml_6.png" >}}

## Step 2: Configure SAML support in Redis Cloud

Now that you have your Entra IdP server ready, configure support for SAML in Redis Cloud.

### Sign in to Redis Cloud

Sign in to your account on the [Redis Cloud console](https://cloud.redis.io/#/login).

### Activate SAML in access management

To activate SAML, you must have a local user (or social sign-on user) with the **owner** role. If you have the correct permissions, you will see the **Single Sign-On** tab.

1. Fill in the information you saved previously in the **setup** form. This includes :

   * **Issuer (IdP Entity ID)**: Microsoft Entra Identifier
   * **IdP server URL**: Login URL
   * **Assertion signing certificate**: Drag-and-drop the certificate file you downloaded to disk in the form text area

     {{<image filename="images/rc/saml/sm_saml_1.png" >}}

   Once you click the **Enable** button, wait a few seconds for the status to change.

1. You will then be able to **download** the service provider (SP) metadata. Save the file to your local hard disk.

    {{<image filename="images/rc/saml/sm_saml_3.png" >}}

1. Open the file in any text editor. Save the following text from the metadata:

   * **EntityID**: The unique name of the service provider (SP)

    {{<image filename="images/rc/saml/sm_saml_4.png" >}}

   * **Location**: The location of the assertion consumer service

    {{<image filename="images/rc/saml/sm_saml_5.png" >}}

## Step 3: Finish SAML configuration in Microsoft Entra ID

1. Go back to Microsoft Entra ID setup and **Edit** the Basic SAML Configuration in **Step 1**. 
   
   This is where you entered mock data. Let's now enter the correct data for this step.

   {{< note >}}
   For the `EntityID` and `Location` fields below you can directly upload the metadata file using the option at the top of the page. However, you will still need to manually    add the **Sign on URL**.
   {{< /note >}}

    * Paste `EntityID` information in the `Identifier (Entity ID)` field.
  
    * Paste `Location` link in `Reply URL (Assertion Consumer Service URL)` field.

    * For the `Sign on URL` field, add URL `https://cloud.redis.io/#/login/?idpId=` where you need to add the ID from the Reply URL ID, for example,    `https://cloud.redis.io/#/login/?idpId=0oa5pwatz2JfpfCb91d7`.

    Select **Save**.

      {{<image filename="images/rc/saml/ad_saml_23.png" >}}

1. Go to step 2, **Attributes & Claims** and select **Edit**.

    {{<image filename="images/rc/saml/ad_saml_24.png" >}}

1. Configure these attributes and claims:

    * Modify Unique User Identifier (Name ID) to **user.mail**
  
    * Modify additional claims to match SAML assertion as follows:
  
        * **Email**: user.mail
        * **FirstName**: user.givenname
        * **LastName**: user.surname
        * **redisAccountMapping**: `<sm_account_id>=owner`

            The `redisAccountMapping` claim maps Redis Cloud accounts to the role each user receives. Its value is a comma-separated list of `accountId=role` pairs, for example `2613034=owner,2923247=member`.

            * **`accountId`** must be the numeric **Redis Cloud Account ID** found in your [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}). Non-numeric values are silently skipped.
            * **`role`** must be lowercase and one of `owner`, `member`, `manager`, `billing_admin`, or `viewer`. Note the underscore in `billing_admin`.
            * Redis Cloud reads a **single value** for this claim. If it resolves to multiple values, only one is used — see [Claim conditions and user groups](#claim-conditions-and-user-groups).

          {{<image filename="images/rc/saml/ad_saml_14.png" >}}
        
        {{<note>}}
Make sure the **Namespace** field is empty when modifying these claims.

{{<image filename="images/rc/saml/ad_saml_namespace_field.png" >}}
        {{</note>}}

1. To add a user to the application, select **User and Groups > Add user/group**.

    {{<image filename="images/rc/saml/ad_saml_15.png" >}}

1. Add the user and select **Assign**.

    {{<image filename="images/rc/saml/ad_saml_16.png" >}}

## Step 4: Return to Redis Cloud console

1. Return to Redis Cloud console and select **Activate**.

    {{<image filename="images/rc/saml/sm_saml_8.png" >}}

1. A popup appears, explaining that you must log in with the credentials of a Microsoft Entra user to test the SAML connection. Select **Continue** to go to the Microsoft login screen.

1. The Microsoft login screen will appear. Enter the credentials and click **Sign In**.

    {{<image filename="images/rc/saml/ad_saml_19.png" >}}

If everything is configured correctly, you will see the the Redis Cloud console screen. Your local account is now considered a SAML account. 

To log in to the Redis Cloud console from now on, click on **Sign in with SSO**.

{{<image filename="images/rc/button-sign-in-sso.png" width="50px" alt="Sign in with SSO button">}}

## Claim conditions and user groups

The simple `redisAccountMapping` value shown above gives every user assigned to the application the same role. If different users need different roles, or you prefer to manage roles with directory groups, you can build the claim value from each user's group membership instead.

However you build it, Redis Cloud reads `redisAccountMapping` as a single string of comma-separated `accountId=role` pairs, so the emitted value must resolve to clean `accountId=role` pairs using the same format described in [Step 3](#step-3-finish-saml-configuration-in-microsoft-entra-id).

### Map roles from directory groups (regex replace)

Microsoft Entra can build the claim value from the names of the groups a user belongs to, using **Apply a regex replace to groups claim content**.

1. Create one directory group per role, using a `redis-<role>` naming convention:

    * `redis-owner`
    * `redis-member`
    * `redis-manager`
    * `redis-billing_admin` — note the **underscore**, so the group name matches the `billing_admin` role token exactly
    * `redis-viewer`

1. On the `redisAccountMapping` claim, set the source to **Attribute**, choose the **groups** attribute, and enable **Apply a regex replace to groups claim content**.

1. Set the regex and replacement patterns:

    * **Regex pattern**: `^redis-(?<role>owner|member|manager|billing_admin|viewer)$`
    * **Replacement pattern**: `<accountId>={role}` — replace `<accountId>` with your numeric Redis Cloud Account ID. To map more than one account, comma-join the pairs, for example `2613034={role},2923247={role}`.

    {{< warning >}}
The substitution token is `{role}` — **curly braces only**. Do **not** write `${role}`. Entra emits the `$` as a literal character, producing a value like `2613034=$owner`, which Redis Cloud rejects with `saml-config-invalid-account-mapping` because `$owner` is not a valid role token.
    {{< /warning >}}

1. Make sure **Emit groups as role claims** is **turned off**. When it is on, the value is emitted under the `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` claim type instead of your custom `redisAccountMapping` claim name, so Redis Cloud never receives the mapping.

{{< note >}}
Set the group claim **Source attribute** to the group **name**, not **Group ID**. If the source is Group ID, the emitted value is a GUID that never matches the `redis-<role>` regex. For groups synced from on-premises Active Directory, use `sAMAccountName`; for cloud-only groups, enable the group-name option.
{{< /note >}}

{{<image filename="images/rc/saml/ad_saml_20.png" >}}

### Users in multiple groups

The group-claim regex emits **one value per matching group**, so a user who belongs to more than one `redis-<role>` group produces a multi-valued claim.

This does not fail login, but because Redis Cloud reads only a single value, the broker forwards one of the values (typically the first). The user then resolves to a single group's role rather than a combination, which makes the effective role unpredictable.

* Assign each user to a **single** `redis-<role>` group per account set, so the resulting role is deterministic.
* If users need **different roles in different accounts**, do not build the value from groups. Instead, store the full `accountId=role,...` string in a per-user directory or extension attribute and emit that attribute directly, with no regex. This always produces a single value.

## Troubleshooting

### `saml-config-invalid-account-mapping`

This error means the `redisAccountMapping` claim reached Redis Cloud, but no valid `accountId=role` pair could be parsed from its value. Check the emitted value for:

* **Stray characters** — most often a literal `$` from writing `${role}` instead of `{role}` in the regex replacement pattern, which produces `accountId=$owner`.
* **A wrong role token** — the role must be exactly `owner`, `member`, `manager`, `billing_admin`, or `viewer`, in lowercase. Values like `Owner` or `billing-admin` (hyphen) are rejected.
* **A non-numeric account ID** — `accountId` must be the numeric Redis Cloud Account ID from [account settings]({{< relref "/operate/rc/accounts/account-settings" >}}).

Multi-group membership (a multi-valued claim) does **not** cause this error. Login succeeds, but the user resolves to a single group's role — see [Users in multiple groups](#users-in-multiple-groups).

### Verify the emitted claim

To confirm the claim value before users sign in:

* Use Entra's **Test this application** on the SAML-based sign-on screen, or
* Capture the SAML assertion during login — with a tool such as [SAML-tracer](https://addons.mozilla.org/firefox/addon/saml-tracer/), or a HAR capture taken with **Preserve log** enabled from the start of the login flow.

Confirm that `redisAccountMapping` contains clean `accountId=role` pairs, with no `$` or other stray characters and no duplicate account IDs.

## IdP initiated SSO

If you correctly set the up the **Sign on URL**, the SAML application appears by default on the user's **My Apps** panel.

{{<image filename="images/rc/saml/ad_saml_25.png" >}}

While assigning the user to the app, a notification will appear:

{{<image filename="images/rc/saml/ad_saml_26.png" >}}

Therefore, if you sign into `https://myapplications.microsoft.com/`, the application will be available.

If the app is not available, make sure that the App is registered. It should be done automatically.

{{<image filename="images/rc/saml/ad_saml_27.png" >}}

{{<image filename="images/rc/saml/ad_saml_28.png" >}}

You can also access the app directly by using the **User access Url** from App Properties.
