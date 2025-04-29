---
Title: Call home client
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: The call home client sends your Redis Enterprise Software cluster's daily usage statistics to Redis.
linkTitle: Call home client
weight: 80
---

The call home client collects data hourly and sends daily usage statistics to Redis. Reports include memory usage, shard details, enabled features, and other operational metrics. To prevent increased load when multiple clusters are running, the daily report is sent at a random time.

These reports provide insights into license consumption, which helps Redis to ensure performance metrics align with contractual agreements, optimize service delivery, and offer proactive customer support.
    
We recommend contacting [Redis support](https://redis.io/support/) before making changes to call home behavior.

## Collected data

The following example shows the data collected hourly for each database:

```sh
"date": "2025-03-25T11:42:13.984Z",
"cluster_UUID": "string",
"cluster_name": "string",
"api_version": "string",
"software_version": "string",
"bdb_uid": "string",
"type": "string",
"shard_type": "string",
"dominant_shard_criteria": "string",
"provisioned_memory": 0,
"used_memory": 0,
"master_shards_count": 0,
"no_eviction": true,
"persistence": true,
"backup": true,
"using_redis_search": true,
"ops_sec": 0,
"replication": true,
"active_active": true
```

## Change data collection schedule

The cluster collects usage data hourly by default.

To change the data collection schedule, [update job scheduler settings]({{<relref "/operate/rs/references/rest-api/requests/job_scheduler#put-job-scheduler">}}) for `bdb_usage_report_job_settings` with a REST API request:

```sh
PUT /v1/job_scheduler
{
  "bdb_usage_report_job_settings": {
    "enabled": true,
    "cron_expression": "*/60 * * * *"
  }
}
```

Replace `cron_expression`'s value with a [`cron` expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the new data collection schedule.

## Turn off call home client

To stop the call home client from sending daily usage statistics to Redis, [update cluster services configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/services_configuration#put-cluster-services_config">}}) for `call_home_agent` with a REST API request:

```sh
PUT /v1/cluster/services_configuration
{ 
  "call_home_agent": { 
    "operating_mode": "disabled"
  } 
}
```
