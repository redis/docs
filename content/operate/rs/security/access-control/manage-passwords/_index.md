---
Title: Set password policies
alwaysopen: false
categories:
- docs
- operate
- rs
description: Set password policies.
hideListLinks: true
linkTitle: Set password policies
toc: 'true'
weight: 30
---

Redis Software provides several ways to manage the passwords of local accounts, including:

- [Password complexity rules](/content/operate/rs/security/access-control/manage-passwords/password-complexity-rules.md)

- [Password expiration](/content/operate/rs/security/access-control/manage-passwords/password-expiration.md)

- [Password rotation](/content/operate/rs/security/access-control/manage-passwords/rotate-passwords.md)

You can also manage a user's ability to [sign in](/content/operate/rs/security/access-control/manage-users/login-lockout.md#user-login-lockout) and control [session timeout](/content/operate/rs/security/access-control/manage-users/login-lockout.md#session-timeout).

To enforce more advanced password policies, we recommend using [LDAP integration](/content/operate/rs/security/access-control/ldap/_index.md) with an external identity provider, such as Active Directory.

> [!NOTE]
> Redis Software securely stores all user passwords using a cryptographic hash function. The default password hashing algorithm is `SHA-256`, but you can [change the password hashing algorithm](/content/operate/rs/security/access-control/manage-passwords/password-hashing-algorithm.md) to `PBKDF2` as of Redis Software version 7.8.6-13.
