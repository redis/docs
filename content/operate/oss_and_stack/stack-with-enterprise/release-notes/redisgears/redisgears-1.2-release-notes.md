---
Title: RedisGears 1.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Plugins and JVM support. Python async await. Override commands API. Register
  functions on key miss events. Tracks new statistics. Python profiler support. Extended
  RedisAI integration.
linkTitle: v1.2 (February 2022)
min-version-db: 6.0.0
min-version-rs: 6.0.12
weight: 99
---

## Requirements

RedisGears v1.2.13 requires:

- Minimum Redis compatibility version (database): 6.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.12

## 1.2.13 (August 2025)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW`: No need to upgrade unless there are new features or fixes.

Details

- Added support for Ubuntu 22.
- Ubuntu 16.04 and Ubuntu 18.04 are no longer supported.
- RedisGears dependencies (Python) now include redis-py 5.0.

## 1.2.12 (December 2024)

This is a maintenance release for RedisGears 1.2.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details

- Bug fixes:
  - [#1125](https://github.com/redisgears/redisgears/pull/1125) The same registration ID might be generated twice. This may lead to an RDB corruption.
  - [#1121](https://github.com/redisgears/redisgears/pull/1121) Recreate the virtual environment on startup. Fixes an issue where the virtual environment might point to the old version of the Python interpreter.
  - [#1122](https://github.com/redisgears/redisgears/pull/1122) Clear the last error after a successful run to avoid confusion if the error is relevant.
  - [#1122](https://github.com/redisgears/redisgears/pull/1122) Clear not-yet-started executions after unregister, pause, or error on registration occcurs. (MOD-8184)

## 1.2.10 (October 2024)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW`: No need to upgrade unless there are new features or fixes.

Details

- Bug fixes:
  - [#1114](https://github.com/redisgears/redisgears/pull/1114) (REPLICAOF and Redis Enterprise A-A only) Cross slot violation. Avoid using `RM_Call` + `SCAN` command which might replicate multiple keys deletion inside a `MULTI EXEC` block when a lazy expire takes place

- Notes:
  - RHEL7 is no longer supported

## 1.2.9 (March 2024)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW`: No need to upgrade unless there are new features or fixes.

Details

- Features:

  - [#1087](https://github.com/RedisGears/RedisGears/pull/1087) Support for RHEL9
  - [#986](https://github.com/RedisGears/RedisGears/pull/986) Added execution mode parameter to `run` function: allows choosing the execution mode: `sync`/`async`/`async_local` - same as when used with register

- Bug fixes:

  - [#1097](https://github.com/RedisGears/RedisGears/pull/1097) Fix stream reader missing notification due to wrong key name comparison (comparing using case sensitive)

## 1.2.7 (July 2023)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW`: No need to upgrade unless there are new features or fixes.

Details

- Features:

  - [#972](https://github.com/RedisGears/RedisGears/pull/972) Upgrade JVM to 17.0.7

## 1.2.6 (March 2023)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW` : No need to upgrade unless there are new features or fixes.

Details

- Features:

  - [#832](https://github.com/RedisGears/RedisGears/pull/832), [#844](https://github.com/RedisGears/RedisGears/pull/844) Added IPV6 support
  - [#841](https://github.com/RedisGears/RedisGears/pull/841) Generate artifacts with dependencies included

- Bug fixes:

  - [#810](https://github.com/RedisGears/RedisGears/pull/810) Fix invalid memory access when checking if a trigger is already registered

## v1.2.5 (July 2022)

This is a maintenance release for RedisGears 1.2.

Update urgency: `MODERATE` : Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#792](https://github.com/RedisGears/RedisGears/issues/792), [#798](https://github.com/RedisGears/RedisGears/pull/798) Execution was triggered infinitely when trimming is turned off.
    - [#791](https://github.com/RedisGears/RedisGears/issues/791), [#796](https://github.com/RedisGears/RedisGears/pull/796) Stop triggering executions during pause even on failure.
    - [#794](https://github.com/RedisGears/RedisGears/pull/794), [#797](https://github.com/RedisGears/RedisGears/pull/797) Use `PythonInstallationDir` configuration to find the virtual environment location on Redis Enterprise. (MOD-1734)

## v1.2.4 (May 2022)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW` : No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

    - [#772](https://github.com/RedisGears/RedisGears/pull/772) Added the ability to upgrade a dependency at runtime with `FORCE_REQUIREMENTS_REINSTALLATION` on `RG.PYEXECUTE`.
    - [#765](https://github.com/RedisGears/RedisGears/pull/765) Allow deactivating override Python allocators for performance improvements.

- Bug fixes:

    - [#761](https://github.com/RedisGears/RedisGears/issues/761), [#760](https://github.com/RedisGears/RedisGears/issues/760), [#778](https://github.com/RedisGears/RedisGears/pull/778) `StreamReader` fixes to pause and unregister stream processing.

## v1.2.3 (April 2022)

This is a maintenance release for RedisGears 1.2.

Update urgency: `LOW` : No need to upgrade unless there are new features you want to use.

Details:

- Improvements:

    - [#739](https://github.com/RedisGears/RedisGears/pull/739) Added TLS support
    - [#734](https://github.com/RedisGears/RedisGears/pull/734) Pause/Unpause registrations
    - [#741](https://github.com/RedisGears/RedisGears/pull/741) Added build for Python-only artifacts

- Bug fixes:

    - [#740](https://github.com/RedisGears/RedisGears/pull/740) Fix -nan value on registration stats

## v1.2.2 (February 2022)

This is the General Availability release of RedisGears 1.2.

### Headlines

#### Plugins and JVM support

RedisGears 1.2 comes with a new plugin mechanism that allows you to decide which languages you want to load into RedisGears. Currently, we support two languages: Python and Java (JVM languages). You can decide which language you want to use using the new `Plugin` configuration.

Full documentation for JVM support can be found on the [Redis documentation website]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm" >}}).

#### Python async await support

RedisGears provides support for Python coroutines. Each step of your gears function can now be a Python coroutine that will take the execution to the background or will wait for some event to happen. Refer to the following links for more information:

- Async Await Support
- Async Await Advanced Topics

#### Override commands API

You can override Redis vanilla commands with a function. For more information, refer to the RedisGears command hooks documentation.

#### Key miss event for read-through pattern

Requested by many users, RedisGears 1.2 allows you to register functions on key miss event. One use case for this is to implement a read-through caching pattern. For more information about this topic, refer to the following links:

- Key Miss Event in the RedisGears documentation.
- [rghibernate](https://github.com/RedisGears/rghibernate) recipe that leverages the key miss event to implement read-through from external databases.

#### Better visibility and analyzing tools

We improved the experience during the development phase by enabling better debugging and troubleshooting. There is still room for improvement but RedisGears 1.2 makes the first steps toward a simpler API that is easier to use. This new version allows you to name your code and upgrade it with a single Redis command. For more information, refer to the upgrade section of the RedisGears introduction documentation.

RedisGears now tracks the following new statistics to better analyze your registrations:

- `lastRunDurationMS` - duration in milliseconds of the last execution
- `totalRunDurationMS` - total runtime of all executions in milliseconds
- `avgRunDurationMS` - average execution runtime in milliseconds

For streams, RedisGears also tracks the following data:

- `lastEstimatedLagMS` - gives the last batch lag (the time difference between the first batch entry in the stream and the time the entire batch finished processing)
- `avgEstimatedLagMS` - average of the `lastEstimatedLagMS` field.

The `RG.DUMPREGISTRATIONS` command exposes these new statistics.

RedisGears 1.2 also adds support for a Python profiler, specifically [`cProfile`](https://docs.python.org/3.7/library/profile.html#module-cProfile). For more information, refer to the documentation for the following commands:

- `RG.PYPROFILE STATS`
- `RG.PYPROFILE RESET`

#### RedisAI integration

Although RedisAI integration was already supported in v1.0, RedisGears 1.2 adds official support for all capabilities in RedisAI v1.2. The API was extended to support RedisAI DAG and was combined with the new async await API to achieve the best performance possible.

### Details

Bug fixes (since 1.0.9):

- [#557](https://github.com/RedisGears/RedisGears/pull/557), [#554](https://github.com/RedisGears/RedisGears/issues/554) `RG.CONFIGGET` returns user-defined configuration
- [#572](https://github.com/RedisGears/RedisGears/pull/572) Lock Redis GIL when creating RedisAI DAG
- [#661](https://github.com/RedisGears/RedisGears/pull/661), [#536](https://github.com/RedisGears/RedisGears/issues/536) Added `RG.TRIGGERONKEY`
- [#650](https://github.com/RedisGears/RedisGears/issues/650) Do not propagate `MULTI EXEC` on Redis 7
- [#671](https://github.com/RedisGears/RedisGears/pull/671), [#558](https://github.com/RedisGears/RedisGears/issues/558) Wait for cluster to be initialized when reading stream data
- [#656](https://github.com/RedisGears/RedisGears/pull/656) Stream reader creates more than one execution on a stream
- [#676](https://github.com/RedisGears/RedisGears/pull/676) Globals dictionary not set correctly after deserialization
- [#665](https://github.com/RedisGears/RedisGears/issues/665), [#679](https://github.com/RedisGears/RedisGears/pull/679) Allow case-insensitive event type on command reader
- [#697](https://github.com/RedisGears/RedisGears/pull/697) `hashtag()` function for Redis Enterprise
- [#688](https://github.com/RedisGears/RedisGears/pull/688), [#545](https://github.com/RedisGears/RedisGears/issues/545) Check `REDISMODULE_CTX_FLAGS_DENY_BLOCKING` flag before blocking the client

{{<note>}}
- This is the first GA version of 1.2. The version inside Redis is 1.2.2 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.

- Minimum Redis version: 6.0.0
{{</note>}}
