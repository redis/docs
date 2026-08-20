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

Licenses and certificates expire per cluster, so the more clusters you run, the more likely one of them is close to expiring without anyone noticing. Radar collects both across the whole fleet and lists them by expiry date, so you find out before a customer does.

Radar presents licenses and certificates as two lists that work the same way. Each row is one cluster, with a status:

| Status | Meaning |
|---|---|
| Valid | Not close to expiry. |
| Expiring | Approaching its expiration date. |
| Expired | Past its expiration date. |

You can filter either list by status to see only what needs attention.

## Licenses

The **Licenses** view lists every cluster's license with its expiration date, how many days remain, and how much of the license you are consuming.

Radar reports shard usage against the licensed limit, broken out by type:

- Total shards in use, against the licensed shard limit.
- RAM shards in use, against their limit.
- Flex shards in use, against their limit.

Radar also shows a fleet-wide total, so you can see aggregate headroom without adding up rows. Usage matters as much as the date: a license that does not expire for a year can still stop you from adding a database next week.

Radar reports on licenses; it does not replace them. Update a license in the cluster itself, and Radar reflects the change at its next collection.

## Certificates

The **Certificates** view lists each cluster's certificates by type, with the expiration date and days remaining.

Radar reports on certificates; it does not issue, rotate, or replace them. Renew a certificate in the cluster itself, and Radar reflects the new expiration date at its next collection.

## Next steps

- [Manage access]({{< relref "/operate/radar/manage-access" >}})
- [Connect clusters]({{< relref "/operate/radar/connect" >}})
