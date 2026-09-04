---
title: Licenses and certificates
alwaysopen: false
categories:
- docs
- operate
- radar
description: Track license and certificate expiry across your fleet.
linkTitle: Licenses and certificates
weight: 50
---

Certificates expire per cluster, so the more clusters you run, the more likely one of them is close to expiring without anyone noticing. Licenses usually share a single expiry date across the fleet, so for licenses the number that changes is consumption, not the date. Radar collects both across the whole fleet and lists them by expiry date, so you find out before a customer does.

Radar presents licenses and certificates as two lists that work the same way. Every row carries a status:

| Status | Meaning |
|---|---|
| Valid | Not close to expiry. No action required. |
| Expiring | Expires within 30 days. |
| Expired | Past its expiration date. Renew immediately. |

You can filter either list by status to see only what needs attention.

## Licenses

The **Licenses** view lists every cluster's license with its expiration date, how many days remain, and how much of the license you are consuming.

Radar reports shard usage against the licensed limit, broken out by type:

- Total shards in use, against the licensed shard limit.
- RAM shards in use, against their limit.
- Flex shards in use, against their limit.

Radar also shows a fleet-wide total, so you can see aggregate headroom without adding up rows, and you can export the list as CSV. Usage matters as much as the date: a license that does not expire for a year can still stop you from adding a database next week.

A license changed on the cluster shows up in Radar at its next collection.

{{<image filename="images/radar/licenses.png" alt="The Licenses page, listing clusters by license status, expiration date, and shard usage" width="90%">}}

## Certificates

The **Certificates** view lists each cluster's certificates by type, with the expiration date and days remaining. One cluster can have several, such as `Api_cert`, `Cm_cert`, `Metrics_exporter_cert`, `Proxy_cert`, and `Syncer_cert`.

A certificate renewed on the cluster shows up in Radar with its new expiration date at the next collection.

{{<image filename="images/radar/certificates.png" alt="The Certificates page, listing certificates by type, cluster, and expiration date" width="90%">}}

## Next steps

- [Manage access]({{< relref "/operate/radar/manage-access" >}})
- [Connect clusters]({{< relref "/operate/radar/connect" >}})
