---
Title: Configure password expiration
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure password expiration to enforce expiration of a user's password
  after a specified number of days.
linkTitle: Password expiration
toc: 'true'
weight: 50
url: '/operate/rs/7.8/security/access-control/manage-passwords/password-expiration/'
---

## Enable password expiration 

To enforce an expiration of a user's password after a specified number of days:

- Use the Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. In the **Password** section, turn on **Expiration**.

    1. Enter the number of days before passwords expire.

    1. Select **Save**.

- Use the `cluster` endpoint of the REST API

    ``` REST
    PUT https://[host][:port]/v1/cluster
    {"password_expiration_duration":<number_of_days>}
    ```

## Deactivate password expiration

To deactivate password expiration:

- Use the Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. In the **Password** section, turn off **Expiration**.

    1. Select **Save**.

- Use the `cluster` REST API endpoint to set `password_expiration_duration` to `0` (zero).
