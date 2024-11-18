---
Title: RedisInsight v2.36.0, October 2023
linkTitle: v2.36.0 (October 2023)
date: 2023-10-26 00:00:00 +0000
description: RedisInsight v2.36
weight: 1
---
## 2.36 (October 2023)
This is the General Availability (GA) release of RedisInsight 2.36.

### Highlights
 
- Optimizations for efficient handling of big [Redis strings](https://redis.io/docs/data-types/strings/): choose to either view the string value for up to a maximum of 5,000 characters or download the data fully as a file if it exceeds the limit
- Improved security measurement to no longer display in plain text existing database passwords, SSH passwords, passphrases, and private keys
 
### Details
 
**Features and improvements**
- [#2685](https://github.com/RedisInsight/RedisInsight/pull/2685), [#2686](https://github.com/RedisInsight/RedisInsight/pull/2686) Added optimizations for working with big [Redis strings](https://redis.io/docs/data-types/strings/). Users can now choose to either view the data up to a maximum of 5,000 characters or download it in a file fully if it exceeds the limit.
- [#2647](https://github.com/RedisInsight/RedisInsight/pull/2647) Improved security measurement to no longer expose the existing database passwords, SSH passwords, passphrases, and private keys in plain text
- [#2631](https://github.com/RedisInsight/RedisInsight/pull/2631) Added proactive notification to restart the application when a new version becomes available
- [#2705](https://github.com/RedisInsight/RedisInsight/pull/2705) Basic support in the [search index](https://redis.io/docs/interact/search-and-query/) creation form (in Browser) to enable [geo polygon](https://redis.io/commands/ft.create/#:~:text=Vector%20Fields.-,GEOSHAPE,-%2D%20Allows%20polygon%20queries) search
- [#2681](https://github.com/RedisInsight/RedisInsight/pull/2681) Updated the Pickle formatter to [support](https://github.com/RedisInsight/RedisInsight/issues/2260) Pickle protocol 5
 
**Bugs**
- [#2675](https://github.com/RedisInsight/RedisInsight/pull/2675) Show the "Scan more" control until the cursor returned by the server is 0 to fix [cases](https://github.com/RedisInsight/RedisInsight/issues/2618) when not all keys are displayed.
