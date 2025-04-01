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
url: '/operate/rs/7.4/security/access-control/manage-passwords/'
---

Redis Enterprise Software provides several ways to manage the passwords of local accounts, including:

- [Password complexity rules]({{< relref "/operate/rs/7.4/security/access-control/manage-passwords/password-complexity-rules" >}})

- [Password expiration]({{< relref "/operate/rs/7.4/security/access-control/manage-passwords/password-expiration" >}})

- [Password rotation]({{< relref "/operate/rs/7.4/security/access-control/manage-passwords/rotate-passwords" >}})

You can also manage a user's ability to [sign in]({{< relref "/operate/rs/7.4/security/access-control/manage-users/login-lockout#user-login-lockout" >}}) and control [session timeout]({{< relref "/operate/rs/7.4/security/access-control/manage-users/login-lockout#session-timeout" >}}).

To enforce more advanced password policies, we recommend using [LDAP integration]({{< relref "/operate/rs/7.4/security/access-control/ldap" >}}) with an external identity provider, such as Active Directory.

{{<note>}}
Redis Enterprise Software stores all user passwords using the SHA-256 cryptographic hash function.
{{</note>}}
