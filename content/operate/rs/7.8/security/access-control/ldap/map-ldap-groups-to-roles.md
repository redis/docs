---
Title: Map LDAP groups to roles
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to map LDAP authorization groups to Redis Enterprise roles
  using the Cluster Manager UI.
weight: 35
url: '/operate/rs/7.8/security/access-control/ldap/map-ldap-groups-to-roles/'
---

Redis Enterprise Software uses a role-based mechanism to enable LDAP authentication and authorization.  

Once LDAP is enabled, you need to map LDAP groups to Redis Enterprise access control roles.

## Map LDAP groups to roles

To map LDAP groups to access control roles in the Cluster Manager UI:

1. Select **Access Control > LDAP > Mapping**.

    {{<note>}}
You can map LDAP roles when LDAP configuration is not enabled, but they won't have any effect until you [configure and enable LDAP]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap" >}}).
    {{</note>}}

    {{<image filename="images/rs/access-control-ldap-mappings-panel.png" alt="Enable LDAP mappings Panel" >}}

1.  Select the **+ Add LDAP Mapping** button to create a new mapping and then enter the following details:

    | _Setting_ | _Description_ | 
|:----------|:--------------|
| **Name** | A descriptive, unique name for the mapping |
| **Distinguished Name** | The distinguished name of the LDAP group to be mapped.  <br/>Example: `cn=admins,ou=groups,dc=example,dc=com` |
| **Role** | The Redis Software access control role defined for this group |
| **Email** | _(Optional)_ An address to receive alerts|
| **Alerts**  | Selections identifying the desired alerts. |

    {{<image filename="images/rs/access-control-ldap-mappings-add.png" alt="Enable LDAP mappings Panel" >}}

1.  When finished, select the **Save** button.

Create a mapping for each LDAP group used to authenticate and/or authorize access to Redis Enterprise Software resources.

The scope of the authorization depends on the access control role:

- If the role authorizes admin management, LDAP users are authorized as cluster management administrators.

- If the role authorizes database access, LDAP users are authorized to use the database to the limits specified in the role.

- To authorize LDAP users to specific databases, update the database access control lists (ACLs) to include the mapped LDAP role.

## More info

- Enable and configure [role-based LDAP]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap" >}})
- Update database ACLs to [authorize LDAP access]({{< relref "/operate/rs/security/access-control/ldap/update-database-acls" >}})
- Learn more about Redis Enterprise Software [security and practices]({{< relref "/operate/rs/security/" >}})
