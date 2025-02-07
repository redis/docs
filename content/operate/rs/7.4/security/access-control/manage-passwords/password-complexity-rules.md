---
Title: Enable password complexity rules
alwaysopen: false
categories:
- docs
- operate
- rs
description: Enable password complexity rules.
linkTitle: Password complexity rules
toc: 'true'
weight: 30
url: '/operate/rs/7.4/security/access-control/manage-passwords/password-complexity-rules/'
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

You can use the Cluster Manager UI or the REST API to enable password complexity rules.

## Enable using the Cluster Manager UI

To enable password complexity rules using the Cluster Manager UI:

1. Go to **Cluster > Security > Preferences**, then select **Edit**.

1. In the **Password** section, turn on **Complexity rules**.

1. Select **Save**.

## Enable using the REST API

To use the REST API to enable password complexity rules:

``` REST
PUT https://[host][:port]/v1/cluster
{"password_complexity":true}
```

## Deactivate password complexity rules

To deactivate password complexity rules:

- Use the Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. In the **Password** section, turn off **Complexity rules**.

    1. Select **Save**.

- Use the `cluster` REST API endpoint to set `password_complexity` to `false`
