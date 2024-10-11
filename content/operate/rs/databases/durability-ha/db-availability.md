---
alwaysopen: false
categories:
- docs
- operate
- rs
db_type: database
description: Verify if a Redis Software database is available to perform read and write operations and can respond to queries from client applications.
linkTitle: Database availability
title: Check database availability
toc: 'true'
weight: 30
---

You can use the [database availability API]({{<relref "/operate/rs/references/rest-api/requests/bdbs/availability">}}) to verify whether a Redis Software database is available to perform read and write operations and can respond to queries from client applications. Load balancers and automated monitoring tools can use this API to monitor database availability.

## Availability by database status

| Database status | Availability |
|-----------------|--------------|
| active          | <span title="Available">&#x2705;</span> Available |
| active-change-pending | <span title="Available">&#x2705;</span> Available |
| creation-failed | <span title="Not available">:x:</span> Not available |
| delete-pending  | <span title="Availability not guaranteed" class="font-serif">:warning:</span> Availability not guaranteed |
| import-pending  | <span title="Available">&#x2705;</span> Available |
| pending         | <span title="Available">&#x2705;</span> Available |
| recovery        | <span title="Not available">:x:</span> Not available |

## Availability by shard status
 
| Shard status | Availability |
|--------------|--------------|
| busy         | <span title="Available">&#x2705;</span> Available |
| down         | <span title="Not available">:x:</span> Not available |
| importing    | <span title="Available">&#x2705;</span> Available |
| loading      | <span title="Available">&#x2705;</span> Available |
| ok           | <span title="Available">&#x2705;</span> Available |
| timeout      | ?            |
| trimming     | <span title="Available">&#x2705;</span> Available |
| unknown      | ?            |
