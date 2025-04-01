---
Title: Manage user login
alwaysopen: false
categories:
- docs
- operate
- rs
description: Manage user login lockout and session timeout.
linkTitle: Manage user login and session
toc: 'true'
weight: 40
url: '/operate/rs/7.8/security/access-control/manage-users/login-lockout/'
---

Redis Enterprise Software secures user access in a few different ways, including automatically:

- Locking user accounts after a series of authentication failures (invalid passwords)

- Signing sessions out after a period of inactivity

Here, you learn how to configure the relevant settings.

## User login lockout

By default, after 5 failed login attempts within 15 minutes, the user account is locked for 30 minutes. You can change the user login lockout settings in the Cluster Manager UI or with [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}).

### View login lockout settings

You can view the cluster's user login lockout settings from **Cluster > Security > Preferences > Lockout threshold** in the Cluster Manager UI or with [`rladmin info cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/info#info-cluster" >}}):

```sh
$ rladmin info cluster | grep login_lockout
    login_lockout_counter_reset_after: 900
    login_lockout_duration: 1800
    login_lockout_threshold: 5
```

### Configure user login lockout

To change the user login lockout settings using the Cluster Manager UI:

1. Go to **Cluster > Security > Preferences**, then select **Edit**.

1. In the **Lockout threshold** section, make sure the checkbox is selected.

    {{<image filename="images/rs/screenshots/cluster/security-preferences-lockout-threshold.png" alt="The Lockout threshold configuration section" >}}

1. Configure the following **Lockout threshold** settings:

    1. **Log-in attempts until user is revoked** - The number of failed login attempts allowed before the user account is locked.

    1. **Time between failed login attempts** in seconds, minutes, or hours - The amount of time during which failed login attempts are counted.

    1. For **Unlock method**, select one of the following:

        - **Locked duration** to set how long the user account is locked after excessive failed login attempts.

        - **Only Admin can unlock the user by resetting the password**.

1. Select **Save**.

### Change allowed login attempts

To change the number of failed login attempts allowed before the user account is locked, use one of the following methods:

- [Cluster Manager UI](#configure-user-login-lockout)

- [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

    ```sh
    rladmin tune cluster login_lockout_threshold <integer>
    ```

    For example, to set the lockout threshold to 10 failed login attempts, run:

    ```sh
    rladmin tune cluster login_lockout_threshold 10
    ```

    If you set the lockout threshold to 0, it turns off account lockout, and the cluster settings show `login_lockout_threshold: disabled`.

    ```sh
    rladmin tune cluster login_lockout_threshold 0
    ```

### Change time before login attempts reset

To change the amount of time during which failed login attempts are counted, use one of the following methods:

- [Cluster Manager UI](#configure-user-login-lockout)

- [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

    ```sh
    rladmin tune cluster login_lockout_counter_reset_after <seconds>
    ```

    For example, to set the lockout reset to 1 hour, run:

    ```sh
    rladmin tune cluster login_lockout_counter_reset_after 3600
    ```

### Change login lockout duration

To change the amount of time that the user account is locked after excessive failed login attempts, use one of the following methods:

- [Cluster Manager UI](#configure-user-login-lockout)

- [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

    ```sh
    rladmin tune cluster login_lockout_duration <login_lockout_duration>
    ```

    For example, to set the lockout duration to 1 hour, run:

    ```sh
    rladmin tune cluster login_lockout_duration 3600
    ```

    If you set the lockout duration to 0, then the account can be unlocked only when an administrator changes the account's password.

    ```sh
    rladmin tune cluster login_lockout_duration 0
    ```

    The cluster settings now show `login_lockout_duration: admin-release`.

### Unlock locked user accounts

To unlock a user account in the Cluster Manager UI:

1. Go to **Access Control > Users**. Locked users have a "User is locked out" label:

   {{<image filename="images/rs/screenshots/access-control/users-locked-out.png" alt="The Access Control > Users configuration screen in the Cluster Manager UI" >}}

1. Point to the user you want to unlock, then click **Reset to unlock**:

   {{<image filename="images/rs/screenshots/access-control/users-reset-to-unlock.png" alt="Reset to unlock button appears when you point to a locked user in the list" >}}

1. In the **Reset user password** dialog, enter a new password for the user:

   {{<image filename="images/rs/screenshots/access-control/users-reset-user-password-dialog.png" alt="Reset user password dialog" >}}

1. Select **Save** to reset the user's password and unlock their account.

To unlock a user account or reset a user password with `rladmin`, run:

```sh
rladmin cluster reset_password <user_email>
```

To unlock a user account or reset a user password with the REST API, use [`PUT /v1/users`]({{< relref "/operate/rs/references/rest-api/requests/users#put-user" >}}):

```sh
PUT /v1/users
{"password": "<new_password>"}
```

### Turn off login lockout

To turn off user login lockout and allow unlimited login attempts, use one of the following methods:

- Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. Clear the **Lockout threshold** checkbox.

    1. Select **Save**.

- [`rladmin tune cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}):

    ```sh
    rladmin tune cluster login_lockout_threshold 0
    ```

The cluster settings show `login_lockout_threshold: disabled`.

## Configure session timeout

The Redis Enterprise Cluster Manager UI supports session timeouts. By default, users are automatically logged out after 15 minutes of inactivity.

To customize the session timeout, use one of the following methods:

- Cluster Manager UI:

    1. Go to **Cluster > Security > Preferences**, then select **Edit**.

    1. For **Session timeout**, select minutes or hours from the list and enter the timeout value.

    1. Select **Save**.

- [`rladmin cluster config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}):

    ```sh
    rladmin cluster config cm_session_timeout_minutes <number_of_min>
    ```

    The `<number_of_min>` is the number of minutes after which sessions will time out.
