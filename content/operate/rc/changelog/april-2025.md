---
Title: Redis Cloud changelog (April 2025)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  April 2025.
highlights: Map multiple Redis Cloud accounts to marketplace account, Upgrade database version for a single Pro database
linktitle: April 2025
weight: 32
---

## New features

### Map multiple Redis Cloud accounts to marketplace account

You can now map multiple Redis Cloud accounts to a single [Google Cloud Marketplace]({{< relref "/operate/rc/cloud-integrations/gcp-marketplace/" >}}) or [AWS Marketplace]({{< relref "/operate/rc/cloud-integrations/aws-marketplace/" >}}) account.

### Upgrade database version for a single Pro database

Selected accounts can now upgrade a single Pro database to a later version. From the database page or database list, select **More actions > Version upgrade** to upgrade your database.

{{<image filename="images/rc/databases-more-actions-menu.png" alt="The More Actions menu on the Database page." >}}

See [Upgrade database version]({{< relref "/operate/rc/databases/upgrade-version" >}}) for more information.

{{< note >}}
Upgrading a single Redis Cloud Pro database is available for selected accounts and will be rolled out gradually to other accounts in the future. If you don't see **Version upgrade** in the **More actions** menu for your database and your database version is not on the latest available version, you can request to upgrade all of the databases in your subscription from the [subscription page]({{< relref "/operate/rc/subscriptions/view-pro-subscription" >}}).
{{< /note >}}