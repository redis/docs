---
Title: Redirect dynamic endpoints
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to redirect dynamic endpoints to a different database.
linkTitle: Redirect endpoints
weight: 31
---

Dynamic endpoints allow you to redirect application traffic from one database to another in the same Redis Cloud account without updating the endpoints in your application. Redis manages endpoint redirection for you.

You can redirect any database's dynamic endpoints to any Redis Cloud Pro database in the same account. For a smooth transition with your existing data, you should [migrate your data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the target database before you redirect your endpoints.

## When to redirect dynamic endpoints

Use endpoint redirection to seamlessly migrate your application traffic to a different database within the same Redis Cloud account. There is no need to update the endpoints in your application, since they'll remain the same. For example, you might want to:

- Upgrade your database's subscription from an [Essentials Plan to a Pro Plan]({{< relref "/operate/rc/subscriptions/upgrade-essentials-pro" >}})
- Move between Redis Cloud offerings, such as Redis on RAM to Redis Flex
- Split a subscription or combine databases from multiple subscriptions into one
- Migrate your database to a different cloud provider, region, or availability zone
- Redirect the endpoint to another database to restore service during Disaster Recovery

## Applications that use legacy static endpoints

Databases created before March 22, 2026 have both legacy static endpoints and dynamic endpoints. You can only migrate the dynamic endpoints to point to a new database. If your application uses the static endpoints, it will connect to the source database instead of the target database after redirection. You can find both the static and dynamic endpoints for these databases on the database's **Configuration** page.

{{<image filename="images/rc/databases-configuration-general-endpoints-legacy.png" alt="The General section of the Configuration tab of the database details page for a database created before March 22, 2026. The dynamic endpoints are listed under the **Dynamic endpoints** section." >}}

Transitioning from the static to the dynamic endpoint does not cause downtime and allows you to gradually manage client disconnections. To migrate to the dynamic endpoint safely:
- Move clients one-by-one (or service-by-service) from legacy static endpoints to dynamic endpoints. Note that during the transition period, both static and Dynamic endpoints can be used concurrently.
- After all clients use the dynamic endpoint, you can then redirect the dynamic endpoints to the target database.

This phased approach minimizes risk and allows controlled client reconnections throughout the migration process.

## Before you start

Read the following sections to prepare for endpoint redirection.

### Scope and impact

This process redirects a source database's dynamic endpoints to a selected target database, including both public and private (if available) endpoints. **Redirecting endpoints does not migrate the data in your database.** You can choose to redirect the endpoints without migrating your data. If you need your data to be available in the target database, you must [migrate your data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the target database **before** you redirect your endpoints.

Plan for the following impacts when redirecting your endpoints:
- Short-lived connection disruptions may occur as clients reconnect to the database, depending on client reconnection behavior.
- Application behavior may change if the target differs in configuration from the source database. See [Redirection compatibility](#redirection-compatibility) for a list of differences that can change application behavior.

We recommend redirecting during a low-traffic window.

#### Redirecting endpoints after data migration

If you [migrated your data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the target database before redirecting your endpoints, make sure that:
- The import or replication is finished.
- Basic metrics for both the source and target databases are reporting normally.
- The application authentication and authorization are set up correctly for the target database.
- You have tested connection to the target database to confirm connectivity and credentials.

Different applications have different availability and consistency requirements. Pausing writes during endpoint redirection is a standard best practice to help ensure data consistency. Still, you can choose the timing and behavior that fits your system (for example, whether to allow reads, how long to pause traffic, and what validation to run).

### Prerequisites

Make sure you have met the following prerequisites:

- Your application is using the dynamic endpoint. Endpoint redirection does not redirect [static endpoints](#applications-that-use-legacy-static-endpoints).
- You have [created a target Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) in the same account that [is compatible with the source database](#redirection-compatibility).
- If you monitor the source database with Prometheus, add the target database to Prometheus before your redirect the endpoint so that you can monitor the target database after the redirection. See [Connect to Prometheus]({{< relref "operate/rc/databases/monitor-performance#connect-to-prometheus" >}}) for more information.

#### Redirection compatibility

Endpoint redirection is only allowed when the source and target databases are compatible. Redis Cloud will validate compatibility and may prevent redirection if the source and target databases are not compatible.

If any of the following properties differ, the databases are not compatible and you cannot redirect the endpoints:
- Port number
- Connectivity settings, such as:
    - [TLS settings]({{< relref "/operate/rc/security/database-security/tls-ssl" >}})
    - [VPC Peering]({{< relref "/operate/rc/security/vpc-peering" >}}) or other connectivity method settings
    - [Default User settings]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}})
    - [CIDR allow list]({{< relref "/operate/rc/security/cidr-whitelist" >}}) settings

Some differences may be intentional but can affect application behavior. In those cases, the console will warn you about the difference but allow you to proceed with redirection. The following differences will cause a warning:
- Redis version
- [RESP Database protocol version]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions)
- [OSS Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) configuration

### Limitations

Be aware of the following limitations when redirecting dynamic endpoints:
- The target database must be a Redis Cloud Pro database on the same account as the source database.
- Active-Active databases are currently not supported as either a source or target database (coming soon).
- Databases using GCP Private Service Connect or AWS PrivateLink are currently not supported for endpoint redirection (coming soon).

## Redirect database endpoints

To redirect your database endpoints:

1. From the Redis Cloud console, select **Databases** from the menu and select the source database in the list.

1. In the **General** section of the **Configuration** tab, select **Redirect endpoints**.

    {{<image filename="images/rc/databases-configuration-redirect-endpoints.png" alt="Use the **Redirect endpoints** button to change the target database for the source database endpoints." >}}

1. Select the target Redis Cloud Pro database from the **Target database** list. You can type in the database's name to find it.

    {{<image filename="images/rc/migrate-data-redirect-pro-endpoints.png" alt="Select the target database from the database list." >}}

1. If you want to assign the same [Role-based Access Control (RBAC) roles]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) to the target database that are assigned to the source database, select **Assign the same ACLs to the target database**.

    {{<image filename="images/rc/migrate-data-redirect-assign-acls.png" alt="Select **Assign the same ACLs to the target database** to assign the same roles to the target database." >}}

    {{< note >}}
If you migrated your data and want a controlled transition from the source to the target database, this is the point to pause writes based on your application's consistency requirements. Pausing writes before redirecting your endpoints helps ensure data consistency.
    {{< /note >}}

1. Select **I acknowledge this action will redirect my database endpoints** to confirm that you understand that this action will redirect your database endpoints. Then select **Redirect endpoints**.

    {{<image filename="images/rc/migrate-data-redirect-acknowledge.png" alt="The **Redirect endpoints** button redirects the source database endpoints to the target database." >}}

After you redirect your database endpoints, you can go to the **Configuration** tab of the target database to verify that the endpoints now point to the target database. 

## Revert endpoint redirection

You can revert endpoint redirection within 24 hours to restore the original endpoints. From either database's **Configuration** tab, select **Revert** to revert endpoint migration.

{{<image filename="images/rc/migrate-data-redirect-revert.png" alt="The **Revert** button reverts endpoint migration." >}}

After the 24-hour window, you can no longer revert to the original endpoints. You can redirect them back to the source database if the source database is a Redis Cloud Pro database. However, doing this will create new endpoints for the target database.





