---
Title: RedisInsight v2.48.0, April 2024
linkTitle: v2.48.0 (April 2024)
date: 2024-04-10 00:00:00 +0000
description: RedisInsight v2.48
weight: 1
aliases: /ri/release-notes/v2.48.0/
         /ri/release-notes/v2.48.0.md
---
## 2.48 (April 2024)
This is the General Availability (GA) release of RedisInsight 2.48.

### Highlights
- New look, still fast. We've refreshed our Redis Insight app to align with our new brand look
- Jumpstart your Redis journey by uploading sample data for empty databases
- Support for the static proxy subpath to run Redis Insight on Docker behind a gateway

### Details

**Features and improvements**
- [#3233](https://github.com/RedisInsight/RedisInsight/pull/3233) New look, still fast. We've refreshed our Redis Insight app to align with our new brand look.
- [#3224](https://github.com/RedisInsight/RedisInsight/pull/3224) Jumpstart your Redis journey by uploading sample data with JSON and basic data structures for empty databases. To upload the sample data, navigate to the Browser screen for your empty database and initiate the upload process with just a click.
- [#2711](https://github.com/RedisInsight/RedisInsight/pull/2711) Support for the static proxy subpath to run Redis Insight on Docker behind a gateway. Use the `RIPROXYPATH` environment variable to configure the subpath proxy path.
