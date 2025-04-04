Select **Version upgrade** to request to upgrade your subscription and databases if there is a later version available.

{{<image filename="images/rc/button-version-upgrade.png" width=150px alt="Version upgrade button." >}}

Select the version to upgrade your databases from the list and select **Upgrade** to submit the upgrade request.

{{<image filename="images/rc/version-upgrade-request.png" width=80% alt="Version upgrade request list with version 7.4 selected." >}}

The upgrade will start one week from your request, according to your subscription's [maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}). 

Review the [7.2 breaking changes]({{< relref "/operate/rc/changelog/2023/june-2023#redis-72-breaking-changes" >}}) or [7.4 breaking changes]({{< relref "/operate/rc/changelog/july-2024#redis-74-breaking-changes" >}}) before you request to upgrade.

{{< note >}}
Upgrading a single Redis Cloud Pro database is available for selected accounts and will be rolled out gradually to other accounts in the future. If you don't see the **Version upgrade** button and are not on the latest database version, see [Upgrade database version]({{< relref "/operate/rc/databases/upgrade-version" >}}) to learn how to upgrade your database.
{{< /note >}}