---
Title: Configure password complexity rules
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable password complexity rules and configure minimum password length.
linkTitle: Password complexity rules
toc: 'true'
weight: 30
url: '/operate/rs/7.22/security/access-control/manage-passwords/password-complexity-rules/'
---

Redis Enterprise Software provides optional password complexity rules that meet common requirements.  When enabled, these rules require the password to have:

- At least 8 characters
- At least one uppercase character
- At least one lowercase character
- At least one number
- At least one special character 

These requirements reflect v6.2.12 and later. Earlier versions did not support numbers or special characters as the first or the last character of a password. This restriction was removed in v6.2.12.

In addition, the password:

- Cannot contain the user's email address or the reverse of the email address.
- Cannot have more than three repeating characters.

Password complexity rules apply when a new user account is created and when the password is changed.  Password complexity rules are not applied to accounts authenticated by an external identity provider.  

## Enable password complexity rules

To enable password complexity rules, use one of the following methods:

- Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. In the **Password** section, enable **Complexity rules**.

    1. Select **Save**.

- [Update cluster]({{<relref "/operate/rs/7.22/references/rest-api/requests/cluster#put-cluster">}}) REST API request:

    ```sh
    PUT https://[host][:port]/v1/cluster
    { "password_complexity": true }
    ```

## Change minimum password length

When password complexity rules are enabled, passwords must have at least 8 characters by default.

If you change the minimum password length, the new minimum is enforced for new users and when existing users change their passwords.

To change the minimum password length, use one of the following methods:

- Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**.
    
    1. Click **Edit**.

    1. In the **Password** section, enable **Complexity rules**.

    1. Set the number of characters for **Minimum password length**.

        {{<image filename="images/rs/screenshots/cluster/security-preferences-min-password-length.png" alt="The minimum password length setting appears in the password section of the cluster security preferences screen when complexity rules are enabled." >}}

    1. Click **Save**.

- [Update cluster]({{<relref "/operate/rs/7.22/references/rest-api/requests/cluster#put-cluster">}}) REST API request:

    ```sh
    PUT https://[host][:port]/v1/cluster
    { "password_min_length": <integer between 8-256> }
    ```

## Deactivate password complexity rules

To deactivate password complexity rules, use one of the following methods:

- Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. In the **Password** section, turn off **Complexity rules**.

    1. Select **Save**.

- [Update cluster]({{<relref "/operate/rs/7.22/references/rest-api/requests/cluster#put-cluster">}}) REST API request:

    ```sh
    PUT https://[host][:port]/v1/cluster
    { "password_complexity": false }
    ```
