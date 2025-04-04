---
Title: Enable role-based LDAP
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to enable role-based LDAP authentication and authorization
  using the Cluster Manager UI.
weight: 25
url: '/operate/rs/7.4/security/access-control/ldap/enable-role-based-ldap/'
---

Redis Enterprise Software uses a role-based mechanism to enable LDAP authentication and authorization.  

When a user attempts to access Redis Enterprise resources using LDAP credentials, the credentials are passed to the LDAP server in a bind request. If the request succeeds, the user’s groups are searched for a group that authorizes access to the original resource.

Role-based LDAP lets you authorize cluster management users (previously known as _external users_) and database users. As with any access control role, you can define the level of access authorized by the role.

## Set up LDAP connection

To configure and enable LDAP from the Cluster Manager UI:

1. Go to **Access Control > LDAP > Configuration**.

1. Select **+ Create**.

1. In **Set LDAP**, configure [LDAP server settings](#ldap-server-settings), [bind credentials](#bind-credentials), [authentication query](#authentication-query), and [authorization query](#authorization-query).

   {{<image filename="images/rs/screenshots/access-control/ldap-config.png" alt="The LDAP configuration screen in the Cluster Manager UI" >}}

1. Select **Save & Enable**.

### LDAP server settings

The **LDAP server** settings define the communication settings used for LDAP authentication and authorization. These include:

| _Setting_ | _Description_ | 
|:----------|:--------------|
| **Protocol type** | Underlying communication protocol; must be _LDAP_, _LDAPS_, or _STARTTLS_ |
| **Host** | URL of the LDAP server |
| **Port** | LDAP server port number |
| **Trusted CA certificate** |  _(LDAPS or STARTTLS protocols only)_ Certificate for the trusted certificate authority (CA) |

When defining multiple LDAP hosts, the organization tree structure must be identical for all hosts.

### Bind credentials

These settings define the credentials for the bind query:

| _Setting_ | _Description_ | 
|:----------|:--------------|
| **Distinguished Name** | Example: `cd=admin,dc=example,dc=org` |
| **Password** | Example: `admin1` |
| **Client certificate authentication** |_(LDAPS or STARTTLS protocols only)_ Place checkmark to enable | 
| **Client public key** | _(LDAPS or STARTTLS protocols only)_ The client public key for authentication |
| **Client private key** | _(LDAPS or STARTTLS protocols only)_ The client private key for authentication |

### Authentication query

These settings define the authentication query:

| _Setting_ | _Description_ | 
|:----------|:--------------|
| **Search user by** | Either _Template_ or _Query_ |
| **Template** | _(template search)_ Example: `cn=%u,ou=dev,dc=example,dc=com` |
| **Base** | _(query search)_ Example: `ou=dev,dc=example,dc=com` |
| **Filter** | _(query search)_ Example: `(cn=%u)` |
| **Scope**  | _(query search)_ Must be _baseObject_, _singleLevel_, or _wholeSubtree_ |

In this example, `%u` is replaced by the username attempting to access the Redis Enterprise resource.

### Authorization query

These settings define the group authorization query:

| _Setting_ | _Description_ | 
|:----------|:--------------|
| **Search groups by** | Either _Attribute_ or _Query_ |
| **Attribute** | _(attribute search)_ Example: `memberOf` (case-sensitive) |
| **Base** | _(query search)_ Example: `ou=groups,dc=example,dc=com` |
| **Filter** | _(query search)_ Example: `(members=%D)` |
| **Scope**  | _(query search)_ Must be _baseObject_, _singleLevel_, or _wholeSubtree_ |

In this example, `%D` is replaced by the Distinguished Name of the user attempting to access the Redis Enterprise resource.

### Authentication timeout

The **Authentication timeout** setting determines the connection timeout to the LDAP server during user authentication.

By default, the timeout is 5 seconds, which is recommended for most cases.
 
However, if you enable multi-factor authentication (MFA) for your LDAP server, you might need to increase the timeout to provide enough time for MFA verification. You can set it to any integer in the range of 5-60 seconds.

## More info

- Map LDAP groups to [access control roles]({{< relref "/operate/rs/7.4/security/access-control/ldap/map-ldap-groups-to-roles" >}})
- Update database ACLs to [authorize LDAP access]({{< relref "/operate/rs/7.4/security/access-control/ldap/update-database-acls" >}})
- Learn more about Redis Software [security and practices]({{< relref "/operate/rs/7.4/security/" >}})
