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

The call home client sends daily usage statistics to Redis for operational insights. Reports include memory usage, shard information, enabled features, and other operational metrics.
    
We recommend contacting [Redis support](https://redis.io/support/) before making changes to call home behavior.

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
