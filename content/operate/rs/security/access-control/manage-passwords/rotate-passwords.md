---
Title: Rotate passwords
alwaysopen: false
categories:
- docs
- operate
- rs
description: Rotate user passwords.
linkTitle: Rotate passwords
toc: 'true'
weight: 70
---

Redis Enterprise Software lets you implement password rotation policies using the [REST API]({{< relref "/operate/rs/references/rest-api" >}}).

You can add a new password for a database user without immediately invalidating the old one to prevent possible authentication errors in production.

{{< note >}}
Password rotation does not work for the default user. [Add additional users]({{< relref "/operate/rs/security/access-control/create-users" >}}) to enable password rotation.
{{< /note >}}

## Password rotation policies

For user access to the Redis Enterprise Software Cluster Manager UI,
you can set a [password expiration policy]({{< relref "/operate/rs/security/access-control/manage-passwords/password-expiration" >}}) to prompt the user to change their password.

However, for database connections that rely on password authentication,
you need to allow for authentication with the existing password while you roll out the new password to your systems.

With the Redis Enterprise Software REST API, you can add additional passwords to your user account for authentication to the database or the Cluster Manager UI and API.

After the old password is replaced in the database connections, you can delete the old password to finish the password rotation process.

{{< warning >}}
Multiple passwords are only supported using the REST API.
If you reset the password for a user in the Cluster Manager UI,
the new password replaces all other passwords for that user.
{{< /warning >}}

The new password cannot already exist as a password for the user and must meet the [password complexity]({{< relref "/operate/rs/security/access-control/manage-passwords/password-complexity-rules" >}}) requirements, if enabled.

## Rotate password

Admins can rotate passwords for any user. If you are not an admin, you can only rotate passwords for your account.

To rotate passwords:

1. Add an additional password to a user's password list with [`POST /v1/users/password`]({{< relref "/operate/rs/references/rest-api/requests/users/password#add-password" >}}).

    ```sh
    POST https://<host>:<port>/v1/users/password
    {
      "username": "<target_username>",
      "new_password": "<a_new_password>"
    }
    ```

    After you send this request, the user can authenticate with both the old and the new password.

1. Update the password in all database connections that connect with the user account.
1. Delete the original password with [`DELETE /v1/users/password`]({{< relref "/operate/rs/references/rest-api/requests/users/password#delete-password" >}}):

    ```sh
    DELETE https://<host>:<port>/v1/users/password
    {
      "username": "<target_username>",
      "old_password": "<existing_password_to_delete>"
    }
    ```

    If there is only one valid password for a user account, you cannot delete that password.

## Replace all passwords

You can replace all existing passwords for your account with a single password that does not match any existing passwords. Admins can reset passwords for any user.
This can be helpful if you suspect that your passwords are compromised and you want to quickly resecure the account.

To replace a user's passwords, use [`PUT /v1/users/password`]({{< relref "/operate/rs/references/rest-api/requests/users/password#update-password" >}}).

```sh
PUT https://<host>:<port>/v1/users/password
{
  "username": "<target_username>",
  "new_password": "<a_new_password>"
}
```

After this request, all of the user's existing passwords are deleted and only the new password is valid.
