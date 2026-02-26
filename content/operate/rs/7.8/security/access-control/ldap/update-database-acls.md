---
Title: Update database ACLs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to use the Cluster Manager UI to update database access
  control lists (ACLs) to authorize access to roles authorizing LDAP user access.
weight: 45
url: '/operate/rs/7.8/security/access-control/ldap/update-database-acls/'
---

To grant LDAP users access to a database, assign the mapped access role to the access control list (ACL) for the database.

1.  In the Cluster Manager UI, go to **Databases**, then select the database from the list.

1.  From the **Security** tab, select the **Edit** button.

1.  In the **Access Control List** section, select **+ Add ACL**.

    {{<image filename="images/rs/screenshots/databases/security-access-control-acl-only.png" alt="Updating a database access control list (ACL)" >}}

1.  Select the appropriate roles and then save your changes.

If you assign multiple roles to an ACL and a user is authorized by more than one of these roles, their access is determined by the first "matching" rule in the list.  

If the first rule gives them read access and the third rule authorizes write access, the user will only be able to read data.  

As a result, we recommend ordering roles so that higher access roles appear before roles with more limited access. 


## More info

- Enable and configure [role-based LDAP]({{< relref "/operate/rs/7.8/security/access-control/ldap/enable-role-based-ldap.md" >}})
- Map LDAP groups to [access control roles]({{< relref "/operate/rs/7.8/security/access-control/ldap/map-ldap-groups-to-roles.md" >}})
- Learn more about Redis Enterprise Software [security and practices]({{< relref "/operate/rs/7.8/security/" >}})
