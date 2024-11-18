---
Title: RedisInsight v2.26.0, May 2023
linkTitle: v2.26.0 (May 2023)
date: 2023-05-31 00:00:00 +0000
description: RedisInsight v2.26
weight: 1
---
## 2.26 (May 2023)
This is the General Availability (GA) release of RedisInsight 2.26.

### Highlights
- Introducing Insights (Beta): a new right-side panel that displays contextualised database recommendations for optimizing performance and memory usage. The list of recommendations gets updated as you interact with your database. Check out the paired-up tutorials to learn about the recommended feature and vote to provide feedback. This functionality is being rolled out gradually to the user base.
- Support for bulk data upload in custom tutorials: quickly upload sample datasets from your custom RedisInsight tutorials to share your Redis expertise with your team and the wider community.

### Details

**Features and improvements**
- [#1847](https://github.com/RedisInsight/RedisInsight/pull/1847), [#1901](https://github.com/RedisInsight/RedisInsight/pull/1901), [#1957](https://github.com/RedisInsight/RedisInsight/pull/1957), [#1972](https://github.com/RedisInsight/RedisInsight/pull/1972) Launching Insights (Beta): a new right-side panel that displays contextualised database recommendations for optimizing performance and memory usage. The list of recommendations gets updated in real-time as you interact with your database taking into account database configuration, user actions and accessed data. Consult the paired-up tutorials to learn more about the recommended feature. This functionality is being rolled out gradually to the user base in order to allow the RedisInsight team to learn and adjust the recommendations. Provide feedback directly in the app or the [GitHub repository](https://github.com/RedisInsight/RedisInsight/issues). 
- [#2019](https://github.com/RedisInsight/RedisInsight/pull/2019) Quickly upload sample data sets in bulk from your custom RedisInsight tutorials to share your Redis expertise with your team and the wider community. Use a text file with the list of Redis commands and follow our simple [instructions](https://github.com/RedisInsight/Tutorials) to include example data sets in your custom RedisInsight tutorials
- [#2010](https://github.com/RedisInsight/RedisInsight/pull/2010), [#2012](https://github.com/RedisInsight/RedisInsight/pull/2012), [#2013](https://github.com/RedisInsight/RedisInsight/pull/2013) Optimized the logic when filtering per data type in Browser to avoid unnecessary [TYPE](https://redis.io/commands/type/) commands

**Bugs**
- [#2014](https://github.com/RedisInsight/RedisInsight/pull/2014) Display the actual command processing time in Workbench when results are grouped
