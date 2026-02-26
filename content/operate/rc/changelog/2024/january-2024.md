---
Title: Redis Cloud changelog (January 2024)
aliases:
- /operate/rc/changelog/january-2024/
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  January 2024.
highlights: Transit Gateway, Database tags
linktitle: January 2024
tags:
- changelog
weight: 70
---

## New features

### Transit Gateway 

You can now connect your Flexible subscriptions hosted on Amazon Web Services (AWS) to [AWS Transit Gateway](https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html). See [Connect to Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}) to learn how to connect your Flexible subscription to Transit Gateway.

### Billing Admin role

You can now add a user with the Billing Admin role in the [Access Management]({{< relref "/operate/rc/security/access-control/access-management" >}}) screen. Billing Admins can view and edit settings related to billing and payments. They can add and remove payment methods and change the payment method for a subscription, but they cannot change any other subscription or database settings.

See [Team Management roles]({{< relref "/operate/rc/security/access-control/access-management#team-management-roles" >}}) to see an overview of user roles and their permissions.

### Database tags

You can now add [tags]({{< relref "/operate/rc/databases/tag-database" >}}) to your database.

Tags are key-value pairs that let you categorize your databases. You can create tags and add them to your databases to associate them with each other. Once you've added tags, you can filter your databases in the [database list]({{< relref "/operate/rc/databases/view-edit-database#manage-the-database-list" >}}) by tag key or value. 

See [Manage tags]({{< relref "/operate/rc/databases/tag-database" >}}) to learn how to add tags to your database.

### Network data cost breakdowns

Invoices for customers with Flexible and Annual subscriptions now include a breakdown of network data costs for the subscription. To download an invoice, go to the [Billing and Payments]({{< relref "/operate/rc/billing-and-payments#download-invoice" >}}) page on the [Redis Cloud console](https://cloud.redis.io/).

Customers with Annual subscriptions can also find a breakdown of network data costs in the consumption report.

## Deprecations

- {{< embed-md "rc-fixed-upgrade-limitation.md" >}}
