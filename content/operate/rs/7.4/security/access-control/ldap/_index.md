---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how Redis Enterprise Software integrates LDAP authentication
  and authorization. Also describes how to enable LDAP for your deployment of Redis
  Enterprise Software.
hideListLinks: true
linkTitle: LDAP authentication
title: LDAP authentication
weight: 50
url: '/operate/rs/7.4/security/access-control/ldap/'
---

Redis Enterprise Software supports [Lightweight Directory Access Protocol](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol) (LDAP) authentication and authorization through its [role-based access controls]({{< relref "/operate/rs/7.4/security/access-control" >}}) (RBAC).  You can use LDAP to authorize access to the Cluster Manager UI and to control database access.

You can configure LDAP roles using the Redis Enterprise Cluster Manager UI or [REST API]({{< relref "/operate/rs/7.4/references/rest-api/requests/ldap_mappings/" >}}).

## How it works

Here's how role-based LDAP integration works:

{{<image filename="images/rs/access-control-ldap-diagram.png" alt="LDAP overview" >}}

1.  A user signs in with their LDAP credentials.  

    Based on the LDAP configuration details, the username is mapped to an LDAP Distinguished Name.

1.  A simple [LDAP bind request](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol#Bind_(authenticate)) is attempted using the Distinguished Name and the password.  The sign-in fails if the bind fails.

1.  Obtain the user’s LDAP group memberships.

    Using configured LDAP details, obtain a list of the user’s group memberships.

1.  Compare the user’s LDAP group memberships to those mapped to local roles.

1.  Determine if one of the user's groups is authorized to access the target resource.  If so, the user is granted the level of access authorized to the role.  

To access the Cluster Manager UI, the user needs to belong to an LDAP group mapped to an administrative role.  

For database access, the user needs to belong to an LDAP group mapped to a role listed in the database’s access control list (ACL).  The rights granted to the group determine the user's level of access. 

## Prerequisites 

Before you enable LDAP in Redis Enterprise, you need:

1. The following LDAP details:

    - Server URI, including host, port, and protocol details.  
    - Certificate details for secure protocols.  
    - Bind credentials, including Distinguished Name, password, and (optionally) client public and private keys for certificate authentication.  
    - Authentication query details, whether template or query.  
    - Authorization query details, whether attribute or query.  
    - The Distinguished Names of LDAP groups you’ll use to authorize access to Redis Enterprise resources. 

1. The LDAP groups that correspond to the levels of access you wish to authorize.  Each LDAP group will be mapped to a Redis Enterprise access control role.

1. A Redis Enterprise access control role for each LDAP group. Before you enable LDAP, you need to set up [role-based access controls]({{< relref "/operate/rs/7.4/security/access-control" >}}) (RBAC).

## Enable LDAP

To enable LDAP:

1.  From **Access Control > LDAP** in the Cluster Manager UI, select the **Configuration** tab and [enable LDAP access]({{< relref "/operate/rs/7.4/security/access-control/ldap/enable-role-based-ldap" >}}).

    {{<image filename="images/rs/access-control-ldap-panel.png" alt="Enable LDAP Panel" >}}

2.  Map LDAP groups to [access control roles]({{< relref "/operate/rs/7.4/security/access-control/ldap/map-ldap-groups-to-roles" >}}).

3.  Update database access control lists (ACLs) to [authorize role access]({{< relref "/operate/rs/7.4/security/access-control/ldap/update-database-acls" >}}).  

If you already have appropriate roles, you can update them to include LDAP groups.

## More info

- Enable and configure [role-based LDAP]({{< relref "/operate/rs/7.4/security/access-control/ldap/enable-role-based-ldap" >}})
- Map LDAP groups to [access control roles]({{< relref "/operate/rs/7.4/security/access-control/ldap/map-ldap-groups-to-roles" >}})
- Update database ACLs to [authorize LDAP access]({{< relref "/operate/rs/7.4/security/access-control/ldap/update-database-acls" >}})
- Learn more about Redis Enterprise Software [security and practices]({{< relref "/operate/rs/7.4/security/" >}})

