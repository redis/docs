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

Dynamic endpoints allow you to redirect application traffic from one database to another in the same Redis Cloud account without changing your application code. 

You can redirect any database's dynamic endpoints to any Redis Cloud Pro database in the same account. For a smooth transition, you should [migrate your data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the target database before you redirect your endpoints.

## When to redirect dynamic endpoints

Use endpoint redirection to seamlessly migrate your application traffic to a different database. For example, you might want to:

- Upgrade your database's subscription from an Essentials Plan to a Pro Plan
- Move between Redis Cloud offerings, such as from or to Redis Flex
- Split a subscription or combine databases from multiple subscriptions into one
- Migrate your database to a different cloud provider, region, or availability zone
- Redirect the endpoint to another database during an incident to restore service

Redirecting endpoints **does not** migrate the data in your database. You can choose to redirect the endpoints without migrating your data. If you need your data to be available in the target database, you must [migrate your data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the target database before you redirect your endpoints.

## Applications that use legacy static endpoints

Databases created before {{RELEASE DATE}} have both legacy static endpoints and dynamic endpoints. You can only migrate the dynamic endpoints to point to a new database. If your application uses the static endpoints, it will connect to the source database instead of the target database after redirection. You can find both the static and dynamic endpoints for these databases on the database's **Configuration** page.

To migrate to the dynamic endpoint safely:
- Move clients one-by-one (or service-by-service) from legacy static endpoints to dynamic endpoints.
- Both static and dynamic endpoints point to the same database, so you can use them concurrently during the migration process.
- After all clients use the dynamic endpoint, you can then redirect the dynamic endpoints to the target database.

## Prerequisites

Before you redirect your dynamic endpoints, make sure you have met the following prerequisites:

- Your application is using the dynamic endpoint. Endpoint redirection does not work with [static endpoints](#applications-that-use-legacy-static-endpoints).
- You have [created a target database]({{< relref "/operate/rc/databases/create-database" >}}) that:
    - Is a Redis Cloud Pro database in the same Redis Cloud account
    - Has the same port number as the source database
    - Has the same connectivity settings as the source database, such as:
        - [TLS settings]({{< relref "/operate/rc/security/database-security/tls-ssl" >}})
        - [VPC Peering]({{< relref "/operate/rc/security/vpc-peering" >}}) or other connectivity method settings
        - [Default User settings]({{< relref "/operate/rc/security/access-control/data-access-control/default-user" >}})
- If you monitor the source database with Prometheus, add the target database to Prometheus before your redirect the endpoint so that you can monitor the target database after the redirection. See [Connect to Prometheus]({{< relref "operate/rc/databases/monitor-performance#connect-to-prometheus" >}}) for more information.

Be aware of the following limitations when redirecting dynamic endpoints:
- The target database must be a Redis Cloud Pro database on the same account as the source database.
- Active-Active databases are not supported as either a source or target database.
- Databases using GCP Private Service Connect or AWS PrivateLink are not supported for endpoint redirection.

## Redirect database endpoints

To migrate your database endpoints:

1. From the Redis Cloud console, select **Databases** from the menu and select the source database in the list.

1. In the **General** section of the **Configuration** tab, select **Redirect endpoints**.

    {{<image filename="images/rc/databases-configuration-redirect-endpoints.png" alt="Use the **Redirect endpoints** button to change the target database for the source database endpoints." >}}

1. Select the target Redis Cloud Pro database from the **Target database** list. You can type in the database's name to find it.

    {{<image filename="images/rc/migrate-data-redirect-pro-endpoints.png" alt="Select the target database from the database list." >}}

    If the source database is a Redis Cloud Essentials database, you can choose whether to map the original endpoint to the **Public** or the **Private** endpoint.

    {{<image filename="images/rc/migrate-data-redirect-essentials-endpoints.png" alt="Choose whether to map the original endpoint to the Public or Private endpoint." >}}

1. If you want to assign the same [Role-based Access Control (RBAC) roles]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control" >}}) to the target database that are assigned to the source database, select **Assign the same ACLs to the target database**.

    {{<image filename="images/rc/migrate-data-redirect-assign-acls.png" alt="Select **Assign the same ACLs to the target database** to assign the same roles to the target database." >}}

1. Select **I acknowledge this action will redirect my database endpoints** to confirm that you understand that this action will redirect your database endpoints. Then select **Redirect endpoints**.

    {{<image filename="images/rc/migrate-data-redirect-acknowledge.png" alt="The **Redirect endpoints** button redirects the source database endpoints to the target database." >}}

After you redirect your database endpoints, you can go to the **Configuration** tab of the target database to verify that the endpoints now point to the target database. 

## Revert endpoint redirection

You can revert endpoint redirection within 24 hours to restore the original endpoints. From either database's **Configuration** tab, select **Revert** to revert endpoint migration.

{{<image filename="images/rc/migrate-data-redirect-revert.png" alt="The **Revert** button reverts endpoint migration." >}}

After the 24-hour window, you can no longer revert to the original endpoints. You can redirect them back to the source database if the source database is a Redis Cloud Pro database. However, doing this will create new endpoints for the target database.





