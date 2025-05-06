---
Title: Migrate to role-based LDAP
alwaysopen: false
categories:
- docs
- operate
- rs
description: Describes how to migrate existing cluster-based LDAP deployments to role-based
  LDAP.
weight: 55
url: '/operate/rs/7.4/security/access-control/ldap/migrate-to-role-based-ldap/'
---

Redis Enterprise Software supports LDAP through a [role-based mechanism]({{< relref "/operate/rs/7.4/security/access-control/ldap/" >}}), first introduced [in v6.0.20]({{< relref "/operate/rs/release-notes/rs-6-0-20-april-2021" >}}).

Earlier versions of Redis Enterprise Software supported a cluster-based mechanism; however, that mechanism was removed in v6.2.12.

If you're using the cluster-based mechanism to enable LDAP authentication, you need to migrate to the role-based mechanism before upgrading to Redis Enterprise Software v6.2.12 or later.

## Migration checklist

This checklist covers the basic process:

1.  Identify accounts per app on the customer end.

1.  Create or identify an LDAP user account on the server that is responsible for LDAP authentication and authorization.

1.  Create or identify an LDAP group that contains the app team members.

1.  Verify or configure the Redis Enterprise ACLs.

1.  Configure each database ACL.

1.  Remove the earlier "external" (LDAP) users from Redis Enterprise.

1.  _(Recommended)_ Update cluster configuration to replace the cluster-based configuration file.

    You can use `rladmin` to update the cluster configuration:

    ``` bash
    $ touch /tmp/saslauthd_empty.conf
    $ rladmin cluster config saslauthd_ldap_conf \
         /tmp/saslauthd_empty.conf
    ```

    Here, a blank file replaces the earlier configuration.

1.  Use **Access Control > LDAP > Configuration** to enable role-based LDAP.

1.  Map your LDAP groups to access control roles.

1.  Test application connectivity using the LDAP credentials of an app team member.

1.  _(Recommended)_ Turn off default access for the database to avoid anonymous client connections.

 Because deployments and requirements vary, you’ll likely need to adjust these guidelines.

## Test LDAP access

To test your LDAP integration, you can:

- Connect with `redis-cli` and use the [`AUTH` command]({{< relref "/commands/auth" >}}) to test LDAP username/password credentials.

- Sign in to the Cluster Manager UI using LDAP credentials authorized for admin access.

- Use [Redis Insight]({{< relref "/develop/tools/insight/" >}}) to access a database using authorized LDAP credentials.

- Use the [REST API]({{< relref "/operate/rs/7.4/references/rest-api" >}}) to connect using authorized LDAP credentials.

## More info

- Enable and configure [role-based LDAP]({{< relref "/operate/rs/7.4/security/access-control/ldap/enable-role-based-ldap" >}})
- Map LDAP groups to [access control roles]({{< relref "/operate/rs/7.4/security/access-control/ldap/map-ldap-groups-to-roles" >}})
- Update database ACLs to [authorize LDAP access]({{< relref "/operate/rs/7.4/security/access-control/ldap/update-database-acls" >}})
- Learn more about Redis Enterprise Software [security and practices]({{< relref "/operate/rs/7.4/security/" >}})
