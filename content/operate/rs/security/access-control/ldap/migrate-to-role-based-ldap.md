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
---

Redis Software supports LDAP through a [role-based mechanism](/content/operate/rs/security/access-control/ldap/_index.md), first introduced [in v6.0.20](/content/operate/rs/release-notes/rs-6-0-20-april-2021.md).

Earlier versions of Redis Software supported a cluster-based mechanism; however, that mechanism was removed in v6.2.12.

If you're using the cluster-based mechanism to enable LDAP authentication, you need to migrate to the role-based mechanism before upgrading to Redis Software v6.2.12 or later.

## Migration checklist

This checklist covers the basic process:

1.  Identify accounts per app on the customer end.

1.  Create or identify an LDAP user account on the server that is responsible for LDAP authentication and authorization.

1.  Create or identify an LDAP group that contains the app team members.

1.  Verify or configure the Redis Software ACLs.

1.  Configure each database ACL.

1.  Remove the earlier "external" (LDAP) users from Redis Software.

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

- Connect with `redis-cli` and use the [`AUTH` command](/content/commands/auth.md) to test LDAP username/password credentials.

- Sign in to the Cluster Manager UI using LDAP credentials authorized for admin access.

- Use [Redis Insight](/content/develop/tools/insight/_index.md) to access a database using authorized LDAP credentials.

- Use the [REST API](/content/operate/rs/references/rest-api/_index.md) to connect using authorized LDAP credentials.

## More info

- Enable and configure [role-based LDAP](/content/operate/rs/security/access-control/ldap/enable-role-based-ldap.md)
- Map LDAP groups to [access control roles](/content/operate/rs/security/access-control/ldap/map-ldap-groups-to-roles.md)
- Update database ACLs to [authorize LDAP access](/content/operate/rs/security/access-control/ldap/update-database-acls.md)
- Learn more about Redis Software [security and practices](/content/operate/rs/security/_index.md)
